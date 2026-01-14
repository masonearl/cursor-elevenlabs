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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const elevenlabs_js_1 = require("@elevenlabs/elevenlabs-js");
const voiceRecorder_1 = require("./voiceRecorder");
const voicePlayer_1 = require("./voicePlayer");
const cursorChat_1 = require("./cursorChat");
let voiceRecorder = null;
let voicePlayer = null;
let chatIntegration = null;
let isActive = false;
let statusBarItem;
function activate(context) {
    console.log('Cursor ElevenLabs Voice Assistant is now active!');
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorVoice.startConversation';
    statusBarItem.text = '$(mic) Voice';
    statusBarItem.tooltip = 'Start Voice Conversation';
    statusBarItem.show();
    // Get configuration
    const config = vscode.workspace.getConfiguration('cursorVoice');
    const apiKey = config.get('elevenlabsApiKey', '');
    if (!apiKey) {
        vscode.window.showWarningMessage('ElevenLabs API key not configured. Please set cursorVoice.elevenlabsApiKey in settings.');
        return;
    }
    // Initialize ElevenLabs client
    const elevenlabsClient = new elevenlabs_js_1.ElevenLabsClient({
        apiKey: apiKey,
    });
    // Initialize components
    voiceRecorder = new voiceRecorder_1.VoiceRecorder();
    voicePlayer = new voicePlayer_1.VoicePlayer(elevenlabsClient);
    chatIntegration = new cursorChat_1.CursorChatIntegration();
    // Register commands
    const startCommand = vscode.commands.registerCommand('cursorVoice.startConversation', async () => {
        await startVoiceConversation(context, elevenlabsClient);
    });
    const stopCommand = vscode.commands.registerCommand('cursorVoice.stopConversation', async () => {
        await stopVoiceConversation();
    });
    context.subscriptions.push(startCommand, stopCommand, statusBarItem);
    // Auto-start if configured
    if (config.get('autoStart', false)) {
        vscode.commands.executeCommand('cursorVoice.startConversation');
    }
}
async function startVoiceConversation(context, client) {
    if (isActive) {
        vscode.window.showInformationMessage('Voice conversation is already active');
        return;
    }
    try {
        isActive = true;
        statusBarItem.text = '$(mic-filled) Voice Active';
        statusBarItem.command = 'cursorVoice.stopConversation';
        statusBarItem.tooltip = 'Stop Voice Conversation';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        vscode.window.showInformationMessage('🎤 Voice conversation started! Speak to build code.');
        // Start the conversation loop
        await conversationLoop(client);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start voice conversation: ${error.message}`);
        await stopVoiceConversation();
    }
}
async function stopVoiceConversation() {
    if (!isActive) {
        return;
    }
    isActive = false;
    statusBarItem.text = '$(mic) Voice';
    statusBarItem.command = 'cursorVoice.startConversation';
    statusBarItem.tooltip = 'Start Voice Conversation';
    statusBarItem.backgroundColor = undefined;
    if (voiceRecorder) {
        await voiceRecorder.stop();
    }
    if (voicePlayer) {
        await voicePlayer.stop();
    }
    vscode.window.showInformationMessage('Voice conversation stopped');
}
async function conversationLoop(client) {
    if (!voiceRecorder || !voicePlayer || !chatIntegration) {
        return;
    }
    while (isActive) {
        try {
            // Step 1: Record audio
            vscode.window.showInformationMessage('🎤 Listening...');
            const audioData = await voiceRecorder.record();
            if (!audioData) {
                continue;
            }
            // Step 2: Transcribe using ElevenLabs STT
            vscode.window.showInformationMessage('📝 Transcribing...');
            const transcription = await transcribeAudio(client, audioData);
            if (!transcription || transcription.trim().length === 0) {
                continue;
            }
            vscode.window.showInformationMessage(`You said: "${transcription}"`);
            // Step 3: Send to Cursor chat
            vscode.window.showInformationMessage('💬 Sending to Cursor...');
            await chatIntegration.sendToChat(transcription);
            // Step 4: Wait for response (this is tricky - we'll need to monitor chat)
            // For now, we'll use a simple approach: wait and then get the last response
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Step 5: Get Cursor's response (placeholder - needs implementation)
            const cursorResponse = await chatIntegration.getLastResponse();
            if (cursorResponse) {
                // Step 6: Convert to speech and play
                vscode.window.showInformationMessage('🔊 Speaking response...');
                await voicePlayer.play(cursorResponse);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error in conversation loop: ${error.message}`);
            // Continue the loop
        }
    }
}
async function transcribeAudio(client, audioData) {
    try {
        // TODO: Implement ElevenLabs transcription API
        // For now, we'll need to check if they have STT endpoints
        // This is a placeholder
        return null;
    }
    catch (error) {
        throw new Error(`Transcription failed: ${error.message}`);
    }
}
function deactivate() {
    stopVoiceConversation();
}
//# sourceMappingURL=extension.js.map