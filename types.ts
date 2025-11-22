import type { Vector3 } from 'three';

export interface BulletState {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface EnemyState {
  id: string;
  position: [number, number, number];
  health: number;
}

export interface HealthPackState {
  id: string;
  position: [number, number, number];
}

export interface ParticleState {
  id: string;
  position: [number, number, number];
  color: string;
  life: number; // Time to live in seconds
}

export interface GameState {
  ammo: {
    clip: number;
    total: number;
  };
  bullets: BulletState[];
  enemies: EnemyState[];
  healthPacks: HealthPackState[];
  particles: ParticleState[];
  isFiring: boolean;
  isReloading: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  movement: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  };
  player: {
    position: Vector3;
    rotation: [number, number, number];
    health: number;
    maxHealth: number;
  };
  actions: {
    initGame: (enemyCount: number, healthPackCount: number) => void;
    setMovement: (movement: Partial<GameState['movement']>) => void;
    setPlayerState: (playerState: Partial<GameState['player']>) => void;
    startFiring: () => void;
    stopFiring: () => void;
    reload: () => void;
    addBullet: (bullet: BulletState) => void;
    removeBullet: (id: string) => void;
    damageEnemy: (id: string, damage: number) => void;
    removeEnemy: (id: string) => void;
    damagePlayer: (damage: number) => void;
    healPlayer: (amount: number) => void;
    removeHealthPack: (id: string) => void;
    addParticles: (count: number, position: [number, number, number], color: string) => void;
    updateParticles: (delta: number) => void;
  };
}
