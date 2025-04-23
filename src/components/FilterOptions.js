import React, { useState, useEffect, useRef } from "react";

function FilterOptions({ selectedLayer }) {
  const [filters, setFilters] = useState([
    { field: "", operator: "=", value: "" },
  ]);
  const [logicOperator, setLogicOperator] = useState("AND");
  const segmentedControlRef = useRef();

  useEffect(() => {
    const control = segmentedControlRef.current;
    if (control) {
      const handler = (e) => {
        const value = e.target.selectedItem?.value;
        console.log("Segmented Control seçimi:", value);
        setLogicOperator(value);
      };
      control.addEventListener("calciteSegmentedControlChange", handler);
      return () => control.removeEventListener("calciteSegmentedControlChange", handler);
    }
  }, []);

  const addFilter = () => {
    setFilters((prev) => [...prev, { field: "", operator: "=", value: "" }]);
  };

  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    setTimeout(() => applyFilters(newFilters), 0);
  };

  const applyFilters = (overrideFilters) => {
    const currentFilters = Array.isArray(overrideFilters) ? overrideFilters : filters;
    const validFilters = currentFilters.filter(
      (f) => f.field && f.operator && f.value !== ""
    );

    const clauses = validFilters.map((f) => {
      const fieldInfo = selectedLayer.fields.find(
        (field) => field.name === f.field
      );
      let valueExpr = f.value;

      if (fieldInfo) {
        const fieldType = fieldInfo.type;
        if (fieldType === "string" || fieldType === "date") {
          valueExpr = `'${f.value}'`;
        }
      }
      return `${f.field} ${f.operator} ${valueExpr}`;
    });

    const definition = clauses.join(` ${logicOperator} `);
    console.log("Oluşturulan WHERE ifadesi:", definition);
    console.log("Seçilen bağlaç:", logicOperator);

    selectedLayer.definitionExpression = definition || null;
  };

  useEffect(() => {
    filters.forEach((_, i) => {
      const fieldSelect = document.getElementById(`field-select-${i}`);
      const opSelect = document.getElementById(`operator-select-${i}`);
      const valInput = document.getElementById(`value-input-${i}`);
      if (fieldSelect) {
        fieldSelect.addEventListener("calciteSelectChange", (event) => {
          const newValue = event.target.value;
          setFilters((prev) => {
            const updated = [...prev];
            updated[i].field = newValue;
            return updated;
          });
        });
      }
      if (opSelect) {
        opSelect.addEventListener("calciteSelectChange", (event) => {
          const newValue = event.target.value;
          setFilters((prev) => {
            const updated = [...prev];
            updated[i].operator = newValue;
            return updated;
          });
        });
      }
      if (valInput) {
        valInput.addEventListener("calciteInputInput", (event) => {
          const newValue = event.target.value;
          setFilters((prev) => {
            const updated = [...prev];
            updated[i].value = newValue;
            return updated;
          });
        });
      }
    });
  }, [filters, selectedLayer]);

  return (
    <calcite-panel heading="Filtre Seçenekleri">
      <calcite-label layout="inline" style={{ marginBottom: "1rem" }}>
        Filtreleme Türü:
        <calcite-segmented-control
          ref={segmentedControlRef}
          width="full"
          value={logicOperator}
          style={{marginTop:"15px"}}
        >
          <calcite-segmented-control-item value="AND">
            AND
          </calcite-segmented-control-item>
          <calcite-segmented-control-item value="OR">
            OR
          </calcite-segmented-control-item>
        </calcite-segmented-control>
      </calcite-label>

      {filters.map((filter, index) => (
        <calcite-block
          key={index}
          heading={`Filtre ${index + 1}`}
          open
          collapsible
        >
          <calcite-label>
            Alan:
            <calcite-select id={`field-select-${index}`} value={filter.field}>
            {(selectedLayer?.fields || []).map((field) => (
                <calcite-option
                  key={field.name}
                  value={field.name}
                  label={field.alias || field.name}
                >
                  {field.alias || field.name}
                </calcite-option>
              ))}
            </calcite-select>
          </calcite-label>
          <calcite-label>
            Koşul:
            <calcite-select
              id={`operator-select-${index}`}
              value={filter.operator}
            >
              <calcite-option value="=">Alanı şu olanlar</calcite-option>
              <calcite-option value="<">Alanı şundan küçük olanlar</calcite-option>
              <calcite-option value="<=">Alanı şundan küçük veya eşit olanlar</calcite-option>
              <calcite-option value=">">Alanı şundan büyük olanlar</calcite-option>
              <calcite-option value=">=">Alanı şundan büyük veya eşit olanlar</calcite-option>
            </calcite-select>
          </calcite-label>
          <calcite-label>
            Değer:
            <calcite-input
              id={`value-input-${index}`}
              type="text"
              value={filter.value}
              placeholder="Değer girin"
            />
          </calcite-label>
          <calcite-button
            appearance="outline"
            color="red"
            icon-start="minus-circle"
            scale="s"
            onClick={() => {
              removeFilter(index);
              applyFilters();
            }}
          >
            Kaldır
          </calcite-button>
        </calcite-block>
      ))}
      <div style={{ marginTop: "8px" }}>
        <calcite-button
          appearance="outline"
          icon-start="plus-circle"
          scale="m"
          onClick={addFilter}
        >
          Filtre Ekle
        </calcite-button>
        <calcite-button
          color="green"
          scale="m"
          style={{ marginLeft: "4px" }}
          onClick={() => applyFilters()}
        >
          Filtreleri Uygula
        </calcite-button>
      </div>
    </calcite-panel>
  );
}

export default FilterOptions;