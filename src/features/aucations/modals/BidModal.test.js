import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BidModal from "./BidModal.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { formatRupiah } from "../../../helpers/toolsHelper";

const noBidAucation = { id: 9, start_bid: 100000, bids: [] };
const withBidsAucation = {
  id: 9,
  start_bid: 100000,
  bids: [{ bid: 150000 }, { bid: 250000 }, { bid: 200000 }],
};

function mountModal(aucation = noBidAucation, bidImpl = () => Promise.resolve()) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  const bidSpy = vi
    .spyOn(store, "asyncSetIsBidAdd")
    .mockImplementation(bidImpl);

  const wrapper = mount(BidModal, {
    props: { aucation },
    global: { plugins: [pinia] },
  });

  return { wrapper, store, bidSpy };
}

const submitForm = (wrapper) => wrapper.find("form").trigger("submit");
const submitButton = (wrapper) => wrapper.find('button[type="submit"]');

describe("BidModal (aucations)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the dialog with a labelled bid input", () => {
    const { wrapper } = mountModal();

    expect(wrapper.find('[role="dialog"]').attributes("aria-modal")).toBe("true");
    expect(wrapper.find("h2").text()).toBe("Ajukan Tawaran");
    expect(wrapper.find('label[for="bid-amount"]').text()).toBe(
      "Nominal Tawaran (Rp)"
    );
    expect(wrapper.find("#bid-amount").attributes("type")).toBe("number");
    expect(submitButton(wrapper).text()).toBe("Ajukan Tawaran");
  });

  it("should emit close from the close icon button", async () => {
    const { wrapper } = mountModal();

    await wrapper.find('button[aria-label="Tutup"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("should emit close from the cancel button", async () => {
    const { wrapper } = mountModal();

    const cancel = wrapper.findAll("button").find((b) => b.text() === "Batal");
    await cancel.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  describe("when the aucation has no bids", () => {
    it("should use the start bid as the minimum and mention it", () => {
      const { wrapper } = mountModal(noBidAucation);

      expect(wrapper.text()).toContain(formatRupiah(100000));
      expect(wrapper.text()).toContain("atau minimal sama dengan harga awal");
      expect(wrapper.find("#bid-amount").attributes("min")).toBe("100000");
    });

    it("should treat missing bids as no bids", () => {
      const { wrapper } = mountModal({ id: 1, start_bid: 50000 });

      expect(wrapper.text()).toContain("atau minimal sama dengan harga awal");
      expect(wrapper.find("#bid-amount").attributes("min")).toBe("50000");
    });

    it("should fall back to zero when the start bid is missing", () => {
      const { wrapper } = mountModal({ id: 1 });

      expect(wrapper.find("#bid-amount").attributes("min")).toBe("0");
    });

    it("should accept a bid equal to the start bid", async () => {
      const { wrapper, bidSpy } = mountModal(noBidAucation);

      await wrapper.find("#bid-amount").setValue("100000");
      await submitForm(wrapper);
      await flushPromises();

      expect(bidSpy).toHaveBeenCalledWith(9, 100000);
      expect(wrapper.find("p.text-red-500").exists()).toBe(false);
    });

    it("should reject a bid lower than the start bid", async () => {
      const { wrapper, bidSpy } = mountModal(noBidAucation);

      await wrapper.find("#bid-amount").setValue("99999");
      await submitForm(wrapper);

      expect(bidSpy).not.toHaveBeenCalled();
      expect(wrapper.find("p.text-red-500").text()).toBe(
        `Tawaran minimal ${formatRupiah(100000)}`
      );
    });
  });

  describe("when the aucation already has bids", () => {
    it("should use the highest bid as the minimum without the start bid hint", () => {
      const { wrapper } = mountModal(withBidsAucation);

      expect(wrapper.text()).toContain(formatRupiah(250000));
      expect(wrapper.text()).not.toContain("atau minimal sama dengan harga awal");
      expect(wrapper.find("#bid-amount").attributes("min")).toBe("250001");
    });

    it("should treat non numeric bids as zero", () => {
      const { wrapper } = mountModal({
        id: 3,
        start_bid: 1000,
        bids: [{ bid: "abc" }, { bid: 5000 }, {}],
      });

      expect(wrapper.find("#bid-amount").attributes("min")).toBe("5001");
    });

    it("should reject a bid equal to the highest bid", async () => {
      const { wrapper, bidSpy } = mountModal(withBidsAucation);

      await wrapper.find("#bid-amount").setValue("250000");
      await submitForm(wrapper);

      expect(bidSpy).not.toHaveBeenCalled();
      expect(wrapper.find("p.text-red-500").text()).toBe(
        `Tawaran harus lebih tinggi dari ${formatRupiah(250000)}`
      );
    });

    it("should accept a bid higher than the highest bid", async () => {
      const { wrapper, bidSpy } = mountModal(withBidsAucation);

      await wrapper.find("#bid-amount").setValue("250001");
      await submitForm(wrapper);
      await flushPromises();

      expect(bidSpy).toHaveBeenCalledWith(9, 250001);
    });
  });

  it("should reject an empty bid", async () => {
    const { wrapper, bidSpy } = mountModal(noBidAucation);

    await submitForm(wrapper);

    expect(bidSpy).not.toHaveBeenCalled();
    expect(wrapper.find("p.text-red-500").exists()).toBe(true);
  });

  it("should reject a bid that is not a number", async () => {
    const { wrapper, bidSpy } = mountModal(noBidAucation);

    wrapper.vm.bid = "abc";
    await submitForm(wrapper);

    expect(bidSpy).not.toHaveBeenCalled();
    expect(wrapper.find("p.text-red-500").exists()).toBe(true);
  });

  it("should clear the previous error on the next valid submit", async () => {
    const { wrapper } = mountModal(noBidAucation);

    await wrapper.find("#bid-amount").setValue("1");
    await submitForm(wrapper);
    expect(wrapper.find("p.text-red-500").exists()).toBe(true);

    await wrapper.find("#bid-amount").setValue("100000");
    await submitForm(wrapper);
    await flushPromises();

    expect(wrapper.find("p.text-red-500").exists()).toBe(false);
  });

  it("should disable the submit button while sending", async () => {
    let resolveBid;
    const pending = new Promise((resolve) => {
      resolveBid = resolve;
    });
    const { wrapper } = mountModal(noBidAucation, () => pending);

    expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();

    await wrapper.find("#bid-amount").setValue("100000");
    await submitForm(wrapper);

    expect(submitButton(wrapper).text()).toBe("Mengirim...");
    expect(submitButton(wrapper).attributes("disabled")).toBeDefined();

    resolveBid();
    await flushPromises();

    expect(submitButton(wrapper).text()).toBe("Ajukan Tawaran");
    expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();
  });

  it("should emit success when the bid was added", async () => {
    const { wrapper, store } = mountModal();

    store.isBidAdded = true;
    store.setIsBidAdd(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(store.isBidAdd).toBe(false);
  });

  it("should not emit success when adding the bid failed", async () => {
    const { wrapper, store } = mountModal();

    store.isBidAdded = false;
    store.setIsBidAdd(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(store.isBidAdd).toBe(false);
  });
});