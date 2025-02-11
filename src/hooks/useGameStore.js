// src/hooks/useGameStore.js
import { create } from "zustand";

const useGameStore = create((set) => ({
  started: false,
  gameOver: false,
  score: 0,
  currentIngredientIndex: 0,
  mistakeCount: 0,
  maxMistakes: 3, // ふつう
  difficulty: "ふつう", // 難易度選択機能は今回は不要

  // PC版（横画面基準）：フィールドサイズは 1280×720、地面は y = 280
  characterX: 100,
  characterY: 280,
  isJumping: false,
  velocityY: 0,
  gravity: 1.2,
  jumpVelocity: -18,

  ingredientList: [],
  highScore: 0,

  setStarted: (val) => set({ started: val }),
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
      jumpVelocity: -18,
      ingredientList: [],
    }),

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
      const isGameOver = newCount >= state.maxMistakes;
      return { mistakeCount: newCount, gameOver: isGameOver };
    }),
  resetMistakes: () => set({ mistakeCount: 0, gameOver: false }),
  setHighScore: (val) => set({ highScore: val }),

  startJump: () =>
    set((state) => {
      if (!state.isJumping) {
        return {
          isJumping: true,
          velocityY: state.jumpVelocity,
          characterY: state.characterY + state.jumpVelocity,
        };
      }
      return {};
    }),

  updateCharacter: () =>
    set((state) => {
      let newVy = state.velocityY + state.gravity;
      let newY = state.characterY + newVy;
      if (newY >= 280) {
        // キャラが地面にいる場合、状態が変わらなければそのまま返す
        if (state.characterY === 280 && state.velocityY === 0 && !state.isJumping) {
          return state;
        }
        newY = 280;
        newVy = 0;
        return { characterY: newY, velocityY: newVy, isJumping: false };
      }
      if (state.characterY === newY && state.velocityY === newVy) {
        return state;
      }
      return { characterY: newY, velocityY: newVy };
    }),

  addIngredient: (ing) =>
    set((state) => ({
      ingredientList: [...state.ingredientList, ing],
    })),
  removeIngredient: (id) =>
    set((state) => ({
      ingredientList: state.ingredientList.filter((item) => item.id !== id),
    })),
}));

export default useGameStore;
