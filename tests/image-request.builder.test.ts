import { ImageRequestBuilder } from "../src/builders/image-request.builder.js"

describe("ImageRequestBuilder", () => {
	let builder: ImageRequestBuilder

	beforeEach(() => {
		builder = new ImageRequestBuilder()
	})

	test("should build URL with prompt", () => {
		const url = builder.setPrompt("A sunset").build()
		expect(url).toContain("prompt/A%20sunset")
	})

	test("should include model parameter", () => {
		const url = builder.setPrompt("test").setModel("turbo").build()
		expect(url).toContain("model=turbo")
	})

	test("should include dimensions and seed", () => {
		const url = builder.setPrompt("test").setDimensions(1024, 768).setSeed(42).build()
		expect(url).toContain("width=1024")
		expect(url).toContain("height=768")
		expect(url).toContain("seed=42")
	})

	test("should handle boolean flags", () => {
		const url = builder
			.setPrompt("test")
			.setFlags({
				nologo: true,
				enhance: true,
			})
			.build()
		expect(url).toContain("nologo=true")
		expect(url).toContain("enhance=true")
	})

	test("should omit undefined parameters", () => {
		const url = builder.setPrompt("test").setModel(undefined).build()
		expect(url).not.toContain("model=")
	})

	test("should encode special characters", () => {
		const url = builder.setPrompt("Café & Beach!").build()
		expect(url).toContain("Caf%C3%A9%20%26%20Beach!")
	})

	test("should build basic URL with prompt", () => {
		const url = builder.setPrompt("A beautiful sunset").build()
		expect(url).toBe("https://image.pollinations.ai/prompt/A%20beautiful%20sunset")
	})

	test("should include all parameters", () => {
		const url = builder
			.setPrompt("Futuristic city")
			.setModel("flux")
			.setSeed(42)
			.setDimensions(1280, 720)
			.setFlags({
				nologo: true,
				private: true,
				enhance: true,
				safe: true,
			})
			.build()

		expect(url).toContain("https://image.pollinations.ai/prompt/Futuristic%20city?")
		expect(url).toMatch(/model=flux/)
		expect(url).toMatch(/seed=42/)
		expect(url).toMatch(/width=1280/)
		expect(url).toMatch(/height=720/)
		expect(url).toMatch(/nologo=true/)
		expect(url).toMatch(/private=true/)
		expect(url).toMatch(/enhance=true/)
		expect(url).toMatch(/safe=true/)
	})

	test("should handle special characters in prompt", () => {
		const url = builder.setPrompt("Café & Brasserie!").build()
		expect(url).toBe("https://image.pollinations.ai/prompt/Caf%C3%A9%20%26%20Brasserie!")
	})

	test("should omit undefined parameters", () => {
		const url = builder.setPrompt("Test").setModel(undefined).setSeed(undefined).build()

		expect(url).toBe("https://image.pollinations.ai/prompt/Test")
	})
})
