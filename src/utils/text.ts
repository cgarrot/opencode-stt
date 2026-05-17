export const formatError = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return String(error)
}

export const truncate = (value: string, length = 360) => {
  if (value.length <= length) return value
  return value.slice(0, length) + "…"
}
