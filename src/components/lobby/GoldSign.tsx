import Link from "next/link";

interface GoldSignProps {
  label: string;
  href: string;
}

export default function GoldSign({ label, href }: GoldSignProps) {
  return (
    <Link
      href={href}
      className="gold-sign block rounded-md border border-amber-200/40 px-4 py-2 text-center font-semibold tracking-wide text-walnut shadow-lg transition hover:scale-[1.02]"
    >
      {label}
    </Link>
  );
}
