<template>
  <div
    v-if="show"
    data-testid="edit-todo-modal"
    class="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-200 overflow-hidden"
  >
    <!-- Modal Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
          <Edit3 :size="18" :stroke-width="2.5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">Ubah Data Todo</h3>
          <p class="text-xs text-slate-500">Perbarui judul, status penyelesaian, dan detail deskripsi Markdown</p>
        </div>
      </div>
      <button
        type="button"
        data-testid="close-edit-modal-btn"
        @click="onClose"
        class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
      >
        <X :size="20" />
      </button>
    </div>

    <!-- Modal Form Body -->
    <form @submit.prevent="handleSave" class="flex-1 flex flex-col min-h-0 bg-white">
      <div class="flex-1 flex flex-col min-h-0 p-6 md:p-8 space-y-4 w-full">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div class="md:col-span-2">
            <label for="edit-todo-title" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Judul Todo <span class="text-red-500">*</span>
            </label>
            <input
              id="edit-todo-title"
              type="text"
              data-testid="edit-todo-title-input"
              v-model="title"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
              required
            />
          </div>

          <div>
            <label for="edit-todo-status" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Status Penyelesaian
            </label>
            <select
              id="edit-todo-status"
              data-testid="edit-todo-status-select"
              v-model="isFinished"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            >
              <option value="0">Sedang Proses</option>
              <option value="1">Sudah Selesai</option>
            </select>
          </div>
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <label for="edit-todo-description" class="block text-sm font-semibold text-slate-700 mb-1.5 shrink-0">
            Deskripsi (Markdown) <span class="text-red-500">*</span>
          </label>
          <div class="flex-1 min-h-[300px]">
            <MarkdownEditor
              id="edit-todo-description"
              v-model="description"
              placeholder="Tuliskan rincian tugas yang perlu diselesaikan dalam format Markdown..."
              height="100%"
              textarea-test-id="edit-todo-description-input"
            />
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <button
          type="button"
          data-testid="cancel-edit-modal-btn"
          @click="onClose"
          :disabled="loading"
          class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          data-testid="submit-edit-modal-btn"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md shadow-amber-600/25 transition-all disabled:opacity-60"
        >
          <template v-if="loading">
            <Loader2 :size="18" class="animate-spin" />
            <span>Menyimpan...</span>
          </template>
          <template v-else>
            <Edit3 :size="18" :stroke-width="2.5" />
            <span>Perbarui Todo</span>
          </template>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Edit3, X, Loader2 } from "lucide-vue-next";
import { useTodosStore } from "../states/todosStore";
import { showErrorDialog } from "../../../helpers/toolsHelper";
import MarkdownEditor from "../components/MarkdownEditor.vue";

// ✅ Props: show, todoId, todo (langsung dari parent)
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  todoId: {
    type: [Number, String],
    default: null,
  },
  todo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);
const todosStore = useTodosStore();

const title = ref("");
const description = ref("");
const isFinished = ref(0);
const loading = ref(false);

function onClose() {
  emit("close");
}

async function handleSave() {
  if (!title.value || !title.value.trim()) {
    showErrorDialog("Judul tidak boleh kosong");
    return;
  }
  if (!description.value || !description.value.trim()) {
    showErrorDialog("Deskripsi tidak boleh kosong");
    return;
  }

  loading.value = true;
  await todosStore.asyncSetIsTodoChange(
    props.todoId,
    title.value.trim(),
    description.value.trim(),
    Number(isFinished.value)
  );
  loading.value = false;
}

// ✅ Isi form dari props.item (prioritas) atau store.isItem (fallback)
watch(
  () => [props.show, props.todoId, props.todo, todosStore.isTodo],
  ([show, todoId, todoProp, todoStore]) => {
    if (!show) return;

    // Prioritas: props.item → store.isItem
    const data = todoProp || (todoStore && String(todoStore.id) === String(todoId) ? todoStore : null);

    if (data) {
      title.value = data.title || "";
      description.value = data.description || "";
      isFinished.value = Number(data.is_finished) || 0;
    }
  },
  { immediate: true }
);

// Handle setelah save berhasil
watch(
  () => [todosStore.isTodoChange, todosStore.isTodoChanged],
  ([isTodoChange, isTodoChanged]) => {
    if (isTodoChange) {
      todosStore.setIsTodoChange(false);
      loading.value = false;
      if (isTodoChanged) {
        todosStore.setIsTodoChanged(false);
        if (props.todoId) {
          todosStore.asyncSetTodo(props.todoId);
        }
        onClose();
      }
    }
  }
);
</script>