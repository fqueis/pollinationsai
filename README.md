# 🐝 Pollinations AI Client Library

A TypeScript/JavaScript client for interacting with Pollinations AI services, providing easy access to image generation, text processing, and speech synthesis capabilities.

## Features

- 🖼️ Image generation with multiple models and parameters
- 🔊 Text-to-speech conversion with voice selection
- 📝 AI-powered text completions
- 🔧 Builder pattern API for easy request construction
- ⚡ Axios-based HTTP client with extensible architecture
- ✅ 100% test coverage with Jest
- 📦 Dual CJS/ESM module support

## Installation

```bash
npm install pollinationsai
# or
pnpm add pollinationsai
# or
yarn add pollinationsai
```

## Module Support

This library supports both modern ESM and legacy CommonJS environments:

**ESM Usage:**

```javascript
import { createImageService } from "pollinationsai"
```

**CommonJS Usage:**

```javascript
const { createImageService } = require("pollinationsai/dist/cjs")
```

## Type Safety

- 🛡️ Full TypeScript support with strict type checking
- 📜 Detailed type definitions included in package
- 🔍 Compile-time validation of all API parameters

## Usage Examples

### Image Generation Features

##### Basic Generation

```typescript
import { createImageService } from "pollinationsai"
import fs from "fs"

// Create service with default client
const imageService = createImageService()

const prompt = "A mystical forest with glowing mushrooms"

// Generate image from prompt
const imageStream = await imageService.generateImage(prompt, {
    model: "flux",
    width: 1024,
    height: 1024,
    private: true,
    safe: true,
    seed: 42,
    nologo: true,
    enhance: true,
})

// Save buffer to file
fs.writeFileSync("magic-forest.jpg", imageBuffer)
```

##### Model Management

```typescript
// List available models
const models = await imageService.listModels()
console.log("Available models:", models)
```

### Text Generation Features

##### Basic Completion

```typescript
import { PollinationsTextService } from "pollinationsai"

const textService = new PollinationsTextService()

// Simple GET-based generation
const prompt = "Once upon a time in a cyberpunk city..."

const story = await textService.getGenerate(prompt, {
    model: "openai-large",
    system: "You are a evil helpful assistant.",
    private: true,
})
```

##### Advanced Chat Completion

```typescript
// Complex POST request with message history
const chatHistory = await textService.postGenerate({
    model: "openai-large",
    messages: [
        { role: "system", content: "You are a sarcastic assistant" },
        { role: "user", content: "How do I make a sandwich?" },
    ],
    seed: 12345,
})
```

##### Multimodal Vision Processing

```typescript
// Image analysis with vision model
const imageAnalysis = await textService.vision({
    model: "openai-large",
    private: true
    messages: [{
        role: "user",
        content: [
            { type: "text", text: "What's in this image?" },
            {
                type: "image_url",
                image_url: {
                    url: "https://example.com/sample.jpg",
                },
            },
        ],
    }]
})
```

##### Real-time Streaming

```typescript
// Subscribe to real-time text generation feed
const cleanup = textService.subscribeToFeed(
    (event) => console.log("New generated text:", event.response)
    (error) => console.error("Stream error:", error)
)

// Remember to cleanup when you're done
setTimeout(() => cleanup(), 60000)
```

##### Model Management

```typescript
// List available models
const models = await textService.listModels()
console.log("Available models:", models)
```

### Speech Features

### Text-to-Speech

##### Basic Usage:

```typescript
import { PollinationsSpeechService } from "pollinationsai"
import fs from "fs"

const speechService = new PollinationsSpeechService()

const text = "Exploring the vastness of space requires courage and curiosity"

// Simple text-to-speech conversion
const audio = await speechService.pollinationsTextToSpeech({ text, voice: "nova", format: "mp3" })

fs.writeFileSync("space.mp3", audio)
```

##### OpenAI-compatible API:

```typescript
const content = "The future belongs to those who believe in the beauty of their dreams"

// Advanced TTS with message history
const dreams = await speechService.openAITextToSpeech({
    voice: "ash",
    format: "wav",
    messages: [{ role: "user", content }],
  });

fs.writeFileSync("dreams.wav", dreams.choices[0].message.audio.data, { encoding: "base64" });
```

### Speech-to-Text

##### Only OpenAI-compatible API:

```typescript
const audio = fs.readFileSync("dreams.wav", { encoding: "base64" });

// Convert speech to text
const transcription = await speechService.openAISpeechToText({
    messages: [{
        role: "user",
        content: [
          { type: "text", text: "What is in this recording?" },
          { type: "input_audio", input_audio: { data: audio, format: "wav" } },
        ],
    }]
})

console.log("Transcription:", transcription.choices[0].message.content)
```

### Builder Pattern Example

```typescript
import { TextGenerationGetRequestBuilder } from "pollinationsai"

const baseUrl = "https://text.pollinations.ai"

const url = new TextGenerationGetRequestBuilder(baseUrl)
    .setPrompt("Once upon a time in a cyberpunk city...")
    .setModel("openai-large")
    .setSeed(1234)
    .setJsonMode(true)
    .setSystem("You are a evil helpful assistant")
    .setPrivateMode(true)
    .build()

const generatedText = await fetch(url).then((r) => r.json())
```

## Development Setup

```bash
# Run tests (with coverage)
npm test

# Watch mode development
npm run tests:watch

# Build both ESM and CJS versions
npm run build
```

## Contributing

🤝 We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Open-source software licensed under the [MIT license](LICENSE)
