import type { OutputConfig } from "../config/types"

export const formatTranscriptForPrompt = (text: string, output: OutputConfig) => {
  return output.appendTrailingSpace ? text + " " : text
}
