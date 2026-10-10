<template>
  <div>
    <div v-if="!store.isAucation" class="flex justify-center py-20">
      <h1 class="sr-only">Memuat detail lelang</h1>
      <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>

    <div v-else-if="!store.aucation" class="text-center py-20">
      <h1 class="text-slate-600">Lelang tidak ditemukan.</h1>
      <RouterLink to="/" class="text-indigo-600 font-medium mt-2 inline-block">Kembali ke Dashboard</RouterLink>
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <RouterLink to="/" class="text-sm text-indigo-600 hover:underline mb-2 inline-block">← Kembali</RouterLink>
          <h1 class="text-2xl font-bold text-slate-900">{{ store.aucation.title }}</h1>
          <p class="text-sm text-slate-500 mt-1">
            Ditutup: {{ formatDate(store.aucation.closed_at) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <template v-if="isOwner">
            <button type="button" @click="showChangeModal = true" class="px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Ubah</button>
            <button type="button" @click="showCoverModal = true" class="px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Ganti Cover</button>
            <button type="button" @click="handleDelete" class="px-3 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100">Hapus</button>
          </template>
          <template v-else>
            <button
              v-if="!store.aucation.my_bid"
              type="button"
              @click="showBidModal = true"
              class="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Ajukan Tawaran
            </button>
            <button
              v-else
              type="button"
              @click="handleCancelBid"
              class="px-4 py-2 text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
            >
              Batalkan Tawaran Saya
            </button>
          </template>
        </div>
      </div>

      <!-- Cover -->
      <div class="rounded-2xl overflow-hidden bg-slate-100 aspect-video max-h-96">
        <img
          v-if="store.aucation.cover"
          :src="store.aucation.cover"
          :alt="store.aucation.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-slate-600">
          Tidak ada cover
        </div>
      </div>

      <!-- Info -->
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold">Harga Awal</p>
          <p class="text-lg font-bold text-slate-900 mt-1">{{ formatRupiah(store.aucation.start_bid) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold">Tawaran Tertinggi</p>
          <p class="text-lg font-bold text-indigo-600 mt-1">{{ formatRupiah(highestBid) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold">Tawaran Saya</p>
          <p class="text-lg font-bold text-slate-900 mt-1">
            {{ store.aucation.my_bid ? formatRupiah(store.aucation.my_bid.bid) : '-' }}
          </p>
        </div>
      </div>

      <!-- Description -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 class="font-semibold text-slate-900 mb-3">Deskripsi</h2>
        <MarkdownViewer :content="store.aucation.description || ''" />
      </div>

      <!-- Bids history -->
      <div class="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 class="font-semibold text-slate-900 mb-3">Riwayat Tawaran</h2>
        <div v-if="!bids.length" class="text-sm text-slate-500">Belum ada tawaran.</div>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="(b, idx) in bids" :key="idx" class="py-3 flex justify-between items-center">
            <div>
              <p class="text-sm font-medium text-slate-800">{{ b.name || b.user?.name || 'Pengguna' }}</p>
              <p class="text-xs text-slate-600">{{ formatDate(b.created_at) }}</p>
            </div>
            <p class="font-semibold text-indigo-600">{{ formatRupiah(b.bid) }}</p>
          </li>
        </ul>
      </div>
    </div>

    <ChangeModal v-if="showChangeModal" :aucation="store.aucation" @close="showChangeModal = false" @success="reload" />
    <ChangeCoverModal v-if="showCoverModal" :aucation-id="store.aucation?.id" @close="showCoverModal = false" @success="reload" />
    <BidModal v-if="showBidModal" :aucation="store.aucation" @close="showBidModal = false" @success="reload" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import { formatRupiah, formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
import MarkdownViewer from "../components/MarkdownViewer.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import ChangeCoverModal from "../modals/ChangeCoverModal.vue";
import BidModal from "../modals/BidModal.vue";

const route = useRoute();
const router = useRouter();
const store = useAucationsStore();
const usersStore = useUsersStore();

const showChangeModal = ref(false);
const showCoverModal = ref(false);
const showBidModal = ref(false);

const isOwner = computed(() => {
  const a = store.aucation;
  const p = usersStore.profile;
  if (!a || !p) return false;
  return a.user_id === p.id || a.user?.id === p.id;
});

const bids = computed(() => {
  const list = store.aucation?.bids || [];
  return [...list].sort((a, b) => (b.bid || 0) - (a.bid || 0));
});

const highestBid = computed(() => {
  if (bids.value.length) return bids.value[0].bid;
  return store.aucation?.start_bid || 0;
});

async function reload() {
  showChangeModal.value = false;
  showCoverModal.value = false;
  showBidModal.value = false;
  await store.asyncSetAucation(route.params.aucationId);
}

async function handleDelete() {
  const res = await showConfirmDialog("Yakin ingin menghapus lelang ini?");
  if (res.isConfirmed) {
    await store.asyncSetIsAucationDelete(route.params.aucationId);
    if (store.isAucationDeleted) {
      router.push("/");
    }
  }
}

async function handleCancelBid() {
  const res = await showConfirmDialog("Yakin ingin membatalkan tawaran Anda?");
  if (res.isConfirmed) {
    await store.asyncSetIsBidDelete(route.params.aucationId);
    if (store.isBidDeleted) reload();
  }
}

onMounted(() => {
  store.setIsAucation(false);
  store.asyncSetAucation(route.params.aucationId);
});

watch(
  () => route.params.aucationId,
  (id) => {
    if (id) {
      store.setIsAucation(false);
      store.asyncSetAucation(id);
    }
  }
);
</script>