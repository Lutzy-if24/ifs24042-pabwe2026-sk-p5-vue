<template>
  <div
    v-if="show"
    data-testid="add-todo-modal"
    class="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-200 overflow-hidden"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Plus :size="18" :stroke-width="2.5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">Tambah Todo Baru</h3>
          <p class="text-xs text-slate-500">Buat tugas baru dan tuliskan detailnya dengan format Markdown</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-add-modal-btn"
        @click="onClose"
        class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
      >
        <X :size="20" />
      </button>
    </div>

    <!-- Modal Form Body -->
    <form @submit.prevent="handleSave" class="flex-1 flex flex-col min-h-0 bg-white">
      <div class="flex-1 flex flex-col min-h-0 p-6 md:p-8 space-y-4 w-full">
        <div class="shrink-0">
          <label for="add-todo-title" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul Todo <span class="text-red-500">*</span>
          </label>
          <input
            id="add-todo-title"
            type="text"
            data-testid="add-todo-title-input"
            v-model="title"
            placeholder="Contoh: Menyelesaikan Laporan Praktikum"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            required
          />
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <label for="add-todo-description" class="block text-sm font-semibold text-slate-700 mb-1.5 shrink-0">
            Deskripsi (Markdown) <span class="text-red-500">*</span>
          </label>
          <div class="flex-1 min-h-[300px]">
            <MarkdownEditor
              id="add-todo-description"
              v-model="description"
              placeholder="Tuliskan rincian tugas yang perlu diselesaikan dalam format Markdown..."
              height="100%"
              textarea-test-id="add-todo-description-input"
            />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <button
          type="button"
          data-testid="cancel-add-modal-btn"
          @click="onClose"
          :disabled="loading"
          class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-add-modal-btn"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
        >
          <template v-if="loading">
            <Loader2 :size="18" class="animate-spin" />
            <span>Menyimpan...</span>
          </template>
          <template v-else>
            <Plus :size="18" :stroke-width="2.5" />
            <span>Tambah Todo</span>
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Plus, X, Loader2 } from "lucide-vue-next";
import { useTodosStore } from "../states/todosStore";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import MarkdownEditor from "../components/MarkdownEditor.vue";

// ✅ Props yang membuat v-if="show" bekerja
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

// ✅ Emit untuk memberitahu parent saat modal ditutup
const emit = defineEmits(["close"]);

const todosStore = useTodosStore();

const title = ref("");
const description = ref("");
const loading = ref(false);

function onClose() {
  emit("close");
}

async function handleSave() {
  // Validasi
  if (!title.value || !title.value.trim()) {
    showErrorDialog("Judul tidak boleh kosong");
    return;
  }
  if (!description.value || !description.value.trim()) {
    showErrorDialog("Deskripsi tidak boleh kosong");
    return;
  }

  loading.value = true;
  await todosStore.asyncSetIsTodoAdd(title.value.trim(), description.value.trim());
  loading.value = false;
}

// Reset form saat modal dibuka
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      title.value = "";
      description.value = "";
      loading.value = false;
    }
  }
);

// Handle response dari store
watch(
  () => [todosStore.isTodoAdd, todosStore.isTodoAdded],
  ([isTodoAdd, isTodoAdded]) => {
    if (isTodoAdd) {
      todosStore.setIsTodoAdd(false);
      loading.value = false;
      if (isTodoAdded) {
        todosStore.setIsTodoAdded(false);
        todosStore.asyncSetTodos();
        onClose();
      }
    }
  }
);
</script>