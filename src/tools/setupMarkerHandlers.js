import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export const setupMarkerHandlers = ({
  view,
  markerLayerRef,
  selectedMarkerRef,
  setSelectedLayer,
}) => {
  const markerLayer = new GraphicsLayer();
  view.map.add(markerLayer);
  markerLayerRef.current = markerLayer;

  if (view.popup?.on) {
    view.popup.on("trigger-action", (event) => {
      if (event.action.id === "delete-marker") {
        const graphic = view.popup.selectedFeature;
        if (graphic && markerLayerRef.current.graphics.includes(graphic)) {
          markerLayerRef.current.remove(graphic);
          view.popup.close();
        }
      }
    });
  } else if (view.popup?.viewModel?.on) {
    view.popup.viewModel.on("trigger-action", (event) => {
      if (event.action.id === "delete-marker") {
        const graphic = event.target.selectedFeature;
        if (graphic && markerLayerRef.current.graphics.includes(graphic)) {
          markerLayerRef.current.remove(graphic);
          view.popup.close();
        }
      }
    });
  }

  view.on("click", (event) => {
    view.hitTest(event).then((response) => {
      const markerResult = response.results.find(
        (result) => result.graphic?.layer === markerLayerRef.current
      );

      if (markerResult) {
        const graphic = markerResult.graphic;

        if (view.type === "2d") {
          view.popup.open({
            location: graphic.geometry,
            features: [graphic],
          });
        } else if (view.type === "3d") {
          view.popup.viewModel.selectedFeature = graphic;
          view.popup.viewModel.open({
            location: graphic.geometry,
            features: [graphic],
          });
        }

        return;
      }

      const layerHit = response.results.find((result) => result.layer);
      if (layerHit) {
        console.log(`Seçilen katman: ${layerHit.layer.title}`);
        setSelectedLayer(layerHit.layer);
      }
    });
  });
};
