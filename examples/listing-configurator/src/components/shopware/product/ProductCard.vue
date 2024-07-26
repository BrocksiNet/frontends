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

defineProps<{
  product: Schemas["Product"];
}>();
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
          <li>
            <strong>Properties:</strong>
            {{
              product.properties
                ?.map((property) => property.translated?.name)
                .join(", ")
            }}
          </li>
          <li>
            <strong>Options:</strong>
            {{
              product.options
                ?.map((option) => option.translated?.name)
                .join(", ")
            }}
          </li>
        </ul>
      </CardDescription>
    </CardContent>
    <CardFooter>
      <Button variant="outline">Add to cart</Button>
    </CardFooter>
  </Card>
</template>
