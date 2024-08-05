<script
  setup
  lang="ts"
  generic="
    ExtendedListingFilter extends {
      code: string;
      label: string;
    }
  "
>
import { ref } from "vue";
import { RadioGroup, RadioGroupItem, Label } from "@/components/ui";

const props = defineProps<{
  filter: ExtendedListingFilter;
  rating: number | undefined;
}>();

const selectedRating = ref<string | undefined>(undefined);
const maxRating = 5;

if (props.rating) {
  selectedRating.value = props.rating.toString();
}

const emits = defineEmits<{
  (e: "rating-filter-changed", value: { code: string; value: string }): void;
}>();
</script>

<template>
  <div class="my-4">
    <RadioGroup
      v-model="selectedRating"
      @update:modelValue="
        emits('rating-filter-changed', {
          code: props.filter.code,
          value: selectedRating ?? '',
        })
      "
    >
      <div class="flex items-center space-x-2" v-for="n in maxRating">
        <RadioGroupItem
          :id="'rating_' + (maxRating + 1 - n)"
          :value="(maxRating + 1 - n).toString()"
        />
        <Label :for="'rating_' + (maxRating + 1 - n)" class="m-1">
          <div class="sr-only">
            At least {{ maxRating + 1 - n }} Stars and above
          </div>
          <template v-for="m in maxRating" class="inline">
            <img
              v-if="maxRating + 1 - n > m - 1"
              class="inline mb-0.5"
              src="../../../assets/icons/star.svg"
              width="15"
            />
            <img
              v-else
              class="inline mb-0.5"
              src="../../../assets/icons/star-empty.svg"
              width="15"
            />
          </template>
          Stars<template v-if="5 !== maxRating + 1 - n">
            & above</template
          ></Label
        >
      </div>
    </RadioGroup>
  </div>
</template>
