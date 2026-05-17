import { textFrom } from "../utils/coerce"
import { readKeychainSecret } from "./keychain"

export const resolveApiKey = async (input: Record<string, unknown>, defaultEnv: string) => {
  const explicitKey = textFrom(input.apiKey)
  if (explicitKey) return explicitKey

  const apiKeyEnv = typeof input.apiKeyEnv === "string" ? input.apiKeyEnv.trim() : defaultEnv
  const envKey = apiKeyEnv ? textFrom(process.env[apiKeyEnv]) : ""
  if (envKey) return envKey

  return readKeychainSecret(textFrom(input.keychainService), textFrom(input.keychainAccount))
}
