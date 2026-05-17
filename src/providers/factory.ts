import type { ProviderConfig } from "../config/types"
import { createMistralProvider } from "./mistral"
import { createOpenAiCompatibleProvider } from "./openai-compatible"
import type { SttProvider } from "./types"

export const createProvider = (config: ProviderConfig): SttProvider => {
  if (config.type === "mistral") return createMistralProvider(config)
  return createOpenAiCompatibleProvider(config)
}
