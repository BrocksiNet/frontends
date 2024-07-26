<script setup lang="ts">
import { useSessionContext } from "@shopware-pwa/composables-next";
import CategoryListing from "@/components/shopware/CategoryListing.vue";

// for initialize the session and get the current currency
const { refreshSessionContext } = useSessionContext();

// init a session
refreshSessionContext();
</script>

<template>
  <div class="container mx-auto pt-5">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
      Listing Configurator
    </h1>
    <Suspense>
      <CategoryListing />
      <template #fallback>
        <p class="leading-7 [&:not(:first-child)]:mt-6">
          Loading ... Listing Configurator ... ⏳
        </p>
      </template>
    </Suspense>
  </div>
</template>
