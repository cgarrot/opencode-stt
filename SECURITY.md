# Security

This plugin records microphone audio and can send it to third-party STT providers. Treat recorded audio as sensitive.

## Secrets

- Prefer environment variables such as `MISTRAL_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY`.
- macOS Keychain is supported for local setups.
- Do not commit `config.local.json`, `.env`, WAV files, or transcripts containing private data.

## Endpoints

- Remote STT endpoints must use HTTPS.
- Plain HTTP is accepted only for loopback hosts such as `localhost` and `127.0.0.1`.
- Transcription uploads use `redirect: "error"` to avoid forwarding audio/auth headers across redirects.

## Reporting issues

Please open a private security advisory or contact the maintainers before disclosing vulnerabilities publicly.
