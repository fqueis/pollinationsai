import {
	TextToSpeechParams,
	TextToSpeechMessage,
	OpenAITextToSpeechParams,
	OpenAISpeechToTextParams,
	SpeechToTextMessage,
} from "../interfaces/voice-service.interface.js"

abstract class BaseSpeechRequestBuilder<T extends TextToSpeechParams> {
	/**
	 * The parameters for the text generation request
	 */
	protected params: T = {} as T

	/**
	 * The model to use for the text generation request
	 */
	protected model: string

	/**
	 * The base URL for the text generation request
	 */
	protected baseUrl: string

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl
		this.model = "openai-audio"
	}

	/**
	 * Remove undefined parameters from the request
	 * @param params - The parameters to remove undefined parameters from
	 * @returns The parameters with undefined parameters removed
	 */
	protected removeUndefinedParams(params: T): T {
		return Object.fromEntries(Object.entries(params).filter(([_, value]) => value !== undefined)) as T
	}

	abstract build(openAIMode?: boolean): T | string
}

export class PollinationsTextToSpeechBuilder extends BaseSpeechRequestBuilder<TextToSpeechParams> {
	private text?: string

	/**
	 * Set the text for the text to speech request
	 * @param text - The text to set for the request
	 * @returns The builder instance
	 */
	setText(text?: string): this {
		this.text = encodeURIComponent(text)
		return this
	}

	/**
	 * Set the voice for the text to speech request
	 * @param voice - The voice to set for the request
	 * @returns The builder instance
	 */
	setVoice(voice?: string): this {
		this.params.voice = voice
		return this
	}

	/**
	 * Build the request body for the text generation request
	 * @returns The request body
	 */
	build(): string {
		if (!this.text) throw new Error("Text is required")

		this.params.model = this.model

		const queryParams = new URLSearchParams(Object.fromEntries(Object.entries(this.params))).toString()

		return `${this.baseUrl}/${this.text}?${queryParams}`
	}
}

export class OpenAITextToSpeechRequestBuilder extends BaseSpeechRequestBuilder<
	TextToSpeechParams & { messages: TextToSpeechMessage[]; format?: string }
> {
	/**
	 * Set the voice for the text to speech request
	 * @param voice - The voice to set for the request
	 * @returns The builder instance
	 */
	setVoice(voice?: string): this {
		this.params.voice = voice
		return this
	}

	/**
	 * Set the audio format for the text to speech request
	 * @param format - The format to set for audio output
	 * @returns The builder instance
	 */
	setFormat(format?: string): this {
		this.params.format = format
		return this
	}

	/**
	 * Add a message to the audio generation request
	 * @param message - The message to add to the request
	 * @returns The builder instance
	 */
	addMessage(message: TextToSpeechMessage): this {
		if (!this.params.messages) this.params.messages = []

		this.params.messages.push(message)
		return this
	}

	build(): OpenAITextToSpeechParams {
		this.params.model = this.model

		if (!this.params.messages?.length) throw new Error("At least one message is required")

		this.params = this.removeUndefinedParams(this.params)

		return {
			audio: {
				voice: this.params.voice ?? "alloy",
				format: this.params.format ?? "wav",
			},
			model: this.params.model,
			modalities: ["text", "audio"],
			messages: this.params.messages,
		} as OpenAITextToSpeechParams
	}
}

export class OpenAISpeechToTextRequestBuilder extends BaseSpeechRequestBuilder<
	OpenAISpeechToTextParams & { format?: string }
> {
	/**
	 * Set the audio format for the text to speech request
	 * @param format - The format to set for audio output
	 * @returns The builder instance
	 */
	setFormat(format?: string): this {
		this.params.format = format
		return this
	}

	/**
	 * Add a message to the audio generation request
	 * @param message - The message to add to the request
	 * @returns The builder instance
	 */
	addMessage(message: SpeechToTextMessage): this {
		if (!this.params.messages) this.params.messages = []

		this.params.messages.push(message)
		return this
	}

	/**
	 * Build the request body for the speech to text generation request
	 * @returns The request body
	 */
	build(): OpenAISpeechToTextParams {
		this.params.model = this.model

		if (!this.params.messages?.length) throw new Error("At least one message is required")

		this.params = this.removeUndefinedParams(this.params)

		return {
			model: this.params.model,
			messages: this.params.messages,
		} as OpenAISpeechToTextParams
	}
}
