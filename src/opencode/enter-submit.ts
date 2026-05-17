import type { TuiPluginApi } from "./types"

type EnterSubmitApi = Pick<TuiPluginApi, "command" | "keymap">

export const createEnterSubmitRegistration = (api: EnterSubmitApi, stopAndSubmit: () => void, canSubmitPrompt: () => boolean) => {
  let unregisterEnterSubmit: (() => void) | undefined

  const register = () => {
    if (!canSubmitPrompt() || unregisterEnterSubmit) return

    if (api.keymap) {
      unregisterEnterSubmit = api.keymap.registerLayer({
        priority: 100,
        commands: [
          {
            name: "opencode-stt.stop-and-submit",
            title: "Stop voice input and send",
            category: "Speech",
            run: stopAndSubmit,
          },
        ],
        bindings: [{ key: "return", cmd: "opencode-stt.stop-and-submit", desc: "Stop voice input and send" }],
      })
      return
    }

    unregisterEnterSubmit = api.command.register(() => [
      {
        title: "stop voice input and send",
        value: "opencode-stt.stop-and-submit",
        description: "Stop microphone recording, transcribe it, and send the prompt.",
        category: "Speech",
        keybind: "return",
        onSelect: stopAndSubmit,
      },
    ])
  }

  const unregister = () => {
    unregisterEnterSubmit?.()
    unregisterEnterSubmit = undefined
  }

  return { register, unregister }
}
