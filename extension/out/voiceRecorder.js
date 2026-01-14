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
exports.VoiceRecorder = void 0;
const vscode = __importStar(require("vscode"));
/**
 * VoiceRecorder uses a WebView to access browser APIs for microphone recording
 * VS Code extensions run in Node.js, so we need a webview for browser APIs
 */
class VoiceRecorder {
    constructor() {
        this.webviewPanel = null;
        this.resolveRecording = null;
    }
    async record() {
        return new Promise((resolve) => {
            this.resolveRecording = resolve;
            // Create webview for audio recording
            this.webviewPanel = vscode.window.createWebviewPanel('voiceRecorder', 'Voice Recorder', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            // Set webview HTML with audio recording
            this.webviewPanel.webview.html = this.getWebviewContent();
            // Handle messages from webview
            this.webviewPanel.webview.onDidReceiveMessage(async (message) => {
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
            });
            this.webviewPanel.onDidDispose(() => {
                if (this.resolveRecording) {
                    this.resolveRecording(null);
                    this.resolveRecording = null;
                }
            });
        });
    }
    getWebviewContent() {
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
exports.VoiceRecorder = VoiceRecorder;
//# sourceMappingURL=voiceRecorder.js.map