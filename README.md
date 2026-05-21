# OpenCode STT

Provider-agnostic speech-to-text dictation for the OpenCode TUI. Press `Ctrl+R` to record your microphone, press it again to transcribe and append the transcript to the active prompt, press `Enter` while recording to transcribe and send it directly to chat, or press `Esc` to cancel recording or transcription.

The plugin started as a Mistral Voxtral integration, but now supports a small provider abstraction for cloud and local STT backends.

## Features

- OpenCode TUI command and prompt-slot indicator, with `Enter`-to-send while recording and `Esc` to cancel.
- `ffmpeg` microphone recording to temporary WAV files.
- Mistral Voxtral provider.
- OpenAI-compatible provider for OpenAI, Groq, `whisper.cpp`, `faster-whisper`/agent servers, and many local endpoints.
- Env var and macOS Keychain secret lookup.
- HTTPS-by-default endpoint policy, with HTTP allowed only for localhost.
- Unit tests for config and output behavior.

## Requirements

- Bun.
- OpenCode TUI with file plugin support.
- `ffmpeg` available in `PATH` or configured via `capture.ffmpegPath`.
- Microphone permission for the terminal/app launching OpenCode.

On macOS, list audio devices with:

```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

Then set `capture.input` to the audio device, for example `":0"`.

## Installation

For a step-by-step setup guide and a copy-paste prompt you can give to OpenCode or another coding agent, see [INSTALL.md](./INSTALL.md).

## OpenCode configuration

Create or update your OpenCode TUI config, usually `~/.config/opencode/tui.json` or `tui.jsonc`:

```jsonc
{
  "plugin": [
    [
      "/absolute/path/to/opencode-stt/voxtral-stt.tsx",
      {
        "configPath": "/absolute/path/to/opencode-stt/config.local.json",
        "keybind": "ctrl+r"
      }
    ]
  ],
  "keybinds": {
    "session_rename": "none"
  }
}
```

`voxtral-stt.tsx` remains as a compatibility entry point and re-exports the modular implementation from `src/`. Published package consumers can also use the `opencode-stt/tui` export.

## Mistral Voxtral config

```json
{
  "capture": {
    "type": "ffmpeg",
    "inputFormat": "avfoundation",
    "input": ":0",
    "sampleRate": 16000,
    "channels": 1,
    "maxSeconds": 120,
    "minBytes": 4096
  },
  "provider": {
    "type": "mistral",
    "model": "voxtral-mini-2602",
    "apiKeyEnv": "MISTRAL_API_KEY",
    "language": "fr"
  },
  "output": {
    "appendTrailingSpace": true
  }
}
```

## Groq / OpenAI-compatible config

Groq can be configured with the convenience provider type:

```json
{
  "provider": {
    "type": "groq",
    "model": "whisper-large-v3-turbo",
    "apiKeyEnv": "GROQ_API_KEY",
    "language": "fr"
  }
}
```

Any OpenAI-compatible transcription endpoint can use the generic type:

```json
{
  "provider": {
    "type": "openai-compatible",
    "endpoint": "https://api.openai.com/v1/audio/transcriptions",
    "model": "whisper-1",
    "apiKeyEnv": "OPENAI_API_KEY",
    "language": "fr"
  }
}
```

## Local STT server config

For a local OpenAI-compatible server such as agent-cli or a `whisper.cpp` wrapper:

```json
{
  "provider": {
    "type": "openai-compatible",
    "endpoint": "http://localhost:10301/v1/audio/transcriptions",
    "model": "whisper-1",
    "apiKeyEnv": "",
    "language": "fr"
  }
}
```

HTTP endpoints are accepted only for loopback hosts.

## Legacy config compatibility

The old flat config still works for Mistral-style usage:

```json
{
  "apiKeyEnv": "MISTRAL_API_KEY",
  "keychainService": "opencode-voxtral-stt",
  "keychainAccount": "your-macos-account",
  "model": "voxtral-mini-2602",
  "endpoint": "https://api.mistral.ai/v1/audio/transcriptions",
  "language": "fr",
  "ffmpeg": "/opt/homebrew/bin/ffmpeg",
  "input": ":0",
  "sampleRate": 16000,
  "channels": 1,
  "maxSeconds": 120,
  "requestTimeoutSeconds": 120,
  "minBytes": 4096,
  "appendTrailingSpace": true
}
```

## Voice indicator

The prompt slot shows `ctrl+r voice input` while idle. During recording it switches to a compact waveform-style indicator (`● ▁▅▇▃ listening`). `Enter` stops recording, inserts the transcript, and submits the prompt; `Esc` cancels without inserting text. The indicator then switches to `transcribing` while the provider request is running, where `Esc` can still cancel the in-flight transcription.

The current indicator is an OpenCode/OpenTUI-friendly animated status indicator. It does not yet read real microphone amplitude; doing that would require parsing live audio levels from `ffmpeg` or switching to a streaming audio pipeline.

## Validation

```bash
bun run typecheck
bun run test
bun run smoke
```

`bun run smoke` imports the plugin entrypoint and checks the exported plugin id.
