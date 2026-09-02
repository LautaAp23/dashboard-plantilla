import { describe, it, expect } from "vitest"
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  normalizarOpcional,
  listarUsuariosQuerySchema,
  DNI_REGEX,
} from "@/lib/usuarios/schemas"

describe("normalizarOpcional", () => {
  it("should return empty string for null", () => {
    expect(normalizarOpcional(null)).toBe("")
  })

  it("should return empty string for undefined", () => {
    expect(normalizarOpcional(undefined)).toBe("")
  })

  it("should return empty string for empty string", () => {
    expect(normalizarOpcional("")).toBe("")
  })

  it("should return empty string for whitespace only", () => {
    expect(normalizarOpcional("   ")).toBe("")
  })

  it("should trim and return non-empty string", () => {
    expect(normalizarOpcional("  hello  ")).toBe("hello")
  })
})

describe("DNI_REGEX", () => {
  it("should accept 7 digit DNI", () => {
    expect("1234567").toMatch(DNI_REGEX)
  })

  it("should accept 8 digit DNI", () => {
    expect("12345678").toMatch(DNI_REGEX)
  })

  it("should reject less than 7 digits", () => {
    expect("123456").not.toMatch(DNI_REGEX)
  })

  it("should reject more than 8 digits", () => {
    expect("123456789").not.toMatch(DNI_REGEX)
  })

  it("should reject non-numeric DNI", () => {
    expect("1234567a").not.toMatch(DNI_REGEX)
  })
})

describe("crearUsuarioSchema", () => {
  const validUser = {
    nombreyapellido_user: "Juan Perez",
    dni_user: "12345678",
    email_user: "juan@test.com",
    id_rol: "rol123",
  }

  it("should accept valid user data", () => {
    const result = crearUsuarioSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  it("should accept user with optional fields", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      direccion_user: "Calle 123",
      telefono_user: "1234567890",
    })
    expect(result.success).toBe(true)
  })

  it("should accept user with empty optional fields", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      direccion_user: "",
      telefono_user: "",
    })
    expect(result.success).toBe(true)
  })

  it("should reject user without required fields", () => {
    const result = crearUsuarioSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should reject user with short name", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      nombreyapellido_user: "AB",
    })
    expect(result.success).toBe(false)
  })

  it("should reject user with invalid email", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      email_user: "invalid-email",
    })
    expect(result.success).toBe(false)
  })

  it("should reject user with invalid DNI", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      dni_user: "123",
    })
    expect(result.success).toBe(false)
  })

  it("should reject user with extra fields (strict mode)", () => {
    const result = crearUsuarioSchema.safeParse({
      ...validUser,
      extraField: "not allowed",
    })
    expect(result.success).toBe(false)
  })
})

describe("actualizarUsuarioSchema", () => {
  const validUpdate = {
    nombreyapellido_user: "Juan Perez Actualizado",
    dni_user: "12345678",
    email_user: "juan@test.com",
    id_rol: "rol123",
  }

  it("should accept valid update data", () => {
    const result = actualizarUsuarioSchema.safeParse(validUpdate)
    expect(result.success).toBe(true)
  })

  it("should reject update without required fields", () => {
    const result = actualizarUsuarioSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("listarUsuariosQuerySchema", () => {
  it("should accept empty query", () => {
    const result = listarUsuariosQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept valid query with all params", () => {
    const result = listarUsuariosQuerySchema.safeParse({
      q: "test",
      estado: "activos",
      desde: "2024-01-01",
      hasta: "2024-12-31",
      page: 1,
      por: 10,
    })
    expect(result.success).toBe(true)
  })

  it("should accept valid estado values", () => {
    expect(listarUsuariosQuerySchema.safeParse({ estado: "activos" }).success).toBe(true)
    expect(listarUsuariosQuerySchema.safeParse({ estado: "inactivos" }).success).toBe(true)
    expect(listarUsuariosQuerySchema.safeParse({ estado: "todos" }).success).toBe(true)
  })

  it("should reject invalid estado", () => {
    const result = listarUsuariosQuerySchema.safeParse({ estado: "invalid" })
    expect(result.success).toBe(false)
  })

  it("should accept valid date format", () => {
    const result = listarUsuariosQuerySchema.safeParse({ desde: "2024-01-01" })
    expect(result.success).toBe(true)
  })

  it("should reject invalid date format", () => {
    const result = listarUsuariosQuerySchema.safeParse({ desde: "01-01-2024" })
    expect(result.success).toBe(false)
  })

  it("should coerce page to number", () => {
    const result = listarUsuariosQuerySchema.safeParse({ page: "1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
    }
  })

  it("should reject page less than 1", () => {
    const result = listarUsuariosQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })
})
