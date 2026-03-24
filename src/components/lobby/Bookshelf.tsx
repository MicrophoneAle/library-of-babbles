interface BookshelfProps {
  className?: string;
  compact?: boolean;
}

export default function Bookshelf({ className = "", compact = false }: BookshelfProps) {
  const rows = compact ? [0, 1] : [0, 1, 2];
  const booksPerRow = compact ? 12 : 16;

  return (
    <div className={`space-y-4 rounded-xl border border-amber-200/10 bg-walnut/70 p-4 ${className}`}>
      {rows.map((shelf) => (
        <div key={shelf} className="space-y-2">
          <div className="h-3 rounded bg-mahogany shadow-inner" />
          <div className="flex gap-1">
            {Array.from({ length: booksPerRow }).map((_, idx) => (
              <div
                key={idx}
                className={`${compact ? "h-11 w-3" : "h-14 w-4"} rounded-sm`}
                style={{
                  background:
                    idx % 4 === 0
                      ? "#8a5a44"
                      : idx % 4 === 1
                        ? "#5f3d2c"
                        : idx % 4 === 2
                          ? "#a46f46"
                          : "#6f5a3d"
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
