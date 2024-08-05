<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import type { operations } from "#shopware";
import { UseClipboard } from "@vueuse/components";
import { Button } from "@/components/ui";

const props = defineProps<{
  requestBodyPreview: operations["readProductListing post /product-listing/{categoryId}"]["body"];
}>();
</script>

<template>
  <div>
    <p>
      <strong>Request body preview:</strong>
    </p>
    <VueJsonPretty :data="props.requestBodyPreview" />
    <UseClipboard
      v-slot="{ copy, copied }"
      :source="JSON.stringify(props.requestBodyPreview)"
    >
      <Button
        variant="secondary"
        @click="copy(JSON.stringify(props.requestBodyPreview))"
      >
        {{ copied ? "Copied" : "Copy" }}
      </Button>
    </UseClipboard>
  </div>
</template>
