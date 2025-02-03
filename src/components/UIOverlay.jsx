// src/components/UIOverlay.jsx
import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../hooks/useGameStore';
import useImage from 'use-image';

const UIOverlay = () => {
  const { score, mistakeCount, highScore, gameOver } = useGameStore();

  const lifeCount = 3 - mistakeCount;
  // ライフ表示用の画像（hito.png）
  const [lifeImg] = useImage('/hito.png');

  return (
    <div style={styles.container}>
      {/* スコア表示 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.score}
      >
        スコア: {score}
      </motion.div>

      {/* ハイスコア表示 */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={styles.highScore}
      >
        ハイスコア: {highScore}
      </motion.div>

      {/* ミス数 */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={styles.mistake}
      >
        ミス: {mistakeCount}/3
      </motion.div>

      {/* ライフアイコン表示 */}
      <div style={styles.lifeContainer}>
        {[...Array(lifeCount)].map((_, i) => (
          <img
            key={i}
            src="/hito.png"
            alt="life"
            style={{ width: 40, height: 40, marginRight: 5 }}
          />
        ))}
      </div>

      {/* 右下に取得済みアイテム（hitp.png）をアニメーション表示 */}
      <div style={styles.hitpContainer}>
        {[...Array(score)].map((_, idx) => (
          <motion.img
            key={idx}
            src="/hitp.png"
            alt="hitp"
            style={styles.hitp}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          />
        ))}
      </div>

      {/* GAME OVER 表示 */}
      {gameOver && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={styles.gameOver}
        >
          GAME OVER
        </motion.div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    pointerEvents: 'none',
    zIndex: 10,
  },
  score: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  highScore: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ff0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  mistake: {
    position: 'absolute',
    top: '50px',
    left: '10px',
    fontSize: '18px',
    color: 'red',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  lifeContainer: {
    position: 'absolute',
    top: '85px',
    left: '10px',
    display: 'flex',
    flexDirection: 'row',
  },
  hitpContainer: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'row',
  },
  hitp: {
    width: '50px',
    height: '50px',
    marginLeft: '5px',
  },
  gameOver: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'red',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '20px',
    borderRadius: '12px',
  },
};

export default UIOverlay;
