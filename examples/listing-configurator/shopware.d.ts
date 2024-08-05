declare module "#shopware" {
  import type { createAPIClient } from "@shopware/api-client";
  export type operations =
    import("@shopware/api-client/store-api-types").operations;
  export type Schemas =
    import("@shopware/api-client/store-api-types").components["schemas"];

  export type ApiClient = ReturnType<typeof createAPIClient<operations>>;

  export type ExtendedListingFilter = {
    label: string;
    code: string;
    id: string;
    name: string;
    options: Array<Schemas["PropertyGroupOption"]>;
    entities: Array<Schemas["ProductManufacturer"]>;
    multiFilterCondition: "AND" | "OR";
    selectedOptions: Array<string>;
    filterType: "equals" | "equalsAny" | "range";
  };

  export type MultiFilterConfig = {
    condition: "AND" | "OR";
    filters?: ExtendedListingFilter[];
  };

  export type MultiFiltersConfig = Array<MultiFilterConfig>;
}
