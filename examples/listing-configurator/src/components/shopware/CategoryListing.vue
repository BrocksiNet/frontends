<script setup lang="ts">
import { onMounted, ref, unref, type Ref, watch } from "vue";
import type {
  Schemas,
  operations,
  ExtendedListingFilter,
  MultiFiltersConfig,
  MultiFilterConfig,
} from "#shopware";
import {
  createCategoryListingContext,
  useCategoryListing,
  useCategorySearch,
  useCategory,
} from "#imports";
import {
  RequestBodyPreview,
  CollapseJsonPretty,
  HelpDialog,
  ShippingFree,
  ProductCard,
} from "@/components/shopware";
import {
  Button,
  Checkbox,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  ScrollBar,
} from "@/components/ui";

const categoryUuid = "e5320bfe6ff04505a442fb5843664947";

const { search: categorySearch } = useCategorySearch();
const categoryResponse = ref();
categoryResponse.value = await categorySearch(categoryUuid, {
  withCmsAssociations: true,
});

useCategory(categoryResponse);
createCategoryListingContext();

const isLoading = ref(true);
const previewNeedsUpdate = ref(true);
const page = ref(1);
const pageMax = ref(1);
const limit = ref(15);
const order = ref("name-asc");
const reduceAggregations = ref("false");
const totalCountMode: Ref<Schemas["TotalCountMode"]> = ref("exact");
const dataViewMode: Ref<"composable" | "listing"> = ref("listing");
const requestBodyPreview = ref(
  {} as operations["readProductListing post /product-listing/{categoryId}"]["body"],
);

const firstFilterCondition: Ref<"OR" | "AND"> = ref("OR");
const multiFilterGroups = ref(-1);
const setMultiFilterGroupsAndInit = (value: string) => {
  multiFilterGroups.value = Number(value);
  createInitalMultiFilterConfig();
};
const multiFilterGroupsMax = ref(4);
const multiFiltersConfig: Ref<MultiFiltersConfig> = ref([]);

const generateMultiFilters = () => {
  const selectedFilters: Schemas["Criteria"]["filter"] = [];
  // only one group
  if (multiFilterGroups.value === 0) {
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
        filter.selectedOptions.length > 0 &&
        filter.filterType === "equalsAny"
      ) {
        queries.push({
          type: "equalsAny",
          field: "optionIds",
          value: filter.selectedOptions,
        });
        queries.push({
          type: "equalsAny",
          field: "propertyIds",
          value: filter.selectedOptions,
        });
      }
      if (
        filter.selectedOptions &&
        filter.code === "properties" &&
        filter.selectedOptions.length > 0 &&
        filter.filterType === "equals"
      ) {
        filter.selectedOptions.forEach((optionId) => {
          queries.push({
            type: "equals",
            field: "optionIds",
            value: optionId,
          });
        });
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
        filter.selectedOptions.length > 0
      ) {
        queries.push({
          type: "equalsAny",
          field: "optionIds",
          value: filter.selectedOptions,
        });
        queries.push({
          type: "equalsAny",
          field: "propertyIds",
          value: filter.selectedOptions,
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
  const initialFilters = unref(getInitialFilters) as ExtendedListingFilter[];
  const properties: string[] = [];
  initialFilters.forEach((filter) => {
    if (filter.selectedOptions && filter.code === code) {
      properties.push(...filter.selectedOptions);
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

  if (multiFilterGroups.value >= 0) {
    const multiFilters =
      generateMultiFilters() as Schemas["Criteria"]["filter"];
    body = { ...body, filter: multiFilters ?? [] };
  }

  if (multiFilterGroups.value === -1) {
    body = {
      ...body,
      properties: generateShortcutFilter(),
      manufacturer: generateShortcutFilter("manufacturer"),
    };
  }

  if (reduceAggregations.value === "true") {
    body = { ...body, "reduce-aggregations": "true" };
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
    unref(getCurrentListing) as Schemas["ProductListingResult"],
  );
  const initalTotal = unref(getInitialListing)?.total;
  if (initalTotal) {
    pageMax.value = Math.ceil(initalTotal / unref(limit) || 1);
  }
  createInitalMultiFilterConfig();
});

const createInitalMultiFilterConfig = () => {
  const multiFilterConfig: MultiFilterConfig[] = [];
  for (let i = 0; i < unref(multiFilterGroups) + 1; i++) {
    if (i === 0) {
      const filters = unref(getInitialFilters) as ExtendedListingFilter[];
      multiFilterConfig.push({ condition: "OR", filters });
    } else {
      multiFilterConfig.push({ condition: "OR" });
    }
  }
  multiFiltersConfig.value = multiFilterConfig;
  previewUpdateToggle();
};

const getMultiFilterConfig = (index: number) => {
  return multiFiltersConfig.value[index];
};

const getMultiFilterConfigFilters = (index: number) => {
  return getMultiFilterConfig(index).filters ?? [];
};

const addInitalFilterConfig = (filter: ExtendedListingFilter) => {
  if (!filter.hasOwnProperty("multiFilterCondition")) {
    filter.multiFilterCondition = "OR";
  }
  if (!filter.hasOwnProperty("filterType")) {
    filter.filterType = "equalsAny";
  }

  return filter.entities || filter.options;
};

const updateSelectedFilterOptions = (
  filter: ExtendedListingFilter,
  id: string,
) => {
  if (!filter.hasOwnProperty("selectedOptions")) {
    filter.selectedOptions = [];
  }
  if (filter.selectedOptions.includes(id)) {
    const index = filter.selectedOptions.indexOf(id);
    filter.selectedOptions.splice(index, 1);
  } else {
    filter.selectedOptions.push(id);
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
        <Label for="multiFilterGroups" class="pt-2.5 mr-2.5"
          >Filter Mode
          <a
            class="font-medium text-primary underline underline-offset-4"
            href="https://shopware.stoplight.io/docs/store-api/cf710bf73d0cd-search-queries#filter"
            target="_blank"
            >ℹ️</a
          ></Label
        >
        <Select
          name="multiFilterGroups"
          id="multiFilterGroups"
          @update:model-value="setMultiFilterGroupsAndInit"
          default-value="-1"
        >
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Select Filter Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select Filter Mode</SelectLabel>
              <SelectItem value="-1">Shortcut Filters</SelectItem>
              <template v-for="group in multiFilterGroupsMax">
                <SelectItem :value="'' + (group - 1)"
                  >{{ group - 1 == 0 ? "" : group - 1 }}
                  {{
                    group - 1 == 0
                      ? "Plain Filter"
                      : group - 1 == 1
                        ? "Multi-Filter-Group"
                        : "Multi-Filter-Groups"
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
        v-if="multiFilterGroups > 0"
        class="border-dashed border-2 p-5"
        :class="{
          'w-full': multiFilterGroups > 2,
          'w-7/12': multiFilterGroups < 2,
        }"
      >
        <legend class="" v-if="multiFilterGroups == 1">
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
  </div>
  <h3 class="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
    Filter Selection
  </h3>
  <ScrollArea class="border rounded-md w-full whitespace-nowrap">
    <div class="flex p-4 space-x-4 w-max">
      <template
        v-for="filter in getInitialFilters as ExtendedListingFilter[]"
        :key="filter.code"
      >
        <fieldset class="inline w-full min-w-52 my-2">
          <legend class="font-bold">{{ filter.label }}</legend>
          <template
            v-for="entity in addInitalFilterConfig(filter)"
            :key="entity.id"
          >
            <div class="flex items-center space-x-2 my-4">
              <Checkbox
                type="checkbox"
                :name="entity.name"
                :id="entity.id"
                @update:checked="updateSelectedFilterOptions(filter, entity.id)"
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
            <p class="leading-7 [&:not(:first-child)]:mt-6">
              Custom stuff for price
            </p>
          </template>
          <template v-if="filter.code.includes('rating')">
            <p class="leading-7 [&:not(:first-child)]:mt-6">
              Custom stuff for rating
            </p>
          </template>
          <template v-if="filter.code.includes('shipping-free')">
            <ShippingFree :filter="filter" />
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
          <template v-for="element in getElements" :key="element.id">
            <ProductCard :product="element" />
          </template>
        </div>
      </div>
      <div v-if="dataViewMode === 'composable'">
        <CollapseJsonPretty
          name="getInitialListing"
          :data="getInitialListing ?? {}"
        />
        <CollapseJsonPretty
          name="getInitialFilters"
          :data="getInitialFilters"
        />
        <CollapseJsonPretty
          name="getCurrentFilters"
          :data="getCurrentFilters"
        />
        <CollapseJsonPretty
          name="getAvailableFilters"
          :data="getAvailableFilters"
        />
        <CollapseJsonPretty name="getElements" :data="getElements" />
      </div>
    </div>
    <div class="py-5">Created with 💙 by Shopware.</div>
  </div>
</template>

<style scoped></style>
