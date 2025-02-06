import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../hooks/useGameStore';
import useImage from 'use-image';

function UIOverlay() {
  const { score, mistakeCount, highScore, gameOver } = useGameStore();
  const [lifeImg] = useImage('/hito.png');

  // スマホ対応：画面サイズを動的に取得して、縦横を判定
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () => setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isPortrait = dimensions.width < dimensions.height;

  const styles = {
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      pointerEvents: 'none',
      zIndex: 10,
    },
    // スコアは左上に配置
    score: {
      position: 'absolute',
      top: isPortrait ? '10px' : '10px',
      left: '10px',
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#000',
      backgroundColor: 'rgba(255,255,255,0.5)',
      padding: '4px 8px',
      borderRadius: '8px',
    },
    // ハイスコアは右上に配置（縦画面なら右上、横画面なら中央上に表示）
    highScore: {
      position: 'absolute',
      top: isPortrait ? '10px' : '10px',
      right: isPortrait ? '10px' : '50%',
      transform: isPortrait ? 'none' : 'translateX(-50%)',
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ff0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: '4px 8px',
      borderRadius: '8px',
    },
    // ミス表示
    mistake: {
      position: 'absolute',
      top: isPortrait ? '50px' : '50px',
      left: '10px',
      fontSize: '18px',
      color: 'red',
      backgroundColor: 'rgba(255,255,255,0.7)',
      padding: '2px 6px',
      borderRadius: '6px',
    },
    // ライフアイコン
    lifeContainer: {
      position: 'absolute',
      top: isPortrait ? '85px' : '85px',
      left: '10px',
      display: 'flex',
      flexDirection: 'row',
    },
    // 取得済みアイテム表示
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
    // GAME OVER 表示
    gameOver: {
      position: 'absolute',
      top: isPortrait ? '40%' : '45%',
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

  const lifeCount = 3 - mistakeCount;

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={styles.score}
      >
        スコア: {score}
      </motion.div>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={styles.highScore}
      >
        ハイスコア: {highScore}
      </motion.div>
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={styles.mistake}
      >
        ミス: {mistakeCount}/3
      </motion.div>
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
}

export default UIOverlay;
