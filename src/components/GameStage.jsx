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
  const reqRef = useRef(null);

  // 表示サイズ & オフセット
  const ingredientSize = 55;
  const ingredientCenterOffsetX = ingredientSize / 2 + 5; 
  const ingredientCenterOffsetY = ingredientSize / 2;
  const visualOffsetX = -5; 

  // 1・2段目は右にずらす量
  // 3・4段目は 0 (ずらさない)
  const collisionShiftRight1_2 = 10;
  const collisionShift3_4 = 0;

  // 固定のステージサイズ
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

      // 具材移動速度：基本3+スコアごとに2%UP
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

  // キャラ表示
  const baseCharSize = 100;
  const characterScale = isJumping ? 1.1 : 1.0;
  const scaledCharSize = baseCharSize * characterScale;
  const charOffset = (scaledCharSize - baseCharSize) / 2;

  // 衝突判定
  const checkCollision = (ing) => {
    const scaleFactor = 0.9;
    const currentCharCenterX = characterX + 50;
    const currentCharCenterY = characterY + 50;

    // 具材の中心Xを段に応じてずらす
    let ingCX = 0;
    if (ing.tier === 1 || ing.tier === 2) {
      ingCX = ing.x + ingredientCenterOffsetX + collisionShiftRight1_2;
    } else {
      ingCX = ing.x + ingredientCenterOffsetX + collisionShift3_4;
    }
    const ingCY = ing.y + ingredientCenterOffsetY;

    let rx = 0;
    let ry = 0;

    if (ing.tier === 1) {
      // 1段目: 小さめ
      rx = 4 * scaleFactor;
      ry = 6 * scaleFactor;
    } else if (ing.tier === 2) {
      // 2段目
      if (isJumping) {
        rx = 7 * scaleFactor;
        ry = 7 * 1.5 * scaleFactor;
      } else {
        rx = 9 * scaleFactor;
        ry = 9 * 1.5 * scaleFactor;
      }
    } else if (ing.tier === 3) {
      // 3段目を大きく
      rx = 24 * scaleFactor * 2.0; 
      ry = (24 * 1.5) * scaleFactor * 2.0;
    } else if (ing.tier === 4) {
      // 4段目
      rx = 20 * scaleFactor * 2.0;
      ry = (20 * 1.5) * scaleFactor * 2.0;
    }

    // 楕円形衝突判定
    const dx = currentCharCenterX - ingCX;
    const dy = currentCharCenterY - ingCY;
    const ellipseCollision = ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)) <= 1;

    // ★ 2段目用の薄い壁判定を修正
    // 具材の中央から地面に向けて、細い壁の当たり判定を設置
    let underWallHit = false;
    if (ing.tier === 2) {
      const wallWidth = 20;  // 薄い壁の横幅（細い壁）
      const wallHeight = 30; // 薄い壁の高さ
      const wallX1 = ing.x + ingredientCenterOffsetX - wallWidth / 2;
      const wallX2 = ing.x + ingredientCenterOffsetX + wallWidth / 2;
      const wallY1 = ing.y + ingredientCenterOffsetY;
      const wallY2 = wallY1 + wallHeight;
      if (
        currentCharCenterX >= wallX1 &&
        currentCharCenterX <= wallX2 &&
        currentCharCenterY >= wallY1 &&
        currentCharCenterY <= wallY2
      ) {
        underWallHit = true;
      }
    }

    if (ellipseCollision || underWallHit) {
      // 具材が必要か判定
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

  // パーティクル
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
        {/* キャラクター */}
        {hitoImg && (
          <KonvaImage
            image={hitoImg}
            x={characterX - charOffset}
            y={characterY - charOffset}
            width={scaledCharSize}
            height={scaledCharSize}
          />
        )}
        {/* 具材リスト */}
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
        {/* 必要な具材アイコン */}
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
