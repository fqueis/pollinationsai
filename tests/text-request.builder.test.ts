import {
	TextGenerationGetRequestBuilder,
	TextGenerationPostRequestBuilder,
	TextGenerationVisionRequestBuilder,
} from "../src/builders/text-request.builder.js"

describe("TextGenerationGetRequestBuilder", () => {
	let builder: TextGenerationGetRequestBuilder
	const baseUrl = "https://text.pollinations.ai"

	beforeEach(() => {
		builder = new TextGenerationGetRequestBuilder(baseUrl)
	})

	test("should build basic URL with prompt", () => {
		const url = builder.setPrompt("Hello world").build()
		expect(url).toBe(`${baseUrl}/prompt/Hello%20world?`)
	})

	test("should include all parameters", () => {
		const url = builder
			.setPrompt("Test prompt")
			.setModel("gpt-4")
			.setSystem("System prompt")
			.setJsonMode(true)
			.setSeed(42)
			.setPrivateMode(true)
			.build()

		expect(url).toContain(`${baseUrl}/prompt/Test%20prompt?`)
		expect(url).toContain("model=gpt-4")
		expect(url).toContain("system=System%2520prompt")
		expect(url).toContain("json=true")
		expect(url).toContain("seed=42")
		expect(url).toContain("private=true")
	})

	test("should encode special characters", () => {
		const url = builder.setPrompt("Hello & Goodbye!").setSystem("Test & System").build()
		expect(url).toContain("prompt/Hello%20%26%20Goodbye!")
		expect(url).toContain("system=Test%2520%2526%2520System")
	})

	test("should omit undefined parameters", () => {
		const url = builder.setPrompt("Test").setModel(undefined).build()
		expect(url).not.toContain("model=")
	})
})

describe("TextGenerationPostRequestBuilder", () => {
	let builder: TextGenerationPostRequestBuilder

	beforeEach(() => {
		builder = new TextGenerationPostRequestBuilder()
	})

	test("should build request with single message", () => {
		const request = builder.addMessage({ role: "user", content: "Hello" }).build()

		expect(request.messages).toEqual([{ role: "user", content: "Hello" }])
	})

	test("should build request with multiple messages", () => {
		const request = builder
			.addMessage({ role: "system", content: "You are a helper" })
			.addMessage({ role: "user", content: "Hello" })
			.addMessage({ role: "assistant", content: "Hi there" })
			.build()

		expect(request.messages).toHaveLength(3)
		expect(request.messages![0]).toEqual({ role: "system", content: "You are a helper" })
		expect(request.messages![1]).toEqual({ role: "user", content: "Hello" })
		expect(request.messages![2]).toEqual({ role: "assistant", content: "Hi there" })
	})

	test("should include optional parameters", () => {
		const request = builder
			.addMessage({ role: "user", content: "Hello" })
			.setModel("gpt-4")
			.setJsonMode(true)
			.setSeed(42)
			.setPrivateMode(true)
			.build()

		expect(request.messages).toBeDefined()
		expect(request.model).toBe("gpt-4")
		expect(request.jsonMode).toBe(true)
		expect(request.seed).toBe(42)
		expect(request.private).toBe(true)
	})

	test("should throw error when no messages are added", () => {
		expect(() => builder.build()).toThrow("At least one message is required")
	})

	test("should handle stream option", () => {
		const request = builder.addMessage({ role: "user", content: "Hello" }).setStream(true).build()

		expect(request.stream).toBe(true)
	})
})

describe("TextGenerationVisionRequestBuilder", () => {
	let builder: TextGenerationVisionRequestBuilder

	beforeEach(() => {
		builder = new TextGenerationVisionRequestBuilder()
	})

	test("should initialize with default model", () => {
		const request = builder
			.addMessage({ role: "user", content: [{ type: "text", text: "Describe this image" }] })
			.build()

		expect(request.model).toBe("openai-large")
	})

	test("should build request with vision message", () => {
		const request = builder
			.addMessage({
				role: "user",
				content: [
					{ type: "text", text: "What's in this image?" },
					{ type: "image_url", image_url: { url: "https://example.com/image.jpg" } },
				],
			})
			.build()

		expect(request.messages).toHaveLength(1)
		expect(request.messages![0]).toEqual({
			role: "user",
			content: [
				{ type: "text", text: "What's in this image?" },
				{ type: "image_url", image_url: { url: "https://example.com/image.jpg" } },
			],
		})
	})

	test("should validate vision models", () => {
		expect(() => builder.setModel("invalid-model")).toThrow("Invalid vision model")

		// Should not throw for valid models
		expect(() => builder.setModel("openai")).not.toThrow()
		expect(() => builder.setModel("openai-large")).not.toThrow()
		expect(() => builder.setModel("claude-hybridspace")).not.toThrow()
	})

	test("should throw error when no messages are added", () => {
		expect(() => builder.build()).toThrow("At least one vision message is required")
	})

	test("should include optional parameters", () => {
		const request = builder
			.addMessage({
				role: "user",
				content: [
					{ type: "text", text: "Analyze this" },
					{ type: "image_url", image_url: { url: "https://example.com/image.jpg" } },
				],
			})
			.setJsonMode(true)
			.setSeed(42)
			.setPrivateMode(true)
			.build()

		expect(request.jsonMode).toBe(true)
		expect(request.seed).toBe(42)
		expect(request.private).toBe(true)
	})
})
