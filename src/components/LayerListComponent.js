import React, { useEffect, useRef } from "react";
import LayerList from "@arcgis/core/widgets/LayerList";

const LayerListComponent = ({
  view,
  onLayerSelect,
  onEditRenderer,
  onRemoveLayer,
  layerListRef,
  activePanel,
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!view || !containerRef.current || activePanel !== "layers-panel")
      return;

    const localContainer = containerRef.current;

    const widgetContainer = document.createElement("div");
    localContainer.appendChild(widgetContainer);

    const layerList = new LayerList({
      view,
      container: widgetContainer,
      dragEnabled: true,
      listItemCreatedFunction: (event) => {
        const item = event.item;
        item.actionsSections = [
          [
            {
              title: "Select",
              className: "esri-icon-layers",
              id: "select-layer",
            },
            {
              title: "Edit Symbol",
              className: "esri-icon-edit",
              id: "edit-renderer",
            },
            {
              title: "Remove Layer",
              className: "esri-icon-close",
              id: "remove-layer",
            },
          ],
        ];
      },
    });

    layerList.on("trigger-action", (event) => {
      const selectedLayer = event.item.layer;

      switch (event.action.id) {
        case "select-layer":
          onLayerSelect(selectedLayer);
          break;
        case "edit-renderer":
          onEditRenderer(selectedLayer);
          break;
        case "remove-layer":
          onRemoveLayer(selectedLayer);
          break;
        default:
          break;
      }
    });

    widgetRef.current = widgetContainer;
    layerListRef.current = layerList;

    return () => {
      if (layerListRef.current) {
        layerListRef.current.destroy();
        layerListRef.current = null;
      }
      if (localContainer && widgetContainer.parentNode === localContainer) {
        localContainer.removeChild(widgetContainer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activePanel, onLayerSelect, onEditRenderer, onRemoveLayer]);

  return <div ref={containerRef} className="panel-content" />;
};

export default LayerListComponent;
