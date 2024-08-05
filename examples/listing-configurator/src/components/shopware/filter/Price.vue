<script
  setup
  lang="ts"
  generic="
    ExtendedListingFilter extends {
      code: string;
      min?: number;
      max?: number;
      label: string;
    }
  "
>
import { ref } from "vue";
import { Input, Label } from "@/components/ui";

const props = defineProps<{
  filter: ExtendedListingFilter;
  min: number | undefined;
  max: number | undefined;
}>();

const min = ref<number>(Math.trunc(props.min || props.filter.min || 0));
const max = ref<number>(Math.trunc(props.max || props.filter.max || 0));

const emits = defineEmits<{
  (
    e: "price-filter-changed",
    value: { code: string; value: { min?: number; max?: number } },
  ): void;
}>();

const executePriceFilterChanged = (value: { min?: number; max?: number }) => {
  emits("price-filter-changed", {
    code: props.filter.code,
    value,
  });
};

const onMinChange = (value: number) => {
  if (
    props.filter.min &&
    props.filter.max &&
    Number(value) >= Number(props.filter.min) &&
    Number(value) <= Number(props.filter.max) &&
    Number(value) <= Number(max.value)
  ) {
    min.value = value;
  } else {
    if (value >= max.value) {
      min.value = Number(max.value) - 1;
    } else if (props.filter.max && value > props.filter.max) {
      min.value = Math.trunc(props.filter.max);
    } else {
      min.value = props.filter.min ? Math.trunc(props.filter.min) : 0;
    }
  }
  executePriceFilterChanged({ min: min.value, max: undefined });
};

const onMaxChange = (value: number) => {
  if (
    props.filter.min &&
    props.filter.max &&
    Number(value) >= Number(props.filter.min) &&
    Number(value) <= Number(props.filter.max) &&
    Number(value) >= Number(min.value)
  ) {
    max.value = value;
  } else {
    if (min.value >= value) {
      max.value = Number(min.value) + 1;
    } else {
      max.value = props.filter.max ? Math.trunc(props.filter.max) : 0;
    }
  }
  executePriceFilterChanged({ min: undefined, max: max.value });
};
</script>

<template>
  <div class="flex flex-wrap">
    <div class="mt-4 mb-2 inline-flex">
      <Label
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-2.5 mr-2.5"
        for="min"
        >Min</Label
      >
      <Input
        class="w-24"
        id="min"
        type="number"
        v-model="min"
        :min="props.filter.min"
        step="1"
        @change="onMinChange($event.target.value)"
      />
    </div>
    <div class="mb-4 mt-2 inline-flex">
      <Label
        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-2.5 mr-2.5"
        for="max"
        >Max</Label
      >
      <Input
        class="w-24"
        id="max"
        type="number"
        v-model="max"
        :max="props.filter.max"
        step="1"
        @input="onMaxChange($event.target.value)"
      />
    </div>
  </div>
</template>
