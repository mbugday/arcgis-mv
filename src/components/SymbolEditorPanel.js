import React, { useEffect, useRef, useState } from "react";

const SymbolEditorPanel = ({ selectedLayer }) => {
  const saveButtonRef = useRef(null);
  const [newClasses, setNewClasses] = useState([]);

  const rgbToHex = (rgb) => {
    return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
      .toString(16)
      .slice(1)}`;
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  useEffect(() => {
    if (!selectedLayer || !selectedLayer.renderer) return;
    const currentRenderer = selectedLayer.renderer;

    const handleSave = () => {
      if (currentRenderer.type === "simple") {
        const colorHex = document.getElementById("colorPicker").value;
        const sizeVal = document.getElementById("sizeInput").value;
        const shapeVal = document.getElementById("shapeSelect").value;
        currentRenderer.symbol.color = hexToRgb(colorHex);
        currentRenderer.symbol.size = parseInt(sizeVal, 10);
        currentRenderer.symbol.style = shapeVal;
      } else if (currentRenderer.type === "class-breaks") {
        const updatedClassBreaks = currentRenderer.classBreakInfos.map((info, idx) => {
          const colorHex = document.getElementById(`colorPicker-${idx}`).value;
          const sizeVal = document.getElementById(`sizeInput-${idx}`).value;
          return {
            minValue: info.minValue,
            maxValue: info.maxValue,
            symbol: {
              ...info.symbol,
              color: hexToRgb(colorHex),
              size: parseInt(sizeVal, 10)
            },
            label: info.label
          };
        });

        newClasses.forEach((cls, idx) => {
          const min = parseFloat(document.getElementById(`newMinValue-${idx}`).value);
          const max = parseFloat(document.getElementById(`newMaxValue-${idx}`).value);
          const color = document.getElementById(`newColorPicker-${idx}`).value;
          const size = document.getElementById(`newSizeInput-${idx}`).value;
          if (!isNaN(min) && !isNaN(max) && color && size) {
            updatedClassBreaks.push({
              minValue: min,
              maxValue: max,
              symbol: {
                type: "simple-marker",
                color: hexToRgb(color),
                size: parseInt(size, 10),
                outline: { color: "black", width: 1 }
              },
              label: `${min} - ${max}`
            });
          }
        });

        currentRenderer.classBreakInfos = updatedClassBreaks;
      }

      selectedLayer.renderer = currentRenderer;
      selectedLayer.refresh();
    };

    const saveBtn = saveButtonRef.current;
    if (saveBtn) {
      saveBtn.addEventListener("click", handleSave);
    }
    return () => {
      if (saveBtn) {
        saveBtn.removeEventListener("click", handleSave);
      }
    };
  }, [selectedLayer, newClasses]);

  if (!selectedLayer || !selectedLayer.renderer) return <div />;

  const { renderer } = selectedLayer;
  return (
    <calcite-panel>
      {renderer.type === "simple" && (
        <calcite-block heading="Simple Sembol" style={{ marginBottom: "1rem" }} collapsible="true" scale="m">
          <calcite-label>Renk
            <calcite-input type="color" id="colorPicker" value={rgbToHex(renderer.symbol?.color || [0, 0, 0])} />
          </calcite-label>
          <calcite-label>Boyut
            <calcite-input type="number" id="sizeInput" value={renderer.symbol?.size || 8} min="1" max="20" />
          </calcite-label>
          <calcite-label>Şekil
            <calcite-select id="shapeSelect" value={renderer.symbol?.style || "circle"}>
              <calcite-option value="circle" label="Circle">Daire</calcite-option>
              <calcite-option value="square" label="Square">Kare</calcite-option>
              <calcite-option value="triangle" label="Triangle">Üçgen</calcite-option>
            </calcite-select>
          </calcite-label>
        </calcite-block>
      )}

      {renderer.type === "class-breaks" && (
        <>
          {renderer.classBreakInfos.map((info, index) => (
            <calcite-block key={index} heading={`Class ${index + 1}`} style={{ marginBottom: "", }} collapsible="true" scale="m">
              <calcite-label>Min Value
                <calcite-input type="number" value={info.minValue} disabled />
              </calcite-label>
              <calcite-label>Max Value
                <calcite-input type="number" value={info.maxValue} disabled />
              </calcite-label>
              <calcite-label>Color
                <calcite-input type="color" id={`colorPicker-${index}`} value={rgbToHex(info.symbol?.color || [0, 0, 0])} />
              </calcite-label>
              <calcite-label>Size
                <calcite-input type="number" id={`sizeInput-${index}`} value={info.symbol?.size || 8} min="1" max="20" />
              </calcite-label>
            </calcite-block>
          ))}

          {newClasses.map((_, index) => (
            <calcite-block key={`new-${index}`} heading={`New Class ${index + 1}`} style={{ marginBottom: "1rem"}}collapsible="true" scale="m">
              <calcite-label>Min Value
                <calcite-input type="number" id={`newMinValue-${index}`} />
              </calcite-label>
              <calcite-label>Max Value
                <calcite-input type="number" id={`newMaxValue-${index}`} />
              </calcite-label>
              <calcite-label>Color
                <calcite-input type="color" id={`newColorPicker-${index}`} />
              </calcite-label>
              <calcite-label>Size
                <calcite-input type="number" id={`newSizeInput-${index}`} min="1" max="20" />
              </calcite-label>
            </calcite-block>
          ))}

          <calcite-button
            appearance="outline"
            icon-start="plus"
            style={{ marginBottom: "1rem" }}
            onClick={() => setNewClasses([...newClasses, {}])}
          >
            Yeni Class Ekle
          </calcite-button>
        </>
      )}

      <div style={{ marginTop: "1rem" }}>
        <calcite-button appearance="solid" ref={saveButtonRef} id="saveRendererBtn">
          Save
        </calcite-button>
      </div>
    </calcite-panel>
  );
};

export default SymbolEditorPanel;
