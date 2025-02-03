// =========================
// src/hooks/useAudio.js
// =========================
import { Howl } from 'howler';

const useAudio = (src, volume = 0.5, loop = false) => {
  const sound = new Howl({
    src,
    volume,
    loop,
    html5: true, // モバイル対応のため
  });

  const playSound = () => {
    sound.play();
  };

  const stopSound = () => {
    sound.stop();
  };

  return { playSound, stopSound };
};

export default useAudio;
