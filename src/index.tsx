/** @jsxImportSource @opentui/solid */
import { tui } from "./opencode/plugin"
import type { TuiPluginModule } from "./opencode/types"

const plugin = {
  id: "opencode-stt",
  tui,
} satisfies TuiPluginModule

export default plugin
