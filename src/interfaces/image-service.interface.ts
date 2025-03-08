export interface ImageService {
	generate(prompt: string, params?: ImageGenerationParams): Promise<Buffer>
	listModels(): Promise<string[]>
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
