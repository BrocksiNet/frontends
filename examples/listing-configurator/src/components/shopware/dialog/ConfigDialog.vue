<script setup lang="ts">
import { ref } from "vue";
import { getShopwareEndpoint, getAccessToken } from "../../../apiClient";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@/components/ui";

const emit = defineEmits<{
  (
    e: "configUpdate",
    config: { shopwareEndpoint: string; shopwareAccessToken: string },
  ): void;
}>();

const shopwareEndpoint = ref(getShopwareEndpoint());
const shopwareAccessToken = ref(getAccessToken());
const errorMessage = ref("");

// a very cheap way to validate the URL
function isHttpUrlValid(url: string) {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === "http:" || newUrl.protocol === "https:";
  } catch (err) {
    return false;
  }
}

function save() {
  if (!shopwareEndpoint.value || !shopwareAccessToken.value) {
    errorMessage.value = "Please fill in all fields";
    return;
  }

  if (!shopwareEndpoint.value.includes("store-api")) {
    errorMessage.value =
      "Please provide a valid store-api endpoint. Should contain 'store-api' at the end.";
    return;
  }

  if (isHttpUrlValid(shopwareEndpoint.value) === false) {
    errorMessage.value =
      "Please provide a valid URL. Should contain 'http://' or 'https://'.";
    return;
  }

  if (shopwareAccessToken.value.length !== 26) {
    errorMessage.value =
      "Please provide a valid access token. Should be 26 characters long.";
    return;
  }

  emit("configUpdate", {
    shopwareEndpoint: shopwareEndpoint.value,
    shopwareAccessToken: shopwareAccessToken.value,
  });
}
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">
        <v-icon name="fa-tools" />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-7xl">
      <DialogHeader>
        <DialogTitle>API Client Settings</DialogTitle>
        <DialogDescription
          >for store-API and the Listing Configurator</DialogDescription
        >
      </DialogHeader>
      <div class="grid gap-2 py-4">
        Change the Endpoint and AccessToken to use another Shopware Instance.
        <div class="inline m-2.5 ml-0 mb-0">
          <Label for="shopwareEndpoint" class="w-28 inline-block"
            >Endpoint</Label
          >
          <Input
            name="shopwareEndpoint"
            id="shopwareEndpoint"
            v-model="shopwareEndpoint"
            class="w-2/6 inline m-2.5"
          />
        </div>
        <div class="inline m-2.5 mt-0 ml-0">
          <Label for="shopwareAccessToken" class="w-28 inline-block"
            >AccessToken</Label
          >
          <Input
            name="shopwareAccessToken"
            id="shopwareAccessToken"
            v-model="shopwareAccessToken"
            class="w-2/6 inline m-2.5"
          />
        </div>
        <div v-if="errorMessage !== ''">
          <p class="text-red-500">{{ errorMessage }}</p>
        </div>
        <div class="inline m-2.5 mt-0 ml-0">
          <Button @click="save">Save</Button>
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
