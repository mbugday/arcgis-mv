import React, { useState, useEffect, useRef } from "react";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";

const SymbolEditorUnique = ({ selectedLayer, setActiveRightPanel }) => {
  const [uniqueValues, setUniqueValues] = useState([]);
  const [fieldName, setFieldName] = useState(null);
  const [currentValue, setCurrentValue] = useState("");
  const [symbolSettings, setSymbolSettings] = useState(null);
  const [newUniqueEntries, setNewUniqueEntries] = useState([]);
  const [deletedEntries, setDeletedEntries] = useState([]);

  const selectRef = useRef();
  const styleSelectRef = useRef();
  const sizeInputRef = useRef();

  const valueRefs = useRef([]);
  const styleRefs = useRef([]);
  const sizeRefs = useRef([]);

  const rgbToHex = (rgb = [0, 0, 0]) =>
    `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

  const hexToRgb = (hex) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };

  useEffect(() => {
    if (!selectedLayer || !selectedLayer.fields) return;

    const matchedField = selectedLayer.fields.find(
      (f) => f.type === "string"
    )?.name;

    if (!matchedField) return;

    setFieldName(matchedField);

    selectedLayer
      .queryFeatures({
        where: "1=1",
        outFields: [matchedField],
        returnGeometry: false,
      })
      .then((result) => {
        const values = [
          ...new Set(
            result.features
              .map((f) => String(f.attributes[matchedField]))
              .filter(Boolean)
          ),
        ];
        setUniqueValues(values);
      });

    if (
      selectedLayer.renderer?.type === "unique-value" &&
      Array.isArray(selectedLayer.renderer.uniqueValueInfos)
    ) {
      const entries = selectedLayer.renderer.uniqueValueInfos.map((info) => {
        const symbol = info.symbol;
        const color = Array.isArray(symbol.color)
          ? rgbToHex(symbol.color)
          : "#ff0000";

        return {
          value: info.value,
          color,
          size: symbol.size || 8,
          style: symbol.style || "circle",
        };
      });

      setNewUniqueEntries(entries);
    }
  }, [selectedLayer]);

  useEffect(() => {
    if (!currentValue || !selectedLayer) return;

    const renderer = selectedLayer.renderer;
    const geometryType = selectedLayer.geometryType || "point";

    const defaultSymbol = {
      type:
        geometryType === "polygon"
          ? "simple-fill"
          : geometryType === "polyline"
          ? "simple-line"
          : "simple-marker",
      color: [255, 0, 0],
      ...(geometryType === "polygon" && {
        outline: { color: [0, 0, 0], width: 1 },
      }),
      ...(geometryType === "polyline" && { width: 2 }),
      ...(geometryType === "point" && {
        size: 8,
        style: "circle",
        outline: { color: [0, 0, 0], width: 1 },
      }),
    };

    if (!renderer.uniqueValueInfos) renderer.uniqueValueInfos = [];

    const existing = renderer.uniqueValueInfos.find(
      (info) => String(info.value) === currentValue
    );

    if (!existing) {
      renderer.uniqueValueInfos.push({
        value: currentValue,
        label: currentValue,
        symbol: defaultSymbol,
      });
      setSymbolSettings(defaultSymbol);
    } else {
      setSymbolSettings(existing.symbol);
    }
  }, [currentValue]);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;

    const handler = (e) => setCurrentValue(e.target.value);
    el.addEventListener("calciteSelectChange", handler);
    return () => el.removeEventListener("calciteSelectChange", handler);
  }, [uniqueValues]);

  useEffect(() => {
    const el = styleSelectRef.current;
    if (!el) return;

    const handler = (e) => handleSymbolChange("style", e.target.value);
    el.addEventListener("calciteSelectChange", handler);
    return () => el.removeEventListener("calciteSelectChange", handler);
  }, [symbolSettings?.style]);

  useEffect(() => {
    const el = sizeInputRef.current;
    if (!el) return;

    const handler = (e) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        handleSymbolChange("size", value);
      }
    };

    el.addEventListener("calciteInputChange", handler);
    return () => el.removeEventListener("calciteInputChange", handler);
  }, [symbolSettings?.size]);

  const forceReloadLayer = () => {
    const view = selectedLayer?.view;
    const map = view?.map;
    if (!map || !selectedLayer) return;

    const index = map.layers.indexOf(selectedLayer);
    if (index !== -1) {
      map.remove(selectedLayer);
      setTimeout(() => {
        map.add(selectedLayer, index);
      }, 0);
    }
  };

  const handleSave = () => {
    if (!selectedLayer || !symbolSettings || !currentValue) return;

    const renderer = selectedLayer.renderer;
    let updatedInfos = [...(renderer.uniqueValueInfos || [])];
    const idx = updatedInfos.findIndex(
      (info) => String(info.value) === currentValue
    );

    const updatedEntry = {
      value: currentValue,
      label: currentValue,
      symbol: JSON.parse(JSON.stringify(symbolSettings)),
    };

    if (idx !== -1) {
      updatedInfos[idx] = updatedEntry;
    } else {
      updatedInfos.push(updatedEntry);
    }

    newUniqueEntries.forEach((_, index) => {
      const value = valueRefs.current[index]?.value;
      const color = newUniqueEntries[index].color;
      const size = parseInt(sizeRefs.current[index]?.value, 10);
      const style = styleRefs.current[index]?.value;

      if (!value) return;
      if (geometryType === "point" && isNaN(size)) return;

      let symbol;

      if (geometryType === "polygon") {
        symbol = {
          type: "simple-fill",
          color: hexToRgb(color),
          outline: { color: [0, 0, 0], width: 1 },
        };
      } else if (geometryType === "polyline") {
        symbol = {
          type: "simple-line",
          color: hexToRgb(color),
          width: 2,
        };
      } else {
        symbol = {
          type: "simple-marker",
          color: hexToRgb(color),
          size,
          style: style || "circle",
          outline: { color: [0, 0, 0], width: 1 },
        };
      }

      updatedInfos.push({
        value,
        label: value,
        symbol,
      });
    });

    updatedInfos = updatedInfos.filter(
      (info) => !deletedEntries.includes(String(info.value))
    );

    const newRenderer = new UniqueValueRenderer({
      type: "unique-value",
      field: fieldName,
      defaultSymbol: renderer.defaultSymbol || undefined,
      uniqueValueInfos: updatedInfos,
    });

    selectedLayer.renderer = newRenderer;
    forceReloadLayer();
    setDeletedEntries([]);
    setActiveRightPanel?.("");
  };

  const handleSymbolChange = (key, value) => {
    if (!symbolSettings) return;
    setSymbolSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleColorChange = (e) => {
    setSymbolSettings((prev) => ({
      ...prev,
      color: hexToRgb(e.target.value),
    }));
  };

  if (!selectedLayer || !fieldName) return null;

  const geometryType = selectedLayer.geometryType;

  return (
    <calcite-panel>
      <calcite-block heading="Unique Değer 1" collapsible>
        <calcite-label>
          Değer Seç
          <calcite-select ref={selectRef}>
            {uniqueValues.map((val, idx) => (
              <calcite-option key={idx} value={String(val)}>
                {String(val)}
              </calcite-option>
            ))}
          </calcite-select>
        </calcite-label>

        {symbolSettings && (
          <>
            <calcite-label>
              Renk
              <calcite-input
                type="color"
                value={rgbToHex(symbolSettings.color)}
                onInput={handleColorChange}
              />
            </calcite-label>

            {geometryType === "point" && (
              <>
                <calcite-label>
                  Boyut
                  <calcite-input
                    ref={sizeInputRef}
                    type="number"
                    min="1"
                    max="20"
                    value={symbolSettings.size || 8}
                  />
                </calcite-label>

                <calcite-label>
                  Şekil
                  <calcite-select ref={styleSelectRef}>
                    <calcite-option value="circle">Daire</calcite-option>
                    <calcite-option value="square">Kare</calcite-option>
                    <calcite-option value="triangle">Üçgen</calcite-option>
                  </calcite-select>
                </calcite-label>
              </>
            )}
          </>
        )}
      </calcite-block>

      {newUniqueEntries.map((entry, index) => (
        <calcite-block
          key={index}
          heading={`Unique Değer ${index + 2}`}
          collapsible
        >
          <calcite-label>
            Değer
            <calcite-select ref={(el) => (valueRefs.current[index] = el)}>
              {uniqueValues.map((val) => (
                <calcite-option key={val} value={val}>
                  {val}
                </calcite-option>
              ))}
            </calcite-select>
          </calcite-label>

          <calcite-label>
            Renk
            <calcite-input
              type="color"
              value={entry.color}
              onInput={(e) => {
                const updated = [...newUniqueEntries];
                updated[index].color = e.target.value;
                setNewUniqueEntries(updated);
              }}
            />
          </calcite-label>
          {geometryType === "point" && (
            <>
              <calcite-label>
                Boyut
                <calcite-input
                  type="number"
                  min="1"
                  max="20"
                  ref={(el) => (sizeRefs.current[index] = el)}
                  value={entry.size}
                />
              </calcite-label>

              <calcite-label>
                Şekil
                <calcite-select ref={(el) => (styleRefs.current[index] = el)}>
                  <calcite-option value="circle">Daire</calcite-option>
                  <calcite-option value="square">Kare</calcite-option>
                  <calcite-option value="triangle">Üçgen</calcite-option>
                </calcite-select>
              </calcite-label>
            </>
          )}

          <calcite-button
            appearance="outline"
            color="danger"
            icon-start="trash"
            scale="s"
            style={{ marginTop: "0.5rem" }}
            onClick={() => {
              const deleted = valueRefs.current[index]?.value;
              const updated = [...newUniqueEntries];
              updated.splice(index, 1);
              valueRefs.current.splice(index, 1);
              styleRefs.current.splice(index, 1);
              sizeRefs.current.splice(index, 1);
              setNewUniqueEntries(updated);
              if (deleted) {
                setDeletedEntries((prev) => [...prev, deleted]);
              }
            }}
          >
            Sil
          </calcite-button>
        </calcite-block>
      ))}

      <calcite-button
        appearance="outline"
        icon-start="plus"
        style={{ marginTop: "1rem" }}
        onClick={() =>
          setNewUniqueEntries([
            ...newUniqueEntries,
            {
              value: uniqueValues[0] || "",
              color: "#ff0000",
              size: 8,
              style: "circle",
            },
          ])
        }
      >
        Yeni Değer Ekle
      </calcite-button>

      <div style={{ marginTop: "1rem" }}>
        <calcite-button appearance="solid" onClick={handleSave}>
          Kaydet
        </calcite-button>
      </div>
    </calcite-panel>
  );
};

export default SymbolEditorUnique;
