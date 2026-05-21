import { test, expect } from "bun:test"
import { createRecordingKeymapRegistration } from "../src/opencode/recording-keymap"
import type { TuiCommand, TuiKeymapLayer } from "../src/opencode/types"

test("recording keymap registers enter and escape while recording", () => {
  const events: string[] = []
  let registeredLayer: TuiKeymapLayer | undefined
  let unregisterCount = 0

  const registration = createRecordingKeymapRegistration(
    {
      command: {
        register: () => {
          throw new Error("command fallback should not be used when keymap is available")
        },
      },
      keymap: {
        registerLayer: (layer) => {
          registeredLayer = layer
          return () => {
            unregisterCount += 1
          }
        },
      },
    },
    {
      stopAndSubmit: () => events.push("submit"),
      cancel: () => events.push("cancel"),
      canSubmitPrompt: () => true,
    },
  )

  registration.registerForRecording()
  registration.registerForRecording()

  if (!registeredLayer) throw new Error("recording keymap layer was not registered")
  expect(registeredLayer.bindings).toEqual([
    { key: "escape", cmd: "opencode-stt.cancel", desc: "Cancel voice input" },
    { key: "return", cmd: "opencode-stt.stop-and-submit", desc: "Stop voice input and send" },
  ])
  expect(registeredLayer.commands).toHaveLength(2)
  registeredLayer.commands.find((command) => command.name === "opencode-stt.stop-and-submit")?.run()
  registeredLayer.commands.find((command) => command.name === "opencode-stt.cancel")?.run()
  expect(events).toEqual(["submit", "cancel"])

  registration.unregister()
  registration.unregister()
  expect(unregisterCount).toEqual(2)
})

test("recording keymap registers only escape while processing", () => {
  let registeredLayer: TuiKeymapLayer | undefined

  const registration = createRecordingKeymapRegistration(
    {
      command: {
        register: () => {
          throw new Error("command fallback should not be used when keymap is available")
        },
      },
      keymap: {
        registerLayer: (layer) => {
          registeredLayer = layer
          return () => {}
        },
      },
    },
    {
      stopAndSubmit: () => {},
      cancel: () => {},
      canSubmitPrompt: () => true,
    },
  )

  registration.registerForProcessing()

  if (!registeredLayer) throw new Error("processing keymap layer was not registered")
  expect(registeredLayer.bindings).toEqual([{ key: "escape", cmd: "opencode-stt.cancel", desc: "Cancel voice input" }])
  expect(registeredLayer.commands).toHaveLength(1)
  expect(registeredLayer.commands[0]?.name).toEqual("opencode-stt.cancel")
})

test("recording keymap registration can be re-armed after unregistering", () => {
  const events: string[] = []
  const registeredLayers: TuiKeymapLayer[] = []
  let unregisterCount = 0

  const registration = createRecordingKeymapRegistration(
    {
      command: {
        register: () => {
          throw new Error("command fallback should not be used when keymap is available")
        },
      },
      keymap: {
        registerLayer: (layer) => {
          registeredLayers.push(layer)
          return () => {
            unregisterCount += 1
          }
        },
      },
    },
    {
      stopAndSubmit: () => events.push("submit"),
      cancel: () => events.push("cancel"),
      canSubmitPrompt: () => true,
    },
  )

  registration.registerForRecording()
  registeredLayers[0]?.commands.find((command) => command.name === "opencode-stt.stop-and-submit")?.run()
  registration.unregister()
  registration.registerForRecording()
  registeredLayers[1]?.commands.find((command) => command.name === "opencode-stt.stop-and-submit")?.run()

  expect(registeredLayers).toHaveLength(2)
  expect(events).toEqual(["submit", "submit"])
  expect(unregisterCount).toEqual(1)
})

test("recording keymap skips enter submit when prompt submission is unavailable", () => {
  let registeredLayer: TuiKeymapLayer | undefined

  const registration = createRecordingKeymapRegistration(
    {
      command: {
        register: () => {
          throw new Error("command fallback should not be used when keymap is available")
        },
      },
      keymap: {
        registerLayer: (layer) => {
          registeredLayer = layer
          return () => {}
        },
      },
    },
    {
      stopAndSubmit: () => {},
      cancel: () => {},
      canSubmitPrompt: () => false,
    },
  )

  registration.registerForRecording()

  if (!registeredLayer) throw new Error("recording keymap layer was not registered")
  expect(registeredLayer.bindings).toEqual([{ key: "escape", cmd: "opencode-stt.cancel", desc: "Cancel voice input" }])
  expect(registeredLayer.commands).toHaveLength(1)
})

test("recording keymap falls back to command keybind without keymap", () => {
  const events: string[] = []
  let registeredCommands: TuiCommand[] = []
  let unregisterCount = 0

  const registration = createRecordingKeymapRegistration(
    {
      command: {
        register: (commands) => {
          registeredCommands = commands()
          return () => {
            unregisterCount += 1
          }
        },
      },
    },
    {
      stopAndSubmit: () => events.push("submit"),
      cancel: () => events.push("cancel"),
      canSubmitPrompt: () => true,
    },
  )

  registration.registerForRecording()

  expect(registeredCommands).toHaveLength(2)
  registeredCommands.find((command) => command.value === "opencode-stt.stop-and-submit")?.onSelect?.()
  registeredCommands.find((command) => command.value === "opencode-stt.cancel")?.onSelect?.()
  expect(events).toEqual(["submit", "cancel"])

  registration.unregister()
  expect(unregisterCount).toEqual(1)
})
