import React from 'react';

export default function FullScreenLoader() {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black flex justify-center items-center">
      <div className="text-white text-3xl font-mono animate-pulse">
        Loading...
      </div>
    </div>
  );
}
