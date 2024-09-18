<script setup lang="ts">
import { ref } from "vue";
import { useSessionContext } from "@shopware-pwa/composables-next";
import {
  CategoryListing,
  CategorySelect,
  HelpDialog,
  ConfigDialog,
} from "@/components/shopware";
import { DevelopmentHint } from "@/components/ui";

const categoryId = ref<string>("");
const updateCategory = (category: { id: string }) => {
  categoryId.value = category.id;
};

const configUpdate = (config: {
  shopwareEndpoint: string;
  shopwareAccessToken: string;
}) => {
  const event = new CustomEvent("configUpdate", { detail: config });
  window.dispatchEvent(event); // window event needed to pass it to main.ts
};

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
    <p class="leading-7 [&:not(:first-child)]:mt-6">
      <DevelopmentHint />
      <HelpDialog />
    </p>
    <div class="flex flex-row leading-7 [&:not(:first-child)]:mt-6">
      <div class="basis-1/2">
        <Suspense>
          <CategorySelect @category-update="updateCategory" />
        </Suspense>
      </div>
      <div class="basis-1/2 text-right">
        <ConfigDialog @config-update="configUpdate" />
      </div>
    </div>
    <Suspense v-if="categoryId !== ''">
      <CategoryListing :category-id="categoryId" :key="categoryId" />
      <template #fallback>
        <p class="leading-7 [&:not(:first-child)]:mt-6">
          Loading ... Listing Configurator ... ⏳
        </p>
      </template>
    </Suspense>
    <div v-if="categoryId === ''" class="leading-7 [&:not(:first-child)]:mt-6">
      <p>
        We did not found any category. 😱 Check also your store-API
        configuration. 💡
      </p>
    </div>
  </div>
</template>
