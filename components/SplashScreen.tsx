import React, { useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { GameStatus } from '../types';

export default function SplashScreen() {
  const setGameStatus = useGameStore((state) => state.actions.setGameStatus);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGameStatus(GameStatus.LOBBY);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [setGameStatus]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center bg-black text-white">
      <h1 className="text-5xl md:text-7xl font-bold animate-pulse">3D FPS SHOOTER</h1>
      <p className="text-lg mt-4">Powered by Three.js</p>
    </div>
  );
}
