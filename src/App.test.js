import { describe, it, expect, vi, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import App from "./App.vue";
import { renderWithProviders } from "./test-utils";
import { createMemoryHistory } from "vue-router";
import { createAppRouter } from "./router";

describe("App Component", () => {
  // Tunggu semua impor lazy (route/komponen) selesai sebelum environment ditutup
  afterEach(async () => {
    await vi.dynamicImportSettled();
    await flushPromises();
  });

  it("should render application without crashing", async () => {
    const { wrapper } = renderWithProviders(App);
    await vi.dynamicImportSettled();
    await flushPromises();

    expect(wrapper.exists()).toBe(true);
  });

  it("should render 404 NotFoundPage for invalid route", async () => {
    const router = createAppRouter(createMemoryHistory());
    router.push("/random-invalid-route");
    await router.isReady();

    const { wrapper } = renderWithProviders(App, { router });
    await vi.dynamicImportSettled();
    await flushPromises();

    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman Tidak Ditemukan");
  });
});