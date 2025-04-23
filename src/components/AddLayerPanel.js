import React, { useRef, useEffect } from "react";
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
  const dialogRef = useRef(null);
  const urlInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.open = isLayerModalOpen;
    }
  }, [isLayerModalOpen]);

  useEffect(() => {
    if (urlInputRef.current) urlInputRef.current.value = layerUrl;
    if (titleInputRef.current) titleInputRef.current.value = layerTitle;
  }, [layerUrl, layerTitle]);

  const addLayer = async () => {
    const cleanedUrl = layerUrl?.replace(/\s/g, "").trim();

    if (!cleanedUrl) {
      alert("Lütfen geçerli bir URL girin!");
      return;
    }

    try {
      const parsedUrl = new URL(cleanedUrl);
      console.log("DEBUG | URL parse OK:", parsedUrl.href);
    } catch (e) {
      console.error("DEBUG | URL PARSE ERROR:", e.message);
      alert("Girilen URL geçerli bir URL formatında değil.");
      return;
    }

    if (!viewRef.current || !viewRef.current.map) {
      alert("Harita henüz hazır değil. Lütfen biraz bekleyip tekrar deneyin.");
      return;
    }

    const newLayer = new FeatureLayer({ url: cleanedUrl });

    try {
      console.log("Layer yükleniyor...");
      await newLayer.load();
      console.log("Layer başarıyla yüklendi:", newLayer);

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
      alert(
        "Katman yüklenemedi. Lütfen URL'nin geçerli bir FeatureLayer adresi olduğundan emin olun."
      );
      console.error("Katman yükleme hatası:", error);
    }
  };

  if (!isLayerModalOpen) return null;

  return (
    <calcite-dialog
      open
      modal
      heading="Yeni Katman"
      ref={dialogRef}
      onCalciteDialogClose={() => setIsLayerModalOpen(false)}
    >
      <calcite-label>
        Katman URL
        <calcite-input
          ref={urlInputRef}
          placeholder="Katman URL'sini girin"
          onInput={(e) => {
            const val = e.target.value;
            console.log("URL değişti:", val);
            setLayerUrl(val);
          }}
        />
      </calcite-label>
      <calcite-label>
        Katman Adı
        <calcite-input
          ref={titleInputRef}
          placeholder="Katmanın adını girin"
          onInput={(e) => {
            const val = e.target.value;
            console.log("Başlık değişti:", val);
            setLayerTitle(val);
          }}
        />
      </calcite-label>
      <calcite-button
        appearance="outline"
        onClick={() => setIsLayerModalOpen(false)}
      >
        İptal
      </calcite-button>
      <calcite-button onClick={addLayer}>Katman Ekle</calcite-button>
    </calcite-dialog>
  );
};

export default AddLayerPanel;
