import React from "react";

const PopupEditor = ({ selectedLayer }) => {
  const [popupTitle, setPopupTitle] = React.useState("");
  const [selectedFields, setSelectedFields] = React.useState([]);
  const checkboxRefs = React.useRef([]);

  React.useEffect(() => {
    if (!selectedLayer) return;

    setPopupTitle(
      selectedLayer?.popupTemplate?.title || selectedLayer?.title || "Pop-up"
    );

    setSelectedFields(
      selectedLayer?.fields?.map((f) => {
        const existing = selectedLayer?.popupTemplate?.fieldInfos?.find(
          (fi) => fi.fieldName === f.name
        );
        return {
          name: f.name,
          label: f.alias || f.name,
          visible: existing?.visible ?? false,
        };
      }) || []
    );
  }, [selectedLayer]);

  const toggleField = React.useCallback((index, checked) => {
    const newFields = [...selectedFields];
    newFields[index].visible = checked;
    setSelectedFields(newFields);
  }, [selectedFields]);

  React.useEffect(() => {
    checkboxRefs.current.forEach((el, index) => {
      if (el) {
        const handler = (e) => {
          toggleField(index, e.target.checked);
        };
        el.addEventListener("calciteCheckboxChange", handler);

        return () => {
          el.removeEventListener("calciteCheckboxChange", handler);
        };
      }
    });
  }, [selectedFields, toggleField]);

  const applyPopup = () => {
    if (!selectedLayer) return;

    const visibleFields = selectedFields.filter((f) => f.visible);

    const contentHtml = visibleFields
      .map((field) => `<b>${field.label}:</b> {${field.name}}`)
      .join("<br>");

    selectedLayer.popupTemplate = {
      title: popupTitle,
      content: [
        {
          type: "text",
          text: contentHtml,
        },
      ],
      fieldInfos: selectedFields.map((f) => ({
        fieldName: f.name,
        label: f.label,
        visible: f.visible,
      })),
    };

    selectedLayer.refresh();
  };

  return (
    <calcite-panel heading="Pop-up Editörü">
      <div style={{ padding: "1rem" }}>
        <calcite-heading level="4">Pop-up Başlığı</calcite-heading>
        <calcite-label>
          <calcite-input
            type="text"
            value={popupTitle}
            onCalciteInputInput={(e) => setPopupTitle(e.target.value)}
            placeholder="Başlık girin"
          />
        </calcite-label>

        <calcite-heading level="4" style={{ marginTop: "1rem" }}>
          Görünecek Alanlar
        </calcite-heading>
        <calcite-block heading="Alan Listesi" open collapsible>
          {selectedFields.map((field, index) => (
            <calcite-label
              key={field.name}
              layout="inline"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              <calcite-checkbox
                ref={(el) => (checkboxRefs.current[index] = el)}
                checked={field.visible}
              />
              {field.label}
            </calcite-label>
          ))}
        </calcite-block>

        <div style={{ marginTop: "1.5rem" }}>
          <calcite-button appearance="solid" width="full" onClick={applyPopup}>
            Pop-up'ı Uygula
          </calcite-button>
        </div>
      </div>
    </calcite-panel>
  );
};

export default PopupEditor;
