import React, { useEffect, useRef } from "react";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";

const BasemapGalleryPanel = ({ view, activePanel }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!view || activePanel !== "basemap-panel") return;

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const galleryDiv = document.createElement("div");
    container.appendChild(galleryDiv);

    const widget = new BasemapGallery({
      view,
      container: galleryDiv,
    });

    widgetRef.current = widget;

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
      container.innerHTML = "";
    };
  }, [view, activePanel]);

  return <div ref={containerRef} className="panel-content" />;
};

export default BasemapGalleryPanel;
