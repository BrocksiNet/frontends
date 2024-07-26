<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { PropType, ref } from "vue";
type JSONDataType =
  | string
  | number
  | boolean
  | unknown[]
  | Record<string, unknown>
  | null;

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  data: {
    type: Object as PropType<JSONDataType>,
    required: true,
  },
});

const collapse = ref(false);
const toggleCollapse = () => {
  collapse.value = !collapse.value;
};
</script>

<template>
  <div>
    <a
      class="font-medium text-primary underline underline-offset-4"
      href="#"
      v-if="collapse === false"
      @click.prevent="toggleCollapse"
    >
      Show {{ props.name }}
    </a>
    <a
      class="font-medium text-primary underline underline-offset-4"
      href="#"
      v-else
      @click.prevent="toggleCollapse"
    >
      Hide {{ props.name }}
    </a>
    <VueJsonPretty :data="props.data" v-if="collapse === true" />
  </div>
</template>
