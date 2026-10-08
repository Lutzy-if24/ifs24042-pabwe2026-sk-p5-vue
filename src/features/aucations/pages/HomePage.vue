<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Dashboard Lelang</h1>
        <p class="text-sm text-slate-500 mt-1">Kelola dan ikuti lelang yang tersedia</p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20"
        >
          <Plus :size="18" />
          Tambah Lelang
        </button>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="activeTab = tab.key; loadAucations()"
        class="px-4 py-2 text-sm font-medium rounded-lg transition"
        :class="activeTab === tab.key
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Cari judul atau deskripsi lelang..."
        class="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="filteredAucations.length === 0" class="text-center py-16">
      <p class="text-slate-500">Belum ada lelang yang ditampilkan.</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <RouterLink
        v-for="item in filteredAucations"
        :key="item.id"
        :to="`/aucations/${item.id}`"
        class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition group"
      >
        <div class="aspect-video bg-slate-100 relative overflow-hidden">
          <img
            v-if="item.cover"
            :src="item.cover"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon :size="48" />
          </div>
          <span
            class="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full"
            :class="item.closed_at && new Date(item.closed_at) < new Date()
              ? 'bg-slate-800 text-white'
              : 'bg-emerald-500 text-white'"
          >
            {{ item.closed_at && new Date(item.closed_at) < new Date() ? 'Ditutup' : 'Berlangsung' }}
          </span>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-slate-900 line-clamp-1">{{ item.title }}</h3>
          <p class="text-sm text-slate-500 mt-1">
            Harga awal: {{ formatRupiah(item.start_bid) }}
          </p>
          <p class="text-sm text-indigo-600 font-medium mt-1">
            Tawaran tertinggi: {{ formatRupiah(item.highest_bid || item.start_bid) }}
          </p>
        </div>
      </RouterLink>
    </div>

    <AddModal v-if="showAddModal" @close="showAddModal = false" @success="onAdded" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { Plus, Image as ImageIcon } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { formatRupiah } from "../../../helpers/toolsHelper";
import { AUCATION_OPEN, AUCATION_CLOSED } from "../api/aucationApi";
import AddModal from "../modals/AddModal.vue";

const store = useAucationsStore();
const loading = ref(true);
const searchQuery = ref("");
const activeTab = ref("all");
const showAddModal = ref(false);

const tabs = [
  { key: "all", label: "Semua Lelang" },
  { key: "mine", label: "Lelang Saya" },
  { key: "open", label: "Lelang Berlangsung" },
  { key: "closed", label: "Lelang Ditutup" },
];

const filteredAucations = computed(() => {
  let list = store.aucations || [];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
    );
  }
  return list;
});

async function loadAucations() {
  loading.value = true;
  const params = {};
  if (activeTab.value === "mine") params.is_me = 1;
  if (activeTab.value === "open") params.is_closed = AUCATION_OPEN;
  if (activeTab.value === "closed") params.is_closed = AUCATION_CLOSED;
  await store.asyncSetAucations(params);
  loading.value = false;
}

function onAdded() {
  showAddModal.value = false;
  loadAucations();
}

onMounted(loadAucations);
</script>
