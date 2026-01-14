import * as vscode from 'vscode';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { VoiceRecorder } from './voiceRecorder';
import { VoicePlayer } from './voicePlayer';
import { CursorChatIntegration } from './cursorChat';

let voiceRecorder: VoiceRecorder | null = null;
let voicePlayer: VoicePlayer | null = null;
let chatIntegration: CursorChatIntegration | null = null;
let isActive = false;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor ElevenLabs Voice Assistant is now active!');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorVoice.startConversation';
    statusBarItem.text = '$(mic) Voice';
    statusBarItem.tooltip = 'Start Voice Conversation';
    statusBarItem.show();

    // Get configuration
    const config = vscode.workspace.getConfiguration('cursorVoice');
    const apiKey = config.get<string>('elevenlabsApiKey', '');
    
    if (!apiKey) {
        vscode.window.showWarningMessage(
            'ElevenLabs API key not configured. Please set cursorVoice.elevenlabsApiKey in settings.'
        );
        return;
    }

    // Initialize ElevenLabs client
    const elevenlabsClient = new ElevenLabsClient({
        apiKey: apiKey,
    });

    // Initialize components
    voiceRecorder = new VoiceRecorder();
    voicePlayer = new VoicePlayer(elevenlabsClient);
    chatIntegration = new CursorChatIntegration();

    // Register commands
    const startCommand = vscode.commands.registerCommand('cursorVoice.startConversation', async () => {
        await startVoiceConversation(context, elevenlabsClient);
    });

    const stopCommand = vscode.commands.registerCommand('cursorVoice.stopConversation', async () => {
        await stopVoiceConversation();
    });

    context.subscriptions.push(startCommand, stopCommand, statusBarItem);

    // Auto-start if configured
    if (config.get<boolean>('autoStart', false)) {
        vscode.commands.executeCommand('cursorVoice.startConversation');
    }
}

async function startVoiceConversation(
    context: vscode.ExtensionContext,
    client: ElevenLabsClient
) {
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

    } catch (error: any) {
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

async function conversationLoop(client: ElevenLabsClient) {
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

        } catch (error: any) {
            vscode.window.showErrorMessage(`Error in conversation loop: ${error.message}`);
            // Continue the loop
        }
    }
}

async function transcribeAudio(client: ElevenLabsClient, audioData: ArrayBuffer): Promise<string | null> {
    try {
        // TODO: Implement ElevenLabs transcription API
        // For now, we'll need to check if they have STT endpoints
        // This is a placeholder
        return null;
    } catch (error: any) {
        throw new Error(`Transcription failed: ${error.message}`);
    }
}

export function deactivate() {
    stopVoiceConversation();
}
