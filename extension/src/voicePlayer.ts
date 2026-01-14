import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class VoicePlayer {
    private webviewPanel: vscode.WebviewPanel | null = null;

    constructor(private client: ElevenLabsClient) {}

    async play(text: string, voiceId?: string): Promise<void> {
        try {
            // Get voice ID from config or use default
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const finalVoiceId = voiceId || config.get<string>('voiceId', '21m00Tcm4TlvDq8ikWAM');

            // Generate speech
            const audioStream = await this.client.textToSpeech.convert(finalVoiceId, {
                text: text,
                modelId: 'eleven_monolingual_v1',
            });

            // Convert stream to audio buffer
            const chunks: Uint8Array[] = [];
            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }

            const audioData = new Uint8Array(
                chunks.reduce((acc, chunk) => acc + chunk.length, 0)
            );
            let offset = 0;
            for (const chunk of chunks) {
                audioData.set(chunk, offset);
                offset += chunk.length;
            }

            // Play audio using webview
            await this.playAudioInWebview(audioData);

        } catch (error: any) {
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }

    private async playAudioInWebview(audioData: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create temporary file for audio
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, `cursor-voice-${Date.now()}.mp3`);
            
            fs.writeFileSync(tempFile, audioData);

            // Create webview for audio playback
            this.webviewPanel = vscode.window.createWebviewPanel(
                'voicePlayer',
                'Voice Player',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: false,
                }
            );

            // Convert file to data URI for webview
            const base64Audio = Buffer.from(audioData).toString('base64');
            const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

            this.webviewPanel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    <h2>🔊 Playing audio...</h2>
    <audio id="audioPlayer" autoplay>
        <source src="${audioDataUri}" type="audio/mpeg">
    </audio>
    <script>
        const vscode = acquireVsCodeApi();
        const audio = document.getElementById('audioPlayer');
        audio.onended = () => {
            vscode.postMessage({ command: 'playbackEnded' });
        };
        audio.onerror = () => {
            vscode.postMessage({ command: 'playbackError' });
        };
    </script>
</body>
</html>`;

            this.webviewPanel.webview.onDidReceiveMessage((message) => {
                if (message.command === 'playbackEnded') {
                    // Clean up
                    fs.unlinkSync(tempFile);
                    if (this.webviewPanel) {
                        this.webviewPanel.dispose();
                    }
                    resolve();
                } else if (message.command === 'playbackError') {
                    fs.unlinkSync(tempFile);
                    if (this.webviewPanel) {
                        this.webviewPanel.dispose();
                    }
                    reject(new Error('Audio playback failed'));
                }
            });

            this.webviewPanel.onDidDispose(() => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {
                    // File might already be deleted
                }
            });
        });
    }

    async stop() {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
