import axios, { AxiosInstance } from "axios"
import { HttpClient, RequestConfig } from "../interfaces/http-client.interface.js"

/**
 * Axios HTTP client implementation
 *
 * @example
 * const client = new AxiosHttpClient("https://image.pollinations.ai")
 */
export class AxiosHttpClient implements HttpClient {
	private client: AxiosInstance

	/**
	 * Constructor for the AxiosHttpClient
	 * @param baseURL - The base URL for the client
	 */
	constructor(baseURL: string) {
		this.client = axios.create({ baseURL })
	}

	/**
	 * Send a GET request to the server
	 * @param url - The URL to send the request to
	 * @param config - The request configuration
	 * @returns The response data
	 */
	async get<T>(url: string, config?: RequestConfig): Promise<T> {
		const response = await this.client.get<T>(url, {
			params: config?.params,
			responseType: config?.responseType || "json",
		})
		return response.data
	}

	/**
	 * Send a POST request to the server
	 * @param url - The URL to send the request to
	 * @param data - The data to send in the request body
	 * @param config - The request configuration
	 * @returns The response data
	 */
	async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
		const response = await this.client.post<T>(url, data, {
			params: config?.params,
			responseType: config?.responseType || "json",
		})

		return response.data
	}
}
