export interface ImageService {
	generate(prompt: string, params?: ImageGenerationParams): Promise<Buffer>
	listModels(): Promise<string[]>
	subscribeToFeed(onData: (event: ImageFeedEvent) => void, onError?: (error: Error) => void): () => void
}

export interface ImageGenerationParams {
	model?: string
	seed?: number
	width?: number
	height?: number
	nologo?: boolean
	private?: boolean
	enhance?: boolean
	safe?: boolean
}

export interface ImageFeedEvent {
	width: number
	height: number
	seed: number
	model: string
	nologo: boolean
	negative_prompt: string
	nofeed: boolean
	safe: boolean
	prompt: string
	ip: string
	status: string
	concurrentRequests: number
	imageURL?: string
	isChild?: boolean
	maturity?: { isChild: boolean }
	timingInfo: ImageFeedTimingInfo[]
	referrer?: string
	wasPimped?: boolean
}

export interface ImageFeedTimingInfo {
	step: string
	timestamp: number
}
