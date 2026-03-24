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

      {/* Lobby preview visible behind the doors while opening */}
      <div className="absolute inset-0 p-8">
        <div className="relative mx-auto h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-amber-100/20 bg-[#2f2017]">
          <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-[#6b4a2a] via-[#3d2718] to-[#24160f]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#2b1a11] to-[#4b311f]" />
          <div className="absolute left-1/2 top-[58%] h-40 w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-amber-100/10 bg-[#1e120d]/50" />
          <div className="absolute left-6 top-8 h-[80%] w-44 rounded-md border border-amber-100/10 bg-walnut/70" />
          <div className="absolute right-6 top-8 h-[80%] w-44 rounded-md border border-amber-100/10 bg-walnut/70" />
          <div className="absolute left-1/2 top-[62%] h-32 w-24 -translate-x-1/2 rounded-md border border-amber-100/20 bg-gradient-to-b from-mahogany to-walnut" />
          <div className="absolute left-1/2 top-[46%] h-10 w-10 -translate-x-1/2 rounded-full bg-amber-100/35 blur-lg" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-100/10" />
        </div>
      </div>
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
      >
        <div className="absolute inset-4 rounded-lg border border-amber-200/15" />
        <div className="absolute inset-x-10 top-8 h-20 rounded border border-amber-100/10 bg-black/10" />
        <div className="absolute inset-x-10 bottom-8 h-20 rounded border border-amber-100/10 bg-black/10" />
        <div className="absolute right-6 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-amber-200/40 bg-gradient-to-br from-amber-100 to-amber-500 shadow-glow" />
      </motion.div>
      <motion.div
        className="wood-panel absolute inset-y-0 right-0 w-1/2 border-l border-amber-300/20"
        animate={{ x: opened ? "100%" : "0%" }}
        transition={{ duration: 1.2, ease: [0.7, 0, 0.2, 1] }}
      >
        <div className="absolute inset-4 rounded-lg border border-amber-200/15" />
        <div className="absolute inset-x-10 top-8 h-20 rounded border border-amber-100/10 bg-black/10" />
        <div className="absolute inset-x-10 bottom-8 h-20 rounded border border-amber-100/10 bg-black/10" />
        <div className="absolute left-6 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-amber-200/40 bg-gradient-to-br from-amber-100 to-amber-500 shadow-glow" />
      </motion.div>
      <div className="absolute bottom-8 w-full text-center text-sm uppercase tracking-[0.3em] text-amber-100/85">
        Pull the brass handle
      </div>
    </div>
  );
}
