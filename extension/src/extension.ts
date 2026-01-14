import * as vscode from 'vscode';
import { VoicePlayer } from './voicePlayer';
import { startSpeechServer, stopSpeechServer, setTranscriptionCallback } from './speechServer';

let voicePlayer: VoicePlayer | null = null;
let statusBarItem: vscode.StatusBarItem;
const SPEECH_SERVER_PORT = 3847;

export function activate(context: vscode.ExtensionContext) {
    console.log('Cursor Voice Assistant is now active!');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cursorVoice.openVoiceInput';
    statusBarItem.text = '$(mic) Voice';
    statusBarItem.tooltip = 'Open Voice Input';
    statusBarItem.show();

    // Initialize TTS player (using macOS built-in TTS)
    voicePlayer = new VoicePlayer(false);

    // Start the speech server
    startSpeechServer(SPEECH_SERVER_PORT).then(() => {
        console.log(`Speech server started on port ${SPEECH_SERVER_PORT}`);
    }).catch(err => {
        console.error('Failed to start speech server:', err);
    });

    // Handle transcription from the web UI
    setTranscriptionCallback(async (text: string) => {
        // Copy to clipboard
        await vscode.env.clipboard.writeText(text);
        
        // Try to open Cursor's chat and paste
        try {
            // Open Cursor chat (Cmd+L)
            await vscode.commands.executeCommand('workbench.action.chat.open');
            
            // Small delay then paste
            setTimeout(async () => {
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                vscode.window.showInformationMessage('Text pasted to chat. Press Enter to send.');
            }, 500);
        } catch (error) {
            vscode.window.showInformationMessage('Text copied to clipboard. Paste it into Cursor chat.');
        }
    });

    // Command: Open voice input web page
    const openVoiceInputCommand = vscode.commands.registerCommand('cursorVoice.openVoiceInput', async () => {
        const url = `http://localhost:${SPEECH_SERVER_PORT}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
        vscode.window.showInformationMessage('Voice input opened in browser. Speak and click "Send to Cursor".');
    });

    // Command: Test TTS
    const testTTSCommand = vscode.commands.registerCommand('cursorVoice.testTTS', async () => {
        if (voicePlayer) {
            await voicePlayer.play('Hello! This is a test of the voice assistant. The macOS built-in text to speech is working.');
        }
    });

    // Command: Speak selected text
    const speakSelectionCommand = vscode.commands.registerCommand('cursorVoice.speakSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && voicePlayer) {
            const selection = editor.document.getText(editor.selection);
            if (selection) {
                await voicePlayer.play(selection);
            } else {
                vscode.window.showWarningMessage('No text selected. Select text first, then run this command.');
            }
        }
    });

    // Command: Speak clipboard content
    const speakClipboardCommand = vscode.commands.registerCommand('cursorVoice.speakClipboard', async () => {
        if (voicePlayer) {
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText) {
                await voicePlayer.play(clipboardText);
            } else {
                vscode.window.showWarningMessage('Clipboard is empty');
            }
        }
    });

    // Command: Stop speaking
    const stopCommand = vscode.commands.registerCommand('cursorVoice.stop', async () => {
        if (voicePlayer) {
            await voicePlayer.stop();
            vscode.window.showInformationMessage('Voice stopped');
        }
    });

    // Command: Type and speak
    const typeAndSpeakCommand = vscode.commands.registerCommand('cursorVoice.typeAndSpeak', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'What would you like me to say?',
            placeHolder: 'Type your message...'
        });
        if (input && voicePlayer) {
            await voicePlayer.play(input);
        }
    });

    context.subscriptions.push(
        openVoiceInputCommand,
        testTTSCommand,
        speakSelectionCommand,
        speakClipboardCommand,
        stopCommand,
        typeAndSpeakCommand,
        statusBarItem
    );
}

export function deactivate() {
    stopSpeechServer();
    if (voicePlayer) {
        voicePlayer.stop();
    }
}
