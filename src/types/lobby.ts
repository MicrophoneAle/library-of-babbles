export interface LobbyLayer {
  id: string;
  src: string;
  className: string;
  fallbackClassName: string;
  blendClassName?: string;
}

export interface LobbyHotspot {
  id: string;
  label: string;
  href: string;
  className: string;
}
