import { describe, it, expect } from "vitest"
import { cn, generarPassword } from "@/lib/utils"

describe("cn", () => {
  it("should merge class names", () => {
    const result = cn("text-red-500", "text-blue-500")
    expect(result).toBe("text-blue-500")
  })

  it("should handle conditional classes", () => {
    const result = cn("base", false && "hidden", "extra")
    expect(result).toContain("base")
    expect(result).toContain("extra")
    expect(result).not.toContain("hidden")
  })
})

describe("generarPassword", () => {
  it("should generate password with default length", () => {
    const password = generarPassword()
    expect(password).toHaveLength(12)
  })

  it("should generate password with custom length", () => {
    const password = generarPassword(16)
    expect(password).toHaveLength(16)
  })

  it("should generate different passwords each time", () => {
    const password1 = generarPassword()
    const password2 = generarPassword()
    expect(password1).not.toBe(password2)
  })

  it("should only contain allowed characters", () => {
    const allowedChars = /^[A-Za-z0-9!@#$%]+$/
    const password = generarPassword(100)
    expect(password).toMatch(allowedChars)
  })
})
