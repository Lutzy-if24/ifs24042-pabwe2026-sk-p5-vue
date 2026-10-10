import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import SidebarComponent from "./SidebarComponent.vue";

const Blank = defineComponent({ render: () => h("div") });

async function mountAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: Blank },
      { path: "/users", component: Blank },
      { path: "/profile", component: Blank },
    ],
  });
  await router.push(path);
  await router.isReady();

  return mount(SidebarComponent, {
    props: { isSidebarOpen: true },
    global: { plugins: [router] },
  });
}

const isActive = (link) => link.classes().includes("bg-indigo-600");
// ikon menu = 1 svg, menu aktif menambah 1 svg (ChevronRight)
const svgCount = (link) => link.findAll("svg").length;

describe("SidebarComponent active link", () => {
  it("should mark only the first link as active at the root path", async () => {
    const wrapper = await mountAt("/");
    const [first, second, third] = wrapper.findAll("a");

    expect(isActive(first)).toBe(true);
    expect(isActive(second)).toBe(false);
    expect(isActive(third)).toBe(false);
    expect(svgCount(first)).toBe(2);
    expect(svgCount(second)).toBe(1);
    expect(svgCount(third)).toBe(1);
  });

  it("should mark only the users link as active at /users", async () => {
    const wrapper = await mountAt("/users");
    const [first, second, third] = wrapper.findAll("a");

    expect(isActive(first)).toBe(false);
    expect(isActive(second)).toBe(true);
    expect(isActive(third)).toBe(false);
    expect(svgCount(second)).toBe(2);
  });

  it("should mark only the profile link as active at /profile", async () => {
    const wrapper = await mountAt("/profile");
    const [first, second, third] = wrapper.findAll("a");

    expect(isActive(first)).toBe(false);
    expect(isActive(second)).toBe(false);
    expect(isActive(third)).toBe(true);
    expect(svgCount(third)).toBe(2);
  });
});