import React, { useRef, useState, TouchEvent } from 'react';
import { useGameStore } from '../hooks/useGameStore';

// Joystick Component
const Joystick = () => {
  const setMovement = useGameStore((state) => state.actions.setMovement);
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !baseRef.current || !stickRef.current) return;
    const touch = e.touches[0];
    const baseRect = baseRef.current.getBoundingClientRect();
    const touchX = touch.clientX - baseRect.left - baseRect.width / 2;
    const touchY = touch.clientY - baseRect.top - baseRect.height / 2;
    
    const distance = Math.min(baseRect.width / 2, Math.sqrt(touchX * touchX + touchY * touchY));
    const angle = Math.atan2(touchY, touchX);

    const x = distance * Math.cos(angle);
    const y = distance * Math.sin(angle);
    
    stickRef.current.style.transform = `translate(${x}px, ${y}px)`;

    const forward = y < -10;
    const backward = y > 10;
    const right = x > 10;
    const left = x < -10;
    setMovement({ forward, backward, left, right });
  };
  
  const handleTouchEnd = () => {
    if (!stickRef.current) return;
    setIsDragging(false);
    stickRef.current.style.transform = `translate(0px, 0px)`;
    setMovement({ forward: false, backward: false, left: false, right: false });
  };

  return (
    <div
      ref={baseRef}
      className="absolute bottom-8 left-8 w-32 h-32 bg-gray-500/50 rounded-full flex justify-center items-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={stickRef}
        className="w-16 h-16 bg-gray-400/70 rounded-full transition-transform"
      ></div>
    </div>
  );
};

// Main UI Component
export default function GameUI(): React.ReactElement {
  const { ammo, isReloading, actions, enemies, gameStarted, player, gameOver } = useGameStore((state) => ({
    ammo: state.ammo,
    isReloading: state.isReloading,
    actions: state.actions,
    enemies: state.enemies,
    gameStarted: state.gameStarted,
    player: state.player,
    gameOver: state.gameOver,
  }));
  const aimRef = useRef<HTMLDivElement>(null);

  const isGameWon = gameStarted && enemies.length === 0;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Aiming area */}
      <div ref={aimRef} className="absolute top-0 right-0 w-1/2 h-full" />
      
      {/* Controls */}
      {!gameOver && !isGameWon && (
         <div className="absolute bottom-0 left-0 w-full h-full pointer-events-auto">
            <Joystick />
            
            <div className="absolute bottom-8 right-8 flex flex-col items-center gap-4">
            <button
                className="w-24 h-24 bg-red-600/70 rounded-full text-white font-bold text-xl active:bg-red-800/70 select-none"
                onTouchStart={(e) => { e.preventDefault(); actions.startFiring(); }}
                onTouchEnd={(e) => { e.preventDefault(); actions.stopFiring(); }}
                onContextMenu={(e) => e.preventDefault()}
            >
                SHOOT
            </button>
            </div>
        </div>
      )}
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white text-2xl font-mono bg-black/50 p-2 rounded select-none">
        <span>Enemies: {enemies.length}</span>
      </div>
      
      <div className="absolute top-4 right-4 text-white text-2xl font-mono bg-black/50 p-2 rounded select-none">
        <span>{isReloading ? 'RELOADING' : `${ammo.clip} / ${ammo.total}`}</span>
        {!isGameWon && !gameOver && (
            <button
            className="ml-4 px-3 py-1 bg-blue-600/70 rounded text-lg active:bg-blue-800/70 pointer-events-auto"
            onClick={actions.reload}
            >
            Reload
            </button>
        )}
      </div>

      {/* Player Health Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-gray-800/75 border-2 border-gray-400/75 rounded-lg overflow-hidden">
        <div 
          className="h-full bg-red-500 transition-all duration-300 ease-out"
          style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
        ></div>
        <span className="absolute inset-0 text-white text-center font-bold">{player.health} / {player.maxHealth}</span>
      </div>


      {/* Crosshair */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white/50 rounded-full"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-white/50 rounded-full"></div>

      {/* Win Screen */}
      {isGameWon && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/75 flex flex-col justify-center items-center pointer-events-auto z-10">
          <h1 className="text-6xl font-bold text-green-400 mb-4 animate-pulse">YOU WIN!</h1>
          <p className="text-white text-xl mb-8">You have eliminated all enemies.</p>
          <button
            className="px-6 py-3 bg-blue-600 rounded text-white text-2xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors"
            onClick={() => actions.initGame(5, 3)} // Restart with 5 enemies, 3 health packs
          >
            Play Again
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/75 flex flex-col justify-center items-center pointer-events-auto z-10">
          <h1 className="text-6xl font-bold text-red-500 mb-4 animate-pulse">GAME OVER</h1>
          <p className="text-white text-xl mb-8">You have been defeated.</p>
          <button
            className="px-6 py-3 bg-blue-600 rounded text-white text-2xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors"
            onClick={() => actions.initGame(5, 3)} // Restart with 5 enemies, 3 health packs
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
