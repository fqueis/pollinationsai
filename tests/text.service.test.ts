import { PollinationsTextService } from "../src/services/text.service.js"
import { HttpClient } from "../src/interfaces/http-client.interface.js"
import { Readable } from "node:stream"
import { TextMessage, VisionMessage } from "../src/interfaces/text-service.interface.js"

describe("PollinationsTextService", () => {
	let service: PollinationsTextService
	let mockHttpClient: jest.Mocked<HttpClient>
	let mockReadable: Readable

	beforeEach(() => {
		mockReadable = new Readable({ read() {} })
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
			const mockJsonResponse = JSON.stringify({ result: "Generated JSON response" })
			mockHttpClient.get.mockResolvedValue(mockJsonResponse)

			await service.getGenerate("Test prompt", {
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

		test("should parse JSON when jsonMode enabled", async () => {
			const mockResponse = JSON.stringify({ answer: 42 })
			mockHttpClient.get.mockResolvedValue(mockResponse)

			const prompt = "Test prompt"

			const result = await service.getGenerate<any>(prompt, { jsonMode: true })

			expect(result).toEqual({ answer: 42 })
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
			const mockJsonResponse = JSON.stringify({ result: "Generated JSON response" })
			mockHttpClient.post.mockResolvedValue(mockJsonResponse)

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

		test("should handle stream option", async () => {
			mockHttpClient.post.mockResolvedValue(mockReadable)

			const result = await service.postGenerate(
				{
					messages: [{ role: "user", content: "Hello" }],
				},
				{ stream: true }
			)

			expect(result).toBeInstanceOf(Readable)
		})

		test("should handle stream errors", async () => {
			mockHttpClient.post.mockResolvedValue(mockReadable)

			const result = (await service.postGenerate(
				{ messages: [{ role: "user", content: "Hello" }] },
				{ stream: true }
			)) as Readable

			const errorHandler = jest.fn()
			result.on("error", errorHandler)

			// Test error propagation
			const testError = new Error("Stream error")
			mockReadable.emit("error", testError)

			await new Promise((resolve) => setTimeout(resolve, 50))
			expect(errorHandler).toHaveBeenCalledWith(testError)
		})

		test("should complete stream properly", async () => {
			mockHttpClient.post.mockResolvedValue(mockReadable)

			const result = (await service.postGenerate(
				{ messages: [{ role: "user", content: "Hello" }] },
				{ stream: true }
			)) as Readable

			const endHandler = jest.fn()
			result.on("end", endHandler)

			// Trigger stream end
			mockReadable.push(null)

			// Wait for the end event to propagate
			await new Promise<void>((resolve) => {
				result.on("end", resolve)
			})

			expect(endHandler).toHaveBeenCalled()
		})

		test("should parse valid JSON response", async () => {
			const mockResponse = JSON.stringify({ result: "success" })
			mockHttpClient.post.mockResolvedValue(mockResponse)

			const result = await service.postGenerate<any>({ messages: [{ role: "user", content: "Hello" }], jsonMode: true })

			expect(result).toEqual({ result: "success" })
		})

		test("should sanitize and parse malformed JSON", async () => {
			const badJson = "{key: 'value', num: 123}"
			mockHttpClient.post.mockResolvedValue(badJson)

			const result = await service.postGenerate<any>({ messages: [{ role: "user", content: "Hello" }], jsonMode: true })

			expect(result).toEqual({ key: "value", num: 123 })
		})

		test("should handle already parsed JSON objects", async () => {
			const mockResponse = { result: "parsed" }
			mockHttpClient.post.mockResolvedValue(JSON.stringify(mockResponse))

			const result = await service.postGenerate<any>({ messages: [{ role: "user", content: "Hello" }], jsonMode: true })

			expect(result).toEqual(mockResponse)
		})

		test("should throw error for invalid JSON after sanitization", async () => {
			const badJson = "{invalid}"
			mockHttpClient.post.mockResolvedValue(badJson)

			await expect(
				service.postGenerate({ messages: [{ role: "user", content: "Hello" }], jsonMode: true })
			).rejects.toThrow("Malformed JSON response")
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
			const mockJsonResponse = JSON.stringify({ result: "Generated JSON response" })
			mockHttpClient.post.mockResolvedValue(mockJsonResponse)

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

		test("should handle JSON responses in vision mode", async () => {
			const mockResponse = JSON.stringify({ analysis: "positive" })
			mockHttpClient.post.mockResolvedValue(mockResponse)

			const result = await service.vision<any>({
				messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
				jsonMode: true,
			})

			expect(result).toEqual({ analysis: "positive" })
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
