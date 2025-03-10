import { AxiosError } from "axios"
import {
	TextGenerationGetRequestBuilder,
	TextGenerationPostRequestBuilder,
	TextGenerationVisionRequestBuilder,
} from "../builders/text-request.builder.js"
import { AxiosHttpClient } from "../clients/axios-http.client.js"
import { HttpClient } from "../interfaces/http-client.interface.js"
import {
	Model,
	TextGenerationGetParams,
	TextGenerationPostParams,
	TextGenerationVisionParams,
	TextService,
} from "../interfaces/text-service.interface.js"

export class PollinationsTextService implements TextService {
	private readonly baseUrl: string = "https://text.pollinations.ai"
	private readonly httpClient: HttpClient

	/**
	 * Constructor for the PollinationsImageService
	 * @param httpClient - The HTTP client to use for the service, should be a HttpClient implementation (optional)
	 */
	constructor(httpClient?: HttpClient) {
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

			console.log(url)

			const response = await this.httpClient.get<string>(url)

			return response
		} catch (error) {
			throw this.handleError(error)
		}
	}

	/**
	 * Generate a text response using POST request method and returns a string or a JSON object
	 * @param params - The parameters for the text generation
	 * @returns The generated text or a JSON object
	 */
	async postGenerate(params: TextGenerationPostParams): Promise<string> {
		try {
			const builder = new TextGenerationPostRequestBuilder()
				.setModel(params?.model)
				.setJsonMode(params?.jsonMode)
				.setPrivateMode(params?.private)
				.setSeed(params?.seed)

			params?.messages?.forEach((msg) => builder.addMessage(msg))

			const body = builder.build()

			return this.httpClient.post<string>(this.baseUrl, body)
		} catch (error) {
			throw this.handleError(error)
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
			throw this.handleError(error)
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
	 * Handle an error that occurred during text generation
	 * @param error - The error to handle
	 * @returns An Error object with the error message
	 */
	private handleError(error: unknown): Error {
		const defaultMessage = "Text generation failed: Unknown error occurred"

		if (this.isAxiosError(error)) {
			return new Error(
				`Text generation failed: ${
					(error.response?.data as { message?: string })?.message || error.message || defaultMessage
				}`
			)
		}

		if (error instanceof Error) {
			return new Error(`Text generation failed: ${error.message}`)
		}

		if (typeof error === "string") {
			return new Error(`Text generation failed: ${error}`)
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
