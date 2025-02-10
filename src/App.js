import { defineCustomElements } from "@esri/calcite-components/dist/loader";
import React, { useEffect, useState, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import LayerList from "@arcgis/core/widgets/LayerList";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";
import Legend from "@arcgis/core/widgets/Legend";
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
  const [labels, setLabels] = useState([{ field: "", filter: "", style: { color: "black", fontSize: "12px" }, placement: "above-center" }]);

  const filterInputRefs = useRef([]);
  const labelInputRefs = useRef([]);

  const layerListRef = useRef(null); 

  useEffect(() => {
    defineCustomElements(window);

    const map = new Map({
      basemap: "streets-vector",
    });

    const view = new MapView({
      container: "mapViewDiv",
      map: map,
      zoom: 3,
      center: [-100, 38],
      popup: {
        dockEnabled: false,
        highlightEnabled: true,
      },
    });

    view.ui.move("zoom", "bottom-right");

    const layer1 = new FeatureLayer({
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0",
      title: "Thermal Hotspots",
      outFields: ["event_type"],
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

    map.addMany([layer1, layer2]);

    view.when(() => {
      const layerList = new LayerList({
        view: view,
        container: document.getElementById("layerListDiv"),
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
            ],
          ];
        },
      });
      layerListRef.current = layerList;

      layerList.on("trigger-action", (event) => {
        if (event.action.id === "select-layer") {
          const selectedLayer = event.item.layer;
          console.log(`Selected Layer: ${selectedLayer.title}`);
          setSelectedLayer(selectedLayer);
          updateFeatureTable(selectedLayer);
          updateLegend(selectedLayer);
        }
        if (event.action.id === "edit-renderer") {
          const selectedLayer = event.item.layer;
          setSelectedLayer(selectedLayer);
          showRendererEditor(selectedLayer);
          setActiveRightPanel("edit-renderer-panel");
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
      featureTable.layer = layer;
      featureTable.refresh();
      featureTableDiv.style.display = "block";
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
        const results = response.results;
        if (results.length > 0) {
          const layerHit = results.find((result) => result.layer);
          if (layerHit) {
            console.log(`Seçilen katman: ${layerHit.layer.title}`);
            setSelectedLayer(layerHit.layer);
            updateFeatureTable(layerHit.layer);
            updateLegend(layerHit.layer);
          }
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
      if (view) {
        view.destroy();
      }
    };
  }, []);

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
            <button className={"style-opt-button"} key={index} onClick={() => applyStyle(style)}>
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
      if (!layer) return [];
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
        <button className="filter-add-btn" onClick={addFilter}>Filtre Ekle</button>
        <button className="filter-apply-btn" onClick={applyFilters}>Filtreleri Uygula</button>
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
      if (selectedLayer) {
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
  
    return (
      <div className="labels-panel">
        <h3>Etiketler</h3>
        {labels.map((label, index) => (
          <div key={index} className="label-group">
            <div>
              <label>Etiket Alanı:</label>
              <select
                value={label.field}
                onChange={(e) => handleLabelChange(index, "field", e.target.value)}
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
                onChange={(e) => handleLabelChange(index, "filter", e.target.value)}
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
                onChange={(e) => handleLabelChange(index, "placement", e.target.value)}
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
            <button onClick={() => handleRemoveLabel(index)}>Etiketi Sil</button>
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
          text="Layers"
          id="layers"
          active={activeLeftPanel === "layers-panel"}
          onClick={() => handleLeftActionClick("layers-panel")}
        ></calcite-action>
        <calcite-action
          icon="table"
          text="Table"
          id="table"
          active={activeLeftPanel === "table-panel"}
          onClick={() => handleLeftActionClick("table-panel")}
        ></calcite-action>
        <calcite-action
          icon="legend"
          text="Legend"
          id="legend"
          active={activeLeftPanel === "legend-panel"}
          onClick={() => handleLeftActionClick("legend-panel")}
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
          text="Properties"
          id="properties"
          active={activeRightPanel === "properties-panel"}
          onClick={() => handleRightActionClick("properties-panel")}
        ></calcite-action>
        <calcite-action
          icon="palette"
          text="Style"
          id="style"
          active={activeRightPanel === "style-panel"}
          onClick={() => handleRightActionClick("style-panel")}
        ></calcite-action>
        <calcite-action
          icon="pencil-mark"
          text="Edit Renderer"
          id="edit-renderer"
          active={activeRightPanel === "edit-renderer-panel"}
          onClick={() => handleRightActionClick("edit-renderer-panel")}
        ></calcite-action>
        <calcite-action
          icon="filter"
          text="Filter"
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
        </div>
        <div
          id="table-panel"
          className={`panel left-panel ${
            activeLeftPanel === "table-panel" ? "active" : ""
          }`}
        >
          <div id="featureTableDiv" className="panel-content">
            <label>Layer is not selected.</label>
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
              <p>No layer selected.</p>
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
          <LabelsPanel selectedLayer={selectedLayer}
            labels={labels}
            setLabels={setLabels}
            onLabelUpdate={updateMapLabels} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
