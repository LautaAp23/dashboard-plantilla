import nodemailer from "nodemailer"

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env

const SMTP_FROM = process.env.SMTP_FROM || "no-reply@example.com"

export interface EnviarEmailProps {
  to: string
  subject: string
  html: string
  text?: string
}

const PLACEHOLDER_HOSTS = ["smtp.example.com", "smtp.tucorreo.com", ""]

// Detecta si las credenciales SMTP fueron configuradas de verdad o siguen con
// los placeholders del archivo .env. Si no están configuradas, simula el envío.
function smtpConfigurado(): boolean {
  const host = SMTP_HOST?.trim() ?? ""
  if (!host || PLACEHOLDER_HOSTS.includes(host)) {
    return false
  }
  return true
}

/**
 * Envía un correo por SMTP (nodemailer). Si el SMTP no está configurado en
 * .env, simula el envío registrando los datos en consola para no romper el
 * flujo en desarrollo. El HTML se imprime completo (sin truncar) en modo
 * simulado para poder ver las contraseñas temporales durante las pruebas.
 */
export async function enviarEmail(props: EnviarEmailProps): Promise<void> {
  const { to, subject, html, text } = props

  if (!smtpConfigurado()) {
    console.warn(
      "⚠️  SMTP no configurado en .env: el envío se simula (solo se registra en consola)."
    )
    console.log("📧 Email simulado para:", to)
    console.log("Asunto:", subject)
    if (html) console.log("Cuerpo HTML:\n", html)
    if (text) console.log("Cuerpo de texto:", text)
    console.log("---")
    return
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER
      ? { user: SMTP_USER, pass: SMTP_PASS ?? "" }
      : undefined,
  })

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      ...(text && { text }),
    })
    console.log(`📧 Email enviado a: ${to} (${subject})`)
  } catch (error) {
    const mensajeError =
      error instanceof Error ? error.message : "Error desconocido"
    console.error(`❌ No se pudo enviar el email a ${to}:`, mensajeError)
    // No propagamos el error para no cortar el flujo de creación de usuarios,
    // pero dejamos registro del fallo del envío.
  }
}
