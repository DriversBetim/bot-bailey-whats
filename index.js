const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

const palavras = ["niteroi", "são caetano", "betim", "ptb"]

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth")

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["Windows", "Chrome", "120.0.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {

    if (qr) {
      console.log("\n📲 Escaneie o QR:\n")
      require("qrcode-terminal").generate(qr, { small: true })
    }

    if (connection === "open") {
      console.log("✅ Conectado!")
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Conexão fechada")

      if (shouldReconnect) {
        setTimeout(startBot, 3000)
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const chatId = msg.key.remoteJid

    const texto =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      ""

    console.log("📩", texto)

    const lower = texto.toLowerCase()
    const match = palavras.some(p => lower.includes(p))

    if (!match) return

    await sock.sendMessage(chatId, {
      text: "👍"
    })
  })
}

startBot()