import { LobbyHotspot, LobbyLayer } from "@/types/lobby";

// Drop your own files in public/assets/lobby and keep these names.
export const lobbyLayers: LobbyLayer[] = [
  {
    id: "room-shell",
    src: "/assets/lobby/room-shell.webp",
    className: "absolute inset-0 bg-cover bg-center",
    fallbackClassName: "absolute inset-0 bg-gradient-to-b from-[#e6dcc7] via-[#cfba98] to-[#8a6548]"
  },
  {
    id: "glass-dome",
    src: "/assets/lobby/glass-dome.webp",
    className: "absolute left-1/2 top-0 h-[18%] w-[38%] -translate-x-1/2 bg-contain bg-no-repeat bg-top",
    fallbackClassName:
      "absolute left-1/2 top-[1.5%] h-[12%] w-[22rem] -translate-x-1/2 rounded-t-[999px] border-4 border-b-0 border-[#d3b982]/65 bg-gradient-to-b from-slate-100 via-[#e6ecf7] to-[#d9e2f0]"
  },
  {
    id: "wall-shelves",
    src: "/assets/lobby/wall-shelves.webp",
    className: "absolute inset-x-[2%] top-[11%] h-[51%] bg-cover bg-center",
    fallbackClassName: "absolute inset-x-0 top-[10%] h-[52%] border-y border-[#c6ad86]/55 bg-[#b99b78]/45"
  },
  {
    id: "floor",
    src: "/assets/lobby/floor-planks.webp",
    className: "absolute inset-x-0 bottom-0 h-[38%] bg-cover bg-bottom",
    fallbackClassName:
      "absolute inset-x-0 bottom-0 h-[38%] bg-[repeating-linear-gradient(90deg,rgba(37,23,16,0.35)_0_2px,transparent_2px_58px),repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0_1px,rgba(0,0,0,0.16)_1px_62px),linear-gradient(180deg,#6b4a35_0%,#3d271c_100%)]"
  },
  {
    id: "furniture",
    src: "/assets/lobby/furniture-center.webp",
    className: "absolute left-1/2 bottom-[4%] h-[32%] w-[58%] -translate-x-1/2 bg-contain bg-no-repeat bg-bottom",
    fallbackClassName: "absolute left-1/2 bottom-[4%] h-[32%] w-[58%] -translate-x-1/2"
  }
];

export const lobbyHotspots: LobbyHotspot[] = [
  {
    id: "projects",
    label: "Projects Wing",
    href: "/projects",
    className: "absolute left-[17%] top-[31%] h-[31%] w-[10%] min-w-[120px] [transform:rotateY(17deg)]"
  },
  {
    id: "blog",
    label: "Blog Alcove",
    href: "/blog",
    className: "absolute right-[17%] top-[31%] h-[31%] w-[10%] min-w-[120px] [transform:rotateY(-17deg)]"
  },
  {
    id: "about-lectern",
    label: "Lectern Introduction",
    href: "/about",
    className: "absolute left-1/2 bottom-[5%] h-[18%] w-[22%] min-w-[220px] -translate-x-1/2"
  }
];
