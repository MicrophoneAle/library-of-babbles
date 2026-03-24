"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WoodenDoors() {
  const [opened, setOpened] = useState(false);
  const router = useRouter();

  const openDoors = () => {
    if (opened) return;
    setOpened(true);
    setTimeout(() => router.push("/lobby"), 1400);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-library-wall">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,214,141,0.22),transparent_55%)]" />
      <motion.button
        onClick={openDoors}
        className="absolute left-1/2 top-1/2 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/60 bg-gradient-to-br from-amber-200 to-amber-500 shadow-glow"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open library doors"
      />
      <motion.div
        className="wood-panel absolute inset-y-0 left-0 w-1/2 border-r border-amber-300/20"
        animate={{ x: opened ? "-100%" : "0%" }}
        transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
      />
      <motion.div
        className="wood-panel absolute inset-y-0 right-0 w-1/2 border-l border-amber-300/20"
        animate={{ x: opened ? "100%" : "0%" }}
        transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
      />
      <div className="absolute bottom-8 w-full text-center text-sm uppercase tracking-[0.3em] text-amber-100/85">
        Pull the brass handle
      </div>
    </div>
  );
}
