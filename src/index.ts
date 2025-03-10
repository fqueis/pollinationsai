export * from "./interfaces/image-service.interface.js"
export * from "./services/image.service.js"
export * from "./builders/image-request.builder.js"
export * from "./clients/axios-http.client.js"

// Main factory function for default usage
import { AxiosHttpClient } from "./clients/axios-http.client.js"
import { PollinationsImageService } from "./services/image.service.js"
import { PollinationsTextService } from "./services/text.service.js"
import type { HttpClient } from "./interfaces/http-client.interface.js"
import type { ImageService } from "./interfaces/image-service.interface.js"
import type { TextService } from "./interfaces/text-service.interface.js"

export const createImageService = (httpClient?: HttpClient): ImageService => {
	return new PollinationsImageService(httpClient)
}

export const createTextService = (httpClient?: HttpClient): TextService => {
	return new PollinationsTextService(httpClient)
}

// Default export for ES modules
export default {
	createImageService,
	createTextService,
	PollinationsImageService,
	PollinationsTextService,
	AxiosHttpClient,
}

// Type exports
export type * from "./interfaces/image-service.interface.js"
export type * from "./interfaces/text-service.interface.js"
export type { HttpClient } from "./interfaces/http-client.interface.js"
