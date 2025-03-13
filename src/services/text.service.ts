import {
	TextGenerationGetRequestBuilder,
	TextGenerationPostRequestBuilder,
	TextGenerationVisionRequestBuilder,
} from "../builders/text-request.builder.js"
import { AxiosHttpClient } from "../clients/axios-http.client.js"
import { HttpClient } from "../interfaces/http-client.interface.js"
import {
	Model,
	StreamEvent,
	TextFeedEvent,
	TextGenerationGetParams,
	TextGenerationPostParams,
	TextGenerationVisionParams,
	TextService,
	TypedReadable,
} from "../interfaces/text-service.interface.js"
import { Readable } from "node:stream"
import { RequestErrorHandler } from "../handlers/request-error.handler.js"

export class PollinationsTextService extends RequestErrorHandler implements TextService {
	/**
	 * The base URL for the Pollinations Text service
	 */
	private readonly baseUrl: string = "https://text.pollinations.ai"

	/**
	 * The HTTP client to use for the service
	 */
	private readonly httpClient: HttpClient

	/**
	 * Constructor for the PollinationsImageService
	 * @param httpClient - The HTTP client to use for the service, should be a HttpClient implementation (optional)
	 */
	constructor(httpClient?: HttpClient) {
		super()
		this.httpClient = httpClient ?? new AxiosHttpClient(this.baseUrl)
	}

	/**
	 * Generate a text response using GET request method and returns a string or a JSON object
	 * @param prompt - The prompt to generate text from
	 * @param params - The parameters for the text generation
	 * @returns The generated text or a JSON object
	 */
	async getGenerate(prompt: string, params?: TextGenerationGetParams): Promise<string> {
		try {
			const url = new TextGenerationGetRequestBuilder(this.baseUrl)
				.setPrompt(prompt)
				.setModel(params?.model)
				.setSeed(params?.seed)
				.setJsonMode(params?.jsonMode)
				.setSystem(params?.system)
				.setPrivateMode(params?.private)
				.build()

			const response = await this.httpClient.get<string>(url)

			return response
		} catch (error) {
			throw super.handleError(error)
		}
	}

	/**
	 * Generate a text response using POST request method and returns a string or a JSON object
	 * @param params - The parameters for the text generation
	 * @param options - The options for the text generation
	 * @returns {Promise<string>} The generated text or a JSON object
	 * @returns {Promise<TypedReadable<StreamEvent>>} When streaming is enabled
	 */
	async postGenerate(
		params: TextGenerationPostParams,
		options: { stream: true; onStreamData?: (event: StreamEvent) => void }
	): Promise<TypedReadable<StreamEvent>>
	async postGenerate(params: TextGenerationPostParams): Promise<string>
	async postGenerate(
		params: TextGenerationPostParams,
		options?: { stream?: boolean; onStreamData?: (event: StreamEvent) => void }
	): Promise<string | TypedReadable<StreamEvent>> {
		try {
			const builder = new TextGenerationPostRequestBuilder()
				.setModel(params?.model)
				.setJsonMode(params?.jsonMode)
				.setPrivateMode(params?.private)
				.setSeed(params?.seed)
				.setStream(options?.stream ?? false)

			params?.messages?.forEach((msg) => builder.addMessage(msg))

			const body = builder.build()

			if (options?.stream) {
				const response = await this.httpClient.post<TypedReadable<StreamEvent>>(this.baseUrl, body, {
					responseType: "stream",
					headers: {
						Accept: "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				})

				return this.createEventStream(response, options?.onStreamData)
			}

			return this.httpClient.post<string>(this.baseUrl, body)
		} catch (error) {
			throw super.handleError(error)
		}
	}

	/**
	 * Generate a text response using POST request method and returns a string or a JSON object
	 * @param params - The parameters for the text generation
	 * @returns The generated text or a JSON object
	 */
	async vision(params?: TextGenerationVisionParams): Promise<string> {
		try {
			const builder = new TextGenerationVisionRequestBuilder()
				.setModel(params?.model)
				.setJsonMode(params?.jsonMode)
				.setPrivateMode(params?.private)
				.setSeed(params?.seed)

			params?.messages?.forEach((msg) => builder.addMessage(msg))

			const body = builder.build()

			return this.httpClient.post<string>(this.baseUrl, body)
		} catch (error) {
			throw super.handleError(error)
		}
	}

	/**
	 * List all available text generation models
	 * @returns An array of model names
	 */
	async listModels(): Promise<Model[]> {
		return this.httpClient.get<Model[]>(`${this.baseUrl}/models`)
	}

	/**
	 * Subscribe to the real-time text generation feed
	 * @param onData - The callback to call when a new event is received
	 * @param onError - The callback to call when an error occurs
	 * @returns A cleanup function to stop the feed
	 */
	subscribeToFeed(onData: (event: TextFeedEvent) => void, onError?: (error: Error) => void): () => void {
		const controller = new AbortController()
		let isStreamActive = true
		let buffer = ""

		this.httpClient
			.get<Readable>("/feed", {
				responseType: "stream",
				headers: {
					Accept: "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
				signal: controller.signal,
			})
			.then((response) => {
				if (!(response instanceof Readable)) {
					throw new Error("Invalid SSE response: expected a readable stream")
				}

				response.on("data", (chunk: Buffer) => {
					if (!isStreamActive) return

					buffer += chunk.toString()
					const events = buffer.split(/\n\n|\r\n\r\n/)
					buffer = events.pop() || ""

					for (const event of events) {
						if (!event.startsWith("data:")) continue

						try {
							const jsonString =
								event
									.split("\n")
									.find((line) => line.startsWith("data:"))
									?.replace(/^data:\s*/, "") || "{}"

							onData(<TextFeedEvent>JSON.parse(jsonString))
						} catch (err) {
							onError?.(new Error(`Failed to parse feed event: ${err.message}`))
						}
					}
				})

				response.on("error", (err: Error) => {
					if (!isStreamActive) return
					isStreamActive = false
					onError?.(new Error(`Feed error: ${err.message}`))
					controller.abort()
				})

				response.on("end", () => {
					if (!isStreamActive) return
					isStreamActive = false
					controller.abort()
				})
			})
			.catch((error) => {
				isStreamActive = false
				onError?.(error instanceof Error ? error : new Error("Unknown feed error"))
			})

		return () => {
			if (isStreamActive) {
				isStreamActive = false
				controller.abort()
			}
		}
	}

	private createEventStream(
		response: Readable,
		onStreamData?: (event: StreamEvent) => void
	): TypedReadable<StreamEvent> {
		const outputStream = new Readable({
			objectMode: true,
			read() {},
		}) as TypedReadable<StreamEvent>

		let isStreamActive = true
		let buffer = ""

		if (!(response instanceof Readable)) {
			throw new Error("Invalid SSE response: expected a readable stream")
		}

		outputStream.resume()

		response.on("data", (chunk: Buffer) => {
			if (!isStreamActive) return

			buffer += chunk.toString()
			const events = buffer.split(/\n\n|\r\n\r\n/)
			buffer = events.pop() || ""

			for (const event of events) {
				if (!event.startsWith("data:")) continue

				try {
					const jsonString =
						event
							.split("\n")
							.find((line) => line.startsWith("data:"))
							?.replace(/^data:\s*/, "") || "{}"

					if (jsonString.trim() === "[DONE]") {
						outputStream.push(null)
						return
					}

					const parsedEvent = JSON.parse(jsonString) as StreamEvent

					outputStream.push(parsedEvent)
					onStreamData?.(parsedEvent)
				} catch (err) {
					outputStream.emit("error", new Error(`Failed to parse stream event: ${err.message}`))
				}
			}
		})

		response.on("error", (err: Error) => {
			if (!isStreamActive) return
			isStreamActive = false
			outputStream.emit("error", err)
		})

		response.on("end", () => {
			if (!isStreamActive) return
			isStreamActive = false
			outputStream.push(null)
		})

		return outputStream
	}
}
