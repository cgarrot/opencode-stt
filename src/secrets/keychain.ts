import { textFrom } from "../utils/coerce"

export const readKeychainSecret = async (service: string, account: string) => {
  if (!service) return ""
  const process = Bun.spawn({
    cmd: ["/usr/bin/security", "find-generic-password", "-w", "-s", service, ...(account ? ["-a", account] : [])],
    stdout: "pipe",
    stderr: "pipe",
  })
  const result = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ])

  if (result[0] === 0) return textFrom(result[1])
  return ""
}
