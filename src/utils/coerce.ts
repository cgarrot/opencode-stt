export const objectFrom = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export const textFrom = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed
}

export const numberFrom = (value: unknown, fallback: number) => {
  if (typeof value !== "number") return fallback
  if (!Number.isFinite(value)) return fallback
  return value
}

export const positiveIntegerFrom = (value: unknown, fallback: number) => {
  const resolved = Math.floor(numberFrom(value, fallback))
  if (resolved < 1) return fallback
  return resolved
}

export const booleanFrom = (value: unknown, fallback: boolean) => {
  if (typeof value !== "boolean") return fallback
  return value
}
