<script setup lang="ts">
import type { ExtendedListingFilter } from "#shopware";
import { ref } from "vue";
import { Checkbox } from "@/components/ui/checkbox";

const props = defineProps<{
  filter: ExtendedListingFilter;
}>();

const emits = defineEmits<{
  (e: "select-value", value: { code: string; value: boolean }): void;
}>();

const currentFilterData = ref(false);
const onChangeOption = (): void => {
  currentFilterData.value = currentFilterData.value ? false : true;
  emits("select-value", {
    code: props.filter?.code,
    value: currentFilterData.value,
  });
};
</script>

<template>
  <div class="flex items-center space-x-2 my-4">
    <Checkbox
      id="shipping-free"
      v-model="currentFilterData"
      type="checkbox"
      @update:checked="onChangeOption()"
    />
    <label
      for="shipping-free"
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {{ props.filter.label }}
    </label>
  </div>
</template>
