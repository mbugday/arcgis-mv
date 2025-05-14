import React from "react";

const StyleOptions = ({ selectedLayer }) => {
  const getAvailableStyles = (layer) => {
    if (!layer) return [];

    if (layer.title === "Thermal Hotspots") return ["Simple", "Heatmap"];
    if (layer.title === "USA Cities") return ["Simple", "Class Breaks", "Unique Value"];
    if (layer.title === "USA States") return ["Simple", "Unique Value"];
    return ["Simple"];
  };

  const applyStyle = (styleType) => {
    if (!selectedLayer) return;

    const geometryType = selectedLayer.geometryType;

    const getSymbolType = () => {
      if (geometryType === "polygon") return "simple-fill";
      if (geometryType === "polyline") return "simple-line";
      return "simple-marker";
    };

    switch (styleType) {
      case "Simple":
        selectedLayer.renderer = {
          type: "simple",
          symbol: {
            type: getSymbolType(),
            color: "red",
            ...(geometryType === "polygon" && {
              outline: { color: "white", width: 1 },
            }),
            ...(geometryType === "polyline" && {
              width: 2,
            }),
            ...(geometryType === "point" && {
              size: 8,
              outline: { color: "white", width: 1 },
            }),
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
                outline: { color: "white", width: 0.5 },
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
                outline: { color: "white", width: 0.5 },
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
                outline: { color: "white", width: 0.5 },
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
                outline: { color: "white", width: 0.5 },
              },
              label: "1,000,001+",
            },
          ],
        };
        break;

      case "Unique Value":
        selectedLayer.renderer = {
          type: "unique-value",
          field: "areaname", // küçük harfli field kullanımı
          defaultSymbol: {
            type: getSymbolType(),
            color: [200, 200, 200],
            ...(geometryType === "polygon" && {
              outline: { color: [0, 0, 0], width: 1 },
            }),
            ...(geometryType === "polyline" && {
              width: 2,
            }),
            ...(geometryType === "point" && {
              size: 8,
              outline: { color: [0, 0, 0], width: 1 },
            }),
          },
          uniqueValueInfos: [],
        };
        break;

      default:
    }

    selectedLayer.refresh?.();
  };

  const availableStyles = getAvailableStyles(selectedLayer);

  return (
    <div>
      <h3>Stiller</h3>
      {availableStyles.length > 0 ? (
        availableStyles.map((style, index) => (
          <calcite-button
            className="style-opt-button"
            key={index}
            onClick={() => applyStyle(style)}
          >
            {style}
          </calcite-button>
        ))
      ) : (
        <p>Bu katman için herhangi bir stil mevcut değil.</p>
      )}
    </div>
  );
};

export default StyleOptions;