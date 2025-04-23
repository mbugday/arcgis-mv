import React, { useEffect, useRef } from "react";

const initialLabel = {
  field: "",
  filter: "",
  style: { color: "black", fontSize: "12px" },
  placement: "above-center",
};

const LabelsPanel = ({ selectedLayer, labels, setLabels }) => {
  const fieldSelectRefs = useRef([]);
  const filterInputRefs = useRef([]);
  const colorInputRefs = useRef([]);
  const sizeInputRefs = useRef([]);

  useEffect(() => {
    if (labels.length > 0) {
      const lastIndex = labels.length - 1;
      const newFilterInput = filterInputRefs.current[lastIndex];
      newFilterInput?.focus();
    }
  }, [labels.length]);

  useEffect(() => {
    labels.forEach((_, index) => {
      const fieldSelect = fieldSelectRefs.current[index];
      const filterInput = filterInputRefs.current[index];
      const colorInput = colorInputRefs.current[index];
      const sizeInput = sizeInputRefs.current[index];

      if (fieldSelect) {
        fieldSelect.addEventListener("calciteSelectChange", (evt) => {
          handleLabelChange(index, "field", evt.target.value);
        });
      }
      if (filterInput) {
        filterInput.addEventListener("calciteInputInput", (evt) => {
          handleLabelChange(index, "filter", evt.target.value);
        });
      }
      if (colorInput) {
        colorInput.addEventListener("calciteInputInput", (evt) => {
          const newStyle = { ...labels[index].style, color: evt.target.value };
          handleLabelChange(index, "style", newStyle);
        });
      }
      if (sizeInput) {
        sizeInput.addEventListener("calciteInputInput", (evt) => {
          const newStyle = {
            ...labels[index].style,
            fontSize: evt.target.value,
          };
          handleLabelChange(index, "style", newStyle);
        });
      }
    });
    return () => {
      labels.forEach((_, index) => {
        fieldSelectRefs.current[index]?.removeEventListener(
          "calciteSelectChange",
          () => {}
        );
        filterInputRefs.current[index]?.removeEventListener(
          "calciteInputInput",
          () => {}
        );
        colorInputRefs.current[index]?.removeEventListener(
          "calciteInputInput",
          () => {}
        );
        sizeInputRefs.current[index]?.removeEventListener(
          "calciteInputInput",
          () => {}
        );
      });
    };
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
      const labelClasses = labels
        .filter((lbl) => lbl.field)
        .map((lbl) => ({
          labelExpressionInfo: { expression: `$feature.${lbl.field}` },
          labelPlacement: lbl.placement,
          symbol: {
            type: "text",
            color: lbl.style.color,
            font: {
              size: parseFloat(lbl.style.fontSize) || 12,
              family: "Arial",
            },
          },
          where: lbl.filter || undefined,
        }));
      selectedLayer.labelingInfo = labelClasses;
      selectedLayer.labelsVisible = true;
      selectedLayer.refresh();
    }
  };

  return (
    <calcite-panel heading="Etiketler">
      {labels.map((label, index) => (
        <calcite-block key={index} heading={`Etiket ${index + 1}`} collapsible>
          <calcite-label>
            Etiket Alanı:
            <calcite-select
              width="full"
              value={label.field}
              ref={(el) => (fieldSelectRefs.current[index] = el)}
            >
              <calcite-option value="">Seçiniz</calcite-option>
              {selectedLayer?.fields?.map((field, i) => (
                <calcite-option key={i} value={field.name}>
                  {field.name} ({field.type})
                </calcite-option>
              ))}
            </calcite-select>
          </calcite-label>

          <calcite-label>
            Filtre:
            <calcite-input
              type="text"
              value={label.filter}
              placeholder="Örnek: POP2000 > 100000"
              ref={(el) => (filterInputRefs.current[index] = el)}
            />
          </calcite-label>

          <calcite-label>
            Renk:
            <calcite-input
              type="color"
              value={label.style.color}
              ref={(el) => (colorInputRefs.current[index] = el)}
              style={{ marginRight: "0.5rem" }}
            />
          </calcite-label>
          <calcite-label>
            Yazı Boyutu:
            <calcite-input
              type="text"
              value={label.style.fontSize}
              placeholder="Örn: 12"
              ref={(el) => (sizeInputRefs.current[index] = el)}
            />
          </calcite-label>

          <calcite-label>
            Etiket Yerleşimi:
            <calcite-select value={label.placement}>
              <calcite-option value="above-center">
                Yukarıda Ortada
              </calcite-option>
              <calcite-option value="above-left">Yukarıda Solda</calcite-option>
              <calcite-option value="above-right">
                Yukarıda Sağda
              </calcite-option>
              <calcite-option value="below-center">
                Aşağıda Ortada
              </calcite-option>
              <calcite-option value="below-left">Aşağıda Solda</calcite-option>
              <calcite-option value="below-right">Aşağıda Sağda</calcite-option>
              <calcite-option value="center-center">Ortada</calcite-option>
              <calcite-option value="center-left">Ortada Solda</calcite-option>
              <calcite-option value="center-right">Ortada Sağda</calcite-option>
            </calcite-select>
          </calcite-label>

          {/* Remove Label Button */}
          <calcite-button
            appearance="outline"
            color="red"
            scale="s"
            onClick={() => handleRemoveLabel(index)}
          >
            Etiketi Sil
          </calcite-button>
        </calcite-block>
      ))}

      <div style={{ marginTop: "10px" }}>
        <calcite-button color="blue" icon-start="plus" onClick={handleAddLabel}>
          Yeni Etiket Ekle
        </calcite-button>
        <calcite-button
          color="green"
          appearance="solid"
          style={{ marginTop: "5px" }}
          onClick={handleApplyLabels}
        >
          Etiketleri Uygula
        </calcite-button>
      </div>
    </calcite-panel>
  );
};

export default LabelsPanel;
