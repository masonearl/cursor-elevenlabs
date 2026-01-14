import * as vscode from 'vscode';

/**
 * VoiceRecorder uses a WebView to access browser APIs for microphone recording
 * VS Code extensions run in Node.js, so we need a webview for browser APIs
 */
export class VoiceRecorder {
    private webviewPanel: vscode.WebviewPanel | null = null;
    private resolveRecording: ((data: ArrayBuffer | null) => void) | null = null;

    async record(): Promise<ArrayBuffer | null> {
        return new Promise((resolve) => {
            this.resolveRecording = resolve;

            // Create webview for audio recording
            this.webviewPanel = vscode.window.createWebviewPanel(
                'voiceRecorder',
                'Voice Recorder',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            // Set webview HTML with audio recording
            this.webviewPanel.webview.html = this.getWebviewContent();

            // Handle messages from webview
            this.webviewPanel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'audioData':
                            const audioData = Buffer.from(message.data, 'base64');
                            if (this.resolveRecording) {
                                this.resolveRecording(audioData.buffer);
                                this.resolveRecording = null;
                            }
                            if (this.webviewPanel) {
                                this.webviewPanel.dispose();
                            }
                            break;
                        case 'error':
                            vscode.window.showErrorMessage(`Recording error: ${message.error}`);
                            if (this.resolveRecording) {
                                this.resolveRecording(null);
                                this.resolveRecording = null;
                            }
                            break;
                    }
                }
            );

            this.webviewPanel.onDidDispose(() => {
                if (this.resolveRecording) {
                    this.resolveRecording(null);
                    this.resolveRecording = null;
                }
            });
        });
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Recorder</title>
</head>
<body>
    <h2>🎤 Recording...</h2>
    <p>Speak now. Recording will stop automatically after 5 seconds.</p>
    <button id="stopBtn" style="display:none;">Stop Recording</button>
    <script>
        const vscode = acquireVsCodeApi();
        let mediaRecorder;
        let audioChunks = [];

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                    
                    vscode.postMessage({
                        command: 'audioData',
                        data: base64
                    });

                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.onerror = (event) => {
                    vscode.postMessage({
                        command: 'error',
                        error: 'Recording failed'
                    });
                };

                mediaRecorder.start();
                
                // Auto-stop after 5 seconds
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                        mediaRecorder.stop();
                    }
                }, 5000);

            } catch (error) {
                vscode.postMessage({
                    command: 'error',
                    error: error.message
                });
            }
        }

        startRecording();
    </script>
</body>
</html>`;
    }

    async stop() {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }
}
