import { ImageGenerationParams } from "../interfaces/image-service.interface.js"

/**
 * Image request builder to generate a full image generation request URL based on the parameters set
 *
 * @example
 * const builder = new ImageRequestBuilder()
 * const url = builder
 * 	.setPrompt("A beautiful sunset over a calm ocean")
 * 	.setModel("flux")
 * 	.setSeed(1234567890)
 * 	.setDimensions(1024, 1024)
 * 	.setFlags({
 * 		nologo: true,
 * 		private: true,
 * 		enhance: true,
 * 		safe: true,
 * 	})
 * 	.build()
 */
export class ImageRequestBuilder {
	private prompt: string = ""
	private params: ImageGenerationParams = {}

	/**
	 * Set the prompt for the image generation request
	 * @param prompt - The prompt to generate an image from
	 * @returns The builder instance
	 */
	setPrompt(prompt: string): this {
		this.prompt = encodeURIComponent(prompt)
		return this
	}

	/**
	 * Set the model for the image generation request
	 * @param model - The model to use for generation
	 * @returns The builder instance
	 */
	setModel(model?: string): this {
		if (model) this.params.model = model
		return this
	}

	/**
	 * Set the seed for the image generation request
	 * @param seed - The seed to use for generation
	 * @returns The builder instance
	 */
	setSeed(seed?: number): this {
		if (seed !== undefined) this.params.seed = seed
		return this
	}

	/**
	 * Set the dimensions for the image generation request
	 * @param width - The width of the image
	 * @param height - The height of the image
	 * @returns The builder instance
	 */
	setDimensions(width?: number, height?: number): this {
		if (width) this.params.width = width
		if (height) this.params.height = height
		return this
	}

	/**
	 * Set the flags for the image generation request
	 * @param options - The flags to use for generation
	 * @returns The builder instance
	 */
	setFlags(options: { nologo?: boolean; private?: boolean; enhance?: boolean; safe?: boolean }): this {
		Object.entries(options).forEach(([key, value]) => {
			if (value !== undefined) this.params[key] = value
		})
		return this
	}

	/**
	 * Build the image generation request URL
	 * @returns The image generation request URL
	 */
	build(): string {
		const baseUrl = `https://image.pollinations.ai/prompt/${this.prompt}`
		const queryParams = new URLSearchParams(Object.fromEntries(Object.entries(this.params))).toString()

		return queryParams ? `${baseUrl}?${queryParams}` : baseUrl
	}
}
