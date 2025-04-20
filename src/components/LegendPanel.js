import React, { useEffect, useRef } from "react";
import Legend from "@arcgis/core/widgets/Legend";

const LegendPanel = ({ view, selectedLayer, activePanel }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!view || !containerRef.current || activePanel !== "legend-panel")
      return;

    const containerElement = containerRef.current;

    const widgetContainer = document.createElement("div");
    containerElement.innerHTML = "";
    containerElement.appendChild(widgetContainer);

    if (widgetRef.current) {
      widgetRef.current.destroy();
      widgetRef.current = null;
    }

    const legend = new Legend({
      view,
      container: widgetContainer,
      layerInfos: selectedLayer
        ? [{ layer: selectedLayer }]
        : view.map.layers.map((layer) => ({ layer })),
    });

    widgetRef.current = legend;

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
      if (containerElement.contains(widgetContainer)) {
        containerElement.removeChild(widgetContainer);
      }
    };
  }, [view, selectedLayer, activePanel]);

  return <div ref={containerRef} className="panel-content" />;
};

export default LegendPanel;
