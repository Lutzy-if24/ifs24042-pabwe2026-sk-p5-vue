<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Ganti Cover</h2>
        <button type="button" @click="$emit('close')" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <div>
          <label for="cover-file" class="block text-sm font-medium text-slate-700 mb-1">Pilih Gambar</label>
          <input
            id="cover-file"
            type="file"
            accept="image/*"
            @change="onFileChange"
            class="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium hover:file:bg-indigo-100"
          />
        </div>

        <div v-if="preview" class="rounded-xl overflow-hidden bg-slate-100 aspect-video">
          <img :src="preview" alt="Preview cover" class="w-full h-full object-cover" />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="$emit('close')" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Batal</button>
          <button
            type="submit"
            :disabled="!file || submitting"
            class="px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {{ submitting ? "Mengunggah..." : "Unggah Cover" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { X } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";

const props = defineProps({
  aucationId: { type: [String, Number], required: true },
});
const emit = defineEmits(["close", "success"]);
const store = useAucationsStore();

const file = ref(null);
const preview = ref("");
const submitting = ref(false);

function onFileChange(e) {
  const f = e.target.files?.[0];
  if (f) {
    file.value = f;
    preview.value = URL.createObjectURL(f);
  }
}

async function handleSubmit() {
  if (!file.value) return;
  submitting.value = true;
  await store.asyncSetIsAucationChangeCover(props.aucationId, file.value);
  submitting.value = false;
}

watch(
  () => store.isAucationChangeCover,
  (val) => {
    if (val) {
      store.setIsAucationChangeCover(false);
      if (store.isAucationChangedCover) emit("success");
    }
  }
);
</script>
