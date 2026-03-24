import Link from "next/link";

interface LobbyHotspotLinkProps {
  href: string;
  label: string;
  className: string;
}

export default function LobbyHotspotLink({ href, label, className }: LobbyHotspotLinkProps) {
  return (
    <Link
      href={href}
      className={`${className} group z-30 rounded-md border border-amber-200/25 bg-black/10 transition hover:bg-amber-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80`}
      aria-label={label}
      title={label}
    >
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-100 opacity-0 transition group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}
