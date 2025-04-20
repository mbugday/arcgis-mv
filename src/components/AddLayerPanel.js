import React from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

const AddLayerPanel = ({
  isLayerModalOpen,
  setIsLayerModalOpen,
  layerUrl,
  setLayerUrl,
  layerTitle,
  setLayerTitle,
  viewRef,
  setLayers,
}) => {
  const addLayer = async () => {
    if (!layerUrl.trim()) {
      alert("Lütfen geçerli bir URL girin!");
      return;
    }

    const newLayer = new FeatureLayer({ url: layerUrl });

    try {
      await newLayer.load();
      newLayer.title = layerTitle?.trim() || newLayer.title || "Yeni Katman";

      viewRef.current.map.add(newLayer);
      setLayers((prev) => [...prev, newLayer]);
      setIsLayerModalOpen(false);
      setLayerUrl("");
      setLayerTitle("");

      if (!newLayer.popupTemplate) {
        const fields = newLayer.fields.map((field) => ({
          label: field.alias || field.name,
          fieldName: field.name,
        }));

        newLayer.popupTemplate = {
          title: newLayer.title,
          content: [
            {
              type: "fields",
              fieldInfos: fields,
            },
          ],
        };
      }
    } catch (error) {
      alert("Katman yüklenirken hata oluştu. Lütfen geçerli bir URL girin.");
      console.error("Katman yükleme hatası:", error);
    }
  };

  if (!isLayerModalOpen) return null;

  return (
    <div className="layer-modal">
      <h3>Yeni Katman Ekle</h3>
      <label>Katman URL:</label>
      <input
        type="text"
        value={layerUrl}
        onChange={(e) => setLayerUrl(e.target.value)}
        placeholder="Katman URL'sini girin"
      />

      <label>Katman Adı:</label>
      <input
        type="text"
        value={layerTitle}
        onChange={(e) => setLayerTitle(e.target.value)}
        placeholder="Katmanın adını girin"
      />

      <button onClick={addLayer} className="add-layer-confirm">
        Ekle
      </button>
      <button
        onClick={() => setIsLayerModalOpen(false)}
        className="add-layer-cancel"
      >
        İptal
      </button>
    </div>
  );
};

export default AddLayerPanel;
