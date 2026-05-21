/** @jsxImportSource @opentui/solid */
import { createFfmpegRecorder } from "../audio/ffmpeg-recorder"
import { createDictationController } from "../core/dictation-controller"
import { loadConfig } from "../config/load-config"
import { createProvider } from "../providers/factory"
import { objectFrom } from "../utils/coerce"
import { createRecordingKeymapRegistration } from "./recording-keymap"
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
  const submitPrompt = api.client.tui.submitPrompt
    ? () => {
        if (!api.client.tui.submitPrompt) throw new Error("OpenCode TUI submitPrompt API is not available.")
        return api.client.tui.submitPrompt()
      }
    : undefined

  const stopAndSubmit = () => {
    void controller.stopAndSubmit().catch((error) => showError(api, error))
  }
  const cancelRecording = () => {
    void controller.cancel().catch((error) => showError(api, error))
  }
  const recordingKeymap = createRecordingKeymapRegistration(api, {
    stopAndSubmit,
    cancel: cancelRecording,
    canSubmitPrompt: () => Boolean(submitPrompt),
  })

  const controller = createDictationController({
    recordKey,
    loadConfig: () => loadConfig(pluginOptions),
    createRecorder: (config) => createFfmpegRecorder(config.capture),
    createProvider: (config) => createProvider(config.provider),
    appendPrompt: (text) => api.client.tui.appendPrompt({ text }),
    submitPrompt,
    notify: (toast) => api.ui.toast(toast),
    onModeChange: (mode) => {
      voiceIndicator.setMode(mode)
      if (mode === "recording") recordingKeymap.registerForRecording()
      else if (mode === "processing") recordingKeymap.registerForProcessing()
      else recordingKeymap.unregister()
    },
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
    recordingKeymap.unregister()
    unregisterHint()
    voiceIndicator.dispose()
    await controller.dispose()
  })
}
