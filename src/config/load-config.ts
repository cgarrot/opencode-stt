import { defaultCaptureConfig, defaultMistralProviderConfig, defaultOpenAiCompatibleProviderConfig, defaultOutputConfig } from "./defaults"
import { secureEndpointFrom } from "./endpoint"
import type { CaptureConfig, MistralProviderConfig, OpenAiCompatibleProviderConfig, PluginConfig, ProviderConfig } from "./types"
import { resolveApiKey } from "../secrets/resolve-api-key"
import { booleanFrom, objectFrom, positiveIntegerFrom, textFrom } from "../utils/coerce"
import { formatError } from "../utils/text"

export const readConfigFile = async (filePath: string) => {
  if (!filePath) return {}
  const file = Bun.file(filePath)
  if (!(await file.exists())) throw new Error(`STT config file does not exist: ${filePath}`)
  try {
    return objectFrom(JSON.parse(await file.text()))
  } catch (error) {
    throw new Error(`Cannot parse STT config ${filePath}: ${formatError(error)}`)
  }
}

const mergedInput = async (options: Record<string, unknown>) => {
  const fileConfig = await readConfigFile(textFrom(options.configPath))
  return { ...options, ...fileConfig }
}

const captureFrom = (merged: Record<string, unknown>): CaptureConfig => {
  const capture = objectFrom(merged.capture)
  return {
    type: "ffmpeg",
    ffmpegPath: textFrom(capture.ffmpegPath, textFrom(capture.ffmpeg, textFrom(merged.ffmpeg, defaultCaptureConfig.ffmpegPath))),
    inputFormat: textFrom(capture.inputFormat, textFrom(merged.inputFormat, defaultCaptureConfig.inputFormat)),
    input: textFrom(capture.input, textFrom(merged.input, defaultCaptureConfig.input)),
    sampleRate: positiveIntegerFrom(capture.sampleRate ?? merged.sampleRate, defaultCaptureConfig.sampleRate),
    channels: positiveIntegerFrom(capture.channels ?? merged.channels, defaultCaptureConfig.channels),
    maxSeconds: positiveIntegerFrom(capture.maxSeconds ?? merged.maxSeconds, defaultCaptureConfig.maxSeconds),
    minBytes: Math.max(44, positiveIntegerFrom(capture.minBytes ?? merged.minBytes, defaultCaptureConfig.minBytes)),
  }
}

const secretSourceFrom = (merged: Record<string, unknown>, provider: Record<string, unknown>) => ({
  apiKey: provider.apiKey ?? merged.apiKey,
  apiKeyEnv: provider.apiKeyEnv ?? merged.apiKeyEnv,
  keychainService: provider.keychainService ?? merged.keychainService,
  keychainAccount: provider.keychainAccount ?? merged.keychainAccount,
})

const envNameFrom = (value: unknown, fallback: string) => {
  if (typeof value === "string") return value.trim()
  return fallback
}

const mistralProviderFrom = async (merged: Record<string, unknown>, provider: Record<string, unknown>): Promise<MistralProviderConfig> => {
  const secrets = secretSourceFrom(merged, provider)
  return {
    type: "mistral",
    endpoint: secureEndpointFrom(provider.endpoint ?? merged.endpoint, defaultMistralProviderConfig.endpoint),
    model: textFrom(provider.model, textFrom(merged.model, defaultMistralProviderConfig.model)),
    language: textFrom(provider.language, textFrom(merged.language, defaultMistralProviderConfig.language)),
    timeoutSeconds: positiveIntegerFrom(provider.timeoutSeconds ?? merged.requestTimeoutSeconds, defaultMistralProviderConfig.timeoutSeconds),
    apiKey: await resolveApiKey(secrets, defaultMistralProviderConfig.apiKeyEnv),
    apiKeyEnv: envNameFrom(secrets.apiKeyEnv, defaultMistralProviderConfig.apiKeyEnv),
    keychainService: textFrom(secrets.keychainService),
    keychainAccount: textFrom(secrets.keychainAccount),
  }
}

const openAiCompatibleProviderFrom = async (merged: Record<string, unknown>, provider: Record<string, unknown>): Promise<OpenAiCompatibleProviderConfig> => {
  const secrets = secretSourceFrom(merged, provider)
  return {
    type: "openai-compatible",
    endpoint: secureEndpointFrom(provider.endpoint ?? merged.endpoint, defaultOpenAiCompatibleProviderConfig.endpoint),
    model: textFrom(provider.model, textFrom(merged.model, defaultOpenAiCompatibleProviderConfig.model)),
    language: textFrom(provider.language, textFrom(merged.language, defaultOpenAiCompatibleProviderConfig.language)),
    timeoutSeconds: positiveIntegerFrom(provider.timeoutSeconds ?? merged.requestTimeoutSeconds, defaultOpenAiCompatibleProviderConfig.timeoutSeconds),
    responseFormat: "json",
    apiKey: await resolveApiKey(secrets, defaultOpenAiCompatibleProviderConfig.apiKeyEnv),
    apiKeyEnv: envNameFrom(secrets.apiKeyEnv, defaultOpenAiCompatibleProviderConfig.apiKeyEnv),
    keychainService: textFrom(secrets.keychainService),
    keychainAccount: textFrom(secrets.keychainAccount),
  }
}

const providerFrom = async (merged: Record<string, unknown>): Promise<ProviderConfig> => {
  const provider = objectFrom(merged.provider)
  const providerType = textFrom(provider.type, textFrom(merged.provider, defaultMistralProviderConfig.type))

  if (providerType === "mistral" || providerType === "voxtral") return mistralProviderFrom(merged, provider)
  if (providerType === "openai-compatible" || providerType === "openai" || providerType === "groq" || providerType === "local") {
    const providerDefaults = providerType === "groq"
      ? { endpoint: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo", apiKeyEnv: "GROQ_API_KEY" }
      : providerType === "local"
        ? { endpoint: "http://localhost:10301/v1/audio/transcriptions", model: "whisper-1", apiKeyEnv: "" }
        : {}
    return openAiCompatibleProviderFrom({ ...merged, ...providerDefaults }, provider)
  }

  throw new Error(`Unsupported STT provider: ${providerType}`)
}

const outputFrom = (merged: Record<string, unknown>) => {
  const output = objectFrom(merged.output)
  return {
    appendTrailingSpace: booleanFrom(output.appendTrailingSpace ?? merged.appendTrailingSpace, defaultOutputConfig.appendTrailingSpace),
  }
}

export const loadConfig = async (options: Record<string, unknown>): Promise<PluginConfig> => {
  const merged = await mergedInput(options)
  return {
    capture: captureFrom(merged),
    provider: await providerFrom(merged),
    output: outputFrom(merged),
  }
}
