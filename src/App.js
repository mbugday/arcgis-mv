import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import React, { useEffect, useState, useRef, useCallback } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Popup from "@arcgis/core/widgets/Popup.js";
import Home from "@arcgis/core/widgets/Home";
import Search from "@arcgis/core/widgets/Search";
import SceneView from "@arcgis/core/views/SceneView";
import Locate from "@arcgis/core/widgets/Locate";
import ScaleBar from "@arcgis/core/widgets/ScaleBar";

import "./App.css";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/calcite/calcite.css";

import SymbolEditorPanel from "./components/SymbolEditorPanel";
import SymbolEditorUnique from "./components/SymbolEditorUnique";
import FilterOptions from "./components/FilterOptions";
import StyleOptions from "./components/StyleOptions";
import LabelsPanel from "./components/LabelsPanel";
import PopupEditor from "./components/PopupEditor";
import AddLayerPanel from "./components/AddLayerPanel";
import MapToolsPanel from "./components/MapToolsPanel";
import FeatureTableComponent from "./components/FeatureTableComponent";
import LayerListComponent from "./components/LayerListComponent";
import LegendPanel from "./components/LegendPanel";
import BookmarksPanel from "./components/BookmarksPanel";
import BasemapGalleryPanel from "./components/BasemapGalleryPanel";

import { handleToolSelection } from "./tools/handleToolSelection";
import { handleMarkerAddMode } from "./tools/handleMarkerAddMode";
import { setupMarkerHandlers } from "./tools/setupMarkerHandlers";

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
  const [activeBottomPanel, setActiveBottomPanel] = useState("");

  const layerListRef = useRef(null);
  const measureWidgetRef = useRef(null);
  const viewRef = useRef(null);
  const markerLayerRef = useRef(null);
  const selectedMarkerRef = useRef(null);

  const handleLayerSelect = useCallback((layer) => {
    setSelectedLayer(layer);
    window.selectedLayer = layer;
  }, []);

  const handleEditRenderer = useCallback((layer) => {
    setSelectedLayer(layer);
    setActiveRightPanel("edit-renderer-panel");
  }, []);

  const handleRemoveLayer = useCallback((layer) => {
    const view = viewRef.current;
    if (view && view.map) {
      view.map.remove(layer);
    }
  }, []);

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

    const layer3 = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3",
      title: "USA States",
      outFields: ["*"],
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [255, 255, 128, 0.6],
          outline: {
            color: [0, 0, 0],
            width: 1,
          },
        },
      },
    });
    map.add(layer3);

    viewRef.current = view;
    view.when(() => {
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

      const clickHandler = view.on("click", async (event) => {
        try {
          const response = await view.hitTest(event);
          const graphic = response.results.find(
            (result) => result.graphic?.layer
          )?.graphic;

          if (graphic) {
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
            setSelectedLayer(graphic.layer);
          } else {
            view.popup.close();
          }
        } catch (err) {
          console.error("Hit test hatası:", err);
        }
      });

      setupMarkerHandlers({
        view,
        markerLayerRef,
        selectedMarkerRef,
        setSelectedLayer,
      });
    });

    // Dinamik url için kullandım: http://localhost:3000/?layerUrl=https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USGS_Seismic_Data_v1/FeatureServer&layerTitle=Deprem%20Verisi
    if (viewRef.current) {
      viewRef.current.when(() => {
        const params = new URLSearchParams(window.location.search);
        const layerUrl = params.get("layerUrl");
        const layerTitle = params.get("layerTitle");

        if (layerUrl) {
          const safeLayerTitle =
            typeof layerTitle === "string" ? layerTitle : "Yeni Katman";
          const newLayer = new FeatureLayer({
            url: layerUrl,
            title: safeLayerTitle,
            outFields: ["*"],
          });

          newLayer
            .load()
            .then(() => {
              if (!viewRef.current.map.findLayerById(newLayer.id)) {
                if (!newLayer.popupTemplate) {
                  const fields = newLayer.fields.map((field) => ({
                    label: field.alias || field.name,
                    fieldName: field.name,
                  }));

                  newLayer.popupTemplate = {
                    title: newLayer.title,
                    content: [
                      {
                        type: "fields",
                        fieldInfos: fields,
                      },
                    ],
                  };
                }
                viewRef.current.map.add(newLayer);
                console.log(
                  "URL'den katman başarıyla eklendi:",
                  newLayer.title
                );
              }
            })
            .catch((error) => {
              console.error("URL'den katman ekleme hatası:", error);
              alert(
                "Katman eklenemedi. Lütfen geçerli bir Feature Layer URL'si girin."
              );
            });
        }
      });
    }

    return () => {
      controller.abort();
      if (view) {
        view.graphics.removeAll();
        view.destroy();
      }
      if (measureWidgetRef.current) {
        measureWidgetRef.current.destroy();
      }
    };
  }, [is3D]);

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

  const handleTool = (tool) => {
    handleToolSelection({
      tool,
      viewRef,
      measureWidgetRef,
      setActiveLeftPanel,
      setActiveRightPanel,
      setActiveMeasureTool,
      activeMeasureTool,
      closeActiveTool,
    });
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

  return (
    <div className="App">
      {/* Soldaki action bar */}
      <calcite-action-bar
        layout="vertical"
        expanded={false}
        className="left-action-bar"
      >
        <calcite-action
          icon="layers"
          text="Katmanlar"
          active={activeLeftPanel === "layers-panel"}
          onclick={() => {
            handleLeftActionClick("layers-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="table"
          text="Tablolar"
          active={activeBottomPanel === "feature-table-panel"}
          onclick={() => {
            setActiveBottomPanel((prev) =>
              prev === "feature-table-panel" ? "" : "feature-table-panel"
            );
            setActiveLeftPanel("");
            setActiveRightPanel("");
          }}
        />
        <calcite-action
          icon="legend"
          text="Lejant"
          active={activeLeftPanel === "legend-panel"}
          onclick={() => {
            handleLeftActionClick("legend-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="bookmark"
          text="Yer İşaretleri"
          active={activeLeftPanel === "bookmarks-panel"}
          onclick={() => {
            handleLeftActionClick("bookmarks-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="basemap"
          text="Altlık Harita"
          active={activeLeftPanel === "basemap-panel"}
          onclick={() => {
            handleLeftActionClick("basemap-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="save"
          text="Harita Görünümünü Kaydet"
          onclick={handleMapExport}
        />
      </calcite-action-bar>

      {/* Sağdaki action bar */}
      <calcite-action-bar
        layout="vertical"
        expanded={false}
        className="right-action-bar"
      >
        <calcite-action
          icon="sliders-horizontal"
          text="Özellikler"
          active={activeRightPanel === "properties-panel"}
          onclick={() => {
            handleRightActionClick("properties-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="palette"
          text="Stiller"
          active={activeRightPanel === "style-panel"}
          onclick={() => {
            handleRightActionClick("style-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="pencil-mark"
          text="Sembol Düzenleme"
          active={activeRightPanel === "edit-renderer-panel"}
          onclick={() => {
            handleRightActionClick("edit-renderer-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="filter"
          text="Filtreler"
          active={activeRightPanel === "filter-panel"}
          onclick={() => {
            handleRightActionClick("filter-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="tag"
          text="Etiketler"
          active={activeRightPanel === "labels-panel"}
          onclick={() => {
            handleRightActionClick("labels-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="measure"
          text="Harita Araçları"
          active={activeRightPanel === "map-tools-panel"}
          onclick={() => {
            handleRightActionClick("map-tools-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="pencil"
          text="Çizim Araçları"
          onclick={() => {
            handleTool("draw");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon="popup"
          text="Pop-up"
          active={activeRightPanel === "popup-editor-panel"}
          onclick={() => {
            handleRightActionClick("popup-editor-panel");
            setActiveBottomPanel("");
          }}
        />
        <calcite-action
          icon={is3D ? "map" : "globe"}
          text={is3D ? "2D" : "3D"}
          onclick={() => {
            setIs3D((prev) => !prev);
            setActiveLeftPanel("");
            setActiveRightPanel("");
          }}
        />
        <calcite-action
          icon="pin"
          text="Marker Ekle"
          active={isMarkerMode}
          appearance={isMarkerMode ? "transparent" : "solid"}
          onclick={() => {
            handleMarkerAddMode({
              viewRef,
              markerLayerRef,
              isMarkerMode,
              setIsMarkerMode,
              setActiveMeasureTool,
              closeActiveTool,
              setMarkerGraphics,
              selectedMarkerRef,
            });
            setActiveBottomPanel("");
            setActiveLeftPanel("");
            setActiveRightPanel("");
          }}
        />
      </calcite-action-bar>

      <div
        className={`container 
    ${activeLeftPanel ? "left-panel-open" : ""} 
    ${activeRightPanel ? "right-panel-open" : ""} 
    ${activeBottomPanel === "feature-table-panel" ? "bottom-panel-open" : ""}`}
      >
        <div id="mapViewDiv" className="map-view"></div>

        {/* Soldaki paneller */}
        <div
          id="layers-panel"
          className={`panel left-panel ${
            activeLeftPanel === "layers-panel" ? "active" : ""
          }`}
        >
          {activeLeftPanel === "layers-panel" && (
            <LayerListComponent
              key={is3D ? "3d" : "2d"}
              view={viewRef.current}
              onLayerSelect={handleLayerSelect}
              onEditRenderer={handleEditRenderer}
              onRemoveLayer={handleRemoveLayer}
              layerListRef={layerListRef}
              activePanel={activeLeftPanel}
            />
          )}
          <calcite-button
            id="add-layer"
            onClick={() => {
              setLayerUrl("");
              setLayerTitle("");
              setIsLayerModalOpen(true);
            }}
          >
            Katman Ekle
          </calcite-button>
          <AddLayerPanel
            isLayerModalOpen={isLayerModalOpen}
            setIsLayerModalOpen={setIsLayerModalOpen}
            layerUrl={layerUrl}
            setLayerUrl={setLayerUrl}
            layerTitle={layerTitle}
            setLayerTitle={setLayerTitle}
            viewRef={viewRef}
            setLayers={setLayers}
          />
        </div>
        {activeBottomPanel === "feature-table-panel" && (
          <div id="feature-table-panel" className="bottom-panel active">
            <FeatureTableComponent
              view={viewRef.current}
              selectedLayer={selectedLayer}
            />
          </div>
        )}
        <div
          id="legend-panel"
          className={`panel left-panel ${
            activeLeftPanel === "legend-panel" ? "active" : ""
          }`}
        >
          <LegendPanel
            view={viewRef.current}
            selectedLayer={selectedLayer}
            activePanel={activeLeftPanel}
          />
        </div>
        <div
          id="bookmarks-panel"
          className={`panel left-panel ${
            activeLeftPanel === "bookmarks-panel" ? "active" : ""
          }`}
        >
          {activeLeftPanel === "bookmarks-panel" && (
            <BookmarksPanel
              view={viewRef.current}
              activePanel={activeLeftPanel}
            />
          )}
        </div>
        <div
          id="basemap-panel"
          className={`panel left-panel ${
            activeLeftPanel === "basemap-panel" ? "active" : ""
          }`}
        >
          <BasemapGalleryPanel
            view={viewRef.current}
            activePanel={activeLeftPanel}
          />
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
          <div className="panel-content">
            <h3>Sembol Düzenleme</h3>
            {selectedLayer ? (
              selectedLayer.renderer?.type === "unique-value" ? (
                <SymbolEditorUnique
                  selectedLayer={selectedLayer}
                  setActiveRightPanel={setActiveRightPanel}
                />
              ) : (
                <SymbolEditorPanel
                  selectedLayer={selectedLayer}
                  setActiveRightPanel={setActiveRightPanel}
                />
              )
            ) : (
              <p>Katman sembolünü düzenlemek için bir katman seçiniz.</p>
            )}
          </div>
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
                filters={filters}
                setFilters={setFilters}
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
            <h3>Etiketler</h3>
            {selectedLayer ? (
              <LabelsPanel
                selectedLayer={selectedLayer}
                labels={labels}
                setLabels={setLabels}
              />
            ) : (
              <p>Etiket ekleyebilmek için lütfen bir katman seçiniz.</p>
            )}
          </div>
        </div>
        <MapToolsPanel
          activeRightPanel={activeRightPanel}
          handleToolSelection={handleTool}
        />
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
      </div>
    </div>
  );
}

export default App;
