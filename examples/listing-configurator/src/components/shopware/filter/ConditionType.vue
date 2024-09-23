<script setup lang="ts">
import { ExtendedListingFilter } from "#shopware";
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

const conditions = [
  "equals",
  "equalsAny",
  "range",
  "contains",
  "prefix",
  "suffix",
] as const;
const props = defineProps<{
  filter: ExtendedListingFilter;
  conditionTypes: Array<(typeof conditions)[number]>;
}>();

const emits = defineEmits<{
  (
    e: "condition-type-changed",
    value: { filter: ExtendedListingFilter; value: string },
  ): void;
}>();

const updateFilterConditionType = (
  filter: ExtendedListingFilter,
  value: string,
) => {
  emits("condition-type-changed", { filter, value });
};
</script>

<template>
  <Label
    class="text-slate-500"
    :for="'filter-condition-type-' + props.filter.code"
    >Condition Type
    <a
      class="font-medium text-primary underline underline-offset-4"
      href="https://developer.shopware.com/docs/resources/references/core-reference/dal-reference/filters-reference.html"
      target="_blank"
      ><v-icon name="fa-info" /></a
  ></Label>
  <Select
    :name="'filter-condition-type-' + filter.code"
    :id="'filter-condition-type-' + filter.code"
    @update:model-value="updateFilterConditionType(filter, $event)"
    :default-value="props.conditionTypes[0]"
  >
    <SelectTrigger class="w-[120px]">
      <SelectValue placeholder="Condition Type" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Condition Type</SelectLabel>
        <template v-for="type in props.conditionTypes">
          <SelectItem :value="type">{{ type }}</SelectItem>
        </template>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
