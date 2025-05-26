/**
 * Utility for playing notification sounds using Web Audio API.
 * This avoids the need for external sound files.
 */

let audioContext: AudioContext | null = null;

/**
 * Initializes the audio context on first user interaction.
 * Must be called in response to a user gesture for browsers that
 * require user interaction to start audio context.
 */
export const initAudioContext = (): void => {
  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    } catch (e) {
      console.error('Web Audio API is not supported in this browser:', e);
    }
  }
};

/**
 * Plays a simple notification sound using Web Audio API.
 * This creates a short "ding" sound.
 */
export const playNotificationSound = (): void => {
  if (!audioContext) {
    initAudioContext();
  }
  
  if (!audioContext) {
    console.error('Could not initialize audio context');
    return;
  }
  
  try {
    // Create oscillator for the tone
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // Higher frequency for notification sound
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
};

export default playNotificationSound; 