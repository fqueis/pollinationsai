import { ImageService, ImageGenerationParams, ImageFeedEvent } from "../interfaces/image-service.interface.js"
import { HttpClient } from "../interfaces/http-client.interface.js"
import { ImageRequestBuilder } from "../builders/image-request.builder.js"
import { AxiosHttpClient } from "../clients/axios-http.client.js"
import { AxiosError } from "axios"
import { Readable } from "node:stream"

export class PollinationsImageService implements ImageService {
	/**
	 * The base URL for the Pollinations Image service
	 */
	private readonly baseUrl: string = "https://image.pollinations.ai"

	/**
	 * The HTTP client to use for the service
	 */
	private readonly httpClient: HttpClient

	/**
	 * The builder for the image request
	 */
	private builder: ImageRequestBuilder = new ImageRequestBuilder()

	/**
	 * Constructor for the PollinationsImageService
	 * @param httpClient - The HTTP client to use for the service, should be a HttpClient implementation (optional)
	 */
	constructor(httpClient?: HttpClient) {
		this.httpClient = httpClient ?? new AxiosHttpClient(this.baseUrl)
	}

	/**
	 * Generate an image from a text prompt
	 * @param prompt - Text description of the desired image
	 * @param options - Generation parameters
	 * @param options.width - Image width in pixels
	 * @param options.height - Image height in pixels
	 * @param options.seed - Optional seed for reproducibility
	 * @param options.model - Model to use for generation
	 * @returns Promise resolving to image buffer
	 */
	async generate(prompt: string, params?: ImageGenerationParams): Promise<Buffer> {
		try {
			const url = this.builder
				.setPrompt(prompt)
				.setModel(params?.model)
				.setSeed(params?.seed)
				.setDimensions(params?.width, params?.height)
				.setFlags({
					nologo: params?.nologo,
					private: params?.private,
					enhance: params?.enhance,
					safe: params?.safe,
				})
				.build()

			const response = await this.httpClient.get<Buffer>(url, {
				responseType: "arraybuffer",
			})

			return response
		} catch (error) {
			throw this.handleError(error)
		}
	}

	/**
	 * List all available models
	 * @returns A promise that resolves to an array of model names
	 */
	async listModels(): Promise<string[]> {
		try {
			return await this.httpClient.get<string[]>("/models")
		} catch (error) {
			throw this.handleError(error)
		}
	}

	/**
	 * Subscribe to the real-time image generation feed
	 * @param onData - The callback to call when a new event is received
	 * @param onError - The callback to call when an error occurs
	 * @returns A cleanup function to stop the feed
	 */
	subscribeToFeed(onData: (event: ImageFeedEvent) => void, onError?: (error: Error) => void): () => void {
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

							onData(<ImageFeedEvent>JSON.parse(jsonString))
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

	/**
	 * Handle an error that occurred during image generation
	 * @param error - The error to handle
	 * @returns An Error object with the error message
	 */
	private handleError(error: unknown): Error {
		const defaultMessage = "Image generation failed: Unknown error occurred"

		if (this.isAxiosError(error)) {
			return new Error(
				`Image generation failed: ${
					(error.response?.data as { message?: string })?.message || error.message || defaultMessage
				}`
			)
		}

		if (error instanceof Error) {
			return new Error(`Image generation failed: ${error.message}`)
		}

		if (typeof error === "string") {
			return new Error(`Image generation failed: ${error}`)
		}

		return new Error(defaultMessage)
	}

	/**
	 * Check if the error is an Axios error
	 * @param error - The error to check
	 * @returns True if the error is an Axios error, false otherwise
	 */
	private isAxiosError(error: unknown): error is AxiosError {
		return (error as AxiosError).isAxiosError === true
	}
}
