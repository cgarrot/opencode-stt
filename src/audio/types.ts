export type RecordingHandle = {
  outputPath: string
  stop(): Promise<string>
  dispose(): Promise<void>
  timeout: ReturnType<typeof setTimeout> | undefined
}

export type AudioRecorder = {
  start(): RecordingHandle
}
