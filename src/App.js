// src/App.js
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from './hooks/useGameStore';
import useAudio from './hooks/useAudio';

import GameStage from './components/GameStage';
import UIOverlay from './components/UIOverlay';
import TouchArea from './components/TouchArea';
import HighScoreManager from './components/HighScoreManager';

import bgmSound from './assets/sounds/wakashachi_long.mp3';

// ウィンドウサイズを動的に取得するフック
function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return dimensions;
}

function App() {
  const dimensions = useWindowDimensions();
  // 固定のフィールドサイズ（PC版基準）：1280×720
  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 720;

  // 「cover」方式でスケール係数を計算（ウィンドウ全体を埋めるために、大きい方を採用）
  const scaleFactor = Math.max(dimensions.width / BASE_WIDTH, dimensions.height / BASE_HEIGHT);
  const scaledWidth = BASE_WIDTH * scaleFactor;
  const scaledHeight = BASE_HEIGHT * scaleFactor;
  // 画面全体にフィールドが埋まるように中央配置するためのオフセット
  const offsetLeft = (dimensions.width - scaledWidth) / 2;
  const offsetTop = (dimensions.height - scaledHeight) / 2;
  // 上部が見切れるので、さらに下に移動させるための追加オフセットを設定（ここを40pxに変更）
  const extraTopOffset = 40; // 以前は30pxだったが、ここで少し下に持っていくため40pxに変更
  const offsetTopAdjusted = offsetTop + extraTopOffset;

  // 固定サイズコンテナ（フィールド）を、スケールして配置するスタイル
  const containerStyle = {
    width: `${BASE_WIDTH}px`,
    height: `${BASE_HEIGHT}px`,
    position: 'absolute',
    top: 0,
    left: 0,
    transform: `translate(${offsetLeft}px, ${offsetTopAdjusted}px) scale(${scaleFactor})`,
    transformOrigin: 'top left',
  };

  const {
    started,
    setStarted,
    isJumping,
    startJump,
    gameOver,
    restartGame,
    addIngredient,
    addScore, // debug用
  } = useGameStore();

  const { playSound: playBGM, stopSound: stopBGM } = useAudio(bgmSound, 0.5, true);

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

  useEffect(() => {
    const keysPressed = {};
    const handleKeyDown = (e) => {
      keysPressed[e.key.toLowerCase()] = true;
      if (keysPressed['i'] && keysPressed['o'] && keysPressed['p']) {
        for (let j = 0; j < 10; j++) {
          addScore();
        }
      }
    };
    const handleKeyUp = (e) => {
      delete keysPressed[e.key.toLowerCase()];
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [addScore]);

  const onJump = () => {
    if (!started) {
      setStarted(true);
      playBGM();
    } else if (!gameOver && !isJumping) {
      startJump();
    }
  };

  const spawnIngredient = () => {
    const items = ['negi', 'niku', 'abura', 'kamaboko'];
    const rItem = Math.floor(Math.random() * items.length);
    const type = items[rItem];

    // 4段編成：
    // Tier1: y = 300  (通常、地上で取れる)
    // Tier2: y = 310  ← もしジャンプしなければ、確実に触れてしまう位置
    // Tier3: y = 220
    // Tier4: y = 180
    const tiers = [
      { tier: 1, y: 300 },
      { tier: 2, y: 310 },
      { tier: 3, y: 220 },
      { tier: 4, y: 180 },
    ];
    const rTier = Math.floor(Math.random() * tiers.length);
    const { tier, y } = tiers[rTier];
    const randomXOffset = Math.floor(Math.random() * 60) + 60;
    addIngredient({
      id: Date.now(),
      type,
      tier,
      x: window.innerWidth + randomXOffset,
      y,
    });
  };

  useEffect(() => {
    let timeoutId;
    const scheduleNextIngredient = () => {
      const delay = Math.floor(Math.random() * 500) + 1000;
      timeoutId = setTimeout(() => {
        spawnIngredient();
        scheduleNextIngredient();
      }, delay);
    };
    if (started && !gameOver) {
      scheduleNextIngredient();
    }
    return () => clearTimeout(timeoutId);
  }, [started, gameOver]);

  useEffect(() => {
    if (gameOver) {
      stopBGM();
    }
  }, [gameOver, stopBGM]);

  const handleRestart = () => {
    restartGame();
  };

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: 'black',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <div style={containerStyle}>
        <HighScoreManager />
        <GameStage />
        <UIOverlay />
        <TouchArea onJump={onJump} />
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
