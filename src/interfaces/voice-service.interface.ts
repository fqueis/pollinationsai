import { TokensDetail } from "./text-service.interface.js"

export interface SpeechService {
	openAITextToSpeech(params: OpenAITextToSpeechParams): Promise<OpenAISpeechResponse>
	pollinationsTextToSpeech(params: PollinationsTextToSpeechParams): Promise<Buffer>
	openAISpeechToText(params: { messages: SpeechToTextMessage[] }): Promise<OpenAISpeechResponse>
}

export interface TextToSpeechParams {
	model: string
	voice?: string
	format?: string
}

export type PollinationsTextToSpeechParams = TextToSpeechParams & {
	text: string
}

export interface OpenAITextToSpeechParams {
	audio: { voice: string; format?: string }
	model: string
	modalities?: string[]
	messages: TextToSpeechMessage[]
}

export interface TextToSpeechMessage {
	role: "user" | "assistant" | "system" | "input_audio"
	content: string
}

export interface OpenAISpeechResponse {
	choices: OpenAISpeechChoice[]
	created: number
	id: string
	model: string
	object: string
	system_fingerprint: string
	usage: {
		prompt_tokens: number
		prompt_tokens_details: TokensDetail
		completion_tokens: number
		completion_tokens_details: TokensDetail
		total_tokens: number
	}
}
export interface OpenAISpeechChoice {
	content_filter_results: {
		hate: OpenAITextToSpeechContentFilterResults
		protected_material_code: OpenAITextToSpeechContentFilterResults
		protected_material_text: OpenAITextToSpeechContentFilterResults
		self_harm: OpenAITextToSpeechContentFilterResults
		sexual: OpenAITextToSpeechContentFilterResults
		violence: OpenAITextToSpeechContentFilterResults
	}
	finish_reason: string
	index: number
	message: {
		audio: {
			data: string
			expiresAt: number
			id: string
			transcript: string
		}
		content?: string
		refusal?: string
		role: string
	}
}

export interface OpenAITextToSpeechContentFilterResults {
	filtered: boolean
	severity?: string
	detected?: boolean
}

export interface OpenAISpeechToTextParams {
	model: string
	messages: SpeechToTextMessage[]
}

export interface SpeechToTextMessage {
	role: "user" | "assistant" | "system"
	content: SpeechToTextContent[]
}

export interface SpeechToTextContent {
	type: "text" | "input_audio"
	text?: string
	input_audio?: {
		data: string
		format: string
	}
}
