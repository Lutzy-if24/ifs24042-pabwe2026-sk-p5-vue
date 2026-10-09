import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import AucationLayout from "./AucationLayout.vue";
import { useUsersStore } from "../../users/states/usersStore";
import { useAuthStore } from "../../auth/states/authStore";
import apiHelper from "../../../helpers/apiHelper";

const mockRouter = { push: vi.fn() };

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return { ...actual, useRouter: () => mockRouter };
});

const NavbarStub = defineComponent({
  name: "NavbarComponent",
  props: ["profile", "isSidebarOpen"],
  emits: ["logout", "toggle-sidebar"],
  setup(_, { emit }) {
    return () =>
      h("div", { "data-testid": "navbar-stub" }, [
        h("button", { "data-testid": "logout", onClick: () => emit("logout") }, "logout"),
        h("button", { "data-testid": "toggle", onClick: () => emit("toggle-sidebar") }, "toggle"),
      ]);
  },
});

const SidebarStub = defineComponent({
  name: "SidebarComponent",
  props: ["isSidebarOpen"],
  emits: ["close-mobile"],
  setup(props, { emit }) {
    return () =>
      h("div", { "data-testid": "sidebar-stub", "data-open": String(props.isSidebarOpen) }, [
        h("button", { "data-testid": "close", onClick: () => emit("close-mobile") }, "close"),
      ]);
  },
});

async function mountLayout({ profile = null, token = null } = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const usersStore = useUsersStore();
  const authStore = useAuthStore();
  usersStore.profile = profile;

  vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(token);
  const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
  const asyncSetProfile = vi.spyOn(usersStore, "asyncSetProfile").mockResolvedValue();
  const asyncLogout = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockResolvedValue();

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { render: () => h("p", "konten halaman") } }],
  });
  await router.push("/");
  await router.isReady();

  const wrapper = mount(AucationLayout, {
    global: {
      plugins: [pinia, router],
      stubs: { NavbarComponent: NavbarStub, SidebarComponent: SidebarStub },
    },
  });
  await flushPromises();

  return { wrapper, usersStore, authStore, putTokenSpy, asyncSetProfile, asyncLogout };
}

describe("AucationLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockClear();
  });

  it("should redirect to login and show loading main landmark when there is no token", async () => {
    const { wrapper } = await mountLayout({ profile: null, token: null });

    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
    expect(wrapper.find("main").exists()).toBe(true);
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.find("header").exists()).toBe(false);
  });

  it("should fetch profile when token exists", async () => {
    const { asyncSetProfile } = await mountLayout({ profile: null, token: "abc" });

    expect(asyncSetProfile).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should render header, aside, and a single main landmark when profile is loaded", async () => {
    const { wrapper } = await mountLayout({ profile: { id: 1, name: "User" }, token: "abc" });

    expect(wrapper.find("header").exists()).toBe(true);
    expect(wrapper.find("aside").exists()).toBe(true);
    expect(wrapper.findAll("main").length).toBe(1);
    expect(wrapper.text()).toContain("konten halaman");
  });

  it("should clear token and redirect when profile fetch ends without profile", async () => {
    const { usersStore, putTokenSpy } = await mountLayout({ profile: null, token: null });
    mockRouter.push.mockClear();

    usersStore.setIsProfile(true);
    await flushPromises();

    expect(putTokenSpy).toHaveBeenCalledWith("");
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.isProfile).toBe(false);
  });

  it("should stay when profile fetch finishes with a profile", async () => {
    const { usersStore, putTokenSpy } = await mountLayout({
      profile: { id: 1, name: "User" },
      token: "abc",
    });

    usersStore.setIsProfile(true);
    await flushPromises();

    expect(putTokenSpy).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(usersStore.isProfile).toBe(false);
  });

  it("should ignore profile changes while isProfile is false", async () => {
    const { usersStore } = await mountLayout({ profile: { id: 1, name: "A" }, token: "abc" });

    usersStore.profile = { id: 2, name: "B" };
    await flushPromises();

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should redirect to login after logout", async () => {
    const { authStore } = await mountLayout({ profile: { id: 1, name: "User" }, token: "abc" });

    authStore.setIsAuthLogout(true);
    await flushPromises();

    expect(authStore.isAuthLogout).toBe(false);
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
  });

  it("should call logout action when navbar emits logout", async () => {
    const { wrapper, asyncLogout } = await mountLayout({
      profile: { id: 1, name: "User" },
      token: "abc",
    });

    await wrapper.find('[data-testid="logout"]').trigger("click");
    expect(asyncLogout).toHaveBeenCalled();
  });

  it("should toggle and close the sidebar", async () => {
    const { wrapper } = await mountLayout({ profile: { id: 1, name: "User" }, token: "abc" });
    const sidebar = () => wrapper.find('[data-testid="sidebar-stub"]');

    expect(sidebar().attributes("data-open")).toBe("false");

    await wrapper.find('[data-testid="toggle"]').trigger("click");
    expect(sidebar().attributes("data-open")).toBe("true");

    await wrapper.find('[data-testid="close"]').trigger("click");
    expect(sidebar().attributes("data-open")).toBe("false");
  });
});