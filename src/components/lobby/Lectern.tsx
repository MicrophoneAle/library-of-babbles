"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function Lectern() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="mx-auto block w-full max-w-sm text-left transition hover:scale-[1.01]"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <div className="relative mx-auto h-56 w-64">
          {/* Slanted reading surface */}
          <div className="absolute left-1/2 top-2 h-24 w-56 -translate-x-1/2 rounded-md border border-[#d9bf91]/45 bg-gradient-to-b from-[#c79a6c] to-[#845638] shadow-xl [transform:perspective(700px)_rotateX(50deg)]" />
          {/* Lip on reading surface */}
          <div className="absolute left-1/2 top-[84px] h-2 w-52 -translate-x-1/2 rounded bg-[#6d462f]" />
          {/* Pedestal stem */}
          <div className="absolute left-1/2 top-[92px] h-28 w-14 -translate-x-1/2 rounded-sm border border-[#caa777]/40 bg-gradient-to-b from-[#9b6e4c] to-[#5b3c2a]" />
          {/* Base */}
          <div className="absolute left-1/2 bottom-3 h-7 w-40 -translate-x-1/2 rounded-md border border-[#d4b587]/40 bg-gradient-to-b from-[#8a613f] to-[#583a29]" />
          <div className="absolute left-1/2 top-6 w-44 -translate-x-1/2 text-center">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-50/90">Grand Lectern</p>
            <p className="mt-2 text-base font-semibold text-amber-50">Open the Introduction Tome</p>
          </div>
        </div>
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
