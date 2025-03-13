import { Readable } from "node:stream"

declare module "stream" {
	interface Readable {
		on(event: "data", listener: (chunk: any) => void): this
		on(event: string | symbol, listener: (...args: any[]) => void): this
	}
}

export interface TypedReadable<T> extends Readable {
	on(event: "data", listener: (chunk: T) => void): this
	on(event: string | symbol, listener: (...args: any[]) => void): this
}

export interface TextService {
	getGenerate(prompt: string, params?: TextGenerationGetParams): Promise<string>
	postGenerate(params: TextGenerationPostParams): Promise<string>
	postGenerate(
		params: TextGenerationPostParams,
		options: { stream: true; onStreamData?: (event: StreamEvent) => void }
	): Promise<TypedReadable<StreamEvent>>
	vision(params?: TextGenerationVisionParams): Promise<string>
	listModels(): Promise<Model[]>
	subscribeToFeed(onData: (event: TextFeedEvent) => void, onError?: (error: Error) => void): () => void
}

export interface BaseGenerationParams {
	model?: string
	seed?: number
	jsonMode?: boolean
	system?: string
	private?: boolean
}

export interface TextGenerationGetParams extends BaseGenerationParams {
	prompt: string
}

export interface TextGenerationPostParams extends BaseGenerationParams {
	messages: TextMessage[]
	stream?: boolean
}

export interface TextMessage {
	role: "user" | "assistant" | "system"
	content: string
}

export interface TextGenerationVisionParams extends BaseGenerationParams {
	messages: VisionMessage[]
}

export interface VisionMessage {
	role: "user" | "assistant" | "system"
	content: VisionContent[]
}

export interface VisionContent {
	type: "text" | "image_url"
	text?: string
	image_url?: { url: string }
}

export interface Model {
	name: string
	type: string
	censored: boolean
	description: string
	baseModel: string
	vision?: boolean
	reasoning?: boolean
	provider?: string
	audio?: boolean
	voices?: string[]
}

export interface TextFeedEvent {
	response: string
	parameters: TextFeedParams
}

export interface TextFeedParams {
	messages: TextMessage[] | VisionMessage[]
	jsonMode: boolean
	seed: number
	model: string
	temperature?: number
	isImagePollinationsReferrer: boolean
	isRobloxReferrer: boolean
	referrer: string
	stream: boolean
	isPrivate: boolean
	voice: string
	prompt_tokens: number
	prompt_tokens_details: TokensDetail
	completion_tokens: number
	completion_tokens_details: TokensDetail
	total_tokens: number
}

export interface TokensDetail {
	accepted_prediction_tokens?: number
	audio_tokens?: number
	cached_tokens?: number
	reasoning_tokens?: number
	rejected_prediction_tokens?: number
}

export interface StreamEvent {
	choices: StreamChoice[]
	created: number
	id: string
	model: string
	object: string
	system_fingerprint: string
	prompt_filter_results: ContentFilterResults[]
}

export interface ContentFilterResults {
	prompt_index: number
	content_filter_results: FilterResults
}

export interface FilterResults {
	hate: { filtered: boolean; severity?: string; detected?: boolean }
	self_harm: { filtered: boolean; severity?: string; detected?: boolean }
	sexual: { filtered: boolean; severity?: string; detected?: boolean }
	violence: { filtered: boolean; severity?: string; detected?: boolean }
}
export interface StreamChoice {
	content_filter_results: FilterResults
	delta: { content: string }
	finish_reason: string
	index: number
}
