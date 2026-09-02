import { describe, it, expect } from "vitest"
import { DominioError } from "@/lib/usuarios/types"
import { manejarError } from "@/lib/api-response"

describe("DominioError", () => {
  it("should create error with code and message", () => {
    const error = new DominioError("VALIDACION", "Test error")
    expect(error.code).toBe("VALIDACION")
    expect(error.message).toBe("Test error")
    expect(error.name).toBe("DominioError")
  })
})

describe("manejarError", () => {
  it("should return 409 for DUPLICADO_EMAIL", () => {
    const error = new DominioError("DUPLICADO_EMAIL", "Email exists")
    const response = manejarError(error)
    expect(response.status).toBe(409)
  })

  it("should return 409 for DUPLICADO_DNI", () => {
    const error = new DominioError("DUPLICADO_DNI", "DNI exists")
    const response = manejarError(error)
    expect(response.status).toBe(409)
  })

  it("should return 409 for DUPLICADO_NOMBRE", () => {
    const error = new DominioError("DUPLICADO_NOMBRE", "Name exists")
    const response = manejarError(error)
    expect(response.status).toBe(409)
  })

  it("should return 404 for NO_ENCONTRADO", () => {
    const error = new DominioError("NO_ENCONTRADO", "Not found")
    const response = manejarError(error)
    expect(response.status).toBe(404)
  })

  it("should return 400 for AUTO_MODIFICACION", () => {
    const error = new DominioError("AUTO_MODIFICACION", "Cannot modify self")
    const response = manejarError(error)
    expect(response.status).toBe(400)
  })

  it("should return 400 for ROL_PROTEGIDO", () => {
    const error = new DominioError("ROL_PROTEGIDO", "Protected role")
    const response = manejarError(error)
    expect(response.status).toBe(400)
  })

  it("should return 400 for VALIDACION", () => {
    const error = new DominioError("VALIDACION", "Validation error")
    const response = manejarError(error)
    expect(response.status).toBe(400)
  })

  it("should return 500 for unknown error", () => {
    const response = manejarError(new Error("Unknown"))
    expect(response.status).toBe(500)
  })

  it("should return 500 for non-Error value", () => {
    const response = manejarError("string error")
    expect(response.status).toBe(500)
  })
})
