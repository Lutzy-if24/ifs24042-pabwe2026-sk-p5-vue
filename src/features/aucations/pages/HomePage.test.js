import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import HomePage from "./HomePage.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { AUCATION_OPEN, AUCATION_CLOSED } from "../api/aucationApi";
import { formatRupiah } from "../../../helpers/toolsHelper";

// Editor markdown berat; di tes cukup diganti textarea sederhana
const MarkdownEditorStub = defineComponent({
  name: "MarkdownEditor",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("textarea", {
        value: props.modelValue,
        onInput: (e) => emit("update:modelValue", e.target.value),
      });
  },
});

const sampleAucations = [
  {
    id: 1,
    title: "Jam Tangan",
    description: "Jam antik langka",
    start_bid: 100000,
    closed_at: null,
    cover: "https://example.com/jam.jpg",
  },
  {
    id: 2,
    title: "Sepeda",
    description: "Sepeda gunung",
    start_bid: 200000,
    closed_at: "2020-01-01T00:00:00Z",
    cover: null,
  },
  {
    id: 3,
    title: "Kamera",
    description: "Kamera mirrorless",
    start_bid: 300000,
    highest_bid: 350000,
    closed_at: "2999-01-01T00:00:00Z",
    cover: null,
  },
  { id: 4, title: null, description: null, start_bid: 1000, closed_at: null, cover: null },
];

async function mountPage(aucations = sampleAucations, loadImpl = () => Promise.resolve()) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  store.aucations = aucations;
  const loadSpy = vi.spyOn(store, "asyncSetAucations").mockImplementation(loadImpl);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { render: () => null } },
      { path: "/aucations/:aucationId", component: { render: () => null } },
    ],
  });

  const wrapper = mount(HomePage, {
    global: {
      plugins: [pinia, router],
      stubs: { MarkdownEditor: MarkdownEditorStub },
    },
  });
  await flushPromises();

  return { wrapper, store, loadSpy };
}

const findButton = (wrapper, text) =>
  wrapper.findAll("button").find((b) => b.text() === text);

// AddModal dimuat lazy (defineAsyncComponent), jadi tunggu import selesai
async function openAddModal(wrapper) {
  await findButton(wrapper, "Tambah Lelang").trigger("click");
  await vi.dynamicImportSettled();
  await flushPromises();
}

describe("HomePage (aucations)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should load aucations on mount without params", async () => {
    const { loadSpy } = await mountPage();
    expect(loadSpy).toHaveBeenCalledWith({});
  });

  it("should show loading status while aucations are loading", async () => {
    let resolveLoad;
    const pending = new Promise((resolve) => {
      resolveLoad = resolve;
    });

    const { wrapper } = await mountPage(sampleAucations, () => pending);
    expect(wrapper.find('[role="status"]').exists()).toBe(true);

    resolveLoad();
    await flushPromises();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it("should render accessible headings and cards", async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.findAll("h1").length).toBe(1);
    expect(wrapper.find("h1").text()).toBe("Dashboard Lelang");
    expect(wrapper.findAll("h2").length).toBe(4);
    expect(wrapper.find("h3").exists()).toBe(false);

    const links = wrapper.findAll("a");
    expect(links.length).toBe(4);
    expect(links[0].attributes("href")).toBe("/aucations/1");
  });

  it("should render cover image, fallback icon, status badge, and bids", async () => {
    const { wrapper } = await mountPage();

    const images = wrapper.findAll("img");
    expect(images.length).toBe(1);
    expect(images[0].attributes("alt")).toBe("Jam Tangan");
    expect(images[0].attributes("loading")).toBe("lazy");

    expect(wrapper.text()).toContain("Ditutup");
    expect(wrapper.text()).toContain("Berlangsung");
    expect(wrapper.find(".bg-emerald-700").exists()).toBe(true);

    // tanpa highest_bid -> memakai start_bid
    expect(wrapper.text()).toContain(`Tawaran tertinggi: ${formatRupiah(100000)}`);
    // dengan highest_bid
    expect(wrapper.text()).toContain(`Tawaran tertinggi: ${formatRupiah(350000)}`);
  });

  it("should show empty state when there are no aucations", async () => {
    const { wrapper } = await mountPage([]);
    expect(wrapper.text()).toContain("Belum ada lelang yang ditampilkan.");
  });

  it("should handle null aucations from store", async () => {
    const { wrapper } = await mountPage(null);
    expect(wrapper.text()).toContain("Belum ada lelang yang ditampilkan.");
  });

  it("should filter by title and by description", async () => {
    const { wrapper } = await mountPage();
    const input = wrapper.find('input[type="search"]');

    await input.setValue("kamera");
    expect(wrapper.findAll("h2").length).toBe(1);
    expect(wrapper.find("h2").text()).toBe("Kamera");

    await input.setValue("antik");
    expect(wrapper.findAll("h2").length).toBe(1);
    expect(wrapper.find("h2").text()).toBe("Jam Tangan");

    await input.setValue("tidak-ada");
    expect(wrapper.text()).toContain("Belum ada lelang yang ditampilkan.");
  });

  it("should ignore blank search query", async () => {
    const { wrapper } = await mountPage();
    await wrapper.find('input[type="search"]').setValue("   ");
    expect(wrapper.findAll("h2").length).toBe(4);
  });

  it("should reload with the correct params when tabs are clicked", async () => {
    const { wrapper, loadSpy } = await mountPage();

    await findButton(wrapper, "Lelang Saya").trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith({ is_me: 1 });
    expect(findButton(wrapper, "Lelang Saya").attributes("aria-pressed")).toBe("true");

    await findButton(wrapper, "Lelang Berlangsung").trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith({ is_closed: AUCATION_OPEN });

    await findButton(wrapper, "Lelang Ditutup").trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith({ is_closed: AUCATION_CLOSED });

    await findButton(wrapper, "Semua Lelang").trigger("click");
    expect(loadSpy).toHaveBeenLastCalledWith({});
  });

  it("should open and close AddModal", async () => {
    const { wrapper } = await mountPage();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await openAddModal(wrapper);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await wrapper.find('button[aria-label="Tutup"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("should close AddModal and reload when aucation is added", async () => {
    const { wrapper, store, loadSpy } = await mountPage();
    expect(loadSpy).toHaveBeenCalledTimes(1);

    await openAddModal(wrapper);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    store.isAucationAdded = true;
    store.setIsAucationAdd(true);
    await flushPromises();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(loadSpy).toHaveBeenCalledTimes(2);
  });
});