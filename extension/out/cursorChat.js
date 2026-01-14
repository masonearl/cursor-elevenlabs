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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorChatIntegration = void 0;
const vscode = __importStar(require("vscode"));
class CursorChatIntegration {
    constructor() {
        this.lastResponse = '';
    }
    /**
     * Send text to Cursor's chat
     * Since we don't have direct API access, we'll use clipboard + automation
     */
    async sendToChat(text) {
        try {
            // Copy text to clipboard
            await vscode.env.clipboard.writeText(text);
            // Open Cursor chat (Cmd+L or Cmd+K)
            // We'll use command execution to open chat
            await vscode.commands.executeCommand('workbench.action.chat.open');
            // Wait a bit for chat to open
            await new Promise(resolve => setTimeout(resolve, 500));
            // Paste the text (this is tricky - we might need to use keyboard shortcuts)
            // For now, we'll just copy it and let user paste manually
            // Or we could use automation libraries
            vscode.window.showInformationMessage(`Text copied to clipboard. Please paste into Cursor chat: "${text.substring(0, 50)}..."`);
        }
        catch (error) {
            throw new Error(`Failed to send to chat: ${error.message}`);
        }
    }
    /**
     * Get the last response from Cursor chat
     * This is a placeholder - we'll need to find a way to read Cursor's chat responses
     */
    async getLastResponse() {
        // TODO: Implement actual chat response reading
        // Options:
        // 1. Monitor clipboard for responses
        // 2. Use Cursor's internal API (if available)
        // 3. Use automation to copy last message
        // 4. Parse Cursor's chat UI (complex)
        // For now, return a placeholder
        return this.lastResponse || null;
    }
    setLastResponse(response) {
        this.lastResponse = response;
    }
}
exports.CursorChatIntegration = CursorChatIntegration;
//# sourceMappingURL=cursorChat.js.map