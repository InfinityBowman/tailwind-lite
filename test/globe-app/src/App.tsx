import { useState, useCallback } from "react";
import { Entity, PolylineGraphics, PointGraphics, LabelGraphics } from "resium";
import {
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  type Viewer as CesiumViewer,
} from "cesium";
import Globe from "@/components/Globe";

const CITIES = [
  { name: "New York", lon: -74.006, lat: 40.7128 },
  { name: "London", lon: -0.1276, lat: 51.5074 },
  { name: "Tokyo", lon: 139.6917, lat: 35.6895 },
  { name: "Sydney", lon: 151.2093, lat: -33.8688 },
  { name: "São Paulo", lon: -46.6333, lat: -23.5505 },
  { name: "Cairo", lon: 31.2357, lat: 30.0444 },
];

const ROUTES = [
  { from: "New York", to: "London", color: Color.CYAN },
  { from: "London", to: "Tokyo", color: Color.YELLOW },
  { from: "Tokyo", to: "Sydney", color: Color.LIME },
  { from: "Sydney", to: "São Paulo", color: Color.ORANGE },
  { from: "São Paulo", to: "Cairo", color: Color.MAGENTA },
  { from: "Cairo", to: "New York", color: Color.AQUA },
];

function getCity(name: string) {
  return CITIES.find((c) => c.name === name)!;
}

export default function App() {
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);
  const [overlays, setOverlays] = useState({
    cities: true,
    routes: true,
  });

  const flyTo = useCallback(
    (lon: number, lat: number) => {
      viewer?.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, 5_000_000),
        duration: 1.5,
      });
    },
    [viewer],
  );

  return (
    <div className="relative h-full w-full">
      <Globe onViewerReady={setViewer}>
        {overlays.cities &&
          CITIES.map((city) => (
            <Entity
              key={city.name}
              name={city.name}
              position={Cartesian3.fromDegrees(city.lon, city.lat)}
            >
              <PointGraphics
                pixelSize={8}
                color={Color.WHITE}
                outlineColor={Color.BLACK}
                outlineWidth={1}
              />
              <LabelGraphics
                text={city.name}
                font="14px Inter, system-ui, sans-serif"
                fillColor={Color.WHITE}
                outlineColor={Color.BLACK}
                outlineWidth={2}
                style={LabelStyle.FILL_AND_OUTLINE}
                verticalOrigin={VerticalOrigin.BOTTOM}
                pixelOffset={new Cartesian2(0, -12)}
              />
            </Entity>
          ))}

        {overlays.routes &&
          ROUTES.map((route) => {
            const from = getCity(route.from);
            const to = getCity(route.to);
            return (
              <Entity key={`${route.from}-${route.to}`}>
                <PolylineGraphics
                  positions={Cartesian3.fromDegreesArray([
                    from.lon, from.lat,
                    to.lon, to.lat,
                  ])}
                  width={2}
                  material={route.color.withAlpha(0.7)}
                />
              </Entity>
            );
          })}
      </Globe>

      {/* Control panel */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 rounded-lg bg-black/70 p-4 text-sm text-white backdrop-blur-sm">
        <h2 className="text-base font-semibold">CesiumJS Globe Demo</h2>
        <p className="text-white/60">Fully offline — no API keys, no network</p>

        <div className="border-t border-white/20 pt-3">
          <h3 className="mb-2 font-medium">Overlays</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.cities}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, cities: e.target.checked }))
              }
              className="accent-cyan-400"
            />
            Cities
          </label>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={overlays.routes}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, routes: e.target.checked }))
              }
              className="accent-cyan-400"
            />
            Routes
          </label>
        </div>

        <div className="border-t border-white/20 pt-3">
          <h3 className="mb-2 font-medium">Fly to</h3>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => flyTo(city.lon, city.lat)}
                className="rounded bg-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/20"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
