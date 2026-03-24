"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function Lectern() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="mx-auto block w-full max-w-sm rounded-lg border border-[#d9bf91]/45 bg-gradient-to-b from-[#b4865b] to-[#7a5338] p-4 text-left shadow-xl transition hover:scale-[1.01]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-amber-50/90">Grand Lectern</p>
        <p className="mt-2 text-lg font-semibold">Open the Introduction Tome</p>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 rounded-lg border border-[#dec39b]/45 bg-[#5f3f2b]/95 p-4"
          >
            <h3 className="font-semibold text-amber-100">Welcome, traveler.</h3>
            <p className="mt-2 text-sm text-parchment/90">
              This is my personal corner of the infinite stacks: a place for projects, thoughts,
              and a living record of books I have read, I am reading, and I hope to read next.
            </p>
            <p className="mt-2 text-sm text-parchment/90">
              Expect craftsmanship, curiosity, and eventually an AI librarian that helps uncover
              your next favorite shelf.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
