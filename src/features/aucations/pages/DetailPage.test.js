import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h, reactive } from "vue";
import { mount, flushPromises, RouterLinkStub } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import DetailPage from "./DetailPage.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatRupiah,
  formatDate,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";

// Router dibuat reaktif supaya watch pada route.params ikut jalan
const holder = vi.hoisted(() => ({ route: null, push: vi.fn() }));

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: () => holder.route,
  useRouter: () => ({ push: holder.push }),
}));

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
}));

const MarkdownViewerStub = defineComponent({
  name: "MarkdownViewer",
  props: ["content"],
  setup(props) {
    return () => h("div", { "data-testid": "viewer" }, props.content);
  },
});

function makeModalStub(name, testId, propName) {
  return defineComponent({
    name,
    props: [propName],
    emits: ["close", "success"],
    setup(props, { emit }) {
      return () =>
        h("div", { "data-testid": testId, "data-prop": String(props[propName]?.id ?? props[propName]) }, [
          h("button", { "data-testid": `${testId}-close`, onClick: () => emit("close") }, "close"),
          h("button", { "data-testid": `${testId}-success`, onClick: () => emit("success") }, "success"),
        ]);
    },
  });
}

const ChangeModalStub = makeModalStub("ChangeModal", "change-modal", "aucation");
const ChangeCoverModalStub = makeModalStub("ChangeCoverModal", "cover-modal", "aucationId");
const BidModalStub = makeModalStub("BidModal", "bid-modal", "aucation");

const baseAucation = {
  id: 5,
  user_id: 1,
  title: "Jam Antik",
  description: "Deskripsi **tebal**",
  cover: "http://img.test/cover.png",
  start_bid: 100000,
  closed_at: "2099-12-31T10:30:00Z",
  bids: [],
  my_bid: null,
};

const ownerProfile = { id: 1 };
const otherProfile = { id: 2 };

async function mountPage({
  aucation = baseAucation,
  profile = otherProfile,
  loadImpl,
} = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  const usersStore = useUsersStore();
  usersStore.profile = profile;

  const loadSpy = vi.spyOn(store, "asyncSetAucation").mockImplementation(
    loadImpl ??
      (async () => {
        store.aucation = aucation;
        store.isAucation = true;
      })
  );

  const wrapper = mount(DetailPage, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: RouterLinkStub,
        MarkdownViewer: MarkdownViewerStub,
        ChangeModal: ChangeModalStub,
        ChangeCoverModal: ChangeCoverModalStub,
        BidModal: BidModalStub,
      },
    },
  });
  await flushPromises();

  return { wrapper, store, usersStore, loadSpy };
}

const findButton = (wrapper, text) =>
  wrapper.findAll("button").find((b) => b.text() === text);

const byTestId = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`);

function cardValue(wrapper, label) {
  const p = wrapper.findAll("p").find((n) => n.text() === label);
  return p.element.nextElementSibling.textContent.trim();
}

describe("DetailPage (aucations)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    holder.route = reactive({ params: { aucationId: "5" } });
  });

  describe("loading and not found", () => {
    it("should show the spinner while the aucation is loading", async () => {
      const { wrapper } = await mountPage({ loadImpl: () => new Promise(() => {}) });

      expect(wrapper.find(".animate-spin").exists()).toBe(true);
      expect(wrapper.text()).not.toContain("Lelang tidak ditemukan.");
    });

    it("should fetch the aucation from the route param on mount", async () => {
      const { loadSpy } = await mountPage();

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledWith("5");
    });

    it("should show a not found message with a link back to the dashboard", async () => {
      const { wrapper } = await mountPage({ aucation: null });

      expect(wrapper.text()).toContain("Lelang tidak ditemukan.");
      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.props("to")).toBe("/");
      expect(link.text()).toBe("Kembali ke Dashboard");
    });
  });

  describe("aucation details", () => {
    it("should render the title, closing date, prices, cover and description", async () => {
      const { wrapper } = await mountPage();

      expect(wrapper.find("h1").text()).toBe("Jam Antik");
      expect(wrapper.text()).toContain(`Ditutup: ${formatDate(baseAucation.closed_at)}`);
      expect(cardValue(wrapper, "Harga Awal")).toBe(formatRupiah(100000));
      expect(cardValue(wrapper, "Tawaran Tertinggi")).toBe(formatRupiah(100000));
      expect(cardValue(wrapper, "Tawaran Saya")).toBe("-");

      const img = wrapper.find("img");
      expect(img.attributes("src")).toBe("http://img.test/cover.png");
      expect(img.attributes("alt")).toBe("Jam Antik");
      expect(byTestId(wrapper, "viewer").text()).toBe("Deskripsi **tebal**");
    });

    it("should show a placeholder when there is no cover", async () => {
      const { wrapper } = await mountPage({
        aucation: { ...baseAucation, cover: null },
      });

      expect(wrapper.find("img").exists()).toBe(false);
      expect(wrapper.text()).toContain("Tidak ada cover");
    });

    it("should pass an empty string to the viewer when there is no description", async () => {
      const { wrapper } = await mountPage({
        aucation: { ...baseAucation, description: undefined },
      });

      expect(byTestId(wrapper, "viewer").text()).toBe("");
    });

    it("should fall back to zero when there are no bids and no start bid", async () => {
      const { wrapper } = await mountPage({
        aucation: { ...baseAucation, start_bid: 0, bids: undefined },
      });

      expect(cardValue(wrapper, "Tawaran Tertinggi")).toBe(formatRupiah(0));
      expect(wrapper.text()).toContain("Belum ada tawaran.");
    });

    it("should list bids from highest to lowest with the highest bid on top", async () => {
      const { wrapper } = await mountPage({
        aucation: {
          ...baseAucation,
          bids: [
            { bid: 200000, user: { name: "Budi" }, created_at: "2099-01-02T10:00:00Z" },
            { bid: 300000, name: "Ani", created_at: "2099-01-03T10:00:00Z" },
            { bid: 0, created_at: "2099-01-01T10:00:00Z" },
          ],
        },
      });

      expect(cardValue(wrapper, "Tawaran Tertinggi")).toBe(formatRupiah(300000));
      expect(wrapper.text()).not.toContain("Belum ada tawaran.");

      const items = wrapper.findAll("li");
      expect(items).toHaveLength(3);
      expect(items[0].text()).toContain("Ani");
      expect(items[0].text()).toContain(formatRupiah(300000));
      expect(items[1].text()).toContain("Budi");
      expect(items[1].text()).toContain(formatRupiah(200000));
      expect(items[2].text()).toContain("Pengguna");
      expect(items[2].text()).toContain(formatRupiah(0));
    });

    it("should treat bids without an amount as zero on both sides of the sort", async () => {
      const { wrapper } = await mountPage({
        aucation: {
          ...baseAucation,
          bids: [
            { bid: 0, name: "Ani", created_at: "2099-01-01T10:00:00Z" },
            { bid: 200000, name: "Budi", created_at: "2099-01-02T10:00:00Z" },
            { bid: 0, name: "Citra", created_at: "2099-01-03T10:00:00Z" },
          ],
        },
      });

      const items = wrapper.findAll("li");
      expect(items).toHaveLength(3);
      expect(items[0].text()).toContain("Budi");
      expect(cardValue(wrapper, "Tawaran Tertinggi")).toBe(formatRupiah(200000));
    });

    it("should link back to the dashboard", async () => {
      const { wrapper } = await mountPage();

      const link = wrapper.findComponent(RouterLinkStub);
      expect(link.props("to")).toBe("/");
      expect(link.text()).toBe("← Kembali");
    });
  });

  describe("owner and bidder actions", () => {
    it("should show owner actions when the user id matches user_id", async () => {
      const { wrapper } = await mountPage({ profile: ownerProfile });

      expect(findButton(wrapper, "Ubah")).toBeTruthy();
      expect(findButton(wrapper, "Ganti Cover")).toBeTruthy();
      expect(findButton(wrapper, "Hapus")).toBeTruthy();
      expect(findButton(wrapper, "Ajukan Tawaran")).toBeUndefined();
    });

    it("should show owner actions when the user id matches user.id", async () => {
      const { wrapper } = await mountPage({
        profile: ownerProfile,
        aucation: { ...baseAucation, user_id: undefined, user: { id: 1 } },
      });

      expect(findButton(wrapper, "Ubah")).toBeTruthy();
      expect(findButton(wrapper, "Ajukan Tawaran")).toBeUndefined();
    });

    it("should let another user place a bid when they have none", async () => {
      const { wrapper } = await mountPage({ profile: otherProfile });

      expect(findButton(wrapper, "Ajukan Tawaran")).toBeTruthy();
      expect(findButton(wrapper, "Batalkan Tawaran Saya")).toBeUndefined();
      expect(findButton(wrapper, "Ubah")).toBeUndefined();
    });

    it("should let another user cancel their bid and show its amount", async () => {
      const { wrapper } = await mountPage({
        aucation: { ...baseAucation, my_bid: { bid: 150000 } },
      });

      expect(findButton(wrapper, "Batalkan Tawaran Saya")).toBeTruthy();
      expect(findButton(wrapper, "Ajukan Tawaran")).toBeUndefined();
      expect(cardValue(wrapper, "Tawaran Saya")).toBe(formatRupiah(150000));
    });

    it("should not treat the user as the owner when there is no profile", async () => {
      const { wrapper } = await mountPage({ profile: null });

      expect(findButton(wrapper, "Ubah")).toBeUndefined();
      expect(findButton(wrapper, "Ajukan Tawaran")).toBeTruthy();
    });

    it("should not be the owner when there is no aucation", async () => {
      const { wrapper } = await mountPage({ aucation: null, profile: ownerProfile });

      expect(wrapper.vm.isOwner).toBe(false);
    });
  });

  describe("modals", () => {
    it("should open and close the change modal", async () => {
      const { wrapper } = await mountPage({ profile: ownerProfile });
      expect(byTestId(wrapper, "change-modal").exists()).toBe(false);

      await findButton(wrapper, "Ubah").trigger("click");
      expect(byTestId(wrapper, "change-modal").exists()).toBe(true);
      expect(byTestId(wrapper, "change-modal").attributes("data-prop")).toBe("5");

      await byTestId(wrapper, "change-modal-close").trigger("click");
      expect(byTestId(wrapper, "change-modal").exists()).toBe(false);
    });

    it("should reload and close the change modal on success", async () => {
      const { wrapper, loadSpy } = await mountPage({ profile: ownerProfile });

      await findButton(wrapper, "Ubah").trigger("click");
      await byTestId(wrapper, "change-modal-success").trigger("click");
      await flushPromises();

      expect(byTestId(wrapper, "change-modal").exists()).toBe(false);
      expect(loadSpy).toHaveBeenCalledTimes(2);
      expect(loadSpy).toHaveBeenLastCalledWith("5");
    });

    it("should open and close the cover modal with the aucation id", async () => {
      const { wrapper } = await mountPage({ profile: ownerProfile });
      expect(byTestId(wrapper, "cover-modal").exists()).toBe(false);

      await findButton(wrapper, "Ganti Cover").trigger("click");
      expect(byTestId(wrapper, "cover-modal").exists()).toBe(true);
      expect(byTestId(wrapper, "cover-modal").attributes("data-prop")).toBe("5");

      await byTestId(wrapper, "cover-modal-close").trigger("click");
      expect(byTestId(wrapper, "cover-modal").exists()).toBe(false);
    });

    it("should reload and close the cover modal on success", async () => {
      const { wrapper, loadSpy } = await mountPage({ profile: ownerProfile });

      await findButton(wrapper, "Ganti Cover").trigger("click");
      await byTestId(wrapper, "cover-modal-success").trigger("click");
      await flushPromises();

      expect(byTestId(wrapper, "cover-modal").exists()).toBe(false);
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });

    it("should open and close the bid modal", async () => {
      const { wrapper } = await mountPage();
      expect(byTestId(wrapper, "bid-modal").exists()).toBe(false);

      await findButton(wrapper, "Ajukan Tawaran").trigger("click");
      expect(byTestId(wrapper, "bid-modal").exists()).toBe(true);
      expect(byTestId(wrapper, "bid-modal").attributes("data-prop")).toBe("5");

      await byTestId(wrapper, "bid-modal-close").trigger("click");
      expect(byTestId(wrapper, "bid-modal").exists()).toBe(false);
    });

    it("should reload and close the bid modal on success", async () => {
      const { wrapper, loadSpy } = await mountPage();

      await findButton(wrapper, "Ajukan Tawaran").trigger("click");
      await byTestId(wrapper, "bid-modal-success").trigger("click");
      await flushPromises();

      expect(byTestId(wrapper, "bid-modal").exists()).toBe(false);
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("deleting the aucation", () => {
    it("should delete and go back to the dashboard when confirmed", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: true });
      const { wrapper, store } = await mountPage({ profile: ownerProfile });
      const deleteSpy = vi
        .spyOn(store, "asyncSetIsAucationDelete")
        .mockImplementation(async () => {
          store.isAucationDeleted = true;
        });

      await findButton(wrapper, "Hapus").trigger("click");
      await flushPromises();

      expect(showConfirmDialog).toHaveBeenCalledWith("Yakin ingin menghapus lelang ini?");
      expect(deleteSpy).toHaveBeenCalledWith("5");
      expect(holder.push).toHaveBeenCalledWith("/");
    });

    it("should stay on the page when deleting failed", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: true });
      const { wrapper, store } = await mountPage({ profile: ownerProfile });
      const deleteSpy = vi
        .spyOn(store, "asyncSetIsAucationDelete")
        .mockImplementation(async () => {
          store.isAucationDeleted = false;
        });

      await findButton(wrapper, "Hapus").trigger("click");
      await flushPromises();

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(holder.push).not.toHaveBeenCalled();
    });

    it("should do nothing when the confirmation is cancelled", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: false });
      const { wrapper, store } = await mountPage({ profile: ownerProfile });
      const deleteSpy = vi.spyOn(store, "asyncSetIsAucationDelete").mockResolvedValue();

      await findButton(wrapper, "Hapus").trigger("click");
      await flushPromises();

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(holder.push).not.toHaveBeenCalled();
    });
  });

  describe("cancelling a bid", () => {
    const withMyBid = { ...baseAucation, my_bid: { bid: 150000 } };

    it("should cancel the bid and reload when confirmed", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: true });
      const { wrapper, store, loadSpy } = await mountPage({ aucation: withMyBid });
      const cancelSpy = vi
        .spyOn(store, "asyncSetIsBidDelete")
        .mockImplementation(async () => {
          store.isBidDeleted = true;
        });

      await findButton(wrapper, "Batalkan Tawaran Saya").trigger("click");
      await flushPromises();

      expect(showConfirmDialog).toHaveBeenCalledWith(
        "Yakin ingin membatalkan tawaran Anda?"
      );
      expect(cancelSpy).toHaveBeenCalledWith("5");
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });

    it("should not reload when cancelling the bid failed", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: true });
      const { wrapper, store, loadSpy } = await mountPage({ aucation: withMyBid });
      const cancelSpy = vi
        .spyOn(store, "asyncSetIsBidDelete")
        .mockImplementation(async () => {
          store.isBidDeleted = false;
        });

      await findButton(wrapper, "Batalkan Tawaran Saya").trigger("click");
      await flushPromises();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when the confirmation is cancelled", async () => {
      showConfirmDialog.mockResolvedValue({ isConfirmed: false });
      const { wrapper, store, loadSpy } = await mountPage({ aucation: withMyBid });
      const cancelSpy = vi.spyOn(store, "asyncSetIsBidDelete").mockResolvedValue();

      await findButton(wrapper, "Batalkan Tawaran Saya").trigger("click");
      await flushPromises();

      expect(cancelSpy).not.toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("route param changes", () => {
    it("should reload when the aucation id in the route changes", async () => {
      const { store, loadSpy } = await mountPage();
      const setSpy = vi.spyOn(store, "setIsAucation");

      holder.route.params.aucationId = "8";
      await flushPromises();

      expect(setSpy).toHaveBeenCalledWith(false);
      expect(loadSpy).toHaveBeenCalledTimes(2);
      expect(loadSpy).toHaveBeenLastCalledWith("8");
    });

    it("should ignore an empty aucation id", async () => {
      const { loadSpy } = await mountPage();

      holder.route.params.aucationId = "";
      await flushPromises();

      expect(loadSpy).toHaveBeenCalledTimes(1);
    });
  });
});