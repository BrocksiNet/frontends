import { createApp } from "vue";
import { createShopwareContext } from "@shopware-pwa/composables-next";
import { apiClient } from "./apiClient";
import App from "./App.vue";
import "./assets/index.css";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { FaInfo, FaTools } from "oh-vue-icons/icons";

addIcons(FaInfo, FaTools);

const defaultApiClient = apiClient();
createVueApp(defaultApiClient);

window.addEventListener("configUpdate", (event) => {
  const config = (event as CustomEvent).detail;
  const newApiClient = apiClient(
    config.shopwareEndpoint,
    config.shopwareAccessToken,
  );
  createVueApp(newApiClient);
});

function createVueApp(apiClient) {
  const app = createApp(App);

  const shopwareContext = createShopwareContext(app, {});
  app.provide("apiClient", apiClient);
  app.use(shopwareContext);
  app.component("v-icon", OhVueIcon);
  app.mount("#app");
}
