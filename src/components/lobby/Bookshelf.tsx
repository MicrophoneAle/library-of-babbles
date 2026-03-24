interface BookshelfProps {
  className?: string;
  compact?: boolean;
}

export default function Bookshelf({ className = "", compact = false }: BookshelfProps) {
  const rows = compact ? [0, 1, 2] : [0, 1, 2, 3];
  const booksPerRow = compact ? 12 : 16;
  const bookPalette = [
    "#3f2b20",
    "#5b3d2f",
    "#6b4a35",
    "#4e3d2b",
    "#354636",
    "#2f3d4f",
    "#6f5a3d",
    "#5f2e2e"
  ];

  return (
    <div className={`relative space-y-3 rounded-xl border border-[#c8ad7f]/35 bg-[#6a4b34]/60 px-5 py-4 shadow-2xl ${className}`}>
      <div className="pointer-events-none absolute bottom-2 left-2 top-2 w-[7px] rounded bg-[#7f5a3d]/90" />
      <div className="pointer-events-none absolute bottom-2 right-2 top-2 w-[7px] rounded bg-[#7f5a3d]/90" />
      {rows.map((shelf) => (
        <div key={shelf} className="space-y-2">
          <div className="h-[10px] rounded bg-[#8a6444] shadow-inner shadow-black/55" />
          <div className="flex items-end gap-1">
            {Array.from({ length: booksPerRow }).map((_, idx) => (
              <div
                key={idx}
                className={`${compact ? "w-3" : "w-4"} relative rounded-sm border border-black/30`}
                style={{
                  height: `${compact ? 30 + ((idx * 7) % 16) : 40 + ((idx * 11) % 24)}px`,
                  background: `linear-gradient(180deg, ${bookPalette[idx % bookPalette.length]}, #20160f)`
                }}
              >
                <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-amber-100/25" />
                {idx % 5 === 0 ? <div className="absolute inset-x-[2px] top-[3px] h-[2px] rounded bg-amber-200/60" /> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
