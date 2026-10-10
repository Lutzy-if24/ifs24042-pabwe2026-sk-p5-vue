import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createAppRouter } from "./router";
import { createMemoryHistory } from "vue-router";
import { useAuthStore } from "./features/auth/states/authStore";
import { useUsersStore } from "./features/users/states/usersStore";
import { useTodosStore } from "./features/todos/states/todosStore";

/**
 * ✅ Stub default untuk komponen yang sering dipakai di dalam test.
 * Ini mencegah warning "Failed to resolve component" dan membuat
 * test bisa menemukan elemen seperti modal, input, dll.
 */
const DEFAULT_STUBS = {
  // Ikon Lucide
  Edit3: true,
  X: true,
  Loader2: true,
  Upload: true,
  ImagePlus: true,
  Plus: true,
  Mail: true,
  Lock: true,
  LogIn: true,
  LogOut: true,
  User: true,
  Users: true,
  Menu: true,
  Search: true,
  Trash2: true,
  Eye: true,
  Check: true,
  AlertCircle: true,
  Sun: true,
  Moon: true,
  CheckSquare: true,
  CheckCircle2: true,
  Clock: true,
  Filter: true,
  Pencil: true,
  ArrowLeft: true,
  Calendar: true,

  // ✅ Stub custom: MarkdownEditor render <textarea> asli
  // agar test bisa menemukan elemen via data-testid
  MarkdownEditor: {
    inheritAttrs: false,
    props: {
      modelValue: { type: String, default: "" },
    },
    emits: ["update:modelValue"],
    template: `
      <textarea
        :data-testid="$attrs['textarea-test-id']"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    `,
  },

  // ✅ Stub custom: MarkdownViewer render konten sebagai teks
  MarkdownViewer: {
    props: {
      content: { type: String, default: "" },
    },
    template: `<div data-testid="markdown-viewer">{{ content }}</div>`,
  },
};

export function createMockPinia(initialState = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const usersStore = useUsersStore(pinia);
  const todosStore = useTodosStore(pinia);

  Object.entries(initialState).forEach(([key, val]) => {
    if (key in authStore.$state) authStore.$state[key] = val;
    if (key in usersStore.$state) usersStore.$state[key] = val;
    if (key in todosStore.$state) todosStore.$state[key] = val;
  });

  return { pinia, authStore, usersStore, todosStore };
}

export function renderWithProviders(
  component,
  {
    preloadedState = {},
    pinia = null,
    router = createAppRouter(createMemoryHistory()),
    props = {},
    slots = {},
    attachTo = undefined,
    ...mountOptions
  } = {}
) {
  const { pinia: activePinia, authStore, usersStore, todosStore } = pinia
    ? {
        pinia,
        authStore: useAuthStore(pinia),
        usersStore: useUsersStore(pinia),
        todosStore: useTodosStore(pinia),
      }
    : createMockPinia(preloadedState);

  // ✅ Merge DEFAULT_STUBS dengan stubs custom dari test
  const mergedStubs = {
    ...DEFAULT_STUBS,
    ...(mountOptions.global?.stubs || {}),
  };

  const wrapper = mount(component, {
    props,
    slots,
    attachTo,
    global: {
      plugins: [activePinia, router],
      stubs: mergedStubs,
      mocks: mountOptions.global?.mocks,
    },
    ...mountOptions,
  });

  return {
    wrapper,
    pinia: activePinia,
    authStore,
    usersStore,
    todosStore,
    router,
    container: wrapper.element,
  };
}