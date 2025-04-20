import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Sketch from "@arcgis/core/widgets/Sketch";
import DistanceMeasurement2D from "@arcgis/core/widgets/DistanceMeasurement2D";
import AreaMeasurement2D from "@arcgis/core/widgets/AreaMeasurement2D";

export const handleToolSelection = async ({
  tool,
  viewRef,
  measureWidgetRef,
  setActiveLeftPanel,
  setActiveRightPanel,
  setActiveMeasureTool,
  activeMeasureTool,
  closeActiveTool,
}) => {
  const view = viewRef.current;
  if (!view) return;

  setActiveLeftPanel("");
  setActiveRightPanel("");

  if (activeMeasureTool === tool) {
    closeActiveTool();
    return;
  }

  closeActiveTool();

  let newWidget;
  
  if (tool === "measure-distance") {
    if (view.type === "2d") {
      newWidget = new DistanceMeasurement2D({ view });
    } else if (view.type === "3d") {
      const { default: DirectLineMeasurement3D } = await import(
        "@arcgis/core/widgets/DirectLineMeasurement3D"
      );
      newWidget = new DirectLineMeasurement3D({ view });
    }
  } else if (tool === "measure-area") {
    if (view.type === "2d") {
      newWidget = new AreaMeasurement2D({ view });
    } else if (view.type === "3d") {
      const { default: AreaMeasurement3D } = await import(
        "@arcgis/core/widgets/AreaMeasurement3D"
      );
      newWidget = new AreaMeasurement3D({ view });
    }
  }

  if (newWidget) {
    view.ui.add(newWidget, "top-right");
    measureWidgetRef.current = newWidget;
    setActiveMeasureTool(tool);
  } else if (tool === "coordinates") {
    const clickHandler = view.on("click", (event) => {
      event.stopPropagation();
      event.preventDefault();

      view.graphics.removeAll();
      if (!event.mapPoint) return;

      const point = {
        type: "point",
        longitude: event.mapPoint.longitude,
        latitude: event.mapPoint.latitude,
      };

      const graphic = new Graphic({
        geometry: point,
        symbol: {
          type: "simple-marker",
          color: "orange",
          size: "12px",
          outline: { color: "white", width: 1 },
        },
        popupTemplate: {
          title: "Koordinatlar",
          content: `Longitude: ${point.longitude.toFixed(
            4
          )}, Latitude: ${point.latitude.toFixed(4)}`,
        },
      });

      view.graphics.add(graphic);

      view.popup.open({
        title: "Koordinatlar",
        location: event.mapPoint,
        content: `Enlem: ${event.mapPoint.latitude.toFixed(
          6
        )}<br>Boylam: ${event.mapPoint.longitude.toFixed(6)}`,
      });

      view.popup.visible = true;
      view.popup.autoOpenEnabled = true;
    });

    viewRef.current.clickHandler = clickHandler;
    setActiveMeasureTool("coordinates");
  } else if (tool === "draw") {
    const graphicsLayer = new GraphicsLayer();
    view.map.add(graphicsLayer);

    const sketch = new Sketch({
      layer: graphicsLayer,
      view: view,
      creationMode: "continuous",
      layout: "vertical",
      updateOnGraphicClick: true,
    });

    view.ui.add(sketch, "top-right");
    viewRef.current.sketch = sketch;
    setActiveMeasureTool("draw");
  }
};
