interface VineProps {
  className?: string;
}

export default function Vine({ className = "" }: VineProps) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <div className="h-24 w-2 rounded-full bg-ivy/60" />
      <div className="relative -top-16 left-2 h-4 w-10 rotate-12 rounded-full bg-ivy/80" />
      <div className="relative -top-10 left-3 h-4 w-8 -rotate-12 rounded-full bg-ivy/80" />
      <div className="relative -top-7 -left-3 h-4 w-8 rotate-45 rounded-full bg-ivy/80" />
    </div>
  );
}
