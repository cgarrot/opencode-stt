export type CaptureConfig = {
  type: "ffmpeg"
  ffmpegPath: string
  inputFormat: string
  input: string
  sampleRate: number
  channels: number
  maxSeconds: number
  minBytes: number
}

export type SecretConfig = {
  apiKey: string
  apiKeyEnv: string
  keychainService: string
  keychainAccount: string
}

export type MistralProviderConfig = SecretConfig & {
  type: "mistral"
  endpoint: string
  model: string
  language: string
  timeoutSeconds: number
}

export type OpenAiCompatibleProviderConfig = SecretConfig & {
  type: "openai-compatible"
  endpoint: string
  model: string
  language: string
  timeoutSeconds: number
  responseFormat: "json"
}

export type ProviderConfig = MistralProviderConfig | OpenAiCompatibleProviderConfig

export type OutputConfig = {
  appendTrailingSpace: boolean
}

export type PluginConfig = {
  capture: CaptureConfig
  provider: ProviderConfig
  output: OutputConfig
}
