<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Ubah Lelang</h2>
        <button type="button" @click="$emit('close')" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <div>
          <label for="change-title" class="block text-sm font-medium text-slate-700 mb-1">Judul</label>
          <input
            id="change-title"
            v-model="title"
            type="text"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <div>
          <label for="change-desc" class="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <MarkdownEditor id="change-desc" v-model="description" />
        </div>

        <div>
          <label for="change-start-bid" class="block text-sm font-medium text-slate-700 mb-1">Harga Awal (Rp)</label>
          <input
            id="change-start-bid"
            v-model.number="startBid"
            type="number"
            min="1"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <div>
          <label for="change-closed-at" class="block text-sm font-medium text-slate-700 mb-1">Batas Waktu</label>
          <input
            id="change-closed-at"
            v-model="closedAt"
            type="datetime-local"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
          <button type="submit" :disabled="submitting" class="px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60">
            {{ submitting ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { X } from "lucide-vue-next";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import { useAucationsStore } from "../states/aucationsStore";

const props = defineProps({
  aucation: { type: Object, required: true },
});
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
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return value;
  const timeWithSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart} ${timeWithSeconds}`;
}

/**
 * Convert ISO / server date string ke format datetime-local (YYYY-MM-DDTHH:mm)
 */
function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(() => {
  if (props.aucation) {
    title.value = props.aucation.title || "";
    description.value = props.aucation.description || "";
    startBid.value = props.aucation.start_bid || null;
    closedAt.value = toDatetimeLocal(props.aucation.closed_at);
  }
});

async function handleSubmit() {
  if (!title.value.trim()) return;
  if (!startBid.value || startBid.value < 1) return;
  if (!closedAt.value) return;

  submitting.value = true;
  await store.asyncSetIsAucationChange(props.aucation.id, {
    title: title.value.trim(),
    description: description.value || "",
    start_bid: Number(startBid.value),
    closed_at: formatClosedAt(closedAt.value),
  });
  submitting.value = false;
}

watch(
  () => store.isAucationChange,
  (val) => {
    if (val) {
      store.setIsAucationChange(false);
      if (store.isAucationChanged) emit("success");
    }
  }
);
</script>