export interface TextService {
	getGenerate(prompt: string, params?: TextGenerationGetParams): Promise<string>
	postGenerate(params: TextGenerationPostParams): Promise<string>
	vision(params?: TextGenerationVisionParams): Promise<string>
	listModels(): Promise<Model[]>
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
