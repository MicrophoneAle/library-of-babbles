export default function Bookshelf() {
  return (
    <div className="space-y-4 rounded-xl border border-amber-200/10 bg-walnut/70 p-4">
      {[0, 1, 2].map((shelf) => (
        <div key={shelf} className="space-y-2">
          <div className="h-3 rounded bg-mahogany shadow-inner" />
          <div className="flex gap-1">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div
                key={idx}
                className="h-14 w-4 rounded-sm"
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
