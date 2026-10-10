import { describe, it, expect } from "vitest";
import { routes } from "./router";

function flatten(list) {
  return list.flatMap((r) => [r, ...(r.children ? flatten(r.children) : [])]);
}

describe("router lazy routes", () => {
  it("should define every route component as a lazy loader", async () => {
    const withComponent = flatten(routes).filter((r) => r.component);

    expect(withComponent).toHaveLength(9);

    for (const route of withComponent) {
      expect(typeof route.component).toBe("function");
      const module = await route.component();
      expect(module.default).toBeTruthy();
    }
  });
});