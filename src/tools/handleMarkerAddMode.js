import Graphic from "@arcgis/core/Graphic";

export const handleMarkerAddMode = ({
  viewRef,
  markerLayerRef,
  isMarkerMode,
  setIsMarkerMode,
  setActiveMeasureTool,
  closeActiveTool,
  setMarkerGraphics,
  selectedMarkerRef,
}) => {
  const view = viewRef.current;
  if (!view) return;

  if (isMarkerMode) {
    if (view.clickHandler) {
      view.clickHandler.remove();
      view.clickHandler = null;
    }
    setIsMarkerMode(false);
    setActiveMeasureTool(null);
    document.getElementById("mapViewDiv").classList.remove("add-marker-mode");
    return;
  }

  closeActiveTool();
  setActiveMeasureTool("add-marker");
  setIsMarkerMode(true);
  document.getElementById("mapViewDiv").classList.add("add-marker-mode");

  const clickHandler = view.on("click", (event) => {
    event.stopPropagation();
    event.preventDefault();

    const point = {
      type: "point",
      longitude: event.mapPoint.longitude,
      latitude: event.mapPoint.latitude,
    };

    const marker = new Graphic({
      geometry: point,
      symbol: {
        type: "picture-marker",
        url: "https://static.arcgis.com/images/Symbols/Shapes/RedPin1LargeB.png",
        width: "24px",
        height: "24px",
      },
      popupTemplate: {
        title: "Marker",
        content: `Longitude: ${point.longitude.toFixed(
          4
        )}, Latitude: ${point.latitude.toFixed(4)}`,
        actions: [
          {
            title: "Marker'ı Sil",
            id: "delete-marker",
            className: "esri-icon-trash",
          },
        ],
      },
    });

    markerLayerRef.current.add(marker);
    setMarkerGraphics((prev) => [...prev, marker]);

    selectedMarkerRef.current = marker;
  });

  viewRef.current.clickHandler = clickHandler;
};
