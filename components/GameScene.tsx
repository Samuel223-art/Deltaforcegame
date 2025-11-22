import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sky, PointerLockControls, useGLTF, Html } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, BallCollider, CapsuleCollider } from '@react-three/rapier';
import { TextureLoader, RepeatWrapping, Vector3, Euler, Quaternion, Camera, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import type { RapierRigidBody, Collider, CollisionEnterEvent } from '@react-three/rapier';
import { useGameStore } from '../hooks/useGameStore';
import { BulletState, EnemyState, HealthPackState, ParticleState, GameStatus } from '../types';

// --- AUDIO ---
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

function playSound(type: 'gunshot' | 'impact_wall' | 'impact_flesh') {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
        case 'gunshot':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
            break;
        case 'impact_wall':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
            break;
        case 'impact_flesh':
             oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);
            break;
    }
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}


// Preload assets for performance
useGLTF.preload('https://threejs.org/examples/models/gltf/Soldier.glb');

// --- 3D COMPONENTS ---

const Ground = () => {
  const texture = useLoader(TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg');
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(100, 100);
  return (
    <RigidBody type="fixed" colliders="cuboid" name="ground">
      <mesh receiveShadow position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </RigidBody>
  );
};

const Wall = ({ position, args }: { position: [number, number, number], args: [number, number, number] }) => {
  const texture = useLoader(TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/brick_diffuse.jpg');
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(args[0]/2, args[1]/2);
  return (
    <RigidBody type="fixed" name="wall">
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </RigidBody>
  );
}

const Bullet: React.FC<{ bullet: BulletState }> = ({ bullet }) => {
  const actions = useGameStore((s) => s.actions);
  const bulletRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (bulletRef.current) {
        const velocityVec = new Vector3(...bullet.velocity);
        bulletRef.current.setLinvel(velocityVec, true);
    }
  }, [bullet.velocity]);

  const handleCollision = (event: CollisionEnterEvent) => {
    const contactPoint = event.contacts[0]?.point;
    const position: [number, number, number] = contactPoint ? [contactPoint.x, contactPoint.y, contactPoint.z] : bullet.position;

    if (event.other.rigidBodyObject?.name.startsWith('enemy')) {
        actions.damageEnemy(event.other.rigidBodyObject.name, 35);
        playSound('impact_flesh');
        actions.addParticles(5, position, 'red');
    } else if (event.other.rigidBodyObject?.name === 'wall' || event.other.rigidBodyObject?.name === 'ground') {
        playSound('impact_wall');
        actions.addParticles(3, position, 'gray');
    }
    actions.removeBullet(bullet.id);
  }

  return (
    <RigidBody
      ref={bulletRef}
      colliders="ball"
      position={bullet.position}
      gravityScale={0}
      onCollisionEnter={handleCollision}
    >
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
      </mesh>
    </RigidBody>
  );
};

const Particle: React.FC<{ particle: ParticleState }> = ({ particle }) => {
    const meshRef = useRef<Mesh>(null!);
    const velocity = useMemo(() => new Vector3((Math.random() - 0.5) * 3, (Math.random()) * 3, (Math.random() - 0.5) * 3), []);
    const lifeTimer = useRef(particle.life);
    const removeParticle = useGameStore(s => s.actions.removeParticle);
  
    useFrame((_, delta) => {
        lifeTimer.current -= delta;
        if (lifeTimer.current <= 0) {
            removeParticle(particle.id);
            return;
        }

        if (meshRef.current) {
            meshRef.current.position.addScaledVector(velocity, delta);
            (meshRef.current.material as MeshBasicMaterial).opacity = lifeTimer.current / particle.life;
        }
    });
  
    return (
      <mesh ref={meshRef} position={particle.position}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshBasicMaterial color={particle.color} transparent opacity={1} />
      </mesh>
    );
};

const HealthPack: React.FC<{ pack: HealthPackState }> = ({ pack }) => {
    const meshRef = useRef<Group>(null!);
    useFrame(() => {
        meshRef.current.rotation.y += 0.01;
    });

    return (
        <RigidBody type="fixed" colliders="cuboid" name={pack.id} sensor>
            <group ref={meshRef} position={pack.position}>
                <mesh position={[0, 0, -0.125]}>
                    <boxGeometry args={[0.5, 0.5, 0.25]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh rotation-y={Math.PI / 2}>
                    <boxGeometry args={[0.5, 0.2, 0.1]} />
                    <meshStandardMaterial color="red" />
                </mesh>
                 <mesh rotation-x={Math.PI / 2}>
                    <boxGeometry args={[0.1, 0.5, 0.2]} />
                    <meshStandardMaterial color="red" />
                </mesh>
            </group>
        </RigidBody>
    );
};


const Enemy: React.FC<{ enemy: EnemyState }> = ({ enemy }) => {
  const enemyRef = useRef<RapierRigidBody>(null);
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Soldier.glb');
  const actions = useGameStore(s => s.actions);
  const lastAttackTime = useRef(0);

  const model = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if ('isMesh' in child && child.isMesh) {
        child.castShadow = true;
      }
    });
    return clonedScene;
  }, [scene]);

  useFrame((_, delta) => {
    if (!enemyRef.current || enemy.health <= 0) return;
    const enemyPosition = enemyRef.current.translation();
    // Get latest player position without subscribing to prevent re-renders
    const playerPosition = useGameStore.getState().player.position;
    const distance = playerPosition.distanceTo(new Vector3(enemyPosition.x, enemyPosition.y, enemyPosition.z));
    
    // AI Behavior
    if (distance < 20) { // Detection range
        const direction = new Vector3().subVectors(playerPosition, enemyPosition).normalize();
        
        // Move towards player
        enemyRef.current.setLinvel({ x: direction.x * 2, y: 0, z: direction.z * 2 }, true);
        
        // Face the player
        const targetRotation = new Euler(0, Math.atan2(direction.x, direction.z), 0);
        const currentRotation = new Quaternion().setFromEuler(new Euler().setFromQuaternion(enemyRef.current.rotation()));
        const targetQuaternion = new Quaternion().setFromEuler(targetRotation);
        currentRotation.slerp(targetQuaternion, delta * 5); // Smooth rotation
        enemyRef.current.setRotation(currentRotation, true);

        // Attack logic
        if (distance < 2.5) { // Attack range
            const now = Date.now();
            if (now - lastAttackTime.current > 1000) { // Attack every 1 second
                lastAttackTime.current = now;
                actions.damagePlayer(10);
            }
        }
    }
  });
  
  return (
    <RigidBody ref={enemyRef} colliders={false} position={enemy.position} name={enemy.id} enabledRotations={[false, true, false]}>
      <CapsuleCollider args={[0.5, 0.4]} />
      <group>
        <primitive 
          object={model} 
          position={[0, -0.9, 0]} 
          scale={1}
        />
        {/* Health Bar */}
        {enemy.health > 0 && (
             <Html position={[0, 1.2, 0]} center>
                <div className="w-24 h-4 bg-gray-800 border-2 border-gray-400 rounded-lg overflow-hidden">
                    <div 
                        className="h-full bg-red-500 transition-all duration-100"
                        style={{ width: `${(enemy.health / 100) * 100}%` }}
                    />
                </div>
            </Html>
        )}
      </group>
    </RigidBody>
  );
};


const Player = () => {
    const { movement, actions } = useGameStore((s) => ({ movement: s.movement, actions: s.actions }));
    const playerRef = useRef<RapierRigidBody>(null);
    const { isFiring, ammo, isReloading } = useGameStore(s => ({isFiring: s.isFiring, ammo: s.ammo, isReloading: s.isReloading}));
    const lastShotTime = useRef(0);

    useFrame((state, delta) => {
        if (!playerRef.current || !state.camera) return;

        // Player Movement
        const velocity = new Vector3();
        const frontVector = new Vector3(0, 0, (movement.backward ? 1 : 0) - (movement.forward ? 1 : 0));
        const sideVector = new Vector3((movement.left ? 1 : 0) - (movement.right ? 1 : 0), 0, 0);

        velocity.subVectors(frontVector, sideVector).normalize().multiplyScalar(5).applyEuler(state.camera.rotation);
        
        const currentVelocity = playerRef.current.linvel();
        playerRef.current.setLinvel({ x: velocity.x, y: currentVelocity.y, z: velocity.z }, true);

        const playerPosition = playerRef.current.translation();
        state.camera.position.set(playerPosition.x, playerPosition.y + 0.8, playerPosition.z);
        
        const playerRotation = state.camera.rotation.toArray().slice(0,3) as [number, number, number];
        actions.setPlayerState({ position: new Vector3().copy(state.camera.position), rotation: playerRotation });
        
        // Firing logic
        const now = Date.now();
        if (isFiring && !isReloading && ammo.clip > 0 && now - lastShotTime.current > 100) { 
            lastShotTime.current = now;
            playSound('gunshot');

            const direction = new Vector3();
            state.camera.getWorldDirection(direction);

            actions.addBullet({
                id: `bullet_${now}`,
                position: [state.camera.position.x, state.camera.position.y, state.camera.position.z],
                velocity: [direction.x * 50, direction.y * 50, direction.z * 50],
            });
            useGameStore.setState(s => ({ ammo: { ...s.ammo, clip: s.ammo.clip - 1 } }));
        }
    });

    const handleHealthPackCollision = (event: CollisionEnterEvent) => {
         if (event.other.rigidBodyObject?.name.startsWith('healthpack')) {
            actions.healPlayer(50);
            actions.removeHealthPack(event.other.rigidBodyObject.name);
        }
    }

    return (
        <RigidBody ref={playerRef} colliders={false} position={useGameStore.getState().player.position} enabledRotations={[false, true, false]} onCollisionEnter={handleHealthPackCollision}>
            <CapsuleCollider args={[0.8, 0.4]} />
        </RigidBody>
    );
};


// --- MAIN SCENE COMPONENT ---

export default function GameScene() {
  const bullets = useGameStore(s => s.bullets);
  const enemies = useGameStore(s => s.enemies);
  const healthPacks = useGameStore(s => s.healthPacks);
  const particles = useGameStore(s => s.particles);
  const gameStatus = useGameStore(s => s.gameStatus);

  return (
    <Canvas shadows camera={{ fov: 60 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        castShadow
        position={[100, 100, 50]}
        intensity={1}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      <Physics>
        <Ground />
        {/* Arena Walls */}
        <Wall position={[-25, 2.5, 0]} args={[1, 5, 50]} />
        <Wall position={[25, 2.5, 0]} args={[1, 5, 50]} />
        <Wall position={[0, 2.5, -25]} args={[50, 5, 1]} />
        <Wall position={[0, 2.5, 25]} args={[50, 5, 1]} />

        <Player />
        
        {enemies.map((enemy) => <Enemy key={enemy.id} enemy={enemy} />)}
        {bullets.map((bullet) => <Bullet key={bullet.id} bullet={bullet} />)}
        {healthPacks.map((pack) => <HealthPack key={pack.id} pack={pack} />)}
      </Physics>

      {/* Particles are not physics objects, so they are rendered outside */}
      {particles.map((p) => <Particle key={p.id} particle={p} />)}

      {gameStatus === GameStatus.PLAYING && <PointerLockControls />}
    </Canvas>
  );
}
