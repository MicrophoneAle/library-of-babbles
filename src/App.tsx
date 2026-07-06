import { Environment, PointerLockControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/room_lobby.glb");

const MOVE_IMPULSE = 0.35;
const EYE_HEIGHT = 1.7;

function useKeyboard() {
  const keys = useRef({
    forward: false,
    back: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.forward = true;
          break;
        case "KeyS":
          keys.current.back = true;
          break;
        case "KeyA":
          keys.current.left = true;
          break;
        case "KeyD":
          keys.current.right = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.forward = false;
          break;
        case "KeyS":
          keys.current.back = false;
          break;
        case "KeyA":
          keys.current.left = false;
          break;
        case "KeyD":
          keys.current.right = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keys;
}

function LobbyRoom() {
  const { scene } = useGLTF("/room_lobby.glb");
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);
  const room = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    room.updateMatrixWorld(true);

    room.traverse((object) => {
      if (object.name.startsWith("SPAWN_")) {
        const position = new Vector3();
        object.getWorldPosition(position);
        setSpawnPoint(position);
      }
    });
  }, [room, setSpawnPoint]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={room} />
    </RigidBody>
  );
}

function Player() {
  const spawnPoint = useGameStore((state) => state.spawnPoint);
  const bodyRef = useRef<RapierRigidBody>(null);
  const keys = useKeyboard();
  const { camera } = useThree();

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    body.setTranslation(
      { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z },
      true,
    );
  }, [spawnPoint]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    const translation = body.translation();
    camera.position.set(
      translation.x,
      translation.y + EYE_HEIGHT,
      translation.z,
    );

    direction.set(0, 0, 0);

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0) {
      forward.normalize();
    }

    right.crossVectors(forward, new Vector3(0, 1, 0)).normalize();

    if (keys.current.forward) {
      direction.add(forward);
    }
    if (keys.current.back) {
      direction.sub(forward);
    }
    if (keys.current.left) {
      direction.sub(right);
    }
    if (keys.current.right) {
      direction.add(right);
    }

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(MOVE_IMPULSE);
      body.applyImpulse({ x: direction.x, y: 0, z: direction.z }, true);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}
      lockRotations
      colliders={false}
      linearDamping={2}
    >
      <CapsuleCollider args={[0.7, 0.3]} />
    </RigidBody>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Environment preset="apartment" />
      <PointerLockControls />
      <Suspense fallback={null}>
        <LobbyRoom />
      </Suspense>
      <Player />
    </>
  );
}

function Crosshair() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <div className="relative h-3 w-3">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/90" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Crosshair />
      <Canvas>
        <Physics gravity={[0, -9.81, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </>
  );
}
