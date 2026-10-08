import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: false },
    });
    expect(wrapper.find('[data-testid="add-todo-modal"]').exists()).toBe(false);
  });

  it("should show validation error if title is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");
  });

  it("should show validation error if description is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    const titleInput = wrapper.find('[data-testid="add-todo-title-input"]');
    await titleInput.setValue("Judul Todo");

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should dispatch asyncSetIsTodoAdd and call onClose on successful add", async () => {
    const { wrapper, todosStore } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: {
        isTodoAdd: false,
        isTodoAdded: false,
      },
    });

    const asyncAddSpy = vi.spyOn(todosStore, "asyncSetIsTodoAdd").mockReturnValue(Promise.resolve());

    const titleInput = wrapper.find('[data-testid="add-todo-title-input"]');
    const descInput = wrapper.find('[data-testid="add-todo-description-input"]');

    await titleInput.setValue("Belajar Vitest");
    await descInput.setValue("Belajar sampai coverage 100%");

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(asyncAddSpy).toHaveBeenCalledWith("Belajar Vitest", "Belajar sampai coverage 100%");

    // Simulate completion from store
    todosStore.setIsTodoAdd(true);
    todosStore.setIsTodoAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should handle isTodoAdd true when isTodoAdded is false", async () => {
    const { wrapper, todosStore } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: {
        isTodoAdd: false,
        isTodoAdded: false,
      },
    });

    todosStore.setIsTodoAdd(true);
    todosStore.setIsTodoAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="add-todo-modal"]').exists()).toBe(true);
  });

  it("should close modal when close or cancel button clicked", async () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    const closeBtn = wrapper.find('[data-testid="close-add-modal-btn"]');
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    const cancelBtn = wrapper.find('[data-testid="cancel-add-modal-btn"]');
    await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
