import { useEffect, useRef, useState, type ReactNode } from "react";
import { Viewer, ImageryLayer } from "resium";
import {
  type Viewer as CesiumViewer,
  type ImageryProvider,
  SceneMode,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  createOfflineImageryProvider,
  offlineTerrainProvider,
} from "@/lib/cesium-config";

interface GlobeProps {
  children?: ReactNode;
  className?: string;
  sceneMode?: SceneMode;
  onViewerReady?: (viewer: CesiumViewer) => void;
}

const creditContainer = document.createElement("div");

export default function Globe({
  children,
  className,
  sceneMode = SceneMode.SCENE3D,
  onViewerReady,
}: GlobeProps) {
  const [imageryProvider, setImageryProvider] =
    useState<ImageryProvider | null>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);

  useEffect(() => {
    createOfflineImageryProvider().then(setImageryProvider);
  }, []);

  if (!imageryProvider) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-white ${className ?? ""}`}
      >
        Loading globe...
      </div>
    );
  }

  return (
    <Viewer
      className={className}
      full
      ref={(e) => {
        if (e?.cesiumElement && e.cesiumElement !== viewerRef.current) {
          viewerRef.current = e.cesiumElement;
          onViewerReady?.(e.cesiumElement);
        }
      }}
      baseLayer={false}
      terrainProvider={offlineTerrainProvider}
      sceneMode={sceneMode}
      animation={false}
      timeline={false}
      baseLayerPicker={false}
      fullscreenButton={false}
      geocoder={false}
      homeButton={false}
      infoBox={false}
      sceneModePicker={false}
      selectionIndicator={false}
      navigationHelpButton={false}
      creditContainer={creditContainer}
    >
      <ImageryLayer
        imageryProvider={imageryProvider}
      />
      {children}
    </Viewer>
  );
}
