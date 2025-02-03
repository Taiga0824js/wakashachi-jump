// src/App.js
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from './hooks/useGameStore';
import useAudio from './hooks/useAudio';

import GameStage from './components/GameStage';
import UIOverlay from './components/UIOverlay';
import TouchArea from './components/TouchArea';
import HighScoreManager from './components/HighScoreManager';

import bgmSound from './assets/sounds/wakashachi_long.mp3';

function App() {
  const {
    started,
    setStarted,
    isJumping,
    startJump,
    gameOver,
    restartGame,
    addIngredient,
  } = useGameStore();

  // BGM（Howler.js を利用）
  const { playSound: playBGM, stopSound: stopBGM } = useAudio(bgmSound, 0.5, true);

  // -----------------------------
  // キーボード操作
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (!started) {
          setStarted(true);
          playBGM();
        } else if (!gameOver && !isJumping) {
          startJump();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, gameOver, isJumping, setStarted, playBGM, startJump]);

  // -----------------------------
  // タップ/クリック操作
  // -----------------------------
  const onJump = () => {
    if (!started) {
      setStarted(true);
      playBGM();
    } else if (!gameOver && !isJumping) {
      startJump();
    }
  };

  // -----------------------------
  // 具材生成（3段：0.5段／1段／3段）
  // -----------------------------
  const spawnIngredient = () => {
    const items = ['negi', 'niku', 'abura', 'kamaboko'];
    const rItem = Math.floor(Math.random() * items.length);
    const type = items[rItem];

    // 下段(0.5段)=y=320, 中段(1段)=y=300, 上段(3段)=y=200
    const tiers = [
      { tier: 1, y: 320 },
      { tier: 2, y: 300 },
      { tier: 3, y: 200 },
    ];
    const rTier = Math.floor(Math.random() * 3);
    const { tier, y } = tiers[rTier];

    addIngredient({
      id: Date.now(),
      type,
      tier,
      x: window.innerWidth + 60,
      y,
    });
  };

  // -----------------------------
  // 一定間隔で具材生成
  // -----------------------------
  const spawnIntervalRef = useRef(null);
  useEffect(() => {
    if (!started || gameOver) {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      return;
    }
    spawnIntervalRef.current = setInterval(() => {
      spawnIngredient();
    }, 1200); // 1.2秒ごとに生成

    return () => clearInterval(spawnIntervalRef.current);
  }, [started, gameOver]);

  // -----------------------------
  // ゲームオーバー時 BGM停止
  // -----------------------------
  useEffect(() => {
    if (gameOver) {
      stopBGM();
    }
  }, [gameOver, stopBGM]);

  // -----------------------------
  // リスタート処理
  // -----------------------------
  const handleRestart = () => {
    restartGame();
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <HighScoreManager />

      {/* メインゲームステージ */}
      <GameStage />

      {/* UIオーバーレイ */}
      <UIOverlay />

      {/* タッチ操作 */}
      <TouchArea onJump={onJump} />

      {/* AnimatePresence を使ってオーバーレイ表示 */}
      <AnimatePresence>
        {!started && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={styles.infoBox}>
              <p style={styles.message}>スペース or 画面下タップでスタート</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.button
              style={styles.restartBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRestart}
            >
              もう一度あそぶ
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  infoBox: {
    color: '#fff',
  },
  message: {
    fontSize: '24px',
    margin: 0,
  },
  restartBtn: {
    padding: '20px 40px',
    fontSize: '20px',
    backgroundColor: '#ff6600',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default App;
