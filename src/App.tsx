import { Environment, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Box3, Object3D, Quaternion, Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/room_lobby.glb");

const MOVE_SPEED = 5;
const EYE_HEIGHT = 1.7;
const CAPSULE_HALF_HEIGHT = 0.4;
const CAPSULE_RADIUS = 0.3;
const LOOK_SENSITIVITY = 0.002;

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

function findStairsNode(root: Object3D) {
  let stairs: Object3D | null = null;

  root.traverse((object) => {
    if (
      object.name === "Lobby_Stairs001" ||
      object.name === "Lobby_Stairs.001" ||
      object.name === "Lobby_Stairs"
    ) {
      if (!stairs || (object as Object3D & { isMesh?: boolean }).isMesh) {
        stairs = object;
      }
    }
  });

  return stairs;
}

function prepareRoom(source: Object3D) {
  const room = source.clone(true);
  room.updateMatrixWorld(true);

  const stairsSource = findStairsNode(room);
  let extractedStairs: Object3D | null = null;

  if (stairsSource) {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    stairsSource.matrixWorld.decompose(position, quaternion, scale);

    extractedStairs = stairsSource.clone(true);
    extractedStairs.position.copy(position);
    extractedStairs.quaternion.copy(quaternion);
    extractedStairs.scale.copy(scale);
    extractedStairs.updateMatrixWorld(true);
  }

  const sketchfab = room.getObjectByName("Sketchfab_model");
  sketchfab?.parent?.remove(sketchfab);

  if (extractedStairs) {
    room.add(extractedStairs);
  }

  return room;
}

function resolveSpawnPoint(root: Object3D) {
  root.updateMatrixWorld(true);

  let spawnMarker: Object3D | null = null;

  root.traverse((object) => {
    if (object.name.startsWith("SPAWN_")) {
      spawnMarker = object;
    }
  });

  if (spawnMarker) {
    const position = new Vector3();
    spawnMarker.getWorldPosition(position);
    return position;
  }

  const floor = root.getObjectByName("Lobby_Floor_Walls");
  if (!floor) {
    return new Vector3(0, 1, 5);
  }

  const bounds = new Box3().setFromObject(floor);
  const spawn = bounds.getCenter(new Vector3());
  spawn.y = bounds.min.y + CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS + 0.05;

  return spawn;
}

function LobbyRoom() {
  const { scene } = useGLTF("/room_lobby.glb");
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);

  const { room, floorSize } = useMemo(() => {
    const roomScene = prepareRoom(scene);
    const floor = roomScene.getObjectByName("Lobby_Floor_Walls");
    const bounds = floor ? new Box3().setFromObject(floor) : new Box3();
    const size = bounds.getSize(new Vector3());

    return {
      room: roomScene,
      floorSize: size,
    };
  }, [scene]);

  useEffect(() => {
    setSpawnPoint(resolveSpawnPoint(room));
  }, [room, setSpawnPoint]);

  return (
    <>
      <RigidBody type="fixed" colliders="trimesh" friction={1}>
        <primitive object={room} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider
          args={[
            Math.max(floorSize.x * 0.5, 5),
            0.1,
            Math.max(floorSize.z * 0.5, 5),
          ]}
          position={[0, -0.2, 0]}
        />
      </RigidBody>
    </>
  );
}

function Player() {
  const spawnPoint = useGameStore((state) => state.spawnPoint);
  const bodyRef = useRef<RapierRigidBody>(null);
  const keys = useKeyboard();
  const { camera, gl } = useThree();
  const hasSpawned = useRef(false);
  const isPointerLocked = useRef(false);
  const lookEuler = useRef({ x: 0, y: 0 });

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) {
        return;
      }

      lookEuler.current.y -= event.movementX * LOOK_SENSITIVITY;
      lookEuler.current.x -= event.movementY * LOOK_SENSITIVITY;
      lookEuler.current.x = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, lookEuler.current.x),
      );

      camera.rotation.order = "YXZ";
      camera.rotation.y = lookEuler.current.y;
      camera.rotation.x = lookEuler.current.x;
    };

    const onClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [camera, gl]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    body.setTranslation(
      { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z },
      true,
    );
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.wakeUp();
    hasSpawned.current = true;
  }, [spawnPoint]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body || !hasSpawned.current) {
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

    if (forward.lengthSq() > 0.001) {
      forward.normalize();
      right.crossVectors(forward, up).normalize();
    } else {
      forward.set(0, 0, -1);
      right.set(1, 0, 0);
    }

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

    const velocity = body.linvel();

    if (direction.lengthSq() > 0) {
      direction.normalize();
      body.setLinvel(
        {
          x: direction.x * MOVE_SPEED,
          y: velocity.y,
          z: direction.z * MOVE_SPEED,
        },
        true,
      );
      body.wakeUp();
    } else {
      body.setLinvel(
        {
          x: velocity.x * 0.75,
          y: velocity.y,
          z: velocity.z * 0.75,
        },
        true,
      );
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}
      lockRotations
      colliders={false}
      canSleep={false}
      friction={0.2}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
    </RigidBody>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Environment preset="apartment" />
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
      <Canvas
        style={{ width: "100vw", height: "100vh", display: "block" }}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.7, 5] }}
      >
        <Physics gravity={[0, -9.81, 0]}>
          <Scene />
        </Physics>
      </Canvas>
    </>
  );
}
