import { objectFrom, textFrom } from "../utils/coerce"

export const recordKeyFromOptions = (options: Record<string, unknown>) => {
  const keybinds = objectFrom(options.keybinds)
  return textFrom(keybinds.record, textFrom(options.keybind, "ctrl+r"))
}
