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
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class VoicePlayer {
    constructor(useElevenLabs = false, elevenLabsClient) {
        this.useElevenLabs = useElevenLabs;
        this.elevenLabsClient = elevenLabsClient;
        this.currentProcess = null;
    }
    async play(text, voiceId) {
        try {
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const useElevenLabs = config.get('useElevenLabs', false);
            if (useElevenLabs && this.elevenLabsClient) {
                // Use ElevenLabs if configured
                await this.playWithElevenLabs(text, voiceId);
            }
            else {
                // Use macOS built-in 'say' command (default)
                await this.playWithSay(text);
            }
        }
        catch (error) {
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }
    async playWithSay(text) {
        return new Promise((resolve, reject) => {
            // Get voice from config or use default
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const voice = config.get('macosVoice', ''); // e.g., "Alex", "Samantha", "Victoria"
            // Escape text for shell
            const escapedText = text.replace(/'/g, "'\\''");
            const voiceArg = voice ? `-v ${voice}` : '';
            // Use macOS 'say' command
            const command = `say ${voiceArg} '${escapedText}'`;
            vscode.window.showInformationMessage(`🔊 Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            this.currentProcess = (0, child_process_1.exec)(command, (error) => {
                this.currentProcess = null;
                if (error) {
                    reject(new Error(`Say command failed: ${error.message}`));
                }
                else {
                    resolve();
                }
            });
        });
    }
    async playWithElevenLabs(text, voiceId) {
        // Keep ElevenLabs implementation for future use
        // This would use the webview approach from before
        throw new Error('ElevenLabs TTS not implemented in this version');
    }
    async stop() {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
    /**
     * List available macOS voices
     */
    static async listVoices() {
        try {
            const { stdout } = await execAsync('say -v ?');
            const voices = stdout
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => {
                // Parse "Alex en_US    # Hello, my name is Alex."
                const match = line.match(/^(\w+)\s+/);
                return match ? match[1] : null;
            })
                .filter((v) => v !== null);
            return voices;
        }
        catch (error) {
            return ['Alex', 'Samantha', 'Victoria']; // Fallback to common voices
        }
    }
}
exports.VoicePlayer = VoicePlayer;
//# sourceMappingURL=voicePlayer.js.map