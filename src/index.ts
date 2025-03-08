export * from "./interfaces/image-service.interface.js"
export * from "./services/image.service.js"
export * from "./builders/image-request.builder.js"
export * from "./clients/axios-http.client.js"

// Main factory function for default usage
import { PollinationsImageService } from "./services/image.service.js"
import { AxiosHttpClient } from "./clients/axios-http.client.js"
import type { HttpClient } from "./interfaces/http-client.interface.js"
import type { ImageService } from "./interfaces/image-service.interface.js"

export const createImageService = (httpClient?: HttpClient): ImageService => {
	return new PollinationsImageService(httpClient)
}

// Default export for ES modules
export default {
	createImageService,
	PollinationsImageService,
	AxiosHttpClient,
}

// Type exports
export type { ImageService } from "./interfaces/image-service.interface.js"
export type { HttpClient } from "./interfaces/http-client.interface.js"
