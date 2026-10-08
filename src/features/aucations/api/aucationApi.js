import apiHelper from "../../../helpers/apiHelper";

/**
 * CATATAN PENTING tentang is_closed:
 * Dokumentasi API menyatakan:
 *   is_closed = 1 → lelang TERBUKA (berlangsung)
 *   is_closed = 0 → lelang TERTUTUP
 * Nilai ini tidak lazim. Jika ternyata dokumentasi salah,
 * cukup ubah dua konstanta di bawah.
 */
export const AUCATION_OPEN = 1;
export const AUCATION_CLOSED = 0;

const aucationApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/aucations`;

  function _url(path) {
    return BASE_URL + path;
  }

  async function getAucations({ is_me, is_closed } = {}) {
    const params = new URLSearchParams();
    if (is_me !== undefined && is_me !== null && is_me !== "") {
      params.append("is_me", String(is_me));
    }
    if (is_closed !== undefined && is_closed !== null && is_closed !== "") {
      params.append("is_closed", String(is_closed));
    }
    const qs = params.toString();
    const targetUrl = qs ? `/?${qs}` : "/";

    const response = await apiHelper.fetchData(_url(targetUrl), {
      method: "GET",
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal mengambil data lelang");
    }

    return result.data?.aucations || [];
  }

  async function getAucation(id) {
    const response = await apiHelper.fetchData(_url(`/${id}`), {
      method: "GET",
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal mengambil detail lelang");
    }

    return result.data?.aucation;
  }

  async function addAucation({ title, description, start_bid, closed_at }) {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        start_bid,
        closed_at,
      }),
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal menambahkan lelang");
    }

    return result.data;
  }

  async function changeAucation(id, { title, description, start_bid, closed_at }) {
    const response = await apiHelper.fetchData(_url(`/${id}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        start_bid,
        closed_at,
      }),
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal mengubah lelang");
    }

    return result.message;
  }

  async function changeAucationCover(id, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const response = await apiHelper.fetchData(_url(`/${id}/cover`), {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal mengubah cover");
    }

    return result.message;
  }

  async function deleteAucation(id) {
    const response = await apiHelper.fetchData(_url(`/${id}`), {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal menghapus lelang");
    }

    return result.message;
  }

  async function addBid(id, bid) {
    const response = await apiHelper.fetchData(_url(`/${id}/bids`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bid }),
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal mengajukan tawaran");
    }

    return result.message;
  }

  async function deleteBid(id) {
    const response = await apiHelper.fetchData(_url(`/${id}/bids`), {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal membatalkan tawaran");
    }

    return result.message;
  }

  async function deleteAllAucations() {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || "Gagal menghapus semua lelang");
    }

    return result.message;
  }

  return {
    getAucations,
    getAucation,
    addAucation,
    changeAucation,
    changeAucationCover,
    deleteAucation,
    addBid,
    deleteBid,
    deleteAllAucations,
  };
})();

export default aucationApi;
