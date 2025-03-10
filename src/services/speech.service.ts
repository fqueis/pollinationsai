import {
	OpenAISpeechToTextRequestBuilder,
	OpenAITextToSpeechRequestBuilder,
	PollinationsTextToSpeechBuilder,
} from "../builders/voice-request.builder.js"
import { AxiosHttpClient } from "../clients/axios-http.client.js"
import { HttpClient } from "../interfaces/http-client.interface.js"
import {
	TextToSpeechParams,
	SpeechService,
	OpenAISpeechResponse,
	TextToSpeechMessage,
	SpeechToTextMessage,
} from "../interfaces/voice-service.interface.js"
import { RequestErrorHandler } from "../handlers/request-error.handler.js"

export class PollinationsSpeechService extends RequestErrorHandler implements SpeechService {
	/**
	 * The base URL for the Pollinations Audio service
	 */
	private readonly baseUrl: string = "https://text.pollinations.ai"

	/**
	 * The HTTP client to use for the service
	 */
	private readonly httpClient: HttpClient

	/**
	 * Constructor for the PollinationsAudioService
	 * @param httpClient - The HTTP client to use for the service, should be a HttpClient implementation (optional)
	 */
	constructor(httpClient?: HttpClient) {
		super()
		this.httpClient = httpClient ?? new AxiosHttpClient(this.baseUrl)
	}

	/**
	 * OpenAI format text to speech request
	 * @param params - The parameters for the text to speech request
	 * @returns The response from the text to speech request
	 */
	async openAITextToSpeech(
		params: TextToSpeechParams & { messages: TextToSpeechMessage[] }
	): Promise<OpenAISpeechResponse> {
		try {
			const builder = new OpenAITextToSpeechRequestBuilder(this.baseUrl)
				.setVoice(params.voice ?? "alloy")
				.setFormat(params.format ?? "wav")

			params?.messages?.forEach((msg) => builder.addMessage(msg))

			const body = builder.build()

			return this.httpClient.post<OpenAISpeechResponse>(`${this.baseUrl}/openai`, body)
		} catch (error) {
			super.handleError(error)
		}
	}

	/**
	 * Pollinations format text to speech request
	 * @param params - The parameters for the text to speech request
	 * @returns The response from the text to speech request
	 */
	async pollinationsTextToSpeech(params: TextToSpeechParams & { text: string; format?: string }): Promise<Buffer> {
		try {
			const url = new PollinationsTextToSpeechBuilder(this.baseUrl)
				.setVoice(params.voice ?? "alloy")
				.setText(params.text)
				.build()

			return this.httpClient.get<Buffer>(url, { responseType: "arraybuffer" })
		} catch (error) {
			super.handleError(error)
		}
	}

	/**
	 * OpenAI format speech to text request
	 * @param params - The parameters for the speech to text request
	 * @returns The response from the speech to text request
	 */
	async openAISpeechToText(params: { messages: SpeechToTextMessage[] }): Promise<OpenAISpeechResponse> {
		try {
			const builder = new OpenAISpeechToTextRequestBuilder(this.baseUrl)

			params?.messages?.forEach((msg) => builder.addMessage(msg))

			const body = builder.build()

			return this.httpClient.post<OpenAISpeechResponse>(`${this.baseUrl}/openai`, body)
		} catch (error) {
			super.handleError(error)
		}
	}
}
