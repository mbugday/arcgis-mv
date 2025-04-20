import React, { useState, useEffect } from "react";

const PopupEditor = ({ selectedLayer }) => {
  const [popupTitle, setPopupTitle] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);

  useEffect(() => {
    if (selectedLayer && selectedLayer.fields?.length) {
      setPopupTitle(
        selectedLayer?.popupTemplate?.title || selectedLayer?.title || "Pop-up"
      );

      setSelectedFields(
        selectedLayer.fields.map((f) => ({
          name: f.name,
          label: f.alias || f.name,
          visible: false, // checkboxlar seçili gelmesin
        }))
      );
    } else {
      setPopupTitle("");
      setSelectedFields([]);
    }
  }, [selectedLayer]);

  const toggleField = (index) => {
    const newFields = [...selectedFields];
    newFields[index].visible = !newFields[index].visible;
    setSelectedFields(newFields);
  };

  const applyPopup = () => {
    const visibleFields = selectedFields.filter((f) => f.visible);

    const contentHtml = visibleFields
      .map((field) => `<b>${field.label}</b>: {${field.name}}`)
      .join("<br>");

    if (selectedLayer) {
      selectedLayer.popupTemplate = {
        title: popupTitle,
        content: contentHtml,
      };
      selectedLayer.refresh();
    }
  };

  return (
    <div>
      <h3>Pop-up Düzenleyici</h3>

      <label>Pop-up Başlığı:</label>
      <input
        type="text"
        value={popupTitle}
        onChange={(e) => setPopupTitle(e.target.value)}
      />

      <h4>Alanlar:</h4>
      <ul>
        {selectedFields.length > 0 ? (
          selectedFields.map((field, index) => (
            <li key={index}>
              <label>
                <input
                  type="checkbox"
                  checked={field.visible}
                  onChange={() => toggleField(index)}
                />
                {field.label}
              </label>
            </li>
          ))
        ) : (
          <p>Katmana ait gösterilecek alan yok.</p>
        )}
      </ul>

      <button onClick={applyPopup}>Pop-up’ı Uygula</button>
    </div>
  );
};

export default PopupEditor;
