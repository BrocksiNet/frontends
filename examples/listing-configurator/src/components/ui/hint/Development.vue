<script setup lang="ts">
import { ref, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "../button";

const props = defineProps<{
  headline?: string;
  message?: string;
  modelValue?: string | number;
  class?: HTMLAttributes["class"];
}>();

const showIsInDevelopment = ref(true);
</script>

<template>
  <div
    :class="
      cn(
        'bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-2 mb-8',
        props.class,
      )
    "
    role="alert"
    v-if="showIsInDevelopment"
  >
    <p class="font-bold">
      {{ props.headline || "Currently in Development" }}
      <Button
        title="Remove this annoying message"
        variant="ghost"
        @click="showIsInDevelopment = false"
        >X</Button
      >
    </p>
    <p>
      {{
        props.message ||
        "This is just a preview and we know not everything is perfect. Like always, but enjoy to playaround."
      }}
    </p>
  </div>
</template>
