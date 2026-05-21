import type { TuiPluginApi } from "./types"

type RecordingKeymapApi = Pick<TuiPluginApi, "command" | "keymap">

type RecordingKeymapActions = {
  stopAndSubmit: () => void
  cancel: () => void
  canSubmitPrompt: () => boolean
}

export const createRecordingKeymapRegistration = (api: RecordingKeymapApi, actions: RecordingKeymapActions) => {
  let unregisterLayer: (() => void) | undefined

  const registerLayer = (includeEnterSubmit: boolean) => {
    unregisterLayer?.()

    const bindings = [{ key: "escape", cmd: "opencode-stt.cancel", desc: "Cancel voice input" }]
    const commands = [
      {
        name: "opencode-stt.cancel",
        title: "Cancel voice input",
        category: "Speech",
        run: actions.cancel,
      },
    ]

    if (includeEnterSubmit && actions.canSubmitPrompt()) {
      bindings.push({ key: "return", cmd: "opencode-stt.stop-and-submit", desc: "Stop voice input and send" })
      commands.push({
        name: "opencode-stt.stop-and-submit",
        title: "Stop voice input and send",
        category: "Speech",
        run: actions.stopAndSubmit,
      })
    }

    if (api.keymap) {
      unregisterLayer = api.keymap.registerLayer({ priority: 100, commands, bindings })
      return
    }

    unregisterLayer = api.command.register(() =>
      commands.map((command) => ({
        title: command.title.toLowerCase(),
        value: command.name,
        description: command.title,
        category: command.category,
        keybind: bindings.find((binding) => binding.cmd === command.name)?.key,
        onSelect: command.run,
      })),
    )
  }

  const registerForRecording = () => registerLayer(true)
  const registerForProcessing = () => registerLayer(false)

  const unregister = () => {
    unregisterLayer?.()
    unregisterLayer = undefined
  }

  return { registerForRecording, registerForProcessing, unregister }
}
