import * as vscode from "vscode"
import { Client, LocalAuth } from "whatsapp-web.js"
import * as qrcode from "qrcode-terminal"
import * as path from "path"

let statusBarItem: vscode.StatusBarItem
let client: Client | undefined

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBarItem.command = "extension.updateWhatsAppStatus"
  context.subscriptions.push(statusBarItem)

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.setupWhatsAppClient", () => setupWhatsAppClient(context)),
  )

  context.subscriptions.push(
    vscode.commands.registerCommand("extension.updateWhatsAppStatus", () => updateStatus(context)),
  )

  initializeWhatsAppClient(context)

  // Update status when the active editor changes
  vscode.window.onDidChangeActiveTextEditor(() => updateStatus(context))
}

async function setupWhatsAppClient(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("WhatsApp QR Code")
  outputChannel.show()

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "vs-code-status" }),
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  })

  client.on("qr", (qr) => {
    outputChannel.clear()
    outputChannel.appendLine("Scan the QR code below with your WhatsApp app to log in:")
    qrcode.generate(qr, { small: true }, (qrcode) => {
      outputChannel.appendLine(qrcode)
    })
  })

  client.on("ready", () => {
    vscode.window.showInformationMessage("WhatsApp client is ready!")
    context.globalState.update("whatsappReady", true)
    updateStatus(context)
  })

  try {
    await client.initialize()
  } catch (error) {
    console.error("Failed to initialize WhatsApp client:", error)
    vscode.window.showErrorMessage("Failed to initialize WhatsApp client. Please try again.")
  }
}

function initializeWhatsAppClient(context: vscode.ExtensionContext) {
  const isReady = context.globalState.get<boolean>("whatsappReady")

  if (!isReady) {
    statusBarItem.text = "Setup WhatsApp Client"
    statusBarItem.command = "extension.setupWhatsAppClient"
    statusBarItem.show()
    return
  }

  setupWhatsAppClient(context)
}

async function updateStatus(context: vscode.ExtensionContext) {
  if (!client) {
    initializeWhatsAppClient(context)
    return
  }

  const editor = vscode.window.activeTextEditor
  let status = "Idle in VS Code"

  if (editor) {
    const fileName = path.basename(editor.document.fileName)
    status = `Working On ${fileName}`
  }

  statusBarItem.text = `WhatsApp: ${status}`
  statusBarItem.show()

  try {
    await client.setStatus(status)
    vscode.window.showInformationMessage(`WhatsApp status updated: ${status}`)
  } catch (error) {
    console.error("Failed to update WhatsApp status:", error)
    vscode.window.showErrorMessage("Failed to update WhatsApp status. Please check your setup.")
  }
}

export function deactivate() {
  if (client) {
    client.destroy()
  }
}

