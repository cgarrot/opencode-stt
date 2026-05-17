export type TranscriptionInput = {
  audioPath: string
  language?: string
  signal: AbortSignal
}

export type TranscriptionResult = {
  text: string
}

export type SttProvider = {
  readonly id: string
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>
}
