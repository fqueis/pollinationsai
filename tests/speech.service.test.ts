import { PollinationsSpeechService } from "../src/services/speech.service.js"
import { HttpClient } from "../src/interfaces/http-client.interface.js"
import { Readable, PassThrough } from "node:stream"
import { TextToSpeechMessage, SpeechToTextMessage } from "../src/interfaces/speech-service.interface.js"

describe("PollinationsSpeechService", () => {
	let service: PollinationsSpeechService
	let mockHttpClient: jest.Mocked<HttpClient>
	let mockStream: PassThrough

	beforeEach(() => {
		mockHttpClient = {
			get: jest.fn(),
			post: jest.fn(),
		}
		mockStream = new PassThrough()
		service = new PollinationsSpeechService(mockHttpClient)
	})

	afterEach(() => {
		mockStream.destroy()
	})

	describe("textToSpeech", () => {
		test("should generate audio with basic text", async () => {
			const mockAudio = Buffer.from("mock-audio-data")
			mockHttpClient.get.mockResolvedValue(mockAudio)

			const result = await service.pollinationsTextToSpeech({
				text: "Hello world",
				model: "openai-audio",
			})

			expect(result).toBeInstanceOf(Buffer)
			expect(result).toEqual(mockAudio)
		})

		test("should include voice parameters", async () => {
			await service.pollinationsTextToSpeech({
				text: "Test voice",
				voice: "alloy",
				model: "openai-audio",
			})

			const calledUrl = mockHttpClient.get.mock.calls[0][0] as string
			expect(calledUrl).toContain("voice=alloy")
			expect(calledUrl).toContain("model=openai-audio")
		})

		test("should handle errors in GET request", async () => {
			const error = new Error("Network error")
			mockHttpClient.get.mockRejectedValue(error)

			await expect(service.pollinationsTextToSpeech({ text: "Test", model: "openai-audio" })).rejects.toThrow()
		})
	})

	describe("openAITextToSpeech", () => {
		test("should generate audio with messages", async () => {
			const mockAudio = Buffer.from("mock-audio-data")
			mockHttpClient.post.mockResolvedValue(mockAudio)

			const messages: TextToSpeechMessage[] = [{ role: "user", content: "Hello world" }]

			const result = await service.openAITextToSpeech({ messages, model: "openai-audio" })

			expect(result).toBeInstanceOf(Buffer)
			expect(result).toEqual(mockAudio)
			expect(mockHttpClient.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					messages,
					model: "openai-audio",
					modalities: ["text", "audio"],
				})
			)
		})

		test("should include custom parameters", async () => {
			await service.openAITextToSpeech({
				messages: [{ role: "user", content: "Test" }],
				voice: "echo",
				format: "mp3",
				model: "openai-audio",
			})

			expect(mockHttpClient.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					audio: {
						voice: "echo",
						format: "mp3",
					},
				})
			)
		})

		test("should handle errors in POST request", async () => {
			mockHttpClient.post.mockRejectedValue(new Error("Network error"))

			await expect(
				service.openAITextToSpeech({
					messages: [{ role: "user", content: "Test" }],
					model: "openai-audio",
				})
			).rejects.toThrow()
		})
	})

	describe("speechToText", () => {
		test("should transcribe audio", async () => {
			const expectedResponse = "Transcribed text"
			mockHttpClient.post.mockResolvedValue(expectedResponse)

			const messages: SpeechToTextMessage[] = [
				{
					role: "user",
					content: [{ type: "text", text: "What is in this recording?" }],
				},
				{
					role: "user",
					content: [{ type: "input_audio", input_audio: { data: "base64audio", format: "wav" } }],
				},
			]

			const result = await service.openAISpeechToText({ messages })

			expect(result).toBe(expectedResponse)
			expect(mockHttpClient.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					messages,
					model: "openai-audio",
				})
			)
		})

		test("should handle transcription errors", async () => {
			mockHttpClient.post.mockRejectedValue(new Error("Transcription failed"))

			await expect(
				service.openAISpeechToText({
					messages: [
						{
							role: "user",
							content: [{ type: "text", text: "What is in this recording?" }],
						},
						{
							role: "user",
							content: [{ type: "input_audio", input_audio: { data: "base64audio", format: "wav" } }],
						},
					],
				})
			).rejects.toThrow()
		})
	})
})
