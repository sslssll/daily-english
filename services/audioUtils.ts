// Helper to decode Base64
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const AudioPlayerService = {
  async playPCM(base64Audio: string, onEnded?: () => void) {
    this.stop(); // Stop any currently playing audio

    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Gemini TTS usually defaults to 24k
      });
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    try {
      const bytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, audioContext);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        currentSource = null;
        if (onEnded) onEnded();
      };

      source.start();
      currentSource = source;
    } catch (error) {
      console.error("Error decoding or playing audio", error);
    }
  },

  stop() {
    if (currentSource) {
      currentSource.stop();
      currentSource = null;
    }
  },
  
  resume() {
      // AudioContext based playback is harder to "pause/resume" exactly without tracking time.
      // For simplicity in this demo, we handle stop/start. 
      // Real resumption requires tracking `startTime` and `offset`.
  }
};