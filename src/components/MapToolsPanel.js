import React from "react";

const MapToolsPanel = ({ activeRightPanel, handleToolSelection }) => {
  return (
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
  );
};

export default MapToolsPanel;
