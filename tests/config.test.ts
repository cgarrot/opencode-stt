import { test, expect } from "bun:test"
import { loadConfig } from "../src/config/load-config"

test("loads legacy Mistral config and sanitizes capture numbers", async () => {
  const config = await loadConfig({
    apiKey: "test-key",
    model: "voxtral-mini-2602",
    endpoint: "https://api.mistral.ai/v1/audio/transcriptions",
    ffmpeg: "ffmpeg",
    sampleRate: -1,
    channels: 0,
    maxSeconds: 15,
    minBytes: 1,
  })

  expect(config.provider.type).toEqual("mistral")
  expect(config.provider.apiKey).toEqual("test-key")
  expect(config.capture.sampleRate).toEqual(16000)
  expect(config.capture.channels).toEqual(1)
  expect(config.capture.maxSeconds).toEqual(15)
  expect(config.capture.minBytes).toEqual(44)
})

test("loads localhost OpenAI-compatible provider without an API key", async () => {
  const previousOpenAiKey = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = "dummy-key-that-must-not-be-read"

  try {
    const config = await loadConfig({
      provider: {
        type: "openai-compatible",
        endpoint: "http://localhost:10301/v1/audio/transcriptions",
        model: "whisper-1",
        apiKeyEnv: "",
      },
    })

    expect(config.provider.type).toEqual("openai-compatible")
    expect(config.provider.endpoint).toEqual("http://localhost:10301/v1/audio/transcriptions")
    expect(config.provider.apiKeyEnv).toEqual("")
    expect(config.provider.apiKey).toEqual("")
  } finally {
    process.env.OPENAI_API_KEY = previousOpenAiKey
  }
})

test("loads local alias without reading OPENAI_API_KEY", async () => {
  const previousOpenAiKey = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = "dummy-key-that-must-not-be-read"

  try {
    const config = await loadConfig({
      provider: {
        type: "local",
      },
    })

    expect(config.provider.type).toEqual("openai-compatible")
    expect(config.provider.endpoint).toEqual("http://localhost:10301/v1/audio/transcriptions")
    expect(config.provider.apiKeyEnv).toEqual("")
    expect(config.provider.apiKey).toEqual("")
  } finally {
    process.env.OPENAI_API_KEY = previousOpenAiKey
  }
})

test("rejects non-local HTTP transcription endpoints", async () => {
  let message = ""
  try {
    await loadConfig({
      provider: {
        type: "openai-compatible",
        endpoint: "http://example.com/v1/audio/transcriptions",
      },
    })
  } catch (error) {
    message = error instanceof Error ? error.message : String(error)
  }

  expect(message).toContain("HTTPS")
})

test("rejects wildcard HTTP host as non-loopback", async () => {
  let message = ""
  try {
    await loadConfig({
      provider: {
        type: "openai-compatible",
        endpoint: "http://0.0.0.0:10301/v1/audio/transcriptions",
      },
    })
  } catch (error) {
    message = error instanceof Error ? error.message : String(error)
  }

  expect(message).toContain("HTTPS")
})

test("rejects endpoint credentials", async () => {
  let message = ""
  try {
    await loadConfig({
      provider: {
        type: "openai-compatible",
        endpoint: "https://user:pass@example.com/v1/audio/transcriptions",
      },
    })
  } catch (error) {
    message = error instanceof Error ? error.message : String(error)
  }

  expect(message).toContain("must not include credentials")
})

test("throws when an explicit configPath is missing", async () => {
  let message = ""
  try {
    await loadConfig({ configPath: "/tmp/opencode-stt-definitely-missing-config.json" })
  } catch (error) {
    message = error instanceof Error ? error.message : String(error)
  }

  expect(message).toContain("does not exist")
})
