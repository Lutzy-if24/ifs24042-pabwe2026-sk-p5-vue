import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("ChangeModal", () => {
  const mockTodo = {
    id: 1,
    title: "Initial Title",
    description: "Initial Desc",
    is_finished: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, todoId: 1 },
    });
    expect(wrapper.find('[data-testid="edit-todo-modal"]').exists()).toBe(false);
  });

  it("should populate inputs with todo data and handle changes", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: mockTodo,
      },
    });

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    const descInput = wrapper.find('[data-testid="edit-todo-description-input"]');
    const statusSelect = wrapper.find('[data-testid="edit-todo-status-select"]');

    expect(titleInput.element.value).toBe("Initial Title");
    expect(descInput.element.value).toBe("Initial Desc");
    expect(statusSelect.element.value).toBe("0");

    await statusSelect.setValue("1");
    expect(statusSelect.element.value).toBe("1");
  });

  it("should handle empty title and description in todo object", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: { id: 1, title: null, description: null, is_finished: 1 },
      },
    });

    expect(wrapper.find('[data-testid="edit-todo-title-input"]').element.value).toBe("");
  });

  it("should validate empty title and empty description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: mockTodo,
      },
    });

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    const form = wrapper.find("form");

    await titleInput.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await titleInput.setValue("Valid Title");
    const descInput = wrapper.find('[data-testid="edit-todo-description-input"]');
    await descInput.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should dispatch asyncSetIsTodoChange and close on success", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: mockTodo,
        isTodoChange: false,
        isTodoChanged: false,
      },
    });

    const changeSpy = vi.spyOn(todosStore, "asyncSetIsTodoChange").mockReturnValue(Promise.resolve());

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "Initial Title", "Initial Desc", 0);

    // Simulate completion with isTodoChanged true
    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should dispatch asyncSetIsTodoChange with 1 when isFinished is true", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: { ...mockTodo, is_finished: 1 },
      },
    });

    const changeSpy = vi.spyOn(todosStore, "asyncSetIsTodoChange").mockReturnValue(Promise.resolve());

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "Initial Title", "Initial Desc", 1);
  });

  it("should handle isTodoChange true when isTodoChanged is false", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: mockTodo,
        isTodoChange: false,
        isTodoChanged: false,
      },
    });

    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="edit-todo-title-input"]').exists()).toBe(true);
  });

  it("should trigger onClose on cancel or close button click", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1 },
      preloadedState: {
        todo: mockTodo,
      },
    });

    const closeBtn = wrapper.find('[data-testid="close-edit-modal-btn"]');
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    const cancelBtn = wrapper.find('[data-testid="cancel-edit-modal-btn"]');
    await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
