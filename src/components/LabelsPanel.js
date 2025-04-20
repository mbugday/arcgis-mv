import React, { useEffect, useRef } from "react";

const initialLabel = {
  field: "",
  filter: "",
  style: { color: "black", fontSize: "12px" },
  placement: "above-center",
};

const LabelsPanel = ({ selectedLayer, labels, setLabels }) => {
  const labelInputRefs = useRef([]);

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
      const labelClasses = labels
        .filter((label) => label.field) // sadece geçerli alanları kullan
        .map((label) => ({
          labelExpressionInfo: {
            expression: `$feature.${label.field}`,
          },
          labelPlacement: label.placement,
          symbol: {
            type: "text",
            color: label.style.color,
            font: {
              size: parseFloat(label.style.fontSize),
              family: "Arial",
            },
          },
          where: label.filter || undefined,
        }));

      selectedLayer.labelingInfo = labelClasses;
      selectedLayer.labelsVisible = true;
      selectedLayer.refresh();
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
              onChange={(e) =>
                handleLabelChange(index, "field", e.target.value)
              }
            >
              <option value="">Seçiniz</option>
              {selectedLayer?.fields?.map((field, i) => (
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
              placeholder="Yazı Boyutu (örn: 12)"
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
          <button onClick={() => handleRemoveLabel(index)}>Etiketi Sil</button>
        </div>
      ))}
      <button onClick={handleAddLabel}>Yeni Etiket Ekle</button>
      <button onClick={handleApplyLabels}>Etiketleri Uygula</button>
    </div>
  );
};

export default LabelsPanel;
