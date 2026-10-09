import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAucationsStore } from "./aucationsStore";
import aucationApi from "../api/aucationApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../api/aucationApi", () => ({
  default: {
    getAucations: vi.fn(),
    getAucation: vi.fn(),
    addAucation: vi.fn(),
    changeAucation: vi.fn(),
    changeAucationCover: vi.fn(),
    deleteAucation: vi.fn(),
    addBid: vi.fn(),
    deleteBid: vi.fn(),
    deleteAllAucations: vi.fn(),
  },
}));

vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
}));

describe("aucationsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should have initial state", () => {
    const store = useAucationsStore();
    expect(store.aucations).toEqual([]);
    expect(store.aucation).toBeNull();
    expect(store.isAucation).toBe(false);
  });

  it("asyncSetAucations success", async () => {
    aucationApi.getAucations.mockResolvedValue([{ id: 1 }]);
    const store = useAucationsStore();
    await store.asyncSetAucations();
    expect(store.aucations).toEqual([{ id: 1 }]);
  });

  it("asyncSetAucations fail sets empty", async () => {
    aucationApi.getAucations.mockRejectedValue(new Error("fail"));
    const store = useAucationsStore();
    await store.asyncSetAucations();
    expect(store.aucations).toEqual([]);
  });

  it("asyncSetAucation success", async () => {
    aucationApi.getAucation.mockResolvedValue({ id: 5 });
    const store = useAucationsStore();
    await store.asyncSetAucation(5);
    expect(store.aucation).toEqual({ id: 5 });
    expect(store.isAucation).toBe(true);
  });

  it("asyncSetAucation fail", async () => {
    aucationApi.getAucation.mockRejectedValue(new Error("fail"));
    const store = useAucationsStore();
    await store.asyncSetAucation(5);
    expect(store.aucation).toBeNull();
    expect(store.isAucation).toBe(true);
  });

  it("asyncSetIsAucationAdd success", async () => {
    aucationApi.addAucation.mockResolvedValue({});
    const store = useAucationsStore();
    await store.asyncSetIsAucationAdd({ title: "t" });
    expect(toolsHelper.showSuccessDialog).toHaveBeenCalled();
    expect(store.isAucationAdded).toBe(true);
    expect(store.isAucationAdd).toBe(true);
  });

  it("asyncSetIsAucationAdd fail", async () => {
    aucationApi.addAucation.mockRejectedValue(new Error("err"));
    const store = useAucationsStore();
    store.isAucationAdded = true;
    await store.asyncSetIsAucationAdd({ title: "t" });
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("err");
    expect(store.isAucationAdded).toBe(false);
    expect(store.isAucationAdd).toBe(true);
  });

  const actionCases = [
    {
      action: "asyncSetIsAucationChange",
      api: "changeAucation",
      args: [1, { title: "t" }],
      defaultMessage: "Lelang berhasil diperbarui!",
      okFlag: "isAucationChanged",
      doneFlag: "isAucationChange",
    },
    {
      action: "asyncSetIsAucationChangeCover",
      api: "changeAucationCover",
      args: [1, new File([], "a.jpg")],
      defaultMessage: "Cover berhasil diperbarui!",
      okFlag: "isAucationChangedCover",
      doneFlag: "isAucationChangeCover",
    },
    {
      action: "asyncSetIsAucationDelete",
      api: "deleteAucation",
      args: [1],
      defaultMessage: "Lelang berhasil dihapus!",
      okFlag: "isAucationDeleted",
      doneFlag: "isAucationDelete",
    },
    {
      action: "asyncSetIsBidAdd",
      api: "addBid",
      args: [1, 1000],
      defaultMessage: "Tawaran berhasil diajukan!",
      okFlag: "isBidAdded",
      doneFlag: "isBidAdd",
    },
    {
      action: "asyncSetIsBidDelete",
      api: "deleteBid",
      args: [1],
      defaultMessage: "Tawaran berhasil dibatalkan!",
      okFlag: "isBidDeleted",
      doneFlag: "isBidDelete",
    },
    {
      action: "asyncSetIsAucationDeleteAll",
      api: "deleteAllAucations",
      args: [],
      defaultMessage: "Semua lelang berhasil dihapus!",
      okFlag: "isAucationDeletedAll",
      doneFlag: "isAucationDeleteAll",
    },
  ];

  describe.each(actionCases)(
    "$action",
    ({ action, api, args, defaultMessage, okFlag, doneFlag }) => {
      it("success shows the message returned by the api", async () => {
        aucationApi[api].mockResolvedValue("pesan dari api");
        const store = useAucationsStore();
        await store[action](...args);
        expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("pesan dari api");
        expect(store[okFlag]).toBe(true);
        expect(store[doneFlag]).toBe(true);
      });

      it("success falls back to the default message", async () => {
        aucationApi[api].mockResolvedValue(undefined);
        const store = useAucationsStore();
        await store[action](...args);
        expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(defaultMessage);
        expect(store[okFlag]).toBe(true);
        expect(store[doneFlag]).toBe(true);
      });

      it("fail shows an error and keeps the flag false", async () => {
        aucationApi[api].mockRejectedValue(new Error("gagal"));
        const store = useAucationsStore();
        store[okFlag] = true;
        await store[action](...args);
        expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("gagal");
        expect(toolsHelper.showSuccessDialog).not.toHaveBeenCalled();
        expect(store[okFlag]).toBe(false);
        expect(store[doneFlag]).toBe(true);
      });
    }
  );

  it("setters update their state", () => {
    const store = useAucationsStore();
    store.setAucations([{ id: 1 }]);
    store.setAucation({ id: 2 });
    expect(store.aucations).toEqual([{ id: 1 }]);
    expect(store.aucation).toEqual({ id: 2 });
  });
});