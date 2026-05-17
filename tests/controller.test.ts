import { test, expect } from "bun:test"
import { createDictationController, type DictationMode } from "../src/core/dictation-controller"
import type { PluginConfig } from "../src/config/types"

const config = {
  capture: {
    type: "ffmpeg",
    ffmpegPath: "ffmpeg",
    inputFormat: "avfoundation",
    input: ":0",
    sampleRate: 16000,
    channels: 1,
    maxSeconds: 120,
    minBytes: 44,
  },
  provider: {
    type: "openai-compatible",
    endpoint: "http://localhost:10301/v1/audio/transcriptions",
    model: "whisper-1",
    language: "fr",
    timeoutSeconds: 120,
    responseFormat: "json",
    apiKey: "",
    apiKeyEnv: "",
    keychainService: "",
    keychainAccount: "",
  },
  output: {
    appendTrailingSpace: true,
  },
} satisfies PluginConfig

test("dispose aborts in-flight transcription without appending after teardown", async () => {
  let appendCount = 0
  let disposeCount = 0
  let resolveTranscribeStarted: (() => void) | undefined
  const transcribeStarted = new Promise<void>((resolve) => {
    resolveTranscribeStarted = resolve
  })
  const modes: DictationMode[] = []

  const controller = createDictationController({
    recordKey: "ctrl+r",
    loadConfig: async () => config,
    createRecorder: () => ({
      start: () => ({
        outputPath: "/tmp/recording.wav",
        timeout: undefined,
        stop: async () => "/tmp/recording.wav",
        dispose: async () => {
          disposeCount += 1
        },
      }),
    }),
    createProvider: () => ({
      transcribe: (input) => {
        resolveTranscribeStarted?.()
        return new Promise((_, reject) => {
          input.signal.addEventListener("abort", () => reject(new Error("aborted")))
        })
      },
    }),
    appendPrompt: async () => {
      appendCount += 1
    },
    notify: () => {},
    onModeChange: (mode) => modes.push(mode),
    onError: () => {},
  })

  await controller.toggle()
  const stopPromise = controller.toggle()
  await transcribeStarted
  await controller.dispose()
  await stopPromise

  expect(appendCount).toEqual(0)
  expect(disposeCount).toEqual(1)
  expect(controller.getMode()).toEqual("idle")
  expect(modes).toContain("recording")
  expect(modes).toContain("processing")
  expect(modes).toContain("idle")
})
