<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Ajukan Tawaran</h2>
        <button type="button" @click="$emit('close')" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <div class="bg-slate-50 rounded-xl p-3 text-sm">
          <p class="text-slate-500">Tawaran tertinggi saat ini</p>
          <p class="text-lg font-bold text-indigo-600">{{ formatRupiah(minBid) }}</p>
          <p class="text-xs text-slate-400 mt-1">
            Tawaran Anda harus lebih tinggi dari nilai ini
            <span v-if="!hasBids"> (atau minimal sama dengan harga awal)</span>.
          </p>
        </div>

        <div>
          <label for="bid-amount" class="block text-sm font-medium text-slate-700 mb-1">Nominal Tawaran (Rp)</label>
          <input
            id="bid-amount"
            v-model.number="bid"
            type="number"
            :min="minRequired"
            required
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            placeholder="Masukkan nominal"
          />
          <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {{ submitting ? "Mengirim..." : "Ajukan Tawaran" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { X } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { formatRupiah } from "../../../helpers/toolsHelper";

const props = defineProps({
  aucation: { type: Object, required: true },
});
const emit = defineEmits(["close", "success"]);
const store = useAucationsStore();

const bid = ref(null);
const error = ref("");
const submitting = ref(false);

const hasBids = computed(() => (props.aucation?.bids || []).length > 0);

const minBid = computed(() => {
  const bids = props.aucation?.bids || [];
  if (bids.length) {
    return Math.max(...bids.map((b) => Number(b.bid) || 0));
  }
  return Number(props.aucation?.start_bid) || 0;
});

const minRequired = computed(() => (hasBids.value ? minBid.value + 1 : minBid.value));

async function handleSubmit() {
  error.value = "";
  const value = Number(bid.value);
  if (Number.isNaN(value) || value < minRequired.value) {
    error.value = hasBids.value
      ? `Tawaran harus lebih tinggi dari ${formatRupiah(minBid.value)}`
      : `Tawaran minimal ${formatRupiah(minBid.value)}`;
    return;
  }

  submitting.value = true;
  await store.asyncSetIsBidAdd(props.aucation.id, value);
  submitting.value = false;
}

watch(
  () => store.isBidAdd,
  (val) => {
    if (val) {
      store.setIsBidAdd(false);
      if (store.isBidAdded) emit("success");
    }
  }
);
</script>
