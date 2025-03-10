import { PollinationsImageService } from "../src/services/image.service.js"
import { ImageRequestBuilder } from "../src/builders/image-request.builder.js"
import { HttpClient } from "../src/interfaces/http-client.interface.js"
import { Readable } from "node:stream"
import { PassThrough } from "node:stream"
import { ImageFeedEvent } from "../src/interfaces/image-service.interface.js"

const mockHttpClient: HttpClient = {
	get: jest.fn(),
	post: jest.fn(),
}
const mockedFeedEvent: ImageFeedEvent = {
	width: 1024,
	height: 768,
	seed: 42,
	model: "flux",
	imageURL: "https://example.com/image.jpg",
	prompt: "Test prompt",
	timingInfo: [],
	ip: "127.0.0.1",
	status: "completed",
	safe: true,
	nologo: false,
	negative_prompt: "",
	nofeed: false,
	concurrentRequests: 1,
}

describe("PollinationsImageService", () => {
	let service: PollinationsImageService
	let builder: ImageRequestBuilder
	let httpClient: HttpClient
	let mockStream: PassThrough

	beforeEach(() => {
		jest.clearAllMocks()

		httpClient = mockHttpClient
		builder = new ImageRequestBuilder()

		mockStream = new PassThrough()
		;(mockHttpClient.get as jest.Mock).mockImplementation(() => Promise.resolve(mockStream))
		service = new PollinationsImageService(httpClient)
	})

	afterEach(() => {
		mockStream.destroy()
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

		await expect(service.generate("Test prompt")).rejects.toThrow("Request failed: Network error")
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

		await expect(service.generate("Test prompt")).rejects.toThrow("Request failed: Invalid parameters")
	})

	test("should use default http client when not provided", () => {
		const serviceWithDefaultBuilder = new PollinationsImageService()
		expect(serviceWithDefaultBuilder).toBeInstanceOf(PollinationsImageService)
	})

	test("should receive valid feed events", (done) => {
		const onData = jest.fn(() => {
			cleanup()
			done()
		})

		const onError = jest.fn((error) => {
			cleanup()
			done(error)
		})

		const cleanup = service.subscribeToFeed(onData, onError)

		process.nextTick(() => {
			mockStream.write(`data: ${JSON.stringify(mockedFeedEvent)}\n\n`)
		})
	})

	test("should handle stream errors", (done) => {
		const onData = jest.fn()
		const onError = jest.fn((error) => {
			expect(error.message).toBe("Feed error: Simulated stream error")
			cleanup()
			done()
		})

		const cleanup = service.subscribeToFeed(onData, onError)

		process.nextTick(() => {
			mockStream.emit("error", new Error("Simulated stream error"))
		})
	})

	test("should handle invalid JSON data", (done) => {
		const onData = jest.fn()
		const onError = jest.fn((error) => {
			expect(error.message).toContain("Failed to parse feed event")
			cleanup()
			done()
		})

		const cleanup = service.subscribeToFeed(onData, onError)

		process.nextTick(() => {
			mockStream.write("data: invalid-json\n\n")
		})
	})

	test("should handle multiple events in single chunk", (done) => {
		const eventCount = 3
		const onData = jest.fn(() => {
			if (onData.mock.calls.length === eventCount) {
				cleanup()
				done()
			}
		})

		const onError = jest.fn((error) => {
			cleanup()
			done(error)
		})

		const cleanup = service.subscribeToFeed(onData, onError)

		process.nextTick(() => {
			const events = Array(eventCount)
				.fill(mockedFeedEvent)
				.map((e, i) => ({ ...e, seed: i }))
				.map((e) => `data: ${JSON.stringify(e)}\n\n`)
				.join("")

			mockStream.write(events)
		})
	})

	test("should handle partial chunk data", (done) => {
		const onData = jest.fn()
		const onError = jest.fn((error) => {
			expect(error.message).toContain("Failed to parse feed event")
			cleanup()
			done()
		})

		const cleanup = service.subscribeToFeed(onData, onError)

		process.nextTick(() => {
			mockStream.write('data: {"incomplete')
			mockStream.write(": true}\n\n")
		})
	})

	test("should stop stream when cleanup is called", (done) => {
		const onData = jest.fn()
		const onError = jest.fn()

		const cleanup = service.subscribeToFeed(onData, onError)
		cleanup()

		process.nextTick(() => {
			mockStream.write(`data: ${JSON.stringify(mockedFeedEvent)}\n\n`)
			mockStream.end()
		})

		setTimeout(() => {
			expect(onData).not.toHaveBeenCalled()
			done()
		}, 50)
	})
})
