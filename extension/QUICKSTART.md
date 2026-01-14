# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd extension
npm install
npm run compile
```

### 2. Configure Settings

Open VS Code/Cursor settings and add:

```json
{
  "cursorVoice.elevenlabsApiKey": "your-api-key-here",
  "cursorVoice.voiceId": "", // Optional - leave empty for default
  "cursorVoice.autoStart": false // Optional - auto-start on launch
}
```

### 3. Test the Extension

**Option A: Development Mode**
1. Open the `extension` folder in Cursor
2. Press `F5` to launch extension development host
3. In the new window, test the extension

**Option B: Install Locally**
1. Package the extension:
   ```bash
   npm install -g vsce
   vsce package
   ```
2. Install in Cursor:
   - `Cmd+Shift+P` → "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file

### 4. Use the Extension

- **Start Voice Conversation**: `Cmd+Shift+P` → "Start Voice Conversation"
- **Or**: Click the microphone icon in the status bar
- **Stop**: `Cmd+Shift+P` → "Stop Voice Conversation"

## 🎯 How It Works

1. **Voice Input**: Webview captures audio from microphone
2. **Transcription**: (TODO - needs ElevenLabs STT implementation)
3. **Send to Chat**: Text is copied to clipboard and chat opens
4. **Get Response**: (TODO - needs Cursor chat API integration)
5. **Voice Output**: ElevenLabs TTS plays the response

## ⚠️ Current Limitations

- **STT Not Implemented**: Need to add ElevenLabs transcription API
- **Chat Integration**: Currently uses clipboard - needs better integration
- **Response Reading**: Need to find way to read Cursor's chat responses

## 🔧 Next Steps

1. Implement ElevenLabs STT for transcription
2. Find Cursor's chat API or use automation
3. Improve error handling
4. Add visual feedback
5. Support push-to-talk mode
