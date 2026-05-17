# Contributing

Thanks for helping improve OpenCode STT.

## Development

```bash
bun install
bun run ci
```

Keep provider adapters small and explicit. A provider should accept an audio file and return transcript text; avoid adding streaming, diarization, or timestamp APIs unless there is a concrete issue and test coverage.

## Adding providers

1. Add a config type in `src/config/types.ts`.
2. Add validation/defaults in `src/config/load-config.ts`.
3. Add the adapter in `src/providers/`.
4. Add unit tests that mock network behavior or test config dispatch.
5. Document the provider in `README.md` and `examples/`.
