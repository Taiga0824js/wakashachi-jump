// ==================================
// src/components/HighScoreManager.jsxooon
// ==================================
import { useEffect } from 'react';
import useGameStore from '../hooks/useGameStore';

function HighScoreManager() {
  const { score, highScore, setHighScore } = useGameStore();

  useEffect(() => {
    const saved = localStorage.getItem('curry-udon-highscore');
    if (saved) {
      setHighScore(Number(saved));
    }
  }, [setHighScore]);

  useEffect(() => {
    if (score > highScore) {
      localStorage.setItem('curry-udon-highscore', String(score));
      setHighScore(score);
    }
  }, [score, highScore, setHighScore]);

  return null;
}

export default HighScoreManager;
