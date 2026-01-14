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
exports.VoicePlayer = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class VoicePlayer {
    constructor(client) {
        this.client = client;
        this.webviewPanel = null;
    }
    async play(text, voiceId) {
        try {
            // Get voice ID from config or use default
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const finalVoiceId = voiceId || config.get('voiceId', '21m00Tcm4TlvDq8ikWAM');
            // Generate speech
            const audioStream = await this.client.textToSpeech.convert(finalVoiceId, {
                text: text,
                modelId: 'eleven_monolingual_v1',
            });
            // Convert stream to audio buffer
            const chunks = [];
            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }
            const audioData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
                audioData.set(chunk, offset);
                offset += chunk.length;
            }
            // Play audio using webview
            await this.playAudioInWebview(audioData);
        }
        catch (error) {
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }
    async playAudioInWebview(audioData) {
        return new Promise((resolve, reject) => {
            // Create temporary file for audio
            const tempDir = os.tmpdir();
            const tempFile = path.join(tempDir, `cursor-voice-${Date.now()}.mp3`);
            fs.writeFileSync(tempFile, audioData);
            // Create webview for audio playback
            this.webviewPanel = vscode.window.createWebviewPanel('voicePlayer', 'Voice Player', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: false,
            });
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
                }
                else if (message.command === 'playbackError') {
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
                }
                catch (e) {
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
exports.VoicePlayer = VoicePlayer;
//# sourceMappingURL=voicePlayer.js.map