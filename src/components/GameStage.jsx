// src/components/GameStage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Circle, Ellipse } from 'react-konva';
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

  // 正しい具材順
  const orderTypes = ['negi', 'niku', 'abura', 'kamaboko'];

  // 背景スクロール用
  const [bgOffset, setBgOffset] = useState(0);

  // パーティクルエフェクト用の状態
  const [particles, setParticles] = useState([]);
  // 各パーティクルは { id, x, y, radius, opacity }

  // requestAnimationFrame 管理
  const reqRef = useRef(null);

  // ★ 修正ポイント ★
  // 従来の円形当たり判定（CHAR_RADIUS, ING_RADIUS）は使わず、楕円形に変更するためのパラメータ
  const CHAR_RX = 15;         // 横方向の半径（従来のCHAR_RADIUS相当）
  const CHAR_RY = 15 * 1.5;     // 縦方向の半径を1.5倍に伸ばす
  const collisionShiftY = 5;    // 衝突判定の中心を下に5pxずらす

  // ============================
  // メインループ
  // ============================
  useEffect(() => {
    if (!started || gameOver) {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }

    const animate = () => {
      // キャラクターの物理更新
      updateCharacter();

      // 具材の移動＆衝突判定
      const collisions = [];
      ingredientList.forEach((ing) => {
        // 具材を左へ移動
        ing.x -= 3;

        if (checkCollision(ing)) {
          collisions.push(ing.id);
          // 衝突位置でパーティクル効果を発生
          const collX = ing.x + 20;
          const collY = ing.y + 20;
          addParticle(collX, collY);
        } else if (ing.x < -80) {
          collisions.push(ing.id);
        }
      });

      collisions.forEach((id) => removeIngredient(id));

      // パーティクルのアニメーション更新
      updateParticles();

      // 背景スクロール
      setBgOffset((prev) => prev - 1);

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [started, gameOver, ingredientList, updateCharacter, removeIngredient]);

  // キャラクターにジャンプ時スケール効果（ジャンプ中は1.1倍に拡大）
  const characterScale = isJumping ? 1.1 : 1.0;
  const baseCharSize = 100;
  const scaledCharSize = baseCharSize * characterScale;
  const charOffset = (scaledCharSize - baseCharSize) / 2;

  // 衝突判定のためのキャラクターの中心位置（楕円の中心）
  const charCenterX = characterX + 50;
  const charCenterY = characterY + 50 + collisionShiftY;

  // ============================
  // パーティクルの追加・更新
  // ============================
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

  // ============================
  // 衝突判定
  // ============================
  const checkCollision = (ing) => {
    /**
     * tier=1 (下段=0.5段) or tier=2 (中段=1段)
     *   → ジャンプ中なら衝突せず飛び越える
     * tier=3 (上段=3段)
     *   → 地上なら衝突せずすり抜ける
     */
    if ((ing.tier === 1 || ing.tier === 2) && isJumping) {
      return false;
    }
    if (ing.tier === 3 && !isJumping) {
      return false;
    }

    // 楕円形衝突判定
    const ingCX = ing.x + 20;
    const ingCY = ing.y + 20;
    const dx = charCenterX - ingCX;
    const dy = charCenterY - ingCY;
    // 楕円の方程式: (dx^2)/(rx^2) + (dy^2)/(ry^2) <= 1
    if ((dx * dx) / (CHAR_RX * CHAR_RX) + (dy * dy) / (CHAR_RY * CHAR_RY) <= 1) {
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

  // ============================
  // レンダリング
  // ============================
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

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
        {/* キャラクター（ジャンプ時は拡大表示） */}
        {hitoImg && (
          <KonvaImage
            image={hitoImg}
            x={characterX - charOffset}
            y={characterY - charOffset}
            width={scaledCharSize}
            height={scaledCharSize}
          />
        )}
        {/* 具材 */}
        {ingredientList.map((ing) => {
          let ingImage = negiImg;
          if (ing.type === 'niku') ingImage = nikuImg;
          if (ing.type === 'abura') ingImage = aburaImg;
          if (ing.type === 'kamaboko') ingImage = kamabokoImg;
          return (
            <KonvaImage
              key={ing.id}
              image={ingImage}
              x={ing.x}
              y={ing.y}
              width={40}
              height={40}
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

      {/* デバッグ用：当たり判定楕円 */}
      <Layer>
        <Ellipse
          x={charCenterX}
          y={charCenterY}
          radiusX={CHAR_RX}
          radiusY={CHAR_RY}
          fill="rgba(128, 0, 128, 0.3)"
          listening={false}
        />
        {ingredientList.map((ing) => (
          <Circle
            key={`col-${ing.id}`}
            x={ing.x + 20}
            y={ing.y + 20}
            radius={7} // こちらはそのまま小さく
            fill="rgba(128, 0, 128, 0.3)"
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
