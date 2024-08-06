<script setup lang="ts">
import { onMounted, ref, unref, type Ref, watch } from "vue";
import type {
  ExtendedListingFilter,
  FilterModes,
  MultiFilterConfig,
  MultiFiltersConfig,
  Schemas,
  operations,
} from "#shopware";
import {
  createCategoryListingContext,
  useCategory,
  useCategoryListing,
  useCategorySearch,
} from "#imports";
import {
  CollapseJsonPretty,
  HelpDialog,
  PriceFilter,
  ProductCard,
  RatingFilter,
  RequestBodyPreview,
  ShippingFreeFilter,
} from "@/components/shopware";
import {
  Button,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

const categoryUuid = "e5320bfe6ff04505a442fb5843664947";

const { search: categorySearch } = useCategorySearch();
const categoryResponse = ref<Schemas["Category"] | null>(null);
categoryResponse.value = await categorySearch(categoryUuid, {
  withCmsAssociations: true,
});
// @ts-ignore-next-line
useCategory(categoryResponse);
createCategoryListingContext();

const isLoading = ref(true);
const previewNeedsUpdate = ref(true);
const page = ref(1);
const pageMax = ref(1);
const limit = ref(15);
const order = ref("name-asc");
const price = ref({ min: undefined, max: undefined } as {
  min: number | undefined;
  max: number | undefined;
});
const rating = ref(undefined) as Ref<number | undefined>;
const reduceAggregations = ref("false");
const totalCountMode: Ref<Schemas["TotalCountMode"]> = ref("exact");
const dataViewMode: Ref<"composable" | "listing"> = ref("listing");
const requestBodyPreview = ref(
  {} as operations["readProductListing post /product-listing/{categoryId}"]["body"],
);

const firstFilterCondition: Ref<"OR" | "AND"> = ref("OR");
const filterMode: Ref<FilterModes> = ref("shortcut-filter");
const setFilterMode = (value: string) => {
  if (value === "shortcut-filter") {
    multiFilterGroups.value = -1;
  }
  if (value === "plain-filter") {
    multiFilterGroups.value = 0;
  }
  if (value === "multi-filter") {
    multiFilterGroups.value = 1;
    createInitalMultiFilterConfig();
  }
  filterMode.value = value as FilterModes;
  previewUpdateToggle();
};
const multiFilterGroups = ref(-1);
const setMultiFilterGroupsAndInit = (value: string) => {
  multiFilterGroups.value = Number(value);
  createInitalMultiFilterConfig();
  previewUpdateToggle();
};
const multiFilterGroupsMax = ref(3);
const multiFiltersConfig: Ref<MultiFiltersConfig> = ref([]);

const generateMultiFilters = () => {
  const selectedFilters: Schemas["Criteria"]["filter"] = [];
  // only one group
  if (filterMode.value === "plain-filter") {
    const manufacturerIds = generateShortcutFilter("manufacturer");
    if (manufacturerIds) {
      selectedFilters.push({
        type: "equalsAny",
        field: "manufacturerId",
        value: manufacturerIds,
      });
    }
    const propertiesFilter = generatePropertiesMultiFilter();
    if (propertiesFilter) {
      selectedFilters.push(propertiesFilter);
    }

    return selectedFilters;
  }

  console.log("one group selectedFilters", generateMultiFiltersQueries());
  return generateMultiFiltersQueries();
};

// @ToDo: this needs more love especially rethink about the filterType
const generateMultiFiltersQueries = () => {
  const multiFilters: Schemas["Criteria"]["filter"] = [];
  let group = 0;
  do {
    console.log("multiFiltersConfig", multiFiltersConfig.value);
    const filters = getMultiFilterConfigFilters(group);
    const queries: Schemas["Filters"] = [];
    console.log("filters", filters);
    filters.forEach((filter) => {
      if (
        filter.selectedOptions &&
        filter.code === "properties" &&
        Object.keys(filter.selectedOptions).length > 0
      ) {
        if (filter.filterType === "equalsAny") {
          queries.push({
            type: "equalsAny",
            field: "optionIds",
            value: Object.keys(filter.selectedOptions).join("|"),
          });
          queries.push({
            type: "equalsAny",
            field: "propertyIds",
            value: Object.keys(filter.selectedOptions).join("|"),
          });
        }
        if (filter.filterType === "equals") {
          Object.keys(filter.selectedOptions).forEach((optionId) => {
            queries.push({
              type: "equals",
              field: "optionIds",
              value: optionId,
            });
          });
          Object.keys(filter.selectedOptions).forEach((optionId) => {
            queries.push({
              type: "equals",
              field: "propertyIds",
              value: optionId,
            });
          });
        }
      }
      if (
        filter.selectedOptions &&
        filter.code === "manufacturer" &&
        Object.keys(filter.selectedOptions).length > 0
      ) {
        if (filter.filterType === "equalsAny") {
          queries.push({
            type: "equalsAny",
            field: "manufacturerId",
            value: Object.keys(filter.selectedOptions).join("|"),
          });
        }
        if (filter.filterType === "equals") {
          Object.keys(filter.selectedOptions).forEach((optionId) => {
            queries.push({
              type: "equals",
              field: "manufacturerId",
              value: optionId,
            });
          });
        }
      }
    });
    let operator = getMultiFilterConfig(group).condition;
    if (group === 0 && multiFilterGroups.value === 1) {
      operator = firstFilterCondition.value;
    }
    if (queries.length > 0) {
      multiFilters.push({
        type: "multi",
        operator: operator,
        queries,
      });
    }
    group += 1;
    console.log("multiFilterGroups", multiFilterGroups.value);
  } while (group < multiFilterGroups.value);

  console.log("multiFilters before end", multiFilters);
  if (multiFilters.length > 1) {
    return [
      {
        type: "multi",
        operator: firstFilterCondition.value,
        queries: multiFilters,
      },
    ];
  }

  return multiFilters;
};

const generatePropertiesMultiFilter = () => {
  const multiFilters: Schemas["Criteria"]["filter"] = [];
  multiFiltersConfig.value.forEach((config) => {
    const queries: Schemas["Filters"] = [];
    config.filters?.forEach((filter) => {
      if (
        filter.selectedOptions &&
        filter.code === "properties" &&
        Object.keys(filter.selectedOptions).length > 0
      ) {
        queries.push({
          type: "equalsAny",
          field: "optionIds",
          value: Object.keys(filter.selectedOptions).join(","),
        });
        queries.push({
          type: "equalsAny",
          field: "propertyIds",
          value: Object.keys(filter.selectedOptions).join(","),
        });
      }
    });
    if (queries.length > 0) {
      multiFilters.push({
        type: "multi",
        operator: "OR",
        queries,
      });
    }
  });

  return multiFilters.shift();
};

const generateShortcutFilter = (code: string = "properties") => {
  const initialFilters = unref(
    getInitialFilters,
  ) as unknown as ExtendedListingFilter[];
  const properties: string[] = [];
  initialFilters.forEach((filter) => {
    if (filter.selectedOptions && filter.code === code) {
      Object.keys(filter.selectedOptions).forEach((optionId) => {
        properties.push(optionId);
      });
    }
  });

  return properties.join("|");
};

const generateBody = () => {
  let body = {
    page: page.value,
    limit: limit.value,
    order: order.value,
    "total-count-mode": totalCountMode.value,
  } as operations["readProductListing post /product-listing/{categoryId}"]["body"];

  if (
    filterMode.value === "plain-filter" ||
    filterMode.value === "multi-filter"
  ) {
    const multiFilters =
      generateMultiFilters() as Schemas["Criteria"]["filter"];
    body = { ...body, filter: multiFilters ?? [] };
  }

  if (filterMode.value === "shortcut-filter") {
    body = {
      ...body,
      properties: generateShortcutFilter(),
      manufacturer: generateShortcutFilter("manufacturer"),
    };

    if (activeFilters.value["shipping-free"] !== true) {
      body = { ...body, "shipping-free-filter": false };
    }

    if (activeFilters.value["rating"] !== true) {
      body = { ...body, "rating-filter": false };
    } else {
      if (rating.value && rating.value > 0) {
        body = { ...body, rating: rating.value };
      }
    }

    if (activeFilters.value["price"] !== true) {
      body = { ...body, "price-filter": false };
    } else {
      if (price.value.min) {
        body = { ...body, "min-price": price.value.min };
      }
      if (price.value.max) {
        body = { ...body, "max-price": price.value.max };
      }
    }

    if (activeFilters.value["manufacturer"] !== true) {
      body = { ...body, "manufacturer-filter": false };
    }

    if (activeFilters.value["shipping-free"] && shippingFreeValue.value) {
      body = { ...body, "shipping-free": shippingFreeValue.value };
    }
  }

  if (reduceAggregations.value === "true") {
    body = { ...body, "reduce-aggregations": "true" };
  }

  if (productAssociations.value) {
    const associations: { [key: string]: any } = {};
    const selectedAssociations = Object.fromEntries(
      Object.entries(productAssociations.value).filter(([_, value]) => value),
    );
    for (const key in selectedAssociations) {
      associations[key] = {};
    }
    body = { ...body, associations };
  }

  return body;
};

const {
  getAvailableFilters,
  getCurrentListing,
  getCurrentFilters,
  getElements,
  getInitialFilters,
  getInitialListing,
  search,
  setInitialListing,
  getSortingOrders,
} = useCategoryListing();
// inital search page
await search({ page: 1, limit: limit.value, order: order.value });

const executeSearch = async () => {
  isLoading.value = true;
  await search(generateBody());
  isLoading.value = false;
};

watch(
  () => [
    page,
    limit,
    order,
    reduceAggregations,
    totalCountMode,
    previewNeedsUpdate,
  ],
  () => {
    requestBodyPreview.value = generateBody();
  },
  { deep: true },
);

onMounted(async () => {
  setInitialListing(
    unref(getCurrentListing) as unknown as Schemas["ProductListingResult"],
  );
  const initalListing = unref(
    getInitialListing,
  ) as unknown as Schemas["ProductListingResult"] & {
    total?: number;
  };
  const initalTotal = initalListing.total;
  if (initalTotal) {
    pageMax.value = Math.ceil(initalTotal / unref(limit) || 1);
  }
  createInitalMultiFilterConfig();
});

const createInitalMultiFilterConfig = () => {
  const multiFilterConfig: MultiFilterConfig[] = [];
  for (let i = 0; i < unref(multiFilterGroups) + 1; i++) {
    if (i === 0) {
      const filters = unref(
        getInitialFilters,
      ) as unknown as ExtendedListingFilter[];
      multiFilterConfig.push({ condition: "OR", filters });
    } else {
      multiFilterConfig.push({ condition: "OR" });
    }
  }
  multiFiltersConfig.value = multiFilterConfig;
};

const getMultiFilterConfig = (index: number) => {
  return multiFiltersConfig.value[index];
};

const getMultiFilterConfigFilters = (index: number) => {
  return getMultiFilterConfig(index).filters ?? [];
};

const addInitalFilterConfig = (filter: ExtendedListingFilter) => {
  if (!filter.hasOwnProperty("selectedOptions")) {
    filter.selectedOptions = {};
  }
  if (filter.code === "price") {
    filter.filterType = "range";
  }
  if (!filter.hasOwnProperty("multiFilterCondition")) {
    filter.multiFilterCondition = "OR";
  }
  if (!filter.hasOwnProperty("filterType")) {
    filter.filterType = "equalsAny";
  }

  return filter;
};

const toggleSelection = (filter: ExtendedListingFilter, id: string) => {
  filter.selectedOptions[id] = !filter.selectedOptions[id];
  if (filter.selectedOptions[id] === false) {
    delete filter.selectedOptions[id];
  }
  previewUpdateToggle();
};

const updateMultiFiltersConfigFilter = (
  filter: ExtendedListingFilter,
  value: string,
) => {
  const newGroup = parseInt(value, 10);
  const tempMultiFiltersConfigValue = JSON.parse(
    JSON.stringify(multiFiltersConfig.value),
  ) as MultiFiltersConfig; // without reference
  // remove filter from other groups
  tempMultiFiltersConfigValue.forEach((config) => {
    config.filters?.forEach((configFilter) => {
      if (configFilter.label === filter.label) {
        const index = config.filters?.indexOf(configFilter);
        if (index && index !== -1 && config.filters) {
          config.filters.splice(index, 1);
        }
      }
    });
  });
  // add filter to new group
  if (!tempMultiFiltersConfigValue[newGroup - 1].filters) {
    tempMultiFiltersConfigValue[newGroup - 1].filters = [];
  }
  tempMultiFiltersConfigValue[newGroup - 1].filters?.push(filter);
  multiFiltersConfig.value = tempMultiFiltersConfigValue;
  previewUpdateToggle();
};

const updateFilterConditionType = (
  filter: ExtendedListingFilter,
  value: string,
) => {
  filter.filterType = value == "equals" ? "equals" : "equalsAny";
  previewUpdateToggle();
};

const setMultiFilterCondition = (group: number, value: string) => {
  multiFiltersConfig.value[group].condition = value === "OR" ? "OR" : "AND";
  previewUpdateToggle();
};

const setFirstMultiFilterCondition = (value: string) => {
  firstFilterCondition.value = value === "OR" ? "OR" : "AND";
  previewUpdateToggle();
};

const productAssociations = ref({
  children: false,
  deliveryTime: false,
  tax: false,
  manufacturer: true,
  unit: false,
  cover: false,
  cmsPage: false,
  canonicalProduct: false,
  media: false,
  crossSellings: false,
  configuratorSettings: false,
  productReviews: false,
  mainCategories: false,
  seoUrls: false,
  options: true,
  properties: true,
  categories: false,
  streams: false,
  customFieldSets: false,
  translations: false,
});

const shippingFreeValue = ref(false);
const activeFilters = ref({
  manufacturer: true,
  price: true,
  rating: true,
  Colour: true,
  "shipping-free": false,
});

const activeInitialFilters: Ref<ExtendedListingFilter[]> = ref([]);
const getActiveFiltersFromInitialFilters = () => {
  if (!getInitialFilters.value) {
    return [];
  }

  activeInitialFilters.value = [];
  for (const filter of getInitialFilters.value) {
    if (!filter) {
      continue;
    }
    if (activeFilters.value.hasOwnProperty(filter.name)) {
      const extendedFilter = addInitalFilterConfig(
        filter as ExtendedListingFilter,
      );
      activeInitialFilters.value.push(extendedFilter);
    }
  }

  return activeInitialFilters.value;
};

const setShippingFreeFilter = (selectValue: {
  code: string;
  value: boolean;
}) => {
  shippingFreeValue.value = selectValue.value;
  previewUpdateToggle();
};

const setPriceFilter = (event: {
  code: string;
  value: { min?: number; max?: number };
}) => {
  if (event.value.min !== undefined) {
    price.value.min = event.value.min;
  }

  if (event.value.max !== undefined) {
    price.value.max = event.value.max;
  }

  previewUpdateToggle();
};

const setRating = (event: { code: string; value: number }) => {
  rating.value = event.value;
  previewUpdateToggle();
};

const previewUpdateToggle = () => {
  previewNeedsUpdate.value = !previewNeedsUpdate.value;
};

if (previewNeedsUpdate) {
  requestBodyPreview.value = generateBody();
}
isLoading.value = false;
</script>

<template>
  <p class="leading-7 [&:not(:first-child)]:mt-6">
    <HelpDialog />
  </p>
  <h2
    class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
  >
    Filters
  </h2>
  <div class="m-2.5 ml-0">
    <div class="flex items-center space-x-2 my-4 h-[20px]">
      <div class="inline-flex m-2.5 ml-0">
        <Label for="filterType" class="pt-2.5 mr-2.5"
          >Filter Mode
          <a
            class="font-medium text-primary underline underline-offset-4"
            href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#filter"
            target="_blank"
            >ℹ️</a
          ></Label
        >
        <Select
          name="filterType"
          id="filterType"
          @update:model-value="setFilterMode"
          default-value="shortcut-filter"
        >
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Select Filter Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select Filter Mode</SelectLabel>
              <SelectItem value="shortcut-filter">Shortcut Filter</SelectItem>
              <SelectItem value="plain-filter">Plain Filter</SelectItem>
              <SelectItem value="multi-filter">Multi Filter</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div v-if="filterMode === 'multi-filter'" class="inline-flex m-2.5 ml-0">
        <Label for="multiFilterGroups" class="pt-2.5 mr-2.5">Count</Label>
        <Select
          name="multiFilterGroups"
          id="multiFilterGroups"
          @update:model-value="setMultiFilterGroupsAndInit"
          default-value="1"
        >
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Select Filter Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Count Multi Filter Groups</SelectLabel>
              <template v-for="group in multiFilterGroupsMax">
                <SelectItem :value="'' + group"
                  >{{ group == 0 ? "" : group }}
                  {{
                    group == 1 ? "Multi-Filter-Group" : "Multi-Filter-Groups"
                  }}</SelectItem
                >
              </template>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div class="flex mt-4">
      <fieldset
        v-if="filterMode === 'multi-filter'"
        class="border-dashed border-2 p-5"
        :class="{
          'w-full': multiFilterGroups > 2,
          'w-7/12': multiFilterGroups < 2,
        }"
      >
        <legend
          class=""
          v-if="filterMode === 'multi-filter' && multiFilterGroups == 1"
        >
          Multi-Filter Group 1
        </legend>
        <legend v-if="multiFilterGroups > 1">
          Top Level Multi-Filter Condition
        </legend>
        <div>
          <RadioGroup
            default-value="OR"
            :orientation="'horizontal'"
            class="grid-flow-col flex items-start"
            @update:model-value="setFirstMultiFilterCondition($event)"
          >
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="firstFilterConditionAnd" value="OR" />
              <Label for="firstFilterConditionAnd">OR</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="firstFilterConditionOr" value="AND" />
              <Label for="firstFilterConditionOr">AND</Label>
            </div>
          </RadioGroup>
        </div>
        <div
          class="text-slate-500 mt-2.5"
          v-if="multiFilterGroups == 1 && getMultiFilterConfigFilters(0).length"
        >
          <u>Assigned filters:</u><br />
          <template
            v-for="(filter, index) in getMultiFilterConfigFilters(0)"
            :key="filter.code"
          >
            {{ filter.label
            }}{{
              !(index === getMultiFilterConfigFilters(0).length - 1) ? ", " : ""
            }}
          </template>
        </div>
        <div v-if="multiFilterGroups > 1" class="flex flex-wrap">
          <template v-for="n in multiFilterGroups">
            <fieldset
              class="inline-block min-w-52 max-w-96 border-dashed border-2 p-5 m-2.5"
            >
              <legend>Multi-Filter-Group {{ n }}</legend>
              <RadioGroup
                default-value="OR"
                :orientation="'horizontal'"
                class="grid-flow-col flex items-start"
                @update:model-value="setMultiFilterCondition(n - 1, $event)"
              >
                <div class="flex items-center space-x-2">
                  <RadioGroupItem :id="'group_' + n + '_or'" value="OR" />
                  <Label :for="'group_' + n + '_or'">OR</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem :id="'group_' + n + '_and'" value="AND" />
                  <Label :for="'group_' + n + '_and'">AND</Label>
                </div>
              </RadioGroup>
              <div
                class="text-destructive mt-2.5"
                v-if="getMultiFilterConfigFilters(n - 1).length < 1"
              >
                💥 You should select at least one filter for this multi filter
                group or reduce the number of multi filter groups.
              </div>
              <div
                class="text-slate-500 mt-2.5"
                v-if="getMultiFilterConfigFilters(n - 1).length"
              >
                <u>Assigned filters:</u><br />
                <template
                  v-for="(filter, index) in getMultiFilterConfigFilters(n - 1)"
                  :key="filter.code"
                >
                  {{ filter.label
                  }}{{
                    !(index === getMultiFilterConfigFilters(n - 1).length - 1)
                      ? ", "
                      : ""
                  }}
                </template>
              </div>
            </fieldset>
          </template>
        </div>
      </fieldset>
    </div>
    <div class="block mb-4 pt-4">
      <p>Filters to use in Filter Selection</p>
      <div class="flex flex-wrap">
        <template
          v-for="filter in getInitialFilters as unknown as ExtendedListingFilter[]"
          :key="filter.code"
        >
          <div class="flex items-center space-x-2 my-2 mr-4">
            <Checkbox
              type="checkbox"
              :name="filter.name"
              :id="filter.code + '_' + filter.name"
              v-model:checked="
                activeFilters[filter.name as keyof typeof activeFilters]
              "
              @update:checked="previewUpdateToggle"
            />
            <Label
              :for="filter.code + '_' + filter.name"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-wrap"
            >
              {{ filter.label }}
            </Label>
          </div>
        </template>
      </div>
    </div>
    <div class="block my-4">
      <p>Product-Associations</p>
      <div class="flex flex-wrap">
        <template
          v-for="index in Object.keys(productAssociations)"
          :key="index"
        >
          <div class="flex items-center space-x-2 my-2 mr-4">
            <Checkbox
              type="checkbox"
              :name="index"
              :id="index"
              v-model:checked="
                productAssociations[index as keyof typeof productAssociations]
              "
              @update:checked="previewUpdateToggle"
            />
            <Label
              :for="index"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-wrap"
            >
              {{ index }}
            </Label>
          </div>
        </template>
      </div>
    </div>
  </div>
  <h3 class="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
    Filter Selection
  </h3>
  <ScrollArea class="border rounded-md w-full whitespace-nowrap">
    <div class="flex p-4 space-x-4 w-max">
      <template
        v-if="!isLoading"
        v-for="filter in getActiveFiltersFromInitialFilters()"
        :key="filter.code"
      >
        <fieldset
          class="inline w-full min-w-52 my-2"
          v-if="activeFilters[filter.name as keyof typeof activeFilters]"
        >
          <legend class="font-bold capitalize">{{ filter.label }}</legend>
          <template
            v-for="entity in filter.entities || filter.options"
            :key="entity.id"
          >
            <div class="flex items-center space-x-2 my-4">
              <Checkbox
                type="checkbox"
                :name="entity.name"
                :id="entity.id"
                :checked="filter.selectedOptions[entity.id]"
                @update:checked="toggleSelection(filter, entity.id)"
              />
              <Label
                :for="entity.id"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-wrap"
              >
                {{ entity.translated?.name }}
              </Label>
            </div>
          </template>
          <template v-if="filter.code.includes('price')">
            <PriceFilter
              :filter="filter"
              :min="price.min"
              :max="price.max"
              @priceFilterChanged="setPriceFilter"
            />
          </template>
          <template v-if="filter.code.includes('rating')">
            <RatingFilter
              :filter="filter"
              :rating="rating"
              @ratingFilterChanged="setRating"
            />
          </template>
          <template v-if="filter.code.includes('shipping-free')">
            <ShippingFreeFilter
              :filter="filter"
              :shippingFree="shippingFreeValue"
              @shippingFreeFilterChanged="setShippingFreeFilter"
            />
          </template>
          <div
            class="my-10 pt-5 border-dashed border-t-2 mr-8"
            v-if="multiFilterGroups > 0"
          >
            <div class="mt-2.5" v-if="multiFilterGroups > 1">
              <Label
                class="text-slate-500"
                :for="'multi-filter-group-' + filter.code"
                >Multi-Filter-Group</Label
              >
              <Select
                :name="'multi-filter-group-' + filter.code"
                :id="'multi-filter-group-' + filter.code"
                @update:model-value="
                  updateMultiFiltersConfigFilter(filter, $event)
                "
                default-value="1"
                class="block"
              >
                <SelectTrigger class="w-[120px]">
                  <SelectValue placeholder="Multi-Filter-Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Multi-Filter-Group</SelectLabel>
                    <template v-for="group in multiFilterGroups">
                      <SelectItem :value="group.toString()">{{
                        group
                      }}</SelectItem>
                    </template>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div class="mt-2.5" v-if="multiFilterGroups > 0">
              <Label
                class="text-slate-500"
                :for="'filter-condition-type-' + filter.code"
                >Condition Type
                <a
                  class="font-medium text-primary underline underline-offset-4"
                  href="https://developer.shopware.com/docs/resources/references/core-reference/dal-reference/filters-reference.html"
                  target="_blank"
                  >ℹ️</a
                ></Label
              >
              <Select
                :name="'filter-condition-type-' + filter.code"
                :id="'filter-condition-type-' + filter.code"
                @update:model-value="updateFilterConditionType(filter, $event)"
                default-value="equalsAny"
              >
                <SelectTrigger class="w-[120px]">
                  <SelectValue placeholder="Condition Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Condition Type</SelectLabel>
                    <SelectItem value="equalsAny">equalsAny</SelectItem>
                    <SelectItem value="equals">equals</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>
      </template>
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
  <h2
    class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
  >
    Page Settings
  </h2>
  <div class="inline">
    <div class="inline m-2.5 ml-0">
      <Label for="limit"
        >Limit
        <a
          class="font-medium text-primary underline underline-offset-4"
          href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#page--limit"
          target="_blank"
          >ℹ️</a
        ></Label
      >
      <Input
        name="limit"
        id="limit"
        v-model="limit"
        @input="limit > 100 ? (limit = 100) : limit < 1 ? (limit = 1) : limit"
        type="number"
        min="1"
        max="100"
        class="w-20 inline m-2.5"
      />
    </div>
    <div class="inline m-2.5 ml-0">
      <Label for="page"
        >Page
        <a
          class="font-medium text-primary underline underline-offset-4"
          href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#page--limit"
          target="_blank"
          >ℹ️</a
        ></Label
      >
      <Input
        name="page"
        id="page"
        v-model="page"
        @input="
          page > pageMax ? (page = pageMax) : page < 1 ? (page = 1) : page
        "
        type="number"
        min="1"
        :max="pageMax"
        class="w-20 inline m-2.5"
      />
    </div>
    <div class="inline-flex m-2.5 ml-0">
      <Label for="order" class="pt-2.5 mr-2.5"
        >Order
        <a
          class="font-medium text-primary underline underline-offset-4"
          href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#sort"
          target="_blank"
          >ℹ️</a
        ></Label
      >
      <Select name="order" id="order" v-model="order">
        <SelectTrigger class="w-[160px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Order</SelectLabel>
            <template v-for="order in getSortingOrders" :key="order.key">
              <!-- @vue-skip -->
              <SelectItem :value="order.key">{{ order.label }}</SelectItem>
            </template>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <div class="inline-flex m-2.5 ml-0">
      <Label for="reduceAggregations" class="pt-2.5 mr-2.5"
        >Reduce Aggregation
        <a
          class="font-medium text-primary underline underline-offset-4"
          href="https://shopware.stoplight.io/docs/store-api/b56ebe18277c6-searching-for-products#product-listing-criteria"
          target="_blank"
          >ℹ️</a
        >
      </Label>
      <Select
        name="reduceAggregations"
        id="reduceAggregations"
        v-model="reduceAggregations"
      >
        <SelectTrigger class="w-[100px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Reduce Aggregations</SelectLabel>
            <SelectItem value="false">No</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <div class="inline-flex m-2.5 ml-0">
      <Label for="totalCountMode" class="pt-2.5 mr-2.5"
        >Total-Count-Mode
        <a
          class="font-medium text-primary underline underline-offset-4"
          href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#total-count-mode"
          target="_blank"
          >ℹ️</a
        >
      </Label>
      <Select
        name="totalCountMode"
        id="totalCountMode"
        v-model="totalCountMode"
      >
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Total Count Mode</SelectLabel>
            <SelectItem value="exact">exact</SelectItem>
            <SelectItem value="next-pages">next-pages</SelectItem>
            <SelectItem value="none">none</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </div>
  <RequestBodyPreview :request-body-preview="requestBodyPreview" />
  <Button class="my-4" @click="executeSearch">Execute Search</Button>
  <div v-if="!isLoading">
    <h2
      class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
    >
      Data view
    </h2>
    <!--  @vue-skip -->
    <p class="leading-7 [&:not(:first-child)]:mt-6">
      Elements lenght: {{ getElements.length }} | CurrentListing total:
      {{ getCurrentListing?.total }} | InitialListing total:
      {{ getInitialListing?.total }}
    </p>
    <div class="inline-flex m-2.5 ml-0">
      <Label for="totalCountMode" class="pt-2.5 mr-2.5">Data-View-Mode</Label>
      <Select name="dataViewMode" id="dataViewMode" v-model="dataViewMode">
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="Data View Mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select the Data View Mode</SelectLabel>
            <SelectItem value="listing">listing</SelectItem>
            <SelectItem value="composable">composable</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <div class="pt-5 pb-10">
      <div v-if="dataViewMode === 'listing'">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <template
            v-for="element in getElements as unknown as Schemas['Product'][]"
            :key="element.id"
          >
            <ProductCard :product="element as unknown as Schemas['Product']" />
          </template>
          <!--  @vue-skip -->
          <p
            v-if="getElements.length < 1"
            class="leading-7 [&:not(:first-child)]:mt-6 font-bold"
          >
            💥 No elements found. 💥
          </p>
        </div>
      </div>
      <div v-if="dataViewMode === 'composable'">
        <CollapseJsonPretty
          name="getInitialListing"
          :data="
            (getInitialListing as unknown as Schemas['ProductListingResult']) ??
            {}
          "
        />
        <CollapseJsonPretty
          name="getInitialFilters"
          :data="getInitialFilters as unknown as ExtendedListingFilter[]"
        />
        <CollapseJsonPretty
          name="getCurrentFilters"
          :data="getCurrentFilters as unknown as ExtendedListingFilter[]"
        />
        <CollapseJsonPretty
          name="getAvailableFilters"
          :data="getAvailableFilters as unknown as ExtendedListingFilter[]"
        />
        <CollapseJsonPretty
          name="getElements"
          :data="getElements as unknown as Schemas['Product'][]"
        />
      </div>
    </div>
    <div class="py-5">Created with 💙 by Shopware.</div>
  </div>
</template>

<style scoped></style>
