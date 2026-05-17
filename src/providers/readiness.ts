import { endpointRequiresAuth } from "../config/endpoint"
import type { ProviderConfig } from "../config/types"

export const assertProviderReady = (config: ProviderConfig) => {
  if (config.type === "mistral" && !config.apiKey) {
    throw new Error("Missing Mistral API key. Set MISTRAL_API_KEY or configure provider.apiKeyEnv/keychainService/keychainAccount.")
  }

  if (config.type === "openai-compatible" && endpointRequiresAuth(config.endpoint) && !config.apiKey) {
    throw new Error("Missing API key for OpenAI-compatible STT endpoint. Set provider.apiKeyEnv or use a localhost endpoint.")
  }
}
