<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";

import type { Schemas } from "#shopware";

const props = defineProps<{
  product: Schemas["Product"];
}>();

const getProductProperties = () => {
  return props.product.properties
    ?.map((property) => property.translated?.name)
    .join(", ");
};

const isProductPropertiesSet = () => {
  if (!props.product.properties) {
    return false;
  }

  return props.product.properties.length > 0;
};

const getProductOptions = () => {
  return props.product.options
    ?.map((option) => option.translated?.name)
    .join(", ");
};

const isProductOptionsSet = () => {
  if (!props.product.options) {
    return false;
  }

  return props.product.options.length > 0;
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ product.name }}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>
        <ul>
          <li>
            <strong>Price:</strong> {{ product.calculatedPrice.totalPrice }}
          </li>
          <li>
            <strong>Manufacturer:</strong>
            {{ product.manufacturer?.translated?.name }}
          </li>
          <li v-if="isProductPropertiesSet()">
            <strong>Properties:</strong>
            {{ getProductProperties() }}
          </li>
          <li v-else><strong>Properties:</strong> -</li>
          <li v-if="isProductOptionsSet()">
            <strong>Options:</strong>
            {{ getProductOptions() }}
          </li>
          <li v-else><strong>Options:</strong> -</li>
        </ul>
      </CardDescription>
    </CardContent>
    <CardFooter>
      <Button variant="outline">Add to cart</Button>
    </CardFooter>
  </Card>
</template>
