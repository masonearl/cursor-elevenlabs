# Cursor ElevenLabs Voice Extension

VS Code extension that adds bidirectional voice conversation to Cursor IDE.

## Features

- 🎤 Voice input - Speak naturally to describe what you want to build
- 🔊 Voice output - Hear Cursor's responses in natural voice
- 🔄 Conversation loop - Iterate through code changes via voice
- ⚡ Real-time - Low-latency voice interactions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Compile:
```bash
npm run compile
```

3. Press F5 to launch extension development host

4. Configure settings:
- Set `cursorVoice.elevenlabsApiKey` in VS Code settings
- Optionally set `cursorVoice.voiceId` for custom voice

## Usage

- Press `Cmd+Shift+P` → "Start Voice Conversation"
- Or click the microphone icon in the status bar
- Speak your coding request
- Listen to Cursor's response
- Continue the conversation

## Development

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- Press F5 to test in extension development host

## Architecture

- `extension.ts` - Main extension entry point
- `voiceRecorder.ts` - Handles microphone input
- `voicePlayer.ts` - Handles audio playback via ElevenLabs
- `cursorChat.ts` - Integrates with Cursor's chat (needs implementation)

## TODO

- [ ] Implement ElevenLabs STT (speech-to-text)
- [ ] Better Cursor chat integration (find API or use automation)
- [ ] Push-to-talk vs continuous listening
- [ ] Visual feedback in UI
- [ ] Error handling and recovery
