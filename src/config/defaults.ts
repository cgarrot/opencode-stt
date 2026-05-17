import type { CaptureConfig, MistralProviderConfig, OpenAiCompatibleProviderConfig, OutputConfig } from "./types"

export const defaultCaptureConfig = {
  type: "ffmpeg",
  ffmpegPath: "ffmpeg",
  inputFormat: "avfoundation",
  input: ":0",
  sampleRate: 16000,
  channels: 1,
  maxSeconds: 120,
  minBytes: 4096,
} satisfies CaptureConfig

export const defaultMistralProviderConfig = {
  type: "mistral",
  endpoint: "https://api.mistral.ai/v1/audio/transcriptions",
  model: "voxtral-mini-2602",
  language: "",
  timeoutSeconds: 120,
  apiKey: "",
  apiKeyEnv: "MISTRAL_API_KEY",
  keychainService: "",
  keychainAccount: "",
} satisfies MistralProviderConfig

export const defaultOpenAiCompatibleProviderConfig = {
  type: "openai-compatible",
  endpoint: "https://api.openai.com/v1/audio/transcriptions",
  model: "whisper-1",
  language: "",
  timeoutSeconds: 120,
  responseFormat: "json",
  apiKey: "",
  apiKeyEnv: "OPENAI_API_KEY",
  keychainService: "",
  keychainAccount: "",
} satisfies OpenAiCompatibleProviderConfig

export const defaultOutputConfig = {
  appendTrailingSpace: true,
} satisfies OutputConfig
