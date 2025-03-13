import {
	TextGenerationGetParams,
	TextGenerationPostParams,
	TextGenerationVisionParams,
	TextMessage,
	VisionMessage,
	BaseGenerationParams,
} from "../interfaces/text-service.interface.js"

/**
 * Base class for text generation request builders
 * @template T - The type of the request parameters
 */
abstract class BaseTextRequestBuilder<T extends BaseGenerationParams> {
	/**
	 * The parameters for the text generation request
	 */
	protected params: T = {} as T

	/**
	 * Remove undefined parameters from the request
	 * @param params - The parameters to remove undefined parameters from
	 * @returns The parameters with undefined parameters removed
	 */
	protected removeUndefinedParams(params: T): T {
		return Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== undefined)) as T
	}

	/**
	 * Set the model for the text generation request
	 * @param model - The model to use for the text generation request
	 * @returns The builder instance
	 */
	setModel(model: string): this {
		this.params.model = model
		return this
	}

	/**
	 * Set the JSON mode for the text generation request
	 * @param jsonMode - The JSON mode to use for the text generation request
	 * @returns The builder instance
	 */
	setJsonMode(jsonMode: boolean): this {
		this.params.jsonMode = jsonMode
		return this
	}

	/**
	 * Set the seed for the text generation request
	 * @param seed - The seed to use for the text generation request
	 * @returns The builder instance
	 */
	setSeed(seed: number): this {
		this.params.seed = seed
		return this
	}

	/**
	 * Set the private mode for the text generation request
	 * @param privateMode - The private mode to use for the text generation request
	 * @returns The builder instance
	 */
	setPrivateMode(privateMode: boolean): this {
		this.params.private = privateMode
		return this
	}

	/**
	 * Build the request body or the request URL for the text generation request
	 * @returns The request body or the request URL
	 */
	abstract build(): T | string
}

/**
 * Builder for text generation get requests
 * @extends BaseTextRequestBuilder<TextGenerationGetParams>
 */
export class TextGenerationGetRequestBuilder extends BaseTextRequestBuilder<TextGenerationGetParams> {
	private encode = (value: string) => encodeURIComponent(value)
	private baseUrl: string

	constructor(baseUrl: string) {
		super()
		this.baseUrl = baseUrl
	}

	/**
	 * Set the encoded prompt for the text generation request
	 * @param prompt - The prompt to use for the text generation request
	 * @returns The builder instance
	 */
	setPrompt(prompt: string): this {
		this.params.prompt = this.encode(prompt)
		return this
	}

	/**
	 * Set the encoded system prompt for the text generation request
	 * @param system - The system prompt to use for the text generation request
	 * @returns The builder instance
	 */
	setSystem(system: string): this {
		this.params.system = this.encode(system)
		return this
	}

	/**
	 * Build the request URL for the text generation request
	 * @returns The request URL
	 */
	build(): string {
		const { prompt, ...queryParams } = this.params
		const searchParams = new URLSearchParams(
			Object.entries(queryParams)
				.filter(([_, v]) => v !== undefined)
				.map(([k, v]) => [k, v.toString()])
		)

		return `${this.baseUrl}/prompt/${prompt}?${searchParams}`
	}
}

/**
 * Builder for text generation post requests
 * @extends BaseTextRequestBuilder<TextGenerationPostParams>
 */
export class TextGenerationPostRequestBuilder extends BaseTextRequestBuilder<TextGenerationPostParams> {
	/**
	 * Add a message to the text generation request
	 * @param message - The message to add to the request
	 * @returns The builder instance
	 */
	addMessage(message: TextMessage): this {
		if (!this.params.messages) this.params.messages = []

		this.params.messages.push(message)
		return this
	}

	/**
	 * Build the request body for the text generation request
	 * @returns The request body
	 */
	build(): TextGenerationPostParams {
		if (!this.params.messages?.length) {
			throw new Error("At least one message is required")
		}

		return this.removeUndefinedParams(this.params)
	}
}

/**
 * Builder for text generation vision requests
 * @extends BaseTextRequestBuilder<TextGenerationVisionParams>
 */
export class TextGenerationVisionRequestBuilder extends BaseTextRequestBuilder<TextGenerationVisionParams> {
	private readonly validVisionModels = new Set(["openai", "openai-large", "claude-hybridspace"])

	constructor() {
		super()
		this.params.model = "openai-large"
	}

	/**
	 * Set the model for the text generation request based on the valid vision models
	 * @param model - The model to use for the text generation request
	 * @returns The builder instance
	 */
	setModel(model: TextGenerationPostParams["model"]): this {
		if (model && !this.validVisionModels.has(model)) {
			throw new Error(
				`Invalid vision model: ${model}. Valid models are: ${Array.from(this.validVisionModels).join(", ")}`
			)
		}

		this.params.model = model

		return this
	}

	/**
	 * Add a message to the text generation request
	 * @param message - The message to add to the request
	 * @returns The builder instance
	 */
	addMessage(message: VisionMessage): this {
		if (!this.params.messages) this.params.messages = []

		this.params.messages.push(message)
		return this
	}

	/**
	 * Build the request body for the text generation request
	 * @returns The request body
	 */
	build(): TextGenerationVisionParams {
		if (!this.params.messages?.length) {
			throw new Error("At least one vision message is required")
		}

		return this.removeUndefinedParams(this.params)
	}
}
