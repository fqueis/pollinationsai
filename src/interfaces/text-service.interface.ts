export interface TextService {
	getGenerate(prompt: string, params?: TextGenerationGetParams): Promise<string>
	postGenerate(params: TextGenerationPostParams): Promise<string>
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
