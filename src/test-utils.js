import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createAppRouter } from "./router";
import { createMemoryHistory } from "vue-router";
import { useAuthStore } from "./features/auth/states/authStore";
import { useUsersStore } from "./features/users/states/usersStore";
import { useTodosStore } from "./features/todos/states/todosStore";

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

  const wrapper = mount(component, {
    props,
    slots,
    attachTo,
    global: {
      plugins: [activePinia, router],
      stubs: mountOptions.global?.stubs,
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
