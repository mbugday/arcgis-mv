import React, { useEffect, useRef } from "react";
import FeatureTable from "@arcgis/core/widgets/FeatureTable";

const FeatureTableComponent = ({ view, selectedLayer}) => {
  const tableContainerRef = useRef(null);
  const tableInstanceRef = useRef(null);
  const lastLayerRef = useRef(null);

  useEffect(() => {
    if (!view || !selectedLayer || !selectedLayer.createQuery) return;

    const containerElement = tableContainerRef.current;

    if (lastLayerRef.current === selectedLayer) return;
    lastLayerRef.current = selectedLayer;

    if (tableInstanceRef.current) {
      tableInstanceRef.current.destroy();
      tableInstanceRef.current = null;
    }

    if (containerElement) {
      containerElement.innerHTML = "";
    }

    const loadFeatureTable = async () => {
      try {
        const query = selectedLayer.createQuery();
        const results = await selectedLayer.queryFeatures(query);

        const featureTable = new FeatureTable({
          view: view,
          container: containerElement,
          layer: selectedLayer,
          features: results.features,
          visibleElements: {
            header: true,
            menu: true,
            selectionColumn: true,
            layerDropdown: true,
          },
        });

        tableInstanceRef.current = featureTable;
      } catch (err) {
        console.error("FeatureTable yüklenirken hata:", err);
      }
    };

    loadFeatureTable();

    return () => {
      if (tableInstanceRef.current) {
        tableInstanceRef.current.destroy();
        tableInstanceRef.current = null;
      }
      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };
  }, [view, selectedLayer]);

  return (
    <>
      <h3 style={{ margin: "20px" }}>Tablolar</h3>
      {selectedLayer ? (
        <div
          key={selectedLayer.id}
          ref={tableContainerRef}
          className="feature-table-container"
        />
      ) : (
        <p>Herhangi bir katman seçilmedi.</p>
      )}
    </>
  );
};

export default FeatureTableComponent;
