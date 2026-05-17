# Installation guide

This guide is designed for humans and coding agents. The safest default install is a file-plugin install from a local clone.

## Copy-paste prompt for an agent

Copy this into OpenCode, Claude Code, Cursor, or another coding agent:

```text
Install the public OpenCode STT plugin from https://github.com/cgarrot/opencode-stt for the current user.

Requirements and safety rules:
- Do not commit or print secrets.
- Do not put API keys directly in config files.
- Use environment variables or macOS Keychain for provider keys.
- Keep `config.local.json`, `.env`, WAV files, and `node_modules/` untracked.
- Do not run a real microphone/API transcription test unless I explicitly ask.

Steps:
1. Verify Bun and ffmpeg are available:
   - `bun --version`
   - `ffmpeg -version`
2. Clone or update the repo at a stable local path, for example:
   - `git clone https://github.com/cgarrot/opencode-stt.git ~/opencode-stt`
   - or, if it exists, `git -C ~/opencode-stt pull --ff-only`
3. In the repo, run:
   - `bun install --frozen-lockfile`
   - `bun run ci`
4. Create `config.local.json` from one of the examples:
   - Mistral/Voxtral: copy `examples/mistral.config.json`
   - Groq: copy `examples/groq.config.json`
   - Local OpenAI-compatible STT server: copy `examples/local-openai-compatible.config.json`
5. Configure secrets without writing keys into files:
   - Mistral: set `MISTRAL_API_KEY`, or configure macOS Keychain.
   - Groq: set `GROQ_API_KEY`.
   - OpenAI-compatible remote: set `OPENAI_API_KEY` or the configured env var.
   - Local localhost server: leave `apiKeyEnv` empty if it does not need auth.
6. Update `~/.config/opencode/tui.json` or `~/.config/opencode/tui.jsonc`.
   Preserve any existing config, but ensure it contains this plugin entry and frees Ctrl+R:

   {
     "plugin": [
       [
         "/ABSOLUTE/PATH/TO/opencode-stt/voxtral-stt.tsx",
         {
           "configPath": "/ABSOLUTE/PATH/TO/opencode-stt/config.local.json",
           "keybinds": {
             "record": "ctrl+r"
           }
         }
       ]
     ],
     "keybinds": {
       "session_rename": "none"
     }
   }

   If the config already has `plugin` entries, append this tuple instead of deleting the existing entries.
   If it already has `keybinds`, merge `session_rename: "none"` into the existing object.
7. On macOS, if the default microphone does not work, list devices with:
   - `ffmpeg -f avfoundation -list_devices true -i ""`
   Then update `capture.input`, for example `":0"` or `":1"`.
8. Restart OpenCode and test manually:
   - Press Ctrl+R once to start recording.
   - Press Ctrl+R again to stop and transcribe.
   - Confirm the prompt receives the transcript.
```

## Manual install

```bash
git clone https://github.com/cgarrot/opencode-stt.git ~/opencode-stt
cd ~/opencode-stt
bun install --frozen-lockfile
bun run ci
cp examples/mistral.config.json config.local.json
```

Then edit `config.local.json` for your provider. Keep secrets in env vars or Keychain.

## Provider quick configs

### Mistral Voxtral

```bash
export MISTRAL_API_KEY="your-key"
cp examples/mistral.config.json config.local.json
```

### Groq Whisper

```bash
export GROQ_API_KEY="your-key"
cp examples/groq.config.json config.local.json
```

### Local OpenAI-compatible server

```bash
cp examples/local-openai-compatible.config.json config.local.json
```

Use this for local servers exposing an OpenAI-compatible `/v1/audio/transcriptions` endpoint.

## OpenCode TUI config snippet

Use absolute paths:

```jsonc
{
  "plugin": [
    [
      "/Users/you/opencode-stt/voxtral-stt.tsx",
      {
        "configPath": "/Users/you/opencode-stt/config.local.json",
        "keybinds": {
          "record": "ctrl+r"
        }
      }
    ]
  ],
  "keybinds": {
    "session_rename": "none"
  }
}
```

If you already have a `plugin` array or `keybinds` object, merge instead of replacing.

## Security checklist before sharing logs

- `config.local.json` should be ignored by git.
- `.env` should be ignored by git.
- WAV files should be ignored by git.
- API keys should not appear in terminal output, screenshots, or issue reports.
