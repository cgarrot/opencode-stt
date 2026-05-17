/** @jsxImportSource @opentui/solid */
import { createSignal } from "solid-js"
import type { DictationMode } from "../core/dictation-controller"
import type { TuiSlotContext, TuiSlotPlugin } from "./types"

type IndicatorState = {
  mode: DictationMode
  tick: number
}

type VoiceIndicatorOptions = {
  requestRender?: () => void
}

const levels = ["▁", "▂", "▃", "▄", "▅", "▆", "▇"]

const levelAt = (tick: number, index: number, mode: DictationMode) => {
  if (mode === "processing") return levels[(tick + index) % 3]
  const wave = Math.abs(Math.sin((tick + index * 1.7) / 2.2))
  return levels[Math.min(levels.length - 1, Math.floor(wave * levels.length))]
}

const createIndicatorComponent = (ctx: TuiSlotContext, recordKey: string, state: () => IndicatorState) => {
  const prefix = () => state().mode === "idle" ? recordKey : ""
  const wave = (index: number) => state().mode === "idle" ? "" : levelAt(state().tick, index, state().mode)
  const label = () => {
    if (state().mode === "recording") return " listening"
    if (state().mode === "processing") return " transcribing"
    return " voice input"
  }

  return (
    <text fg={ctx.theme.current.textMuted} wrapMode="none">
      <span style={{ fg: ctx.theme.current.accent }}>{prefix()}</span>
      <span style={{ fg: ctx.theme.current.accent }}>{wave(0)}</span>
      <span style={{ fg: ctx.theme.current.accent }}>{wave(1)}</span>
      <span style={{ fg: ctx.theme.current.accent }}>{wave(2)}</span>
      <span style={{ fg: ctx.theme.current.accent }}>{wave(3)}</span>
      <span style={{ fg: ctx.theme.current.accent }}>{wave(4)}</span>
      {label()}
    </text>
  )
}

export const createVoiceIndicator = (recordKey: string, options: VoiceIndicatorOptions = {}) => {
  const [state, setState] = createSignal<IndicatorState>({ mode: "idle", tick: 0 })
  let interval: ReturnType<typeof setInterval> | undefined

  const ensureInterval = () => {
    if (interval) return
    interval = setInterval(() => {
      setState((current) => ({ ...current, tick: current.tick + 1 }))
      options.requestRender?.()
    }, 140)
  }

  const stopInterval = () => {
    if (!interval) return
    clearInterval(interval)
    interval = undefined
  }

  const setMode = (mode: DictationMode) => {
    setState((current) => ({ mode, tick: current.tick + 1 }))
    options.requestRender?.()
    if (mode === "idle") stopInterval()
    else ensureInterval()
  }

  const plugin = {
    order: 50,
    slots: {
      home_prompt_right(ctx: TuiSlotContext) {
        return createIndicatorComponent(ctx, recordKey, state)
      },
      session_prompt_right(ctx: TuiSlotContext) {
        return createIndicatorComponent(ctx, recordKey, state)
      },
    },
  } satisfies TuiSlotPlugin

  return {
    plugin,
    setMode,
    dispose: stopInterval,
  }
}
