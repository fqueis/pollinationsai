export interface HttpClient {
	get<T>(url: string, config?: RequestConfig): Promise<T>
}

export interface RequestConfig {
	responseType?: "arraybuffer" | "json"
	params?: Record<string, string | number | boolean>
}
