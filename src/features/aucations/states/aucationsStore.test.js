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
    await store.asyncSetIsAucationAdd({ title: "t" });
    expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("err");
    expect(store.isAucationAdded).toBe(false);
  });

  it("asyncSetIsAucationChange success", async () => {
    aucationApi.changeAucation.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsAucationChange(1, {});
    expect(store.isAucationChanged).toBe(true);
  });

  it("asyncSetIsAucationChangeCover success", async () => {
    aucationApi.changeAucationCover.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsAucationChangeCover(1, new File([], "a.jpg"));
    expect(store.isAucationChangedCover).toBe(true);
  });

  it("asyncSetIsAucationDelete success", async () => {
    aucationApi.deleteAucation.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsAucationDelete(1);
    expect(store.isAucationDeleted).toBe(true);
  });

  it("asyncSetIsBidAdd success", async () => {
    aucationApi.addBid.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsBidAdd(1, 1000);
    expect(store.isBidAdded).toBe(true);
  });

  it("asyncSetIsBidDelete success", async () => {
    aucationApi.deleteBid.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsBidDelete(1);
    expect(store.isBidDeleted).toBe(true);
  });

  it("asyncSetIsAucationDeleteAll success", async () => {
    aucationApi.deleteAllAucations.mockResolvedValue("ok");
    const store = useAucationsStore();
    await store.asyncSetIsAucationDeleteAll();
    expect(store.isAucationDeletedAll).toBe(true);
  });
});
