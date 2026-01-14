import * as http from 'http';
import * as vscode from 'vscode';

let server: http.Server | null = null;
let lastTranscription: string = '';
let onTranscriptionCallback: ((text: string) => void) | null = null;

const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
    <title>Cursor Voice Input</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #fff;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 { 
            font-size: 24px; 
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #status {
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .listening { background: #2d5a27; }
        .idle { background: #333; }
        .error { background: #5a2727; }
        #transcription {
            width: 100%;
            min-height: 150px;
            background: #2d2d2d;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 15px;
            color: #fff;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
            resize: vertical;
        }
        .buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        button:hover { opacity: 0.9; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        #startBtn { background: #0078d4; color: white; }
        #stopBtn { background: #d41a1a; color: white; }
        #sendBtn { background: #28a745; color: white; }
        #clearBtn { background: #555; color: white; }
        .instructions {
            margin-top: 30px;
            padding: 15px;
            background: #252525;
            border-radius: 8px;
            font-size: 14px;
            color: #aaa;
        }
        .instructions h3 { 
            margin: 0 0 10px 0; 
            color: #fff;
            font-size: 16px;
        }
        .instructions ol { margin: 0; padding-left: 20px; }
        .instructions li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Cursor Voice Input</h1>
        
        <div id="status" class="idle">Ready to listen</div>
        
        <textarea id="transcription" placeholder="Your speech will appear here..."></textarea>
        
        <div class="buttons">
            <button id="startBtn" onclick="startListening()">🎤 Start Listening</button>
            <button id="stopBtn" onclick="stopListening()" disabled>⏹ Stop</button>
            <button id="sendBtn" onclick="sendToChat()">📤 Send to Cursor</button>
            <button id="clearBtn" onclick="clearText()">🗑 Clear</button>
        </div>
        
        <div class="instructions">
            <h3>How to use:</h3>
            <ol>
                <li>Click "Start Listening" and speak</li>
                <li>Click "Stop" when done speaking</li>
                <li>Edit the text if needed</li>
                <li>Click "Send to Cursor" to paste into chat</li>
                <li>In Cursor, press Enter to send</li>
                <li>Select Cursor's response and use "Speak Selection" command</li>
            </ol>
        </div>
    </div>

    <script>
        let recognition = null;
        let isListening = false;

        // Check for browser support
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            document.getElementById('status').textContent = 'Speech recognition not supported. Use Chrome or Edge.';
            document.getElementById('status').className = 'error';
            document.getElementById('startBtn').disabled = true;
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListening = true;
                document.getElementById('status').textContent = '🔴 Listening... Speak now';
                document.getElementById('status').className = 'listening';
                document.getElementById('startBtn').disabled = true;
                document.getElementById('stopBtn').disabled = false;
            };

            recognition.onend = () => {
                isListening = false;
                document.getElementById('status').textContent = 'Ready to listen';
                document.getElementById('status').className = 'idle';
                document.getElementById('startBtn').disabled = false;
                document.getElementById('stopBtn').disabled = true;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                document.getElementById('status').textContent = 'Error: ' + event.error;
                document.getElementById('status').className = 'error';
                isListening = false;
                document.getElementById('startBtn').disabled = false;
                document.getElementById('stopBtn').disabled = true;
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const textarea = document.getElementById('transcription');
                if (finalTranscript) {
                    textarea.value += finalTranscript;
                }
            };
        }

        function startListening() {
            if (recognition && !isListening) {
                recognition.start();
            }
        }

        function stopListening() {
            if (recognition && isListening) {
                recognition.stop();
            }
        }

        function clearText() {
            document.getElementById('transcription').value = '';
        }

        async function sendToChat() {
            const text = document.getElementById('transcription').value.trim();
            if (!text) {
                alert('No text to send');
                return;
            }

            try {
                // Send to extension server
                const response = await fetch('/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                
                if (response.ok) {
                    document.getElementById('status').textContent = '✅ Sent to Cursor! Switch to Cursor and press Enter.';
                    document.getElementById('status').className = 'idle';
                } else {
                    throw new Error('Failed to send');
                }
            } catch (error) {
                console.error('Error sending:', error);
                document.getElementById('status').textContent = 'Error sending to Cursor';
                document.getElementById('status').className = 'error';
            }
        }
    </script>
</body>
</html>
`;

export function startSpeechServer(port: number = 3847): Promise<void> {
    return new Promise((resolve, reject) => {
        if (server) {
            resolve();
            return;
        }

        server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.method === 'GET' && req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(HTML_PAGE);
                return;
            }

            if (req.method === 'POST' && req.url === '/send') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { text } = JSON.parse(body);
                        lastTranscription = text;
                        
                        if (onTranscriptionCallback) {
                            onTranscriptionCallback(text);
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid request' }));
                    }
                });
                return;
            }

            res.writeHead(404);
            res.end('Not found');
        });

        server.listen(port, () => {
            console.log(`Speech server running at http://localhost:${port}`);
            resolve();
        });

        server.on('error', reject);
    });
}

export function stopSpeechServer() {
    if (server) {
        server.close();
        server = null;
    }
}

export function getLastTranscription(): string {
    return lastTranscription;
}

export function setTranscriptionCallback(callback: (text: string) => void) {
    onTranscriptionCallback = callback;
}
