interface BookshelfProps {
  className?: string;
  compact?: boolean;
}

export default function Bookshelf({ className = "", compact = false }: BookshelfProps) {
  const rows = compact ? [0, 1] : [0, 1, 2];
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
    <div className={`space-y-4 rounded-xl border border-[#c8ad7f]/35 bg-[#6a4b34]/55 p-4 shadow-2xl ${className}`}>
      {rows.map((shelf) => (
        <div key={shelf} className="space-y-2">
          <div className="h-3 rounded bg-[#8a6444] shadow-inner shadow-black/50" />
          <div className="flex items-end gap-1">
            {Array.from({ length: booksPerRow }).map((_, idx) => (
              <div
                key={idx}
                className={`${compact ? "w-3" : "w-4"} rounded-sm border border-black/30 relative`}
                style={{
                  height: `${compact ? 30 + ((idx * 7) % 16) : 40 + ((idx * 11) % 24)}px`,
                  background: `linear-gradient(180deg, ${bookPalette[idx % bookPalette.length]}, #20160f)`
                }}
              >
                <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-amber-100/25" />
                {idx % 5 === 0 ? (
                  <div className="absolute inset-x-[2px] top-[3px] h-[2px] rounded bg-amber-200/60" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
