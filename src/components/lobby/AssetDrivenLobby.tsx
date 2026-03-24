import { lobbyHotspots, lobbyLayers } from "@/config/lobbyScene";
import LobbyHotspotLink from "@/components/lobby/LobbyHotspotLink";

export default function AssetDrivenLobby() {
  return (
    <section className="relative h-[calc(100vh-57px)] w-full overflow-hidden [perspective:1200px]">
      {/* Base room color so scene is never blank */}
      <div className="absolute inset-0 bg-[#ccb390]" />

      {/* Layer stack: each layer has image path + fallback styling */}
      {lobbyLayers.map((layer) => (
        <div key={layer.id} className={layer.fallbackClassName}>
          <div
            className={layer.className}
            style={{ backgroundImage: `url("${layer.src}")` }}
            aria-hidden
          />
        </div>
      ))}

      {/* Wall/floor separator */}
      <div className="absolute inset-x-0 top-[62%] z-20 h-[6px] bg-[#7c573d] shadow-[0_-8px_18px_rgba(0,0,0,0.25)]" />

      {/* Config-driven interactive regions */}
      {lobbyHotspots.map((spot) => (
        <LobbyHotspotLink key={spot.id} href={spot.href} label={spot.label} className={spot.className} />
      ))}
    </section>
  );
}
