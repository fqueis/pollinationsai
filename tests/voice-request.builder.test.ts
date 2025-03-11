import {
	PollinationsTextToSpeechBuilder,
	OpenAITextToSpeechRequestBuilder,
	OpenAISpeechToTextRequestBuilder,
} from "../src/builders/voice-request.builder.js"
import { TextToSpeechMessage, SpeechToTextMessage } from "../src/interfaces/voice-service.interface.js"

describe("PollinationsTextToSpeechBuilder", () => {
	let builder: PollinationsTextToSpeechBuilder
	const baseUrl = "https://voice.pollinations.ai"

	beforeEach(() => {
		builder = new PollinationsTextToSpeechBuilder(baseUrl)
	})

	test("should build basic URL with text", () => {
		const url = builder.setText("Hello world").build()
		expect(url).toBe(`${baseUrl}/Hello%20world?model=openai-audio`)
	})

	test("should include voice parameter", () => {
		const url = builder.setText("Test voice").setVoice("alloy").build()

		expect(url).toContain("voice=alloy")
		expect(url).toContain("model=openai-audio")
	})

	test("should throw error when text is not set", () => {
		expect(() => builder.build()).toThrow("Text is required")
	})

	test("should encode special characters in text", () => {
		const url = builder.setText("Hello & Goodbye!").build()
		expect(url).toContain("Hello%20%26%20Goodbye")
	})
})

describe("OpenAITextToSpeechRequestBuilder", () => {
	let builder: OpenAITextToSpeechRequestBuilder
	const baseUrl = "https://api.openai.com/v1/audio/speech"

	beforeEach(() => {
		builder = new OpenAITextToSpeechRequestBuilder(baseUrl)
	})

	test("should build request with default parameters", () => {
		const message: TextToSpeechMessage = { role: "user", content: "Hello world" }
		const request = builder.addMessage(message).build()

		expect(request).toEqual({
			audio: {
				voice: "alloy",
				format: "wav",
			},
			model: "openai-audio",
			modalities: ["text", "audio"],
			messages: [message],
		})
	})

	test("should include custom voice and format", () => {
		const message: TextToSpeechMessage = { role: "user", content: "Test" }
		const request = builder.addMessage(message).setVoice("echo").setFormat("mp3").build()

		expect(request.audio).toEqual({
			voice: "echo",
			format: "mp3",
		})
	})

	test("should throw error when no messages are added", () => {
		expect(() => builder.build()).toThrow("At least one message is required")
	})
})

describe("OpenAISpeechToTextRequestBuilder", () => {
	let builder: OpenAISpeechToTextRequestBuilder
	const baseUrl = "https://api.openai.com/v1/audio/transcriptions"

	beforeEach(() => {
		builder = new OpenAISpeechToTextRequestBuilder(baseUrl)
	})

	test("should build request with message", () => {
		const message: SpeechToTextMessage = {
			role: "user",
			content: [
				{
					type: "text",
					text: "What is in this recording?",
				},
				{
					type: "input_audio",
					input_audio: { data: "base64audio", format: "wav" },
				},
			],
		}
		const request = builder.addMessage(message).build()

		expect(request).toEqual({
			model: "openai-audio",
			messages: [message],
		})
	})

	test("should set format", () => {
		const message: SpeechToTextMessage = {
			role: "user",
			content: [
				{
					type: "text",
					text: "What is in this recording?",
				},
				{
					type: "input_audio",
					input_audio: { data: "base64audio", format: "wav" },
				},
			],
		}
		const request = builder.addMessage(message).setFormat("mp3").build()

		expect(request.model).toBe("openai-audio")
		expect(request.messages).toEqual([message])
	})

	test("should throw error when no messages are added", () => {
		expect(() => builder.build()).toThrow("At least one message is required")
	})
})
