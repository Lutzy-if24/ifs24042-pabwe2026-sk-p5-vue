<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Tambah Lelang</h2>
        <button type="button" @click="$emit('close')" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <div>
          <label for="add-title" class="block text-sm font-medium text-slate-700 mb-1">Judul</label>
          <input
            id="add-title"
            v-model="title"
            type="text"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            placeholder="Judul lelang"
          />
        </div>

        <div>
          <label for="add-desc" class="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <MarkdownEditor id="add-desc" v-model="description" />
        </div>

        <div>
          <label for="add-start-bid" class="block text-sm font-medium text-slate-700 mb-1">Harga Awal (Rp)</label>
          <input
            id="add-start-bid"
            v-model.number="startBid"
            type="number"
            min="1"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            placeholder="1000000"
          />
        </div>

        <div>
          <label for="add-closed-at" class="block text-sm font-medium text-slate-700 mb-1">Batas Waktu</label>
          <input
            id="add-closed-at"
            v-model="closedAt"
            type="datetime-local"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
          <p class="text-xs text-slate-400 mt-1">Waktu harus di masa depan</p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
            Batal
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {{ submitting ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { X } from "lucide-vue-next";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import { useAucationsStore } from "../states/aucationsStore";

const emit = defineEmits(["close", "success"]);
const store = useAucationsStore();

const title = ref("");
const description = ref("");
const startBid = ref(null);
const closedAt = ref("");
const submitting = ref(false);

/**
 * Format datetime-local value (YYYY-MM-DDTHH:mm) menjadi
 * format yang diterima API: "YYYY-MM-DD HH:mm:ss"
 */
function formatClosedAt(value) {
  if (!value) return "";
  // value dari datetime-local: "2026-10-07T09:33"
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return value;
  const timeWithSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart} ${timeWithSeconds}`;
}

async function handleSubmit() {
  if (!title.value.trim()) return;
  if (!startBid.value || startBid.value < 1) return;
  if (!closedAt.value) return;

  submitting.value = true;
  await store.asyncSetIsAucationAdd({
    title: title.value.trim(),
    description: description.value || "",
    start_bid: Number(startBid.value),
    closed_at: formatClosedAt(closedAt.value),
  });
  submitting.value = false;
}

watch(
  () => store.isAucationAdd,
  (val) => {
    if (val) {
      store.setIsAucationAdd(false);
      if (store.isAucationAdded) {
        emit("success");
      }
    }
  }
);
</script>