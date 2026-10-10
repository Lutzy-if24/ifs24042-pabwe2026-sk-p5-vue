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
      props: { show: false, todoId: 1, todo: mockTodo },
    });
    expect(wrapper.find('[data-testid="edit-todo-modal"]').exists()).toBe(false);
  });

  it("should populate inputs with todo data and handle changes", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: mockTodo },
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
      props: {
        show: true,
        todoId: 1,
        todo: { id: 1, title: null, description: null, is_finished: 1 },
      },
    });

    expect(wrapper.find('[data-testid="edit-todo-title-input"]').element.value).toBe("");
  });

  it("should validate empty title and empty description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: mockTodo },
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
      props: { show: true, todoId: 1, todo: mockTodo },
      preloadedState: { isTodoChange: false, isTodoChanged: false },
    });

    const changeSpy = vi.spyOn(todosStore, "asyncSetIsTodoChange").mockReturnValue(Promise.resolve());

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "Initial Title", "Initial Desc", 0);

    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should dispatch asyncSetIsTodoChange with 1 when isFinished is true", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: { ...mockTodo, is_finished: 1 } },
    });

    const changeSpy = vi.spyOn(todosStore, "asyncSetIsTodoChange").mockReturnValue(Promise.resolve());

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "Initial Title", "Initial Desc", 1);
  });

  it("should handle isTodoChange true when isTodoChanged is false", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: mockTodo },
      preloadedState: { isTodoChange: false, isTodoChanged: false },
    });

    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="edit-todo-title-input"]').exists()).toBe(true);
  });

  it("should trigger onClose on cancel or close button click", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: mockTodo },
    });

    const closeBtn = wrapper.find('[data-testid="close-edit-modal-btn"]');
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    const cancelBtn = wrapper.find('[data-testid="cancel-edit-modal-btn"]');
    await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });

  it("should call asyncSetTodo when isTodoChanged is true and todoId exists", async () => {
    const { todosStore } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 1, todo: mockTodo },
      preloadedState: { isTodoChange: false, isTodoChanged: false },
    });

    const setTodoSpy = vi.spyOn(todosStore, "asyncSetTodo").mockReturnValue(Promise.resolve());

    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(setTodoSpy).toHaveBeenCalledWith(1);
  });

  it("should not crash when show is true but no todo data available", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, todoId: 999, todo: null },
      preloadedState: { isTodo: null },
    });

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    expect(titleInput.exists()).toBe(true);
    expect(titleInput.element.value).toBe("");
  });

  it("should handle non-numeric is_finished value gracefully", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: {
        show: true,
        todoId: 1,
        todo: { ...mockTodo, is_finished: "abc" },
      },
    });

    const changeSpy = vi.spyOn(todosStore, "asyncSetIsTodoChange").mockReturnValue(Promise.resolve());

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeSpy).toHaveBeenCalled();
    const callArgs = changeSpy.mock.calls[0];
    expect(callArgs[3]).toBe(0);
  });

  it("should not populate form when show is false at mount", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, todoId: 1, todo: mockTodo },
    });

    expect(wrapper.find('[data-testid="edit-todo-modal"]').exists()).toBe(false);

    await wrapper.setProps({ show: true });
    await new Promise((r) => setTimeout(r, 10));

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    expect(titleInput.element.value).toBe("Initial Title");
  });

  // ✅ FIX #1: Cover branch ketika props.todo NULL, tapi store.isTodo COCOK
  it("should populate form from store.isTodo when props.todo is null but store matches todoId", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: {
        show: true,
        todoId: 1,
        todo: null,
      },
    });

    todosStore.isTodo = { id: 1, title: "From Store", description: "Store Desc", is_finished: 0 };
    await new Promise((r) => setTimeout(r, 10));

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    expect(titleInput.element.value).toBe("From Store");
  });

  // ✅ FIX #2: Cover branch ketika props.todo NULL & store.id TIDAK cocok
  it("should not populate form when store.isTodo id does not match todoId", async () => {
    const { wrapper, todosStore } = renderWithProviders(ChangeModal, {
      props: {
        show: true,
        todoId: 999,
        todo: null,
      },
    });

    todosStore.isTodo = { id: 1, title: "Wrong", description: "Wrong", is_finished: 0 };
    await new Promise((r) => setTimeout(r, 10));

    const titleInput = wrapper.find('[data-testid="edit-todo-title-input"]');
    expect(titleInput.element.value).toBe("");
  });

  // ✅ FIX #3: Cover `if (props.todoId)` ELSE branch (todoId NULL)
  it("should not call asyncSetTodo when todoId is null", async () => {
    const { todosStore } = renderWithProviders(ChangeModal, {
      props: {
        show: true,
        todoId: null,
        todo: mockTodo,
      },
      preloadedState: {
        isTodoChange: false,
        isTodoChanged: false,
      },
    });

    const setTodoSpy = vi.spyOn(todosStore, "asyncSetTodo").mockReturnValue(Promise.resolve());

    todosStore.setIsTodoChange(true);
    todosStore.setIsTodoChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(setTodoSpy).not.toHaveBeenCalled();
  });
});