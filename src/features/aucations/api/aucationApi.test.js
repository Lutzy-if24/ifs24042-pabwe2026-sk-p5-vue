import { describe, it, expect, vi, beforeEach } from "vitest";
import aucationApi, { AUCATION_OPEN, AUCATION_CLOSED } from "./aucationApi";
import apiHelper from "../../../helpers/apiHelper";

describe("aucationApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("konstanta status", () => {
    it("AUCATION_OPEN bernilai 1 dan AUCATION_CLOSED bernilai 0", () => {
      expect(AUCATION_OPEN).toBe(1);
      expect(AUCATION_CLOSED).toBe(0);
    });
  });

  describe("getAucations", () => {
    it("should fetch aucations without query", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: { aucations: [{ id: 1 }] },
        }),
      });

      const res = await aucationApi.getAucations();
      expect(res).toEqual([{ id: 1 }]);
    });

    it("should include is_me query", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: { aucations: [] },
        }),
      });

      await aucationApi.getAucations({ is_me: 1 });
      expect(apiHelper.fetchData).toHaveBeenCalledWith(
        expect.stringContaining("is_me=1"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should include is_closed query", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: { aucations: [] },
        }),
      });

      await aucationApi.getAucations({ is_closed: AUCATION_OPEN });
      expect(apiHelper.fetchData).toHaveBeenCalledWith(
        expect.stringContaining("is_closed=1"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should return empty array when data.aucations is missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {},
        }),
      });

      const res = await aucationApi.getAucations();
      expect(res).toEqual([]);
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Unauthorized",
        }),
      });

      await expect(aucationApi.getAucations()).rejects.toThrow("Unauthorized");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.getAucations()).rejects.toThrow(
        "Gagal mengambil data lelang"
      );
    });
  });

  describe("getAucation", () => {
    it("should return aucation detail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: { aucation: { id: 5, title: "Test" } },
        }),
      });

      const res = await aucationApi.getAucation(5);
      expect(res).toEqual({ id: 5, title: "Test" });
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Not found",
        }),
      });

      await expect(aucationApi.getAucation(99)).rejects.toThrow("Not found");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.getAucation(99)).rejects.toThrow(
        "Gagal mengambil detail lelang"
      );
    });
  });

  describe("addAucation", () => {
    it("should create aucation and return data", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          data: { aucation_id: 10 },
        }),
      });

      const res = await aucationApi.addAucation({
        title: "Lelang",
        description: "Desc",
        start_bid: 1000000,
        closed_at: "2026-12-31T23:59:00",
      });
      expect(res).toEqual({ aucation_id: 10 });
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Data tidak valid",
        }),
      });

      await expect(
        aucationApi.addAucation({
          title: "",
          description: "",
          start_bid: 0,
          closed_at: "",
        })
      ).rejects.toThrow("Data tidak valid");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(
        aucationApi.addAucation({
          title: "",
          description: "",
          start_bid: 0,
          closed_at: "",
        })
      ).rejects.toThrow("Gagal menambahkan lelang");
    });
  });

  describe("changeAucation", () => {
    it("should update aucation and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Berhasil diubah",
        }),
      });

      const msg = await aucationApi.changeAucation(1, {
        title: "Baru",
        description: "Desc",
        start_bid: 2000000,
        closed_at: "2026-11-30T12:00:00",
      });
      expect(msg).toBe("Berhasil diubah");
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Gagal update",
        }),
      });

      await expect(
        aucationApi.changeAucation(1, {
          title: "",
          description: "",
          start_bid: 0,
          closed_at: "",
        })
      ).rejects.toThrow("Gagal update");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(
        aucationApi.changeAucation(1, {
          title: "",
          description: "",
          start_bid: 0,
          closed_at: "",
        })
      ).rejects.toThrow("Gagal mengubah lelang");
    });
  });

  describe("changeAucationCover", () => {
    it("should upload cover with FormData and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Berhasil mengubah cover",
        }),
      });

      const dummyFile = new File(["dummy"], "cover.jpg", { type: "image/jpeg" });
      const msg = await aucationApi.changeAucationCover(1, dummyFile);
      expect(msg).toBe("Berhasil mengubah cover");
    });

    it("should handle cover file without name property", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Berhasil",
        }),
      });

      const dummyBlob = new Blob(["dummy"], { type: "image/jpeg" });
      const msg = await aucationApi.changeAucationCover(1, dummyBlob);
      expect(msg).toBe("Berhasil");
    });

    it("should throw error on upload fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Format tidak didukung",
        }),
      });

      const dummyFile = new File(["dummy"], "cover.jpg");
      await expect(aucationApi.changeAucationCover(1, dummyFile)).rejects.toThrow(
        "Format tidak didukung"
      );
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      const dummyFile = new File(["dummy"], "cover.jpg");
      await expect(aucationApi.changeAucationCover(1, dummyFile)).rejects.toThrow(
        "Gagal mengubah cover"
      );
    });
  });

  describe("deleteAucation", () => {
    it("should delete and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Berhasil dihapus",
        }),
      });

      const msg = await aucationApi.deleteAucation(1);
      expect(msg).toBe("Berhasil dihapus");
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Tidak diizinkan",
        }),
      });

      await expect(aucationApi.deleteAucation(1)).rejects.toThrow("Tidak diizinkan");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.deleteAucation(1)).rejects.toThrow(
        "Gagal menghapus lelang"
      );
    });
  });

  describe("addBid", () => {
    it("should add bid and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Tawaran berhasil",
        }),
      });

      const msg = await aucationApi.addBid(1, 5000000);
      expect(msg).toBe("Tawaran berhasil");
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Tawaran terlalu rendah",
        }),
      });

      await expect(aucationApi.addBid(1, 100)).rejects.toThrow(
        "Tawaran terlalu rendah"
      );
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.addBid(1, 100)).rejects.toThrow(
        "Gagal mengajukan tawaran"
      );
    });
  });

  describe("deleteBid", () => {
    it("should delete bid and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Tawaran dibatalkan",
        }),
      });

      const msg = await aucationApi.deleteBid(1);
      expect(msg).toBe("Tawaran dibatalkan");
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Tidak ada tawaran",
        }),
      });

      await expect(aucationApi.deleteBid(1)).rejects.toThrow("Tidak ada tawaran");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.deleteBid(1)).rejects.toThrow(
        "Gagal membatalkan tawaran"
      );
    });
  });

  describe("deleteAllAucations", () => {
    it("should delete all and return message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "success",
          message: "Semua lelang dihapus",
        }),
      });

      const msg = await aucationApi.deleteAllAucations();
      expect(msg).toBe("Semua lelang dihapus");
    });

    it("should throw error on fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
          message: "Gagal",
        }),
      });

      await expect(aucationApi.deleteAllAucations()).rejects.toThrow("Gagal");
    });

    it("should use fallback error message", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
        json: async () => ({
          status: "fail",
        }),
      });

      await expect(aucationApi.deleteAllAucations()).rejects.toThrow(
        "Gagal menghapus semua lelang"
      );
    });
  });
});
