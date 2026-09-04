import { describe, it, expect } from "vitest"
import { normalizarOpcional } from "@/lib/validators"

describe("normalizarOpcional (lib/validators)", () => {
  it("should return empty string for null", () => {
    expect(normalizarOpcional(null)).toBe("")
  })
  it("should return empty string for undefined", () => {
    expect(normalizarOpcional(undefined)).toBe("")
  })
  it("should trim and return value", () => {
    expect(normalizarOpcional("  hola  ")).toBe("hola")
  })
  it("should return empty for whitespace", () => {
    expect(normalizarOpcional("   ")).toBe("")
  })
})
