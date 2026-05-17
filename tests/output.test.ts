import { test, expect } from "bun:test"
import { formatTranscriptForPrompt } from "../src/core/output"

test("formats transcript with trailing space by default", () => {
  expect(formatTranscriptForPrompt("bonjour", { appendTrailingSpace: true })).toEqual("bonjour ")
})

test("can preserve exact transcript text", () => {
  expect(formatTranscriptForPrompt("bonjour", { appendTrailingSpace: false })).toEqual("bonjour")
})
