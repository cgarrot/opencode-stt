import { mkdtempSync } from "node:fs"
import { rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { CaptureConfig } from "../config/types"
import { formatError, truncate } from "../utils/text"
import type { AudioRecorder, RecordingHandle } from "./types"

export const createFfmpegRecorder = (config: CaptureConfig): AudioRecorder => ({
  start() {
    const tempDir = mkdtempSync(join(tmpdir(), "opencode-stt-"))
    const outputPath = join(tempDir, "recording.wav")
    const controller = new AbortController()
    const process = Bun.spawn({
      cmd: [
        config.ffmpegPath,
        "-hide_banner",
        "-nostdin",
        "-loglevel",
        "warning",
        "-f",
        config.inputFormat,
        "-i",
        config.input,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        String(config.sampleRate),
        "-ac",
        String(config.channels),
        "-y",
        outputPath,
      ],
      stdout: "ignore",
      stderr: "pipe",
      signal: controller.signal,
      killSignal: "SIGTERM",
    })
    const stderr = new Response(process.stderr).text()
    let stopped = false

    const stop = async () => {
      if (!stopped) controller.abort()
      const exitResult = await process.exited.then(
        (code: number) => `exit ${code}`,
        (error: unknown) => `process error: ${formatError(error)}`,
      )
      const stderrText = await stderr.catch((error: unknown) => `stderr read error: ${formatError(error)}`)
      const file = Bun.file(outputPath)
      stopped = true

      if (!(await file.exists())) {
        throw new Error(`ffmpeg did not create an audio file (${exitResult}). ${truncate(stderrText)}`)
      }

      if (file.size < config.minBytes) {
        throw new Error(`Recording is too small (${file.size} bytes). Check microphone permission/device. ${truncate(stderrText)}`)
      }

      return outputPath
    }

    const dispose = async () => {
      if (!stopped) controller.abort()
      await process.exited.catch((error: unknown) => {
        console.warn(`OpenCode STT recording cleanup failed: ${formatError(error)}`)
      })
      await stderr.catch((error: unknown) => {
        console.warn(`OpenCode STT stderr cleanup failed: ${formatError(error)}`)
      })
      await rm(tempDir, { force: true, recursive: true }).catch((error: unknown) => {
        console.warn(`OpenCode STT temp cleanup failed: ${formatError(error)}`)
      })
    }

    return {
      outputPath,
      stop,
      dispose,
      timeout: undefined,
    } satisfies RecordingHandle
  },
})
