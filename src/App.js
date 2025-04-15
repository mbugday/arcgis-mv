import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import React, { useEffect, useState, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import LayerList from "@arcgis/core/widgets/LayerList";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import Legend from "@arcgis/core/widgets/Legend";
import Graphic from "@arcgis/core/Graphic";
import DistanceMeasurement2D from "@arcgis/core/widgets/DistanceMeasurement2D";
import AreaMeasurement2D from "@arcgis/core/widgets/AreaMeasurement2D";
import Popup from "@arcgis/core/widgets/Popup.js";
import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Bookmarks from "@arcgis/core/widgets/Bookmarks";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Home from "@arcgis/core/widgets/Home";
import Search from "@arcgis/core/widgets/Search";
import SceneView from "@arcgis/core/views/SceneView";
import Locate from "@arcgis/core/widgets/Locate";
import ScaleBar from "@arcgis/core/widgets/ScaleBar";
import * as projection from "@arcgis/core/geometry/projection";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import "./App.css";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/calcite/calcite.css";

function App() {
  const [activeLeftPanel, setActiveLeftPanel] = useState("");
  const [activeRightPanel, setActiveRightPanel] = useState("");
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [filters, setFilters] = useState([
    { field: null, value: "", condition: "=" },
  ]);
  const [labels, setLabels] = useState([
    {
      field: "",
      filter: "",
      style: { color: "black", fontSize: "12px" },
      placement: "above-center",
    },
  ]);

  const [layers, setLayers] = useState([]);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);
  const [layerUrl, setLayerUrl] = useState("");
  const [layerTitle, setLayerTitle] = useState("");
  const [activeMeasureTool, setActiveMeasureTool] = useState("");
  const [is3D, setIs3D] = useState(false);
  const [markerGraphics, setMarkerGraphics] = useState([]);
  const [isMarkerMode, setIsMarkerMode] = useState(false);

  const filterInputRefs = useRef([]);
  const labelInputRefs = useRef([]);
  const layerListRef = useRef(null);
  const measureWidgetRef = useRef(null);
  const viewRef = useRef(null);
  const bookmarksRef = useRef(null);
  const basemapGalleryRef = useRef(null);
  const markerLayerRef = useRef(null);
  const selectedMarkerRef = useRef(null);

  useEffect(() => {
    defineCustomElements(window);
    const controller = new AbortController();

    const map = new Map({
      basemap: "streets-vector",
      ground: is3D ? "world-elevation" : null,
    });

    const view = is3D
      ? new SceneView({
          container: "mapViewDiv",
          map,
          camera: {
            position: {
              longitude: -100,
              latitude: 38,
              z: 2500,
            },
            tilt: 60,
          },
          popup: new Popup({
            dockEnabled: true,
            highlightEnabled: true,
            dockOptions: {
              buttonEnabled: true,
              breakpoint: false,
            },
          }),
        })
      : new MapView({
          container: "mapViewDiv",
          map,
          zoom: 3,
          center: [-100, 38],
          popupEnabled: true,
          popup: new Popup({
            dockEnabled: true,
            highlightEnabled: true,
            dockOptions: {
              buttonEnabled: true,
              breakpoint: false,
            },
          }),
        });

    view.ui.move("zoom", "bottom-right");

    const homeWidget = new Home({
      view: view,
    });
    view.ui.add(homeWidget, "bottom-right");
    const searchWidget = new Search({
      view: view,
      //includeDefaultSources: true,
      state: "disabled",
    });
    view.ui.add(searchWidget, "bottom-right");

    const layer1 = new FeatureLayer({
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0",
      title: "Thermal Hotspots",
      outFields: ["*"],
      popupTemplate: {
        title: "Thermal Hotspot & Fire Activity",
        content: `
          <b>Brightness:</b> {bright_ti4} K<br>
          <b>Confidence:</b> {confidence} %<br>
          <b>Fire Radiative Power (FRP):</b> {frp} MW<br>
          <b>Acquisition Date:</b> {acq_date} {acq_time} UTC<br>
          <b>Satellite:</b> {satellite} ({daynight})<br>
          <b>Source:</b> {source}
        `,
        fieldInfos: [
          {
            fieldName: "bright_ti4",
            format: { places: 2 },
          },
          {
            fieldName: "confidence",
            format: { places: 0 },
          },
          {
            fieldName: "frp",
            format: { places: 2 },
          },
          {
            fieldName: "acq_date",
            format: { dateFormat: "short-date" },
          },
          {
            fieldName: "acq_time",
            format: { places: 0 },
          },
        ],
      },
      renderer: {
        type: "simple", // Renderer tipi
        symbol: {
          type: "simple-marker", // Nokta sembolü
          style: "circle",
          color: "red",
          size: "8px", // Nokta boyutu
          outline: {
            color: "white",
            width: 1,
          },
        },
        label: "Thermal Hotspots",
        description: "VIIRS Thermal Hotspots and Fire Activity",
      },
    });

    const layer2 = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
      title: "USA Cities",
      outFields: ["*"],
      popupTemplate: {
        title: "{AREANAME}",
        content: `
          <b>State Name:</b> {AREANAME}<br>
          <b>Capital:</b> {CAPITAL}<br>
          <b>Population (2000):</b> {POP2000}<br>
          <b>Area:</b> {SHAPE} square miles
        `,
        fieldInfos: [
          {
            fieldName: "POP2000",
            format: { digitSeparator: true, places: 0 }, // Binlik ayrımcı
          },
          {
            fieldName: "AREA",
            format: { digitSeparator: true, places: 2 }, // Virgülden sonra 2 basamak
          },
        ],
      },
      renderer: {
        type: "class-breaks",
        field: "POP2000",
        classBreakInfos: [
          {
            minValue: 0,
            maxValue: 100000,
            symbol: {
              type: "simple-marker",
              size: 6,
              color: "blue",
              outline: {
                color: "white",
                width: 0.5,
              },
            },
            label: "0 - 100,000",
          },
          {
            minValue: 100001,
            maxValue: 500000,
            symbol: {
              type: "simple-marker",
              size: 10,
              color: "green",
              outline: {
                color: "white",
                width: 0.5,
              },
            },
            label: "100,001 - 500,000",
          },
          {
            minValue: 500001,
            maxValue: 1000000,
            symbol: {
              type: "simple-marker",
              size: 14,
              color: "orange",
              outline: {
                color: "white",
                width: 0.5,
              },
            },
            label: "500,001 - 1,000,000",
          },
          {
            minValue: 1000001,
            maxValue: 10000000,
            symbol: {
              type: "simple-marker",
              size: 18,
              color: "red",
              outline: {
                color: "white",
                width: 0.5,
              },
            },
            label: "1,000,001+",
          },
        ],
        defaultSymbol: {
          type: "simple-marker",
          size: 4,
          color: "gray",
          outline: {
            color: "white",
            width: 0.5,
          },
        },
        defaultLabel: "Other",
      },
    });

    layer1
      .when(() => {
        console.log("Layer 1 loaded.");
      })
      .catch((error) => {
        console.error("Layer 1 failed to load:", error);
      });

    layer2
      .when(() => {
        console.log("Layer 2 loaded.");
      })
      .catch((error) => {
        console.error("Layer 2 failed to load:", error);
      });

    map.addMany([layer1, layer2]);

    viewRef.current = view;
    const viewWidgets = (view) => {
      const layerListDiv = document.getElementById("layerListDiv");

      if (layerListRef.current) {
        layerListRef.current.view = view;
      } else {
        const layerList = new LayerList({
          view,
          container: layerListDiv,
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

          if (event.action.id === "select-layer") {
            setSelectedLayer(selectedLayer);
            updateFeatureTable(selectedLayer);
            updateLegend(selectedLayer);
          }

          if (event.action.id === "edit-renderer") {
            setSelectedLayer(selectedLayer);
            showRendererEditor(selectedLayer);
            setActiveRightPanel("edit-renderer-panel");
          }

          if (event.action.id === "remove-layer") {
            view.map.remove(selectedLayer);
          }
        });

        layerListRef.current = layerList;
      }

      const bookmarksDiv = document.getElementById("bookmarksDiv");

      if (bookmarksRef.current) {
        bookmarksRef.current.view = view;
      } else {
        const bookmarks = new Bookmarks({
          view,
          container: bookmarksDiv,
          editingEnabled: true,
        });
        bookmarksRef.current = bookmarks;
      }

      const basemapDiv = document.getElementById("basemapDiv");

      if (basemapGalleryRef.current) {
        basemapGalleryRef.current.view = view;
      } else {
        const basemapGallery = new BasemapGallery({
          view,
          container: basemapDiv,
        });
        basemapGalleryRef.current = basemapGallery;
      }

      const locateWidget = new Locate({
        view: viewRef.current,
      });
      viewRef.current.ui.add(locateWidget, {
        position: "bottom-right",
      });

      const scaleBar = new ScaleBar({
        view: viewRef.current,
        unit: "metric",
      });
      viewRef.current.ui.add(scaleBar, {
        position: "bottom-left",
      });
    };

    view.when(() => {
      viewWidgets(view);

      const markerLayer = new GraphicsLayer();
      view.map.add(markerLayer);
      markerLayerRef.current = markerLayer;

      if (view.popup?.on) {
        // 2D MapView
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
        // 3D SceneView
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

      view.popup.on("trigger-action", (event) => {
        const selectedFeature = view.popup.selectedFeature;

        if (
          event.action.id === "delete-buffer" &&
          selectedFeature?.attributes?.buffer
        ) {
          markerLayerRef.current.remove(selectedFeature);
          view.popup.close();
        }
      });
    });

    const featureTableDiv = document.getElementById("featureTableDiv");
    const updateFeatureTable = async (layer) => {
      featureTableDiv.innerHTML = "";

      const featureTable = new FeatureTable({
        view: view,
        container: featureTableDiv,
        visibleElements: {
          header: true,
          menu: true,
          selectionColumn: true,
          layerDropdown: true,
        },
      });
      if (layer.createQuery) {
        const query = layer.createQuery();
        const results = await layer.queryFeatures(query);
        featureTable.layer = layer;
        featureTable.features = results.features;
        featureTable.refresh();
        featureTableDiv.style.display = "block";
      } else {
        console.error("createQuery fonksiyonu bu katmanda mevcut değil.");
      }
    };

    const legend = new Legend({
      view: view,
      container: document.getElementById("legendDiv"),
      layerInfos: [
        {
          layer: layer1,
          title: "Thermal Hotspots",
        },
        {
          layer: layer2,
          title: "USA Cities",
        },
      ],
    });

    const updateLegend = (layer) => {
      if (legend) {
        legend.layerInfos = [
          {
            layer: layer,
          },
        ];
      }
    };

    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const markerResult = response.results.find(
          (result) => result.graphic?.layer === markerLayerRef.current
        );

        if (markerResult) {
          const graphic = markerResult.graphic;

          if (view.type === "2d") {
            // 2D: sadece popup göster
            view.popup.open({
              location: graphic.geometry,
              features: [graphic],
            });
          } else if (view.type === "3d") {
            // 3D: SceneView için viewModel üzerinden aç
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
          updateFeatureTable(layerHit.layer);
          updateLegend(layerHit.layer);
        }
      });
    });

    const showRendererEditor = (layer) => {
      const rendererEditorDiv = document.getElementById("rendererEditorDiv");
      rendererEditorDiv.innerHTML = "";

      const currentRenderer = layer.renderer;

      if (currentRenderer.type === "simple") {
        rendererEditorDiv.innerHTML = `
          <h3>Edit Symbol</h3>
          <label>Symbol Color</label>
          <input type="color" id="colorPicker" value="${rgbToHex(
            currentRenderer.symbol.color
          )}" />
          <label>Size</label>
          <input type="number" id="sizeInput" value="${
            currentRenderer.symbol.size || 8
          }" min="1" max="20" />
          <label>Shape</label>
          <select id="shapeSelect">
            <option value="circle" ${
              currentRenderer.symbol.style === "circle" ? "selected" : ""
            }>Circle</option>
            <option value="square" ${
              currentRenderer.symbol.style === "square" ? "selected" : ""
            }>Square</option>
            <option value="triangle" ${
              currentRenderer.symbol.style === "triangle" ? "selected" : ""
            }>Triangle</option>
          </select>
          <button id="saveRendererBtn">Save</button>
        `;
      } else if (currentRenderer.type === "class-breaks") {
        rendererEditorDiv.innerHTML = "<h3>Edit Class Breaks</h3>";

        currentRenderer.classBreakInfos.forEach((info, index) => {
          const classDiv = document.createElement("div");
          classDiv.innerHTML = `
            <h4>Class ${index + 1}</h4>
            <label>Min Value</label>
            <input type="number" value="${info.minValue}" disabled />
            <label>Max Value</label>
            <input type="number" value="${info.maxValue}" disabled />
            <label>Color</label>
            <input type="color" id="colorPicker-${index}" value="${rgbToHex(
            info.symbol.color
          )}" />
            <label>Size</label>
            <input type="number" id="sizeInput-${index}" value="${
            info.symbol.size
          }" min="1" max="20" />
          `;
          rendererEditorDiv.appendChild(classDiv);
        });

        rendererEditorDiv.innerHTML += `
        <h4>New Class</h4>
        <label>Min Value</label>
        <input type="number" id="newMinValue" />
        <label>Max Value</label>
        <input type="number" id="newMaxValue" />
        <label>Color</label>
        <input type="color" id="newColorPicker" />
        <label>Size</label>
        <input type="number" id="newSizeInput" min="1" max="20" />
      `;

        rendererEditorDiv.innerHTML +=
          '<button id="saveRendererBtn">Save</button>';
      }

      document.getElementById("saveRendererBtn").onclick = () => {
        if (currentRenderer.type === "simple") {
          currentRenderer.symbol.color = hexToRgb(
            document.getElementById("colorPicker").value
          );
          currentRenderer.symbol.size = parseInt(
            document.getElementById("sizeInput").value,
            10
          );
          currentRenderer.symbol.style =
            document.getElementById("shapeSelect").value;
        } else if (currentRenderer.type === "class-breaks") {
          const updatedClassBreakInfos = [...currentRenderer.classBreakInfos];

          const newMinValue = parseFloat(
            document.getElementById("newMinValue").value
          );
          const newMaxValue = parseFloat(
            document.getElementById("newMaxValue").value
          );
          const newColor = hexToRgb(
            document.getElementById("newColorPicker").value
          );
          const newSize = parseInt(
            document.getElementById("newSizeInput").value,
            10
          );

          if (
            !isNaN(newMinValue) &&
            !isNaN(newMaxValue) &&
            newColor &&
            newSize
          ) {
            updatedClassBreakInfos.push({
              minValue: newMinValue,
              maxValue: newMaxValue,
              symbol: {
                type: "simple-marker",
                color: newColor,
                size: newSize,
                outline: { color: "black", width: 1 },
              },
              label: `${newMinValue} - ${newMaxValue}`,
            });
          }

          currentRenderer.classBreakInfos = updatedClassBreakInfos;
          layer.renderer = currentRenderer;

          layer.refresh();
          updateLegend(layer);

          rendererEditorDiv.style.display = "none";
          setActiveRightPanel("");
        }
      };

      rendererEditorDiv.style.display = "block";
    };

    const rgbToHex = (rgb) => {
      return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
        .toString(16)
        .slice(1)}`;
    };

    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    return () => {
      controller.abort();
      if (view) {
        view.destroy();
      }
      if (measureWidgetRef.current) {
        measureWidgetRef.current.destroy();
      }
      view.graphics.removeAll();
      view.destroy();
    };
  }, [is3D]);

  const addLayer = async () => {
    if (!layerUrl.trim()) {
      alert("Lütfen geçerli bir URL girin!");
      return;
    }
    const newLayer = new FeatureLayer({ url: layerUrl });
    await newLayer.load();
    newLayer.title = layerTitle?.trim() || newLayer.title || "Yeni Katman";

    try {
      await newLayer.load();
      newLayer.title = layerTitle || newLayer.title || "Yeni Katman";
      viewRef.current.map.add(newLayer);
      setLayers((prevLayers) => [...prevLayers, newLayer]);
      setIsLayerModalOpen(false);
      setLayerUrl("");
      setLayerTitle("");
    } catch (error) {
      alert("Katman yüklenirken hata oluştu. Lütfen geçerli bir URL girin.");
      console.error("Katman yükleme hatası:", error);
    }

    if (!newLayer.popupTemplate) {
      const fields = newLayer.fields.map((field) => {
        return {
          label: field.alias || field.name,
          fieldName: field.name,
        };
      });

      newLayer.popupTemplate = {
        title: layerTitle,
        content: [
          {
            type: "fields",
            fieldInfos: fields,
          },
        ],
      };
    }
  };

  const openLayerModal = () => {
    setLayerUrl("");
    setLayerTitle("");
    setIsLayerModalOpen(true);
  };

  const closeActiveTool = () => {
    const view = viewRef.current;

    if (measureWidgetRef.current) {
      measureWidgetRef.current.viewModel.clear();
      view.ui.remove(measureWidgetRef.current);
      measureWidgetRef.current.destroy();
      measureWidgetRef.current = null;
    }

    if (viewRef.current.clickHandler) {
      viewRef.current.clickHandler.remove();
      viewRef.current.clickHandler = null;
    }

    if (viewRef.current.sketch) {
      viewRef.current.sketch.destroy();
      viewRef.current.sketch = null;
    }

    setActiveMeasureTool(null);
  };

  const handleToolSelection = (tool) => {
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
      newWidget = new DistanceMeasurement2D({ view: view });
    } else if (tool === "measure-area") {
      newWidget = new AreaMeasurement2D({ view: view });
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

  const enableMarkerAddMode = () => {
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

  const performBufferAnalysis = async (view, markerLayer) => {
    const bufferDistance = parseFloat(
      document.getElementById("bufferDistanceInput").value
    );
    if (isNaN(bufferDistance) || bufferDistance <= 0) {
      alert("Lütfen geçerli bir buffer mesafesi girin.");
      return;
    }

    if (!markerLayer.graphics.length) {
      alert("Önce haritaya bir marker ekleyin.");
      return;
    }

    const marker = markerLayer.graphics.getItemAt(
      markerLayer.graphics.length - 1
    );

    await projection.load();

    const projectedGeometry = projection.project(marker.geometry, {
      wkid: 3857, // Web Mercator (metrik sistem)
    });

    const bufferGeometry = geometryEngine.buffer(
      projectedGeometry,
      bufferDistance * 1000,
      "meters"
    );

    const finalBufferGeometry = projection.project(bufferGeometry, {
      wkid: 4326,
    });

    const bufferGraphic = new Graphic({
      geometry: finalBufferGeometry,
      symbol: {
        type: "simple-fill",
        color: [150, 150, 200, 0.4],
        outline: {
          color: [50, 50, 150],
          width: 2,
        },
      },
      attributes: { buffer: true },
      popupTemplate: {
        title: "Buffer Alanı",
        content: "Bu, seçilen marker etrafındaki buffer alanıdır.",
        actions: [
          {
            title: "Buffer'ı Sil",
            id: "delete-buffer",
            className: "esri-icon-trash",
          },
        ],
      },
    });

    markerLayer.graphics.forEach((graphic) => {
      if (graphic.attributes?.buffer) {
        markerLayer.remove(graphic);
      }
    });

    markerLayer.add(bufferGraphic);
    
    const markersInsideBuffer = markerLayer.graphics.filter((graphic) => {
      if (graphic === bufferGraphic || !graphic.geometry) return false;
      const projectedGraphic = projection.project(graphic.geometry, {
        wkid: 3857,
      });
      return geometryEngine.contains(bufferGeometry, projectedGraphic);
    });

    alert(
      `Bu buffer alanı içinde ${markersInsideBuffer.length} marker bulunuyor.`
    );
  };

  const handleLeftActionClick = (panelId) => {
    setActiveLeftPanel(panelId === activeLeftPanel ? "" : panelId);
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  };

  const handleRightActionClick = (panelId) => {
    setActiveRightPanel(panelId === activeRightPanel ? "" : panelId);
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  };

  const handleMapExport = () => {
    const view = viewRef.current;
    if (!view) return;

    view
      .takeScreenshot()
      .then((screenshot) => {
        const link = document.createElement("a");
        link.href = screenshot.dataUrl;
        link.download = "harita-gorunumu.png";
        link.click();
      })
      .catch((error) => {
        console.error("Harita görüntüsü alınamadı:", error);
      });
  };

  const StyleOptions = ({ selectedLayer }) => {
    const getAvailableStyles = (layer) => {
      if (!layer) return [];

      if (layer.title === "Thermal Hotspots") {
        return ["Simple", "Heatmap"];
      }

      if (layer.title === "USA Cities") {
        return ["Simple", "Class Breaks"];
      }

      return [];
    };

    const applyStyle = (styleType) => {
      if (!selectedLayer) return;

      switch (styleType) {
        case "Simple":
          selectedLayer.renderer = {
            type: "simple",
            symbol: {
              type: "simple-marker",
              style: "circle",
              color: "red",
              size: 8,
              outline: {
                color: "white",
                width: 1,
              },
            },
          };
          break;

        case "Heatmap":
          selectedLayer.renderer = {
            type: "heatmap",
            colorStops: [
              { ratio: 0, color: "rgba(255, 255, 255, 0)" },
              { ratio: 0.2, color: "rgba(255, 140, 0, 0.8)" },
              { ratio: 0.4, color: "rgba(255, 69, 0, 0.8)" },
              { ratio: 0.6, color: "rgba(255, 0, 0, 0.8)" },
              { ratio: 1, color: "rgba(139, 0, 0, 0.8)" },
            ],
            maxPixelIntensity: 100,
            minPixelIntensity: 0,
          };
          break;

        case "Class Breaks":
          selectedLayer.renderer = {
            type: "class-breaks",
            field: "POP2000",
            classBreakInfos: [
              {
                minValue: 0,
                maxValue: 100000,
                symbol: {
                  type: "simple-marker",
                  size: 6,
                  color: "blue",
                  outline: {
                    color: "white",
                    width: 0.5,
                  },
                },
                label: "0 - 100,000",
              },
              {
                minValue: 100001,
                maxValue: 500000,
                symbol: {
                  type: "simple-marker",
                  size: 10,
                  color: "green",
                  outline: {
                    color: "white",
                    width: 0.5,
                  },
                },
                label: "100,001 - 500,000",
              },
              {
                minValue: 500001,
                maxValue: 1000000,
                symbol: {
                  type: "simple-marker",
                  size: 14,
                  color: "orange",
                  outline: {
                    color: "white",
                    width: 0.5,
                  },
                },
                label: "500,001 - 1,000,000",
              },
              {
                minValue: 1000001,
                maxValue: 10000000,
                symbol: {
                  type: "simple-marker",
                  size: 18,
                  color: "red",
                  outline: {
                    color: "white",
                    width: 0.5,
                  },
                },
                label: "1,000,001+",
              },
            ],
          };
          break;

        default:
          console.log("Unknown style type:", styleType);
      }

      selectedLayer.refresh();
    };

    const availableStyles = getAvailableStyles(selectedLayer);

    return (
      <div>
        <h3>Stiller</h3>
        {availableStyles.length > 0 ? (
          availableStyles.map((style, index) => (
            <button
              className={"style-opt-button"}
              key={index}
              onClick={() => applyStyle(style)}
            >
              {style}
            </button>
          ))
        ) : (
          <p>Bu katman için herhangi bir stil mevcut değil.</p>
        )}
      </div>
    );
  };

  const FilterOptions = ({ selectedLayer, filters, setFilters }) => {
    useEffect(() => {
      filterInputRefs.current.forEach((ref) => {
        if (ref) {
          ref.focus();
        }
      });
    }, [filters]);

    const handleFieldChange = (index, field) => {
      const newFilters = [...filters];
      newFilters[index].field = field;
      newFilters[index].value = "";
      newFilters[index].condition = "=";
      setFilters(newFilters);
    };

    const handleFilterChange = (index, key, value) => {
      const newFilters = [...filters];
      newFilters[index][key] = value;
      setFilters(newFilters);
    };

    const applyFilters = () => {
      if (!selectedLayer) return;

      const whereClauses = filters
        .filter((filter) => filter.field && filter.value)
        .map(
          (filter) =>
            `${filter.field.name} ${filter.condition} '${filter.value}'`
        )
        .join(" AND ");

      const tagsClause = selectedLayer.tags
        ? selectedLayer.tags.map((tag) => `tags LIKE '%${tag}%'`).join(" OR ")
        : "";

      const finalWhereClause = [whereClauses, tagsClause]
        .filter((clause) => clause !== "")
        .join(" AND ");

      selectedLayer.definitionExpression = finalWhereClause || "1=1";
      selectedLayer.refresh();
    };

    const addFilter = () => {
      setFilters([...filters, { field: null, value: "", condition: "=" }]);
    };

    const removeFilter = (index) => {
      const newFilters = filters.filter((_, i) => i !== index);
      setFilters(newFilters);
      applyFilters();
    };

    const getFilterFields = (layer) => {
      if (!layer || !layer.fields) return [];
      return layer.fields.map((field) => ({
        name: field.name,
        type: field.type,
      }));
    };

    const filterFields = getFilterFields(selectedLayer);

    return (
      <div>
        <h3>Filtreler</h3>
        {filters.map((filter, index) => (
          <div key={index} className="filter-group">
            <label>Filtreleme Alanı:</label>
            <select
              onChange={(e) => {
                const selectedIndex = e.target.value;
                const selectedField = filterFields[selectedIndex];
                handleFieldChange(index, selectedField);
              }}
              value={
                filter.field
                  ? filterFields
                      .findIndex((f) => f.name === filter.field.name)
                      .toString()
                  : ""
              }
            >
              <option value="">Filtreleme alanı</option>
              {filterFields.map((field, index) => (
                <option key={index} value={index}>
                  {field.name}
                </option>
              ))}
            </select>
            {filter.field && (
              <div>
                <label>Koşul:</label>
                <select
                  onChange={(e) =>
                    handleFilterChange(index, "condition", e.target.value)
                  }
                  value={filter.condition}
                >
                  <option value="=">Alanı şu olanlar</option>
                  <option value="<">Alanı şundan küçük olanlar</option>
                  <option value="<=">
                    Alanı şundan küçük veya eşit olanlar
                  </option>
                  <option value=">">Alanı şundan büyük olanlar</option>
                  <option value=">=">
                    Alanı şundan büyük veya eşit olanlar
                  </option>
                </select>

                <label>Değer:</label>
                <input
                  ref={(el) => (filterInputRefs.current[index] = el)}
                  type="text"
                  value={filter.value}
                  onChange={(e) =>
                    handleFilterChange(index, "value", e.target.value)
                  }
                />
                <button
                  className="remove-filter-btn"
                  onClick={() => removeFilter(index)}
                >
                  X
                </button>
              </div>
            )}
          </div>
        ))}
        <button className="filter-add-btn" onClick={addFilter}>
          Filtre Ekle
        </button>
        <button className="filter-apply-btn" onClick={applyFilters}>
          Filtreleri Uygula
        </button>
      </div>
    );
  };

  const initialLabel = {
    field: "",
    filter: "",
    style: { color: "black", fontSize: "12px" },
    placement: "above-center",
  };

  const LabelsPanel = ({ selectedLayer, labels, setLabels, onLabelUpdate }) => {
    useEffect(() => {
      labelInputRefs.current.forEach((ref) => {
        if (ref) {
          ref.focus();
        }
      });
    }, [labels]);

    const handleAddLabel = () => {
      setLabels([...labels, { ...initialLabel }]);
    };

    const handleRemoveLabel = (index) => {
      const newLabels = labels.filter((_, i) => i !== index);
      setLabels(newLabels);
    };

    const handleLabelChange = (index, key, value) => {
      const newLabels = [...labels];
      newLabels[index][key] = value;
      setLabels(newLabels);
    };

    const handleApplyLabels = () => {
      if (selectedLayer && selectedLayer.fields) {
        const labelClasses = labels.map((label) => ({
          labelExpressionInfo: { expression: `$feature.${label.field}` },
          labelPlacement: label.placement,
          symbol: {
            type: "text",
            color: label.style.color,
            font: { size: label.style.fontSize, family: "Arial" },
          },
          where: label.filter,
        }));

        selectedLayer.labelingInfo = labelClasses;
        selectedLayer.labelsVisible = true;
        onLabelUpdate(selectedLayer);
      }
    };

    if (!selectedLayer || !selectedLayer.fields) {
      return <div>Etiketler için bir katman seçin.</div>;
    }

    return (
      <div className="labels-panel">
        <h3>Etiketler</h3>
        {labels.map((label, index) => (
          <div key={index} className="label-group">
            <div>
              <label>Etiket Alanı:</label>
              <select
                value={label.field}
                onChange={(e) =>
                  handleLabelChange(index, "field", e.target.value)
                }
              >
                <option value="">Seçiniz</option>
                {selectedLayer?.fields.map((field, i) => (
                  <option key={i} value={field.name}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Filtre:</label>
              <input
                ref={(el) => (labelInputRefs.current[index] = el)}
                type="text"
                value={label.filter}
                onChange={(e) =>
                  handleLabelChange(index, "filter", e.target.value)
                }
                placeholder="Örnek: POP2000 > 100000"
              />
            </div>
            <div>
              <label>Etiket Stili:</label>
              <input
                type="color"
                value={label.style.color}
                onChange={(e) =>
                  handleLabelChange(index, "style", {
                    ...label.style,
                    color: e.target.value,
                  })
                }
              />
              <input
                type="text"
                value={label.style.fontSize}
                onChange={(e) =>
                  handleLabelChange(index, "style", {
                    ...label.style,
                    fontSize: e.target.value,
                  })
                }
                placeholder="Yazı Boyutu (örn: 12px)"
              />
            </div>
            <div>
              <label>Etiket Yerleşimi:</label>
              <select
                value={label.placement}
                onChange={(e) =>
                  handleLabelChange(index, "placement", e.target.value)
                }
              >
                <option value="above-center">Yukarıda Ortada</option>
                <option value="above-left">Yukarıda Solda</option>
                <option value="above-right">Yukarıda Sağda</option>
                <option value="below-center">Aşağıda Ortada</option>
                <option value="below-left">Aşağıda Solda</option>
                <option value="below-right">Aşağıda Sağda</option>
                <option value="center-center">Ortada</option>
                <option value="center-left">Ortada Solda</option>
                <option value="center-right">Ortada Sağda</option>
              </select>
            </div>
            <button onClick={() => handleRemoveLabel(index)}>
              Etiketi Sil
            </button>
          </div>
        ))}
        <button onClick={handleAddLabel}>Yeni Etiket Ekle</button>
        <button onClick={handleApplyLabels}>Etiketleri Uygula</button>
      </div>
    );
  };

  const updateMapLabels = (layer) => {
    if (layer && layer.labelingInfo) {
      layer.refresh();
    }
  };

  const PopupEditor = ({ selectedLayer }) => {
    const [popupTitle, setPopupTitle] = useState(
      selectedLayer.popupTemplate?.title || selectedLayer.title || "Pop-up"
    );
    const [selectedFields, setSelectedFields] = useState(
      selectedLayer?.fields?.map((f) => ({
        name: f.name,
        label: f.alias || f.name,
        visible: false,
      })) || []
    );

    const toggleField = (index) => {
      const newFields = [...selectedFields];
      newFields[index].visible = !newFields[index].visible;
      setSelectedFields(newFields);
    };

    const applyPopup = () => {
      const visibleFields = selectedFields.filter((f) => f.visible);

      const contentHtml = visibleFields
        .map((field) => `<b>${field.label}:</b> {${field.name}}`)
        .join("<br>");

      selectedLayer.popupTemplate = {
        title: popupTitle,
        content: contentHtml,
        fieldInfos: visibleFields.map((f) => ({
          fieldName: f.name,
          label: f.label,
        })),
      };

      selectedLayer.refresh();
    };

    return (
      <div className="popup-editor">
        <label>Başlık:</label>
        <input
          type="text"
          value={popupTitle}
          onChange={(e) => setPopupTitle(e.target.value)}
        />
        <h4>Gösterilecek Alanlar:</h4>
        {selectedFields.map((field, i) => (
          <div key={i}>
            <input
              type="checkbox"
              checked={field.visible}
              onChange={() => toggleField(i)}
            />
            <label>{field.label}</label>
          </div>
        ))}
        <button onClick={applyPopup}>Pop-up'ı Uygula</button>
      </div>
    );
  };

  return (
    <div className="App">
      {/* Soldaki action bar */}
      <calcite-action-bar
        expandDisabled="false"
        expanded="false"
        layout="vertical"
        className="left-action-bar"
      >
        <calcite-action
          icon="layers"
          text="Katmanlar"
          id="layers"
          active={activeLeftPanel === "layers-panel"}
          onClick={() => handleLeftActionClick("layers-panel")}
        ></calcite-action>
        <calcite-action
          icon="table"
          text="Tablolar"
          id="table"
          active={activeLeftPanel === "table-panel"}
          onClick={() => handleLeftActionClick("table-panel")}
        ></calcite-action>
        <calcite-action
          icon="legend"
          text="Lejant"
          id="legend"
          active={activeLeftPanel === "legend-panel"}
          onClick={() => handleLeftActionClick("legend-panel")}
        ></calcite-action>
        <calcite-action
          icon="bookmark"
          text="Yer İşaretleri"
          id="bookmarks"
          active={activeLeftPanel === "bookmarks-panel"}
          onClick={() => handleLeftActionClick("bookmarks-panel")}
        ></calcite-action>
        <calcite-action
          icon="basemap"
          text="Altlık Harita"
          id="basemap"
          active={activeLeftPanel === "basemap-panel"}
          onClick={() => handleLeftActionClick("basemap-panel")}
        ></calcite-action>
        <calcite-action
          icon="save"
          text="Harita Görünümünü Kaydet"
          id="save-map"
          onClick={() => handleMapExport()}
        ></calcite-action>
      </calcite-action-bar>

      {/* Sağdaki action bar */}
      <calcite-action-bar
        expandDisabled="false"
        expanded="false"
        layout="vertical"
        className="right-action-bar"
      >
        <calcite-action
          icon="sliders-horizontal"
          text="Özellikler"
          id="properties"
          active={activeRightPanel === "properties-panel"}
          onClick={() => handleRightActionClick("properties-panel")}
        ></calcite-action>
        <calcite-action
          icon="palette"
          text="Stiller"
          id="style"
          active={activeRightPanel === "style-panel"}
          onClick={() => handleRightActionClick("style-panel")}
        ></calcite-action>
        <calcite-action
          icon="pencil-mark"
          text="Sembol Düzenleme"
          id="edit-renderer"
          active={activeRightPanel === "edit-renderer-panel"}
          onClick={() => handleRightActionClick("edit-renderer-panel")}
        ></calcite-action>
        <calcite-action
          icon="filter"
          text="Filtreler"
          id="filter"
          active={activeRightPanel === "filter-panel"}
          onClick={() => handleRightActionClick("filter-panel")}
        ></calcite-action>
        <calcite-action
          icon="tag"
          text="Etiketler"
          id="labels"
          active={activeRightPanel === "labels-panel"}
          onClick={() => handleRightActionClick("labels-panel")}
        ></calcite-action>
        <calcite-action
          icon="measure"
          text="Harita Araçları"
          id="map-tools"
          active={activeRightPanel === "map-tools-panel"}
          onClick={() => handleRightActionClick("map-tools-panel")}
        ></calcite-action>
        <calcite-action
          icon="pencil"
          text="Çizim Araçları"
          id="draw"
          active={activeRightPanel === "draw-panel"}
          onClick={() => {
            handleToolSelection("draw");
            //handleRightActionClick("draw-panel");
          }}
        ></calcite-action>
        <calcite-action
          icon="popup"
          text="Pop-up"
          id="popup-editor"
          active={activeRightPanel === "popup-editor-panel"}
          onClick={() => handleRightActionClick("popup-editor-panel")}
        ></calcite-action>
        <calcite-action
          icon={is3D ? "map" : "globe"}
          text={is3D ? "2D" : "3D"}
          onClick={() => setIs3D((prev) => !prev)}
        ></calcite-action>
        <calcite-action
          icon="pin"
          text="Marker Ekle"
          id="add-marker"
          active={isMarkerMode}
          appearance={isMarkerMode ? "transparent" : "solid"}
          onClick={() => enableMarkerAddMode()}
        ></calcite-action>
        <calcite-action
          icon="polygon"
          text="Buffer Analizi"
          id="buffer-analysis"
          active={activeRightPanel === "buffer-analysis-panel"}
          onClick={() => handleRightActionClick("buffer-analysis-panel")}
        ></calcite-action>
      </calcite-action-bar>

      <div
        className={`container ${activeLeftPanel ? "left-panel-open" : ""} ${
          activeRightPanel ? "right-panel-open" : ""
        }`}
      >
        <div id="mapViewDiv" className="map-view"></div>

        {/* Soldaki paneller */}
        <div
          id="layers-panel"
          className={`panel left-panel ${
            activeLeftPanel === "layers-panel" ? "active" : ""
          }`}
        >
          <div id="layerListDiv" className="panel-content"></div>
          <calcite-button
            id="add-layer"
            onClick={() => {
              openLayerModal();
            }}
          >
            Katman Ekle
          </calcite-button>
          {isLayerModalOpen && (
            <div className="layer-modal">
              <h3>Yeni Katman Ekle</h3>
              <label>Katman URL:</label>
              <input
                type="text"
                value={layerUrl}
                onChange={(e) => setLayerUrl(e.target.value)}
                placeholder="Katman URL'sini girin"
              />

              <label>Katman Adı:</label>
              <input
                type="text"
                value={layerTitle}
                onChange={(e) => setLayerTitle(e.target.value)}
                placeholder="Katmanın adını girin"
              />
              <button onClick={addLayer} className="add-layer-confirm">
                Ekle
              </button>
              <button
                onClick={() => setIsLayerModalOpen(false)}
                className="add-layer-cancel"
              >
                İptal
              </button>
            </div>
          )}
        </div>
        <div
          id="table-panel"
          className={`panel left-panel ${
            activeLeftPanel === "table-panel" ? "active" : ""
          }`}
        >
          <div id="featureTableDiv" className="panel-content">
            <label>Herhangi bir katman seçilmedi.</label>
          </div>
        </div>
        <div
          id="legend-panel"
          className={`panel left-panel ${
            activeLeftPanel === "legend-panel" ? "active" : ""
          }`}
        >
          <div id="legendDiv" className="panel-content"></div>
        </div>
        <div
          id="bookmarks-panel"
          className={`panel left-panel ${
            activeLeftPanel === "bookmarks-panel" ? "active" : ""
          }`}
        >
          <div id="bookmarksDiv" className="panel-content"></div>
        </div>
        <div
          id="basemap-panel"
          className={`panel left-panel ${
            activeLeftPanel === "basemap-panel" ? "active" : ""
          }`}
        >
          <div id="basemapDiv" className="panel-content"></div>
        </div>

        {/* Sağdaki paneller */}
        <div
          id="properties-panel"
          className={`panel right-panel ${
            activeRightPanel === "properties-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            {selectedLayer ? (
              <div>
                <h3>Özellikler</h3>
                <p>Title: {selectedLayer.title}</p>
                <p>URL: {selectedLayer.url}</p>
                {/* Diğer özellikler burada göster.*/}
                <h4>Renderer</h4>
                <pre>{JSON.stringify(selectedLayer.renderer, null, 2)}</pre>
              </div>
            ) : (
              <p>Herhangi bir katman seçilmedi.</p>
            )}
          </div>
        </div>
        <div
          id="style-panel"
          className={`panel right-panel ${
            activeRightPanel === "style-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <h3>Stil Ayarları</h3>
            {selectedLayer ? (
              <StyleOptions selectedLayer={selectedLayer} />
            ) : (
              <p>Stil uygulayabilmek için bir katman seçiniz.</p>
            )}
          </div>
        </div>
        <div
          id="edit-renderer-panel"
          className={`panel right-panel ${
            activeRightPanel === "edit-renderer-panel" ? "active" : ""
          }`}
        >
          <div id="rendererEditorDiv" className="renderer-editor"></div>
        </div>
        <div
          id="filter-panel"
          className={`panel right-panel ${
            activeRightPanel === "filter-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <h3>Filtreleme</h3>
            {selectedLayer ? (
              <FilterOptions
                selectedLayer={selectedLayer}
                filters={filters} // Filtre state'ini prop olarak geçir
                setFilters={setFilters} // Filtre güncelleme fonksiyonunu prop olarak geçir
              />
            ) : (
              <p>Filtreleri uygulamak için lütfen bir katman seçin.</p>
            )}
          </div>
        </div>
        <div
          id="labels-panel"
          className={`panel right-panel ${
            activeRightPanel === "labels-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <LabelsPanel
              selectedLayer={selectedLayer}
              labels={labels}
              setLabels={setLabels}
              onLabelUpdate={updateMapLabels}
            />
          </div>
        </div>
        <div
          id="map-tools-panel"
          className={`panel right-panel ${
            activeRightPanel === "map-tools-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <h3>Harita Araçları</h3>
            <div className="map-tools-div">
              <calcite-button
                className="tool-button"
                onClick={() => handleToolSelection("measure-distance")}
              >
                Mesafe Ölçümü
              </calcite-button>
              <calcite-button
                className="tool-button"
                onClick={() => handleToolSelection("measure-area")}
              >
                Alan Ölçümü
              </calcite-button>
              <calcite-button
                icon="arrow"
                className="tool-button"
                onClick={() => handleToolSelection("coordinates")}
              >
                Konum
              </calcite-button>
            </div>
          </div>
        </div>
        <div
          id="popup-editor-panel"
          className={`panel right-panel ${
            activeRightPanel === "popup-editor-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <h3>Pop-up Düzenleme</h3>
            {selectedLayer ? (
              <PopupEditor selectedLayer={selectedLayer} />
            ) : (
              <p>Pop-up düzenlemek için bir katman seçin.</p>
            )}
          </div>
        </div>
        <div
          id="buffer-analysis-panel"
          className={`panel right-panel ${
            activeRightPanel === "buffer-analysis-panel" ? "active" : ""
          }`}
        >
          <div className="panel-content">
            <h3>Buffer (Çevresel) Analiz</h3>
            <label>Buffer Mesafesi</label>
            <input
              type="number"
              id="bufferDistanceInput"
              placeholder="km"
              min="1"
            />
            <button
              onClick={() =>
                performBufferAnalysis(viewRef.current, markerLayerRef.current)
              }
            >
              Analizi Başlat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
