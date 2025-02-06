import React from 'react';
import { useDrag } from 'react-use-gesture';

const TouchArea = ({ onJump }) => {
  const bind = useDrag((state) => {
    if (state.tap) {
      onJump();
    }
  });

  return (
    <div
      {...bind()}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '120px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto',
        touchAction: 'none', // タッチ時のズームや拡大を無効化
      }}
      onTouchStart={(e) => e.preventDefault()} // デフォルトのタッチ挙動を抑止
    >
      <p style={{ color: '#fff', fontSize: '18px', margin: 0 }}>タップでジャンプ</p>
    </div>
  );
};

export default TouchArea;
