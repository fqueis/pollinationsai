export interface HttpClient {
	get<T>(url: string, config?: RequestConfig): Promise<T>
	post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>
}

export interface RequestConfig {
	responseType?: "arraybuffer" | "json" | "stream"
	headers?: Record<string, string>
	params?: Record<string, string | number | boolean>
	signal?: AbortSignal
}
