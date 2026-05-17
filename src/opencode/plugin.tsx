/** @jsxImportSource @opentui/solid */
import { createFfmpegRecorder } from "../audio/ffmpeg-recorder"
import { createDictationController } from "../core/dictation-controller"
import { loadConfig } from "../config/load-config"
import { createProvider } from "../providers/factory"
import { objectFrom } from "../utils/coerce"
import { recordKeyFromOptions } from "./options"
import { showError } from "./ui"
import type { TuiPlugin } from "./types"
import { createVoiceIndicator } from "./voice-indicator"

export const tui: TuiPlugin = async (api, options) => {
  const pluginOptions = objectFrom(options)
  const recordKey = recordKeyFromOptions(pluginOptions)
  const voiceIndicator = createVoiceIndicator(recordKey, { requestRender: () => api.renderer?.requestRender() })
  const slotRegistration = api.slots?.register(voiceIndicator.plugin)
  const unregisterHint = typeof slotRegistration === "function" ? slotRegistration : () => {}

  const controller = createDictationController({
    recordKey,
    loadConfig: () => loadConfig(pluginOptions),
    createRecorder: (config) => createFfmpegRecorder(config.capture),
    createProvider: (config) => createProvider(config.provider),
    appendPrompt: (text) => api.client.tui.appendPrompt({ text }),
    notify: (toast) => api.ui.toast(toast),
    onModeChange: voiceIndicator.setMode,
    onError: (error) => showError(api, error),
  })

  const unregister = api.command.register(() => [
    {
      title: "voice input",
      value: "opencode-stt.toggle",
      description: "Record microphone audio, transcribe it, and append the transcript to the prompt.",
      category: "Speech",
      keybind: recordKey,
      onSelect: () => {
        void controller.toggle().catch((error) => showError(api, error))
      },
    },
  ])

  api.lifecycle.onDispose(async () => {
    unregister()
    unregisterHint()
    voiceIndicator.dispose()
    await controller.dispose()
  })
}
