<script setup lang="ts">
import { ref } from "vue";
import type { Schemas } from "#shopware";
import { useCategorySearch } from "#imports";
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

const emit = defineEmits<{
  (e: "categoryUpdate", category: { id: string }): void;
}>();

const { advancedSearch: categorySearch } = useCategorySearch();
const categoryResponse = ref<Schemas["Category"][] | null>(null);
categoryResponse.value = await categorySearch({
  withCmsAssociations: false,
  query: {
    filter: [
      {
        field: "active",
        type: "equals",
        value: true,
      },
      {
        field: "linkType",
        type: "equals",
        value: null,
      },
      {
        field: "visible",
        type: "equals",
        value: true,
      },
      {
        field: "childCount",
        type: "range",
        parameters: {
          gt: 0,
        },
      },
    ],
    sort: [
      {
        field: "childCount",
        order: "DESC",
      },
    ],
  },
});
const selectedCategoryId = ref<string>(categoryResponse.value?.[0]?.id ?? "");
const selectedCategory = (categoryId: string) => {
  const newCategoryId = categoryResponse.value?.find(
    (category) => category.id === categoryId,
  );
  if (!newCategoryId) return null;
  selectedCategoryId.value = newCategoryId.id;
  emit("categoryUpdate", { id: newCategoryId.id });
  return selectedCategoryId;
};
emit("categoryUpdate", { id: selectedCategoryId.value });
</script>

<template>
  <div
    class="inline-flex mt-2.5 w-full ml-auto leading-7 [&:not(:first-child)]:mt-6"
  >
    <Label
      for="category"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-2.5 mr-2.5 w-40"
      >Selected Category</Label
    >
    <Select
      name="category"
      id="category"
      @update:model-value="selectedCategory"
      :default-value="selectedCategoryId"
    >
      <SelectTrigger>
        <SelectValue placeholder="Name - ChildCount" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Name - ChildCount</SelectLabel>
          <template v-for="category in categoryResponse">
            <SelectItem :value="category.id"
              >{{ category.name }} - {{ category.childCount }}</SelectItem
            >
          </template>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
