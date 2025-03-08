import { ImageService, ImageGenerationParams } from "../interfaces/image-service.interface.js"
import { HttpClient } from "../interfaces/http-client.interface.js"
import { ImageRequestBuilder } from "../builders/image-request.builder.js"
import { AxiosHttpClient } from "../clients/axios-http.client.js"
import { AxiosError } from "axios"

export class PollinationsImageService implements ImageService {
	private readonly baseUrl: string = "https://image.pollinations.ai"
	private readonly httpClient: HttpClient
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
