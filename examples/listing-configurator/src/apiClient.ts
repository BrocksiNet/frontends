import { createAPIClient } from "@shopware/api-client";
import type { operations } from "#shopware";
import Cookies from "js-cookie";

const shopwareEndpoint = "https://demo-frontends.shopware.store/store-api";
const accessToken = "SWSCBHFSNTVMAWNZDNFKSHLAYW";

export const apiClient = (
  currentShopwareEndpoint = "",
  currentAccessToken = "",
) => {
  if (currentShopwareEndpoint !== "" && currentAccessToken !== "") {
    const customApiClient = createAPIClient<operations>({
      baseURL: currentShopwareEndpoint,
      accessToken: currentAccessToken,
      contextToken: Cookies.get("sw-context-token"),
    });

    customApiClient.hook("onContextChanged", (newContextToken) => {
      Cookies.set("sw-context-token", newContextToken, {
        expires: 365, // days
        path: "/",
        sameSite: "lax",
        secure: shopwareEndpoint.startsWith("https://"),
      });
    });

    return customApiClient;
  }

  const apiClient = createAPIClient<operations>({
    baseURL: shopwareEndpoint,
    accessToken: accessToken,
    contextToken: Cookies.get("sw-context-token"),
  });

  apiClient.hook("onContextChanged", (newContextToken) => {
    Cookies.set("sw-context-token", newContextToken, {
      expires: 365, // days
      path: "/",
      sameSite: "lax",
      secure: shopwareEndpoint.startsWith("https://"),
    });
  });

  return apiClient;
};

export const getShopwareEndpoint = () => shopwareEndpoint;
export const getAccessToken = () => accessToken;
