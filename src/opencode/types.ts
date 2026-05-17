export type TuiKeybindSet = {
  get(name: string): string
  print(name: string): string
}

export type TuiToastInput = {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  message: string
  duration?: number
}

export type TuiPluginApi = {
  command: {
    register(cb: () => TuiCommand[]): () => void
  }
  ui: {
    toast(input: TuiToastInput): void
  }
  keybind?: {
    create(defaults: Record<string, string>, overrides?: Record<string, unknown>): TuiKeybindSet
  }
  client: {
    tui: {
      appendPrompt(input: { text: string }): Promise<unknown>
    }
  }
  lifecycle: {
    onDispose(fn: () => void | Promise<void>): () => void
  }
  renderer?: {
    requestRender(): void
  }
  slots?: {
    register(plugin: TuiSlotPlugin): (() => void) | string
  }
}

export type TuiCommand = {
  title: string
  value: string
  description?: string
  category?: string
  keybind?: string
  onSelect?: () => void
}

export type TuiPlugin = (api: TuiPluginApi, options: Record<string, unknown> | undefined) => Promise<void>

export type TuiPluginModule = {
  id: string
  tui: TuiPlugin
}

export type TuiSlotContext = {
  theme: {
    current: {
      accent: string
      textMuted: string
    }
  }
}

export type TuiSlotPlugin = {
  order?: number
  slots: Record<string, (ctx: TuiSlotContext, value: Record<string, unknown>) => unknown>
}
