<script setup lang="ts">
import type { ExtendedListingFilter } from "#shopware";
import { ref } from "vue";
import { Checkbox } from "@/components/ui/checkbox";

const props = defineProps<{
  filter: ExtendedListingFilter;
  shippingFree: boolean | undefined;
}>();

const emits = defineEmits<{
  (
    e: "shipping-free-filter-changed",
    value: { code: string; value: boolean },
  ): void;
}>();

const shippingFreeFilter = ref(false);
if (props.shippingFree) {
  shippingFreeFilter.value = props.shippingFree;
}

const onChangeOption = (): void => {
  shippingFreeFilter.value = shippingFreeFilter.value ? false : true;
  emits("shipping-free-filter-changed", {
    code: props.filter?.code,
    value: shippingFreeFilter.value,
  });
};
</script>

<template>
  <div class="flex items-center space-x-2 my-4">
    <Checkbox
      id="shipping-free"
      :checked="shippingFreeFilter"
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
