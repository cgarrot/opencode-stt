import type { TuiPluginApi } from "./types"
import { formatError, truncate } from "../utils/text"

export const showError = (api: TuiPluginApi, error: unknown) => {
  api.ui.toast({
    title: "OpenCode STT",
    message: truncate(formatError(error)),
    variant: "error",
    duration: 9000,
  })
}
