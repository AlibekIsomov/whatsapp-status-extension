"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = __importStar(require("qrcode-terminal"));
const path = __importStar(require("path"));
let statusBarItem;
let client;
function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = "extension.updateWhatsAppStatus";
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(vscode.commands.registerCommand("extension.setupWhatsAppClient", () => setupWhatsAppClient(context)));
    context.subscriptions.push(vscode.commands.registerCommand("extension.updateWhatsAppStatus", () => updateStatus(context)));
    initializeWhatsAppClient(context);
    // Update status when the active editor changes
    vscode.window.onDidChangeActiveTextEditor(() => updateStatus(context));
}
exports.activate = activate;
async function setupWhatsAppClient(context) {
    const outputChannel = vscode.window.createOutputChannel("WhatsApp QR Code");
    outputChannel.show();
    client = new whatsapp_web_js_1.Client({
        authStrategy: new whatsapp_web_js_1.LocalAuth({ clientId: "vs-code-status" }),
        puppeteer: {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
    });
    client.on("qr", (qr) => {
        outputChannel.clear();
        outputChannel.appendLine("Scan the QR code below with your WhatsApp app to log in:");
        qrcode.generate(qr, { small: true }, (qrcode) => {
            outputChannel.appendLine(qrcode);
        });
    });
    client.on("ready", () => {
        vscode.window.showInformationMessage("WhatsApp client is ready!");
        context.globalState.update("whatsappReady", true);
        updateStatus(context);
    });
    try {
        await client.initialize();
    }
    catch (error) {
        console.error("Failed to initialize WhatsApp client:", error);
        vscode.window.showErrorMessage("Failed to initialize WhatsApp client. Please try again.");
    }
}
function initializeWhatsAppClient(context) {
    const isReady = context.globalState.get("whatsappReady");
    if (!isReady) {
        statusBarItem.text = "Setup WhatsApp Client";
        statusBarItem.command = "extension.setupWhatsAppClient";
        statusBarItem.show();
        return;
    }
    setupWhatsAppClient(context);
}
async function updateStatus(context) {
    if (!client) {
        initializeWhatsAppClient(context);
        return;
    }
    const editor = vscode.window.activeTextEditor;
    let status = "Idle in VS Code";
    if (editor) {
        const fileName = path.basename(editor.document.fileName);
        status = `Editing ${fileName} in VS Code`;
    }
    statusBarItem.text = `WhatsApp: ${status}`;
    statusBarItem.show();
    try {
        await client.setStatus(status);
        vscode.window.showInformationMessage(`WhatsApp status updated: ${status}`);
    }
    catch (error) {
        console.error("Failed to update WhatsApp status:", error);
        vscode.window.showErrorMessage("Failed to update WhatsApp status. Please check your setup.");
    }
}
function deactivate() {
    if (client) {
        client.destroy();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map