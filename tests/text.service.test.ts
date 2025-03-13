import { PollinationsTextService } from "../src/services/text.service.js"
import { HttpClient } from "../src/interfaces/http-client.interface.js"
import { Readable } from "node:stream"
import { TextMessage, VisionMessage } from "../src/interfaces/text-service.interface.js"

describe("PollinationsTextService", () => {
	let service: PollinationsTextService
	let mockHttpClient: jest.Mocked<HttpClient>

	beforeEach(() => {
		mockHttpClient = {
			get: jest.fn(),
			post: jest.fn(),
		}
		service = new PollinationsTextService(mockHttpClient)
	})

	describe("getGenerate", () => {
		test("should generate text with basic prompt", async () => {
			const expectedResponse = "Generated text response"
			mockHttpClient.get.mockResolvedValue(expectedResponse)

			const result = await service.getGenerate("Hello world")

			expect(result).toBe(expectedResponse)
			expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining("/prompt/Hello%20world"))
		})

		test("should include all parameters in GET request", async () => {
			await service.getGenerate("Test prompt", {
				prompt: "Test prompt",
				model: "openai-large",
				seed: 42,
				jsonMode: true,
				system: "Test system",
				private: true,
			})

			const calledUrl = mockHttpClient.get.mock.calls[0][0] as string
			expect(calledUrl).toContain("model=openai-large")
			expect(calledUrl).toContain("seed=42")
			expect(calledUrl).toContain("json=true")
			expect(calledUrl).toContain("system=Test%2520system")
			expect(calledUrl).toContain("private=true")
		})

		test("should handle errors in GET request", async () => {
			const error = new Error("Network error")
			mockHttpClient.get.mockRejectedValue(error)

			await expect(service.getGenerate("Test")).rejects.toThrow()
		})
	})

	describe("postGenerate", () => {
		test("should generate text with messages", async () => {
			const expectedResponse = "Generated response"
			mockHttpClient.post.mockResolvedValue(expectedResponse)

			const messages: TextMessage[] = [
				{ role: "system", content: "You are a helper" },
				{ role: "user", content: "Hello" },
			]

			const result = await service.postGenerate({ messages })

			expect(result).toBe(expectedResponse)
			expect(mockHttpClient.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					messages: messages,
				})
			)
		})

		test("should include all parameters in POST request", async () => {
			await service.postGenerate({
				messages: [{ role: "user", content: "Hello" }],
				model: "gpt-4",
				seed: 42,
				jsonMode: true,
				private: true,
			})

			expect(mockHttpClient.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					model: "gpt-4",
					seed: 42,
					jsonMode: true,
					private: true,
				})
			)
		})

		test("should handle errors in POST request", async () => {
			mockHttpClient.post.mockRejectedValue(new Error("Network error"))

			await expect(
				service.postGenerate({
					messages: [{ role: "user", content: "Hello" }],
				})
			).rejects.toThrow()
		})
	})

	describe("vision", () => {
		test("should generate vision response", async () => {
			const expectedResponse = "Vision analysis response"
			mockHttpClient.post.mockResolvedValue(expectedResponse)

			const messages: VisionMessage[] = [
				{
					role: "user",
					content: [
						{ type: "text", text: "What's in this image?" },
						{ type: "image_url", image_url: { url: "https://example.com/image.jpg" } },
					],
				},
			]

			const result = await service.vision({ messages })

			expect(result).toBe(expectedResponse)
			expect(mockHttpClient.post).toHaveBeenCalledWith("https://text.pollinations.ai", {
				messages,
			})
		})

		test("should handle vision parameters when explicitly set", async () => {
			await service.vision({
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: "Analyze this" },
							{ type: "image_url", image_url: { url: "https://example.com/image.jpg" } },
						],
					},
				],
				model: "openai",
				jsonMode: true,
				private: true,
			})

			expect(mockHttpClient.post).toHaveBeenCalledWith(
				"https://text.pollinations.ai",
				expect.objectContaining({
					messages: expect.any(Array),
					model: "openai",
					jsonMode: true,
					private: true,
				})
			)
		})
	})

	describe("listModels", () => {
		test("should return available models", async () => {
			const mockModels = [
				{ id: "gpt-4", name: "GPT-4" },
				{ id: "gpt-3.5", name: "GPT-3.5" },
			]
			mockHttpClient.get.mockResolvedValue(mockModels)

			const result = await service.listModels()

			expect(result).toEqual(mockModels)
			expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining("/models"))
		})
	})

	describe("subscribeToFeed", () => {
		let mockReadable: Readable

		beforeEach(() => {
			mockReadable = new Readable({ read() {} })
			mockHttpClient.get.mockResolvedValue(mockReadable)
		})

		test("should handle feed events", (done) => {
			const mockEvent = { id: "123", status: "completed" }
			const onData = jest.fn()
			const cleanup = service.subscribeToFeed(onData)

			mockReadable.push(`data: ${JSON.stringify(mockEvent)}\n\n`)

			setTimeout(() => {
				expect(onData).toHaveBeenCalledWith(mockEvent)
				cleanup()
				done()
			}, 100)
		})

		test("should handle feed errors", (done) => {
			const onError = jest.fn()
			const cleanup = service.subscribeToFeed(() => {}, onError)

			// Use process.nextTick to ensure listeners are attached first
			process.nextTick(() => {
				mockReadable.emit("error", new Error("Stream error"))
			})

			setTimeout(() => {
				expect(onError).toHaveBeenCalledWith(expect.any(Error))
				cleanup()
				done()
			}, 100)
		})

		test("should cleanup properly", () => {
			const cleanup = service.subscribeToFeed(() => {})
			cleanup()
			// Should not throw errors when cleaning up
			expect(() => cleanup()).not.toThrow()
		})
	})
})
