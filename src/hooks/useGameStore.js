// src/hooks/useGameStore.js
import { create } from 'zustand';

const useGameStore = create((set) => ({
  // --- ゲームステート ---
  started: false,           // ゲームが始まっていないと動かない
  score: 0,
  highScore: 0,
  currentIngredientIndex: 0, 
  mistakeCount: 0,
  gameOver: false,

  // --- キャラクター物理 ---
  characterX: 100,    // Dinoっぽく少し右に
  characterY: 280,    // 地面の高さに合わせて
  isJumping: false,
  velocityY: 0,
  gravity: 1.2,       // 重力を増加
  jumpVelocity: -18,  // ジャンプ初速を元に戻す（以前の設定 -18）

  // --- 具材 ---
  ingredientList: [],

  // --- スタートフラグ ---
  setStarted: (val) => set({ started: val }),

  // --- スコアやミスの操作 ---
  addScore: () => set((state) => ({ score: state.score + 1 })),
  resetScore: () => set({ score: 0 }),
  incrementIngredientIndex: () =>
    set((state) => ({
      currentIngredientIndex: (state.currentIngredientIndex + 1) % 4,
    })),
  resetCurrentIngredientIndex: () => set({ currentIngredientIndex: 0 }),
  incrementMistake: () =>
    set((state) => {
      const newCount = state.mistakeCount + 1;
      const isGameOver = newCount >= 3;
      return { mistakeCount: newCount, gameOver: isGameOver };
    }),
  resetMistakes: () => set({ mistakeCount: 0, gameOver: false }),
  setHighScore: (val) => set({ highScore: val }),

  // --- ジャンプ開始 ---
  startJump: () =>
    set((state) => {
      if (!state.isJumping) {
        // ジャンプ開始時にキャラクターの位置を即座に更新する処理はそのまま
        return {
          isJumping: true,
          velocityY: state.jumpVelocity,
          characterY: state.characterY + state.jumpVelocity,
        };
      }
      return {};
    }),

  // --- キャラクターの更新 ---
  updateCharacter: () =>
    set((state) => {
      let newVy = state.velocityY + state.gravity;
      let newY = state.characterY + newVy;
      // 地面に衝突
      if (newY >= 280) {
        newY = 280;
        newVy = 0;
        return {
          characterY: newY,
          velocityY: newVy,
          isJumping: false,
        };
      }
      return {
        characterY: newY,
        velocityY: newVy,
      };
    }),

  // --- 具材の操作 ---
  addIngredient: (ing) =>
    set((state) => ({
      ingredientList: [...state.ingredientList, ing],
    })),
  removeIngredient: (id) =>
    set((state) => ({
      ingredientList: state.ingredientList.filter((item) => item.id !== id),
    })),

  // --- ゲームのリスタート ---
  restartGame: () =>
    set({
      started: false,
      score: 0,
      mistakeCount: 0,
      gameOver: false,
      currentIngredientIndex: 0,
      characterX: 100,
      characterY: 280,
      isJumping: false,
      velocityY: 0,
      gravity: 1.2,
      ingredientList: [],
    }),
}));

export default useGameStore;
