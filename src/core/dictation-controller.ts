import type { AudioRecorder, RecordingHandle } from "../audio/types"
import type { PluginConfig } from "../config/types"
import { assertProviderReady } from "../providers/readiness"
import { formatTranscriptForPrompt } from "./output"

export type DictationMode = "idle" | "recording" | "processing"

export type DictationControllerToast = {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  message: string
  duration?: number
}

export type DictationControllerOptions = {
  recordKey: string
  loadConfig(): Promise<PluginConfig>
  createRecorder(config: PluginConfig): AudioRecorder
  createProvider(config: PluginConfig): { transcribe(input: { audioPath: string; language?: string; signal: AbortSignal }): Promise<{ text: string }> }
  appendPrompt(text: string): Promise<unknown>
  submitPrompt?(): Promise<unknown>
  notify(toast: DictationControllerToast): void
  onModeChange?(mode: DictationMode): void
  onError(error: unknown): void
}

type StopRecordingOptions = {
  submitAfterAppend?: boolean
}

const PROMPT_APPEND_FLUSH_DELAY_MS = 50

// OpenCode applies appendPrompt through the TUI event loop; wait a short frame so
// the prompt store sees the inserted transcript before submitPrompt reads it.
const waitForPromptAppendFlush = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, PROMPT_APPEND_FLUSH_DELAY_MS)
  })

export const createDictationController = (options: DictationControllerOptions) => {
  let recording: RecordingHandle | undefined
  let recordingConfig: PluginConfig | undefined
  let activeOperation: Promise<void> | undefined
  let transcriptionController: AbortController | undefined
  let processing = false
  let cancelRequested = false
  let mode: DictationMode = "idle"
  let disposed = false

  const setMode = (nextMode: DictationMode) => {
    if (disposed && nextMode !== "idle") return
    mode = nextMode
    options.onModeChange?.(nextMode)
  }

  const notify = (toast: DictationControllerToast) => {
    if (!disposed) options.notify(toast)
  }

  const appendPrompt = async (text: string) => {
    if (disposed) return
    await options.appendPrompt(text)
  }

  const submitPrompt = async () => {
    if (disposed) return
    if (!options.submitPrompt) throw new Error("Prompt submission is not available in this OpenCode TUI API.")
    await options.submitPrompt()
  }

  const stopActiveRecording = async (active: RecordingHandle, config: PluginConfig, stopOptions: StopRecordingOptions) => {
    const provider = options.createProvider(config)
    const controller = new AbortController()
    transcriptionController = controller
    const timeout = setTimeout(() => controller.abort(), config.provider.timeoutSeconds * 1000)

    try {
      notify({ title: "OpenCode STT", message: "Stopping recording and transcribing…", variant: "info" })
      const audioPath = await active.stop()
      if (disposed) return
      const result = await provider.transcribe({ audioPath, language: config.provider.language, signal: controller.signal })
      if (cancelRequested || disposed) return
      await appendPrompt(formatTranscriptForPrompt(result.text, config.output))
      if (stopOptions.submitAfterAppend) {
        await waitForPromptAppendFlush()
        await submitPrompt()
      }
      if (!cancelRequested) {
        notify({
          title: "OpenCode STT",
          message: stopOptions.submitAfterAppend ? "Transcript sent to chat." : "Transcript inserted into prompt.",
          variant: "success",
        })
      }
    } finally {
      clearTimeout(timeout)
      if (transcriptionController === controller) transcriptionController = undefined
      await active.dispose()
    }
  }

  const stopRecording = async (stopOptions: StopRecordingOptions = {}) => {
    if (disposed) return
    if (processing) {
      notify({ title: "OpenCode STT", message: "Still processing the previous recording…", variant: "warning" })
      return
    }

    if (!recording) return

    processing = true
    setMode("processing")
    const active = recording
    const activeConfig = recordingConfig
    recording = undefined
    recordingConfig = undefined
    if (active.timeout) clearTimeout(active.timeout)

    const operation = activeConfig
      ? stopActiveRecording(active, activeConfig, stopOptions)
      : Promise.reject(new Error("Recording config was not available."))
    activeOperation = operation
    try {
      await operation
    } catch (error) {
      if (!cancelRequested && !disposed) throw error
    } finally {
      if (activeOperation === operation) activeOperation = undefined
      processing = false
      cancelRequested = false
      setMode("idle")
    }
  }

  const cancelActiveRecording = async (active: RecordingHandle) => {
    if (active.timeout) clearTimeout(active.timeout)
    await active.dispose()
  }

  const cancel = async () => {
    if (disposed) return

    if (recording && !processing) {
      cancelRequested = true
      const active = recording
      recording = undefined
      recordingConfig = undefined
      await cancelActiveRecording(active)
      cancelRequested = false
      setMode("idle")
      notify({ title: "OpenCode STT", message: "Recording cancelled.", variant: "info" })
      return
    }

    if (processing) {
      cancelRequested = true
      transcriptionController?.abort()
      notify({ title: "OpenCode STT", message: "Transcription cancelled.", variant: "info" })
      try {
        await activeOperation
      } catch {
        // stopRecording handles aborted transcription
      }
    }
  }

  const toggle = async () => {
    if (recording || processing) {
      await stopRecording()
      return
    }

    if (disposed) return
    processing = true
    try {
      const config = await options.loadConfig()
      if (disposed) return
      assertProviderReady(config.provider)
      const recorder = options.createRecorder(config)
      recording = recorder.start()
      recordingConfig = config
      recording.timeout = setTimeout(() => {
        if (!recording || processing) return
        void toggle().catch(options.onError)
      }, config.capture.maxSeconds * 1000)
      setMode("recording")
      notify({
        title: "OpenCode STT",
        message: options.submitPrompt
          ? `Recording… press ${options.recordKey} again to stop, Enter to send, or Esc to cancel.`
          : `Recording… press ${options.recordKey} again to stop, or Esc to cancel.`,
        variant: "info",
        duration: 5000,
      })
    } finally {
      processing = false
    }
  }

  const dispose = async () => {
    disposed = true
    transcriptionController?.abort()
    const operation = activeOperation
    if (!recording) {
      await operation?.catch(() => {})
      setMode("idle")
      return
    }
    const active = recording
    recording = undefined
    recordingConfig = undefined
    if (active.timeout) clearTimeout(active.timeout)
    await active.dispose()
    await operation?.catch(() => {})
    setMode("idle")
  }

  return {
    toggle,
    stopAndSubmit: () => stopRecording({ submitAfterAppend: true }),
    cancel,
    dispose,
    getMode: () => mode,
  }
}
