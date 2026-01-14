import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VoicePlayer {
    private currentProcess: any = null;

    constructor(private useElevenLabs: boolean = false, private elevenLabsClient?: any) {}

    async play(text: string, voiceId?: string): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const useElevenLabs = config.get<boolean>('useElevenLabs', false);

            if (useElevenLabs && this.elevenLabsClient) {
                // Use ElevenLabs if configured
                await this.playWithElevenLabs(text, voiceId);
            } else {
                // Use macOS built-in 'say' command (default)
                await this.playWithSay(text);
            }
        } catch (error: any) {
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }

    private async playWithSay(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Get voice from config or use default
            const config = vscode.workspace.getConfiguration('cursorVoice');
            const voice = config.get<string>('macosVoice', ''); // e.g., "Alex", "Samantha", "Victoria"
            
            // Escape text for shell
            const escapedText = text.replace(/'/g, "'\\''");
            const voiceArg = voice ? `-v ${voice}` : '';
            
            // Use macOS 'say' command
            const command = `say ${voiceArg} '${escapedText}'`;
            
            vscode.window.showInformationMessage(`🔊 Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            
            this.currentProcess = exec(command, (error) => {
                this.currentProcess = null;
                if (error) {
                    reject(new Error(`Say command failed: ${error.message}`));
                } else {
                    resolve();
                }
            });
        });
    }

    private async playWithElevenLabs(text: string, voiceId?: string): Promise<void> {
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
    static async listVoices(): Promise<string[]> {
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
                .filter((v): v is string => v !== null);
            return voices;
        } catch (error) {
            return ['Alex', 'Samantha', 'Victoria']; // Fallback to common voices
        }
    }
}
