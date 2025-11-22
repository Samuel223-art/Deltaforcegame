
import React, { Suspense } from 'react';
import GameScene from './components/GameScene';
import GameUI from './components/GameUI';

function Loader() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl">
      Loading...
    </div>
  )
}

export default function App(): React.ReactElement {
  return (
    <div className="w-full h-full">
      <Suspense fallback={<Loader />}>
        <GameScene />
      </Suspense>
      <GameUI />
    </div>
  );
}
