// src/components/GameStage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Circle } from 'react-konva';
import useImage from 'use-image';
import useGameStore from '../hooks/useGameStore';
import useAudio from '../hooks/useAudio';

// 効果音
import missSE from '../assets/sounds/Miss.ogg';
import crossbowSE from '../assets/sounds/Crossbow.ogg';

const GameStage = () => {
  const {
    started,
    gameOver,
    characterX,
    characterY,
    updateCharacter,
    ingredientList,
    removeIngredient,
    currentIngredientIndex,
    incrementIngredientIndex,
    addScore,
    resetCurrentIngredientIndex,
    incrementMistake,
    isJumping,
    score,
  } = useGameStore();

  // 画像読み込み
  const [hitoImg] = useImage('/hito.png');
  const [negiImg] = useImage('/negi.png');
  const [nikuImg] = useImage('/niku.png');
  const [aburaImg] = useImage('/aburaage.png');
  const [kamabokoImg] = useImage('/kamaboko.png');
  const [jimenImg] = useImage('/jimen.jpg');

  // 効果音
  const { playSound: playMiss } = useAudio(missSE);
  const { playSound: playCrossbow } = useAudio(crossbowSE);

  // 具材の種類（4種類）
  const orderTypes = ['negi', 'niku', 'abura', 'kamaboko'];

  // 背景スクロール用
  const [bgOffset, setBgOffset] = useState(0);

  // パーティクルエフェクト用の状態
  const [particles, setParticles] = useState([]);
  // 各パーティクルは { id, x, y, radius, opacity }

  // requestAnimationFrame 管理
  const reqRef = useRef(null);

  // 具材の表示サイズと衝突判定用オフセット設定
  const ingredientSize = 55; // 具材画像は55×55に拡大
  const ingredientCenterOffsetX = ingredientSize / 2 + 5; // (27.5 + 5 = 32.5)
  const ingredientCenterOffsetY = ingredientSize / 2;       // 27.5
  const visualOffsetX = -5; // 具材画像の描画位置を左に5pxずらす

  // 固定のステージサイズ（PC版用）：1280×720
  const stageWidth = 1280;
  const stageHeight = 720;

  // メインループ
  useEffect(() => {
    if (!started || gameOver) {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }
    const animate = () => {
      updateCharacter();
      // 具材移動速度：基本速度3を1点ごとに2%アップ
      const currentSpeed = 3 * (1 + 0.02 * score);
      const collisions = [];
      ingredientList.forEach((ing) => {
        ing.x -= currentSpeed;
        if (checkCollision(ing)) {
          collisions.push(ing.id);
          const collX = ing.x + 20;
          const collY = ing.y + 20;
          addParticle(collX, collY);
        } else if (ing.x < -80) {
          collisions.push(ing.id);
        }
      });
      collisions.forEach((id) => removeIngredient(id));
      updateParticles();
      setBgOffset((prev) => prev - 1);
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [started, gameOver, ingredientList, updateCharacter, removeIngredient, score]);

  // キャラクター表示用パラメータ
  const baseCharSize = 100;
  const characterScale = isJumping ? 1.1 : 1.0;
  const scaledCharSize = baseCharSize * characterScale;
  const charOffset = (scaledCharSize - baseCharSize) / 2;

  // 衝突判定関数（修正済み）
  const checkCollision = (ing) => {
    const scaleFactor = 0.9;
    // キャラクターの中心（固定位置）
    const currentCharCenterX = characterX + 50;
    const currentCharCenterY = characterY + 50;
    // 具材の中心位置（判定用）
    const ingCX = ing.x + ingredientCenterOffsetX;
    const ingCY = ing.y + ingredientCenterOffsetY;
    let rx, ry;
    if (ing.tier === 1) {
      // Tier1: 小さめの当たり判定で回避しやすくする
      rx = 8 * scaleFactor;
      ry = (8 * 1.5) * scaleFactor;
    } else if (ing.tier === 2) {
      if (isJumping) {
        // ジャンプ中なら小さめにして、着地時の衝突を避ける
        rx = 8 * scaleFactor;
        ry = (8 * 1.5) * scaleFactor;
      } else {
        // 地上では、あまり大きすぎないサイズに調整
        rx = 10 * scaleFactor;
        ry = (10 * 1.5) * scaleFactor;
      }
    } else if (ing.tier === 3 || ing.tier === 4) {
      // Tier3,4 はそのまま大きめ
      rx = 15 * scaleFactor * 1.8;
      ry = (15 * 1.5) * scaleFactor * 1.8;
    }
    const dx = currentCharCenterX - ingCX;
    const dy = currentCharCenterY - ingCY;
    if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
      const needed = orderTypes[currentIngredientIndex];
      if (ing.type === needed) {
        if (currentIngredientIndex === orderTypes.length - 1) {
          addScore();
          playCrossbow();
          resetCurrentIngredientIndex();
        } else {
          incrementIngredientIndex();
        }
      } else {
        incrementMistake();
        playMiss();
      }
      return true;
    }
    return false;
  };

  // パーティクルの追加・更新
  const addParticle = (x, y) => {
    const id = Date.now();
    const newParticle = { id, x, y, radius: 10, opacity: 1.0 };
    setParticles((prev) => [...prev, newParticle]);
  };

  const updateParticles = () => {
    setParticles((prevParticles) =>
      prevParticles
        .map((p) => ({
          ...p,
          radius: p.radius + 0.5,
          opacity: p.opacity - 0.03,
        }))
        .filter((p) => p.opacity > 0)
    );
  };

  return (
    <Stage width={stageWidth} height={stageHeight}>
      {/* 背景レイヤー */}
      <Layer>
        <Rect
          x={0}
          y={0}
          width={stageWidth}
          height={stageHeight}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: stageHeight }}
          fillLinearGradientColorStops={[0, '#7ddff8', 1, '#fffceb']}
        />
      </Layer>
      {/* 地面レイヤー */}
      <Layer>
        {jimenImg && (
          <KonvaImage
            image={jimenImg}
            x={bgOffset % stageWidth}
            y={380}
            width={stageWidth}
            height={stageHeight - 380}
          />
        )}
        {jimenImg && (
          <KonvaImage
            image={jimenImg}
            x={(bgOffset % stageWidth) + stageWidth}
            y={380}
            width={stageWidth}
            height={stageHeight - 380}
          />
        )}
      </Layer>
      {/* キャラクター＆具材レイヤー */}
      <Layer>
        {hitoImg && (
          <KonvaImage
            image={hitoImg}
            x={characterX - charOffset}
            y={characterY - charOffset}
            width={scaledCharSize}
            height={scaledCharSize}
          />
        )}
        {ingredientList.map((ing) => {
          let ingImage = negiImg;
          if (ing.type === 'niku') ingImage = nikuImg;
          if (ing.type === 'abura') ingImage = aburaImg;
          if (ing.type === 'kamaboko') ingImage = kamabokoImg;
          return (
            <KonvaImage
              key={ing.id}
              image={ingImage}
              x={ing.x + visualOffsetX}
              y={ing.y}
              width={ingredientSize}
              height={ingredientSize}
            />
          );
        })}
      </Layer>
      {/* パーティクルエフェクトレイヤー */}
      <Layer>
        {particles.map((p) => (
          <Circle
            key={p.id}
            x={p.x}
            y={p.y}
            radius={p.radius}
            fill="yellow"
            opacity={p.opacity}
            listening={false}
          />
        ))}
      </Layer>
      {/* 右上：次に拾う具材表示 */}
      <Layer>
        <Rect
          x={stageWidth - 280}
          y={10}
          width={200}
          height={50}
          fill="rgba(255,255,255,0.7)"
          cornerRadius={10}
          listening={false}
        />
        <Text
          text="次に拾う具材:"
          x={stageWidth - 270}
          y={20}
          fontSize={18}
          fill="#000"
        />
        {orderTypes[currentIngredientIndex] === 'negi' && (
          <KonvaImage
            image={negiImg}
            x={stageWidth - 90}
            y={15}
            width={40}
            height={40}
          />
        )}
        {orderTypes[currentIngredientIndex] === 'niku' && (
          <KonvaImage
            image={nikuImg}
            x={stageWidth - 90}
            y={15}
            width={40}
            height={40}
          />
        )}
        {orderTypes[currentIngredientIndex] === 'abura' && (
          <KonvaImage
            image={aburaImg}
            x={stageWidth - 90}
            y={15}
            width={40}
            height={40}
          />
        )}
        {orderTypes[currentIngredientIndex] === 'kamaboko' && (
          <KonvaImage
            image={kamabokoImg}
            x={stageWidth - 90}
            y={15}
            width={40}
            height={40}
          />
        )}
      </Layer>
    </Stage>
  );
};

export default GameStage;
