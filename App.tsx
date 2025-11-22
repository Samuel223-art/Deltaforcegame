import React, { Suspense } from 'react';
import { useGameStore } from './hooks/useGameStore';
import { GameStatus } from './types';
import SplashScreen from './components/SplashScreen';
import LobbyScreen from './components/LobbyScreen';
import FullScreenLoader from './components/FullScreenLoader';
import GameScene from './components/GameScene';
import GameUI from './components/GameUI';

function GameView() {
  return (
    <>
      <Suspense fallback={<FullScreenLoader />}>
        <GameScene />
      </Suspense>
      <GameUI />
    </>
  )
}

export default function App(): React.ReactElement {
  const gameStatus = useGameStore((state) => state.gameStatus);

  const renderScene = () => {
    switch (gameStatus) {
      case GameStatus.SPLASH:
        return <SplashScreen />;
      case GameStatus.LOBBY:
        return <LobbyScreen />;
      case GameStatus.PLAYING:
      case GameStatus.WON:
      case GameStatus.LOST:
        return <GameView />;
      default:
        return <SplashScreen />;
    }
  }

  return (
    <div className="w-full h-full">
      {renderScene()}
    </div>
  );
}
