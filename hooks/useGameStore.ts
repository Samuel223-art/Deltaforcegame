import { create } from 'zustand';
import { Vector3 } from 'three';
import { GameState, GameStatus } from '../types';

const CLIP_SIZE = 30;
const INITIAL_TOTAL_AMMO = 120;
const PLAYER_MAX_HEALTH = 100;

export const useGameStore = create<GameState>((set, get) => ({
  ammo: {
    clip: CLIP_SIZE,
    total: INITIAL_TOTAL_AMMO,
  },
  bullets: [],
  enemies: [],
  healthPacks: [],
  particles: [],
  isFiring: false,
  isReloading: false,
  gameStatus: GameStatus.SPLASH,
  movement: {
    forward: false,
    backward: false,
    left: false,
    right: false,
  },
  player: {
    position: new Vector3(0, 1, 10),
    rotation: [0, 0, 0],
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
  },
  actions: {
    setGameStatus: (status) => set({ gameStatus: status }),
    initGame: (enemyCount, healthPackCount) => {
        const enemies = Array.from({ length: enemyCount }, (_, i) => ({
        id: `enemy_${i}_${Date.now()}`,
        position: [(Math.random() - 0.5) * 40, 1.25, (Math.random() - 0.5) * 40] as [number, number, number],
        health: 100,
      }));
      const healthPacks = Array.from({ length: healthPackCount }, (_, i) => ({
        id: `healthpack_${i}_${Date.now()}`,
        position: [(Math.random() - 0.5) * 45, 0.5, (Math.random() - 0.5) * 45] as [number, number, number],
      }));
      set({ 
        enemies, 
        healthPacks,
        ammo: { clip: CLIP_SIZE, total: INITIAL_TOTAL_AMMO }, 
        player: { ...get().player, health: PLAYER_MAX_HEALTH, position: new Vector3(0, 1, 10) },
        gameStatus: GameStatus.PLAYING,
        bullets: [],
        particles: [],
      });
    },
    setMovement: (movement) => set((state) => ({ movement: { ...state.movement, ...movement } })),
    setPlayerState: (playerState) => set((state) => ({ player: { ...state.player, ...playerState } })),
    startFiring: () => set({ isFiring: true }),
    stopFiring: () => set({ isFiring: false }),
    reload: () => {
      const { ammo, isReloading } = get();
      if (isReloading || ammo.clip === CLIP_SIZE || ammo.total === 0) return;

      set({ isReloading: true });
      setTimeout(() => {
        const currentAmmo = get().ammo;
        const ammoNeeded = CLIP_SIZE - currentAmmo.clip;
        const ammoToReload = Math.min(ammoNeeded, currentAmmo.total);
        set((state) => ({
          ammo: {
            clip: state.ammo.clip + ammoToReload,
            total: state.ammo.total - ammoToReload,
          },
          isReloading: false,
        }));
      }, 1500); // 1.5 second reload time
    },
    addBullet: (bullet) => set((state) => ({ bullets: [...state.bullets, bullet] })),
    removeBullet: (id) => set((state) => ({ bullets: state.bullets.filter((b) => b.id !== id) })),
    damageEnemy: (id, damage) => {
        set((state) => ({
            enemies: state.enemies.map(enemy => {
                if (enemy.id === id) {
                    const newHealth = Math.max(0, enemy.health - damage);
                    if (newHealth === 0) {
                        setTimeout(() => get().actions.removeEnemy(id), 0);
                    }
                    return { ...enemy, health: newHealth };
                }
                return enemy;
            })
        }));
    },
    removeEnemy: (id) => {
        set((state) => {
            const newEnemies = state.enemies.filter(e => e.id !== id);
            if (newEnemies.length === 0) {
                return { enemies: newEnemies, gameStatus: GameStatus.WON };
            }
            return { enemies: newEnemies };
        });
    },
    damagePlayer: (damage) => {
        set((state) => {
            const newHealth = Math.max(0, state.player.health - damage);
            if (newHealth === 0) {
                return { player: { ...state.player, health: 0 }, gameStatus: GameStatus.LOST };
            }
            return { player: { ...state.player, health: newHealth } };
        });
    },
    healPlayer: (amount) => {
        set((state) => ({
            player: { ...state.player, health: Math.min(state.player.maxHealth, state.player.health + amount) }
        }));
    },
    removeHealthPack: (id) => {
        set((state) => ({ healthPacks: state.healthPacks.filter(hp => hp.id !== id) }));
    },
    addParticles: (count, position, color) => {
        const newParticles = Array.from({ length: count }, () => ({
            id: `particle_${Math.random()}`,
            position,
            color,
            life: 0.5, // 0.5 second lifespan
        }));
        set(state => ({ particles: [...state.particles, ...newParticles] }));
    },
    removeParticle: (id) => {
        set(state => ({
            particles: state.particles.filter(p => p.id !== id),
        }));
    },
  },
}));
