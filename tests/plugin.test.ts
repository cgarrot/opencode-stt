import { test, expect } from "bun:test"
import { createEnterSubmitRegistration } from "../src/opencode/enter-submit"
import type { TuiCommand, TuiKeymapLayer } from "../src/opencode/types"

test("enter submit registration uses keymap layer and unregisters cleanly", () => {
  const events: string[] = []
  let registeredLayer: TuiKeymapLayer | undefined
  let unregisterCount = 0

  const registration = createEnterSubmitRegistration(
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
    () => events.push("submit"),
    () => true,
  )

  registration.register()
  registration.register()

  if (!registeredLayer) throw new Error("enter keymap layer was not registered")
  expect(registeredLayer.bindings).toEqual([{ key: "return", cmd: "opencode-stt.stop-and-submit", desc: "Stop voice input and send" }])
  expect(registeredLayer.commands).toHaveLength(1)
  registeredLayer.commands[0]?.run()
  expect(events).toEqual(["submit"])

  registration.unregister()
  registration.unregister()
  expect(unregisterCount).toEqual(1)
})

test("enter submit registration is skipped when prompt submission is unavailable", () => {
  let commandRegisterCount = 0
  let keymapRegisterCount = 0

  const registration = createEnterSubmitRegistration(
    {
      command: {
        register: () => {
          commandRegisterCount += 1
          return () => {}
        },
      },
      keymap: {
        registerLayer: () => {
          keymapRegisterCount += 1
          return () => {}
        },
      },
    },
    () => {},
    () => false,
  )

  registration.register()

  expect(commandRegisterCount).toEqual(0)
  expect(keymapRegisterCount).toEqual(0)
})

test("enter submit registration falls back to command keybind without keymap", () => {
  const events: string[] = []
  let registeredCommands: TuiCommand[] = []
  let unregisterCount = 0

  const registration = createEnterSubmitRegistration(
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
    () => events.push("submit"),
    () => true,
  )

  registration.register()

  expect(registeredCommands).toHaveLength(1)
  expect(registeredCommands[0]?.value).toEqual("opencode-stt.stop-and-submit")
  expect(registeredCommands[0]?.keybind).toEqual("return")
  registeredCommands[0]?.onSelect?.()
  expect(events).toEqual(["submit"])

  registration.unregister()
  expect(unregisterCount).toEqual(1)
})
