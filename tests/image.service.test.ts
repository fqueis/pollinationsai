import { PollinationsImageService } from "../src/services/image.service.js"
import { ImageRequestBuilder } from "../src/builders/image-request.builder.js"
import { HttpClient } from "../src/interfaces/http-client.interface.js"

const mockHttpClient: HttpClient = {
	get: jest.fn(),
}

describe("PollinationsImageService", () => {
	let service: PollinationsImageService
	let builder: ImageRequestBuilder
	let httpClient: HttpClient

	beforeEach(() => {
		httpClient = mockHttpClient
		builder = new ImageRequestBuilder()
		service = new PollinationsImageService(httpClient)
		jest.clearAllMocks()
	})

	test("should return image buffer on success", async () => {
		const mockImage = Buffer.from("test-image")
		;(httpClient.get as jest.Mock).mockResolvedValue(mockImage)

		const result = await service.generate("Test prompt")
		expect(result).toBeInstanceOf(Buffer)
		expect(result).toEqual(mockImage)
	})

	test("should list models on success", async () => {
		const mockModels = ["flux", "turbo"]
		;(httpClient.get as jest.Mock).mockResolvedValue(mockModels)

		const result = await service.listModels()
		expect(result).toEqual(mockModels)
	})

	test("should handle HTTP errors", async () => {
		const error = new Error("Network error")
		;(httpClient.get as jest.Mock).mockRejectedValue(error)

		await expect(service.generate("Test prompt")).rejects.toThrow("Image generation failed: Network error")
	})

	test("should handle Axios errors", async () => {
		const axiosError = {
			isAxiosError: true,
			response: {
				data: { message: "Invalid parameters" },
			},
			message: "Request failed",
		}

		;(httpClient.get as jest.Mock).mockRejectedValue(axiosError)

		await expect(service.generate("Test prompt")).rejects.toThrow("Image generation failed: Invalid parameters")
	})

	test("should use default http client when not provided", () => {
		const serviceWithDefaultBuilder = new PollinationsImageService()
		expect(serviceWithDefaultBuilder).toBeInstanceOf(PollinationsImageService)
	})
})
