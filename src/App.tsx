import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 1.7, 5] }}>
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  );
}
