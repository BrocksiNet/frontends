import type { Schemas, ExtendedListingFilter } from "#shopware";
import type { Ref } from "vue";

export const generatePriceFilter = (
  price: Ref<{ min: number | undefined; max: number | undefined }>,
) => {
  return {
    type: "range",
    field: "price",
    parameters: generatePriceFilterParameters(price),
  } as Schemas["RangeFilter"];
};

export const generatePriceFilterParameters = (
  price: Ref<{ min: number | undefined; max: number | undefined }>,
) => {
  const { min, max } = price.value;
  let parameters = {};
  if (min && max) {
    parameters = { gte: min, lte: max };
  } else if (min) {
    parameters = { gte: min };
  } else if (max) {
    parameters = { lte: max };
  }

  return parameters;
};

export const generateShortcutPriceFilter = (
  activeFilters: Ref<Record<string, boolean>>,
  price: Ref<{ min: number | undefined; max: number | undefined }>,
) => {
  const { min, max } = price.value;
  if (activeFilters.value["price"] !== true) {
    return { "price-filter": false };
  } else {
    if (min && max) {
      return { "min-price": min, "max-price": max };
    } else if (min) {
      return { "min-price": min };
    } else if (max) {
      return { "max-price": max };
    }
  }
};

export const generateShippingFreeFilter = (
  activeFilters: Ref<Record<string, boolean>>,
  shippingFreeValue: Ref<boolean>,
) => {
  if (activeFilters.value["shipping-free"] === false) {
    return { "shipping-free-filter": false };
  }

  if (activeFilters.value["shipping-free"]) {
    return { "shipping-free": shippingFreeValue.value };
  }

  return {};
};

export const generateRatingFilter = (
  activeFilters: Ref<Record<string, boolean>>,
  rating: Ref<number | undefined>,
) => {
  if (activeFilters.value["rating"] !== true) {
    return { "rating-filter": false };
  } else {
    if (rating.value && rating.value > 0) {
      return { rating: rating.value };
    }
  }
};

export const generateManufacturerFilter = (
  activeFilters: Ref<Record<string, boolean>>,
  manufacturer: string,
) => {
  if (activeFilters.value["manufacturer"] !== true) {
    return { "manufacturer-filter": false };
  } else {
    if (manufacturer !== "") {
      return { manufacturer: manufacturer };
    }
  }
};

export const generatePropertiesFilter = (properties: string) => {
  if (properties !== "") {
    return { properties: properties };
  }

  return {};
};

export const generateFilterQueries = (
  filter: ExtendedListingFilter,
  field: string | Array<string>,
) => {
  const queries: Schemas["Filters"] = [];
  if (filter.filterType === "equalsAny") {
    if (field instanceof Array) {
      field.forEach((field) => {
        queries.push({
          type: "equalsAny",
          field: field,
          value: Object.keys(filter.selectedOptions).join("|"),
        });
      });
    }

    if (typeof field === "string") {
      queries.push({
        type: "equalsAny",
        field: field,
        value: Object.keys(filter.selectedOptions).join("|"),
      });
    }
  }

  if (filter.filterType === "equals") {
    if (field instanceof Array) {
      field.forEach((field) => {
        Object.keys(filter.selectedOptions).forEach((value) => {
          queries.push({
            type: "equals",
            field: field,
            value: value,
          });
        });
      });
    }

    if (typeof field === "string") {
      Object.keys(filter.selectedOptions).forEach((value) => {
        queries.push({
          type: "equals",
          field: field,
          value: value,
        });
      });
    }
  }

  return queries as Array<Schemas["EqualsFilter"] | Schemas["SimpleFilter"]>;
};
