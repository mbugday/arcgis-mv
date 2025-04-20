import React, { useEffect } from "react";

const SymbolEditorPanel = ({ selectedLayer }) => {
  useEffect(() => {
    if (!selectedLayer || !selectedLayer.renderer) return;

    const rendererEditorDiv = document.getElementById("rendererEditorDiv");
    if (!rendererEditorDiv) return;

    const currentRenderer = selectedLayer.renderer;
    rendererEditorDiv.innerHTML = "";

    if (currentRenderer.type === "simple") {
      rendererEditorDiv.innerHTML = `
        <h3>Edit Symbol</h3>
        <label>Symbol Color</label>
        <input type="color" id="colorPicker" value="${rgbToHex(
          currentRenderer.symbol.color
        )}" />
        <label>Size</label>
        <input type="number" id="sizeInput" value="$${
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
      rendererEditorDiv.innerHTML = `<h3>Edit Class Breaks</h3>`;

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
        <button id="saveRendererBtn">Save</button>
      `;
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
        selectedLayer.renderer = currentRenderer;
        selectedLayer.refresh();

        rendererEditorDiv.style.display = "none";
      }
    };

    rendererEditorDiv.style.display = "block";
  }, [selectedLayer]);

  const rgbToHex = (rgb) => {
    return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
      .toString(16)
      .slice(1)}`;
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  return <div id="rendererEditorDiv" className="renderer-editor"></div>;
};

export default SymbolEditorPanel;
