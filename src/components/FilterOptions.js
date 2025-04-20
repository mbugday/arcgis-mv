import React, { useEffect, useRef } from "react";

const FilterOptions = ({ selectedLayer, filters, setFilters }) => {
  const filterInputRefs = useRef([]);

  useEffect(() => {
    filterInputRefs.current = filterInputRefs.current.slice(0, filters.length);
  }, [filters]);

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        field: null,
        value: "",
        condition: "=",
      },
    ]);
  };

  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);

    setTimeout(() => {
      applyFilters(newFilters);
    }, 0);
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    setFilters(newFilters);
  };

  const applyFilters = (currentFilters = filters) => {
    if (!selectedLayer) return;

    const whereClause = currentFilters
      .filter((filter) => filter.field?.name && filter.value)
      .map(
        (filter) => `${filter.field.name} ${filter.condition} '${filter.value}'`
      )
      .join(" AND ");

    const tagsClause = Array.isArray(selectedLayer.tags)
      ? selectedLayer.tags.map((tag) => `tags LIKE '%${tag}%'`).join(" OR ")
      : "";

    const finalWhere = [whereClause, tagsClause].filter(Boolean).join(" AND ");

    selectedLayer.definitionExpression = finalWhere;
  };

  return (
    <div>
      {filters.map((filter, index) => (
        <div key={index} style={{ marginBottom: "1rem" }}>
          <label>
            Alan:
            <select
              value={filter.field?.name || ""}
              onChange={(e) =>
                updateFilter(
                  index,
                  "field",
                  selectedLayer?.fields?.find((f) => f.name === e.target.value)
                )
              }
            >
              <option value="">Alan seçin</option>
              {Array.isArray(selectedLayer?.fields) &&
                selectedLayer.fields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.alias || field.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Koşul:
            <select
              value={filter.condition}
              onChange={(e) => updateFilter(index, "condition", e.target.value)}
            >
              <option value="=">Alanı şu olanlar</option>
              <option value="<">Alanı şundan küçük olanlar</option>
              <option value="<=">Alanı şundan küçük veya eşit olanlar</option>
              <option value=">">Alanı şundan büyük olanlar</option>
              <option value=">=">Alanı şundan büyük veya eşit olanlar</option>
            </select>
          </label>
          <label>
            Değer:
            <input
              type="text"
              ref={(el) => (filterInputRefs.current[index] = el)}
              value={filter.value}
              onChange={(e) => updateFilter(index, "value", e.target.value)}
            />
          </label>
          <button onClick={() => removeFilter(index)}>Kaldır</button>
        </div>
      ))}
      <calcite-button onClick={addFilter}>Filtre Ekle</calcite-button>
      <calcite-button appearance="outline" onClick={() => applyFilters()}>
        Filtreleri Uygula
      </calcite-button>
    </div>
  );
};

export default FilterOptions;
