import React from 'react';
import { useGameStore } from '../hooks/useGameStore';

export default function LobbyScreen() {
  const initGame = useGameStore((state) => state.actions.initGame);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center bg-gray-900 text-white p-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-2">ARENA SHOOTER</h1>
        <p className="text-md md:text-lg text-gray-300 mb-8">Eliminate all soldiers to win.</p>
        <button
          className="px-8 py-4 bg-green-600 rounded-lg text-white text-2xl font-bold hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg"
          onClick={() => initGame(5, 3)} // Start with 5 enemies, 3 health packs
        >
          Play Game
        </button>
      </div>
      <div className="absolute bottom-4 text-gray-500 text-sm">
        <p>Controls:</p>
        <p>Left virtual stick to move. Right side of screen to aim. Button to shoot.</p>
      </div>
    </div>
  );
}
