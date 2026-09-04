import { describe, it, expect } from "vitest"
import { changePasswordSchema } from "@/lib/cuenta/schemas"

describe("changePasswordSchema", () => {
  it("should accept valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "newPass123",
    })
    expect(result.success).toBe(true)
  })

  it("should reject empty currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newPass123",
    })
    expect(result.success).toBe(false)
  })

  it("should reject newPassword shorter than 8", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "short",
    })
    expect(result.success).toBe(false)
  })

  it("should reject extra fields (strict mode)", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldPass123",
      newPassword: "newPass123",
      extra: "not allowed",
    } as never)
    expect(result.success).toBe(false)
  })
})
