import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

import { reactive } from "vue";

const mockRouter = {
  push: vi.fn(),
};

const mockRoute = reactive({ params: { todoId: "1" } });

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    useRouter: () => mockRouter,
    useRoute: () => mockRoute,
  };
});

describe("DetailPage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const mockTodo = {
    id: 1,
    title: "Detail Todo Judul",
    description: "Detail Todo Deskripsi",
    is_finished: 1,
    cover: "https://example.com/cover.jpg",
    created_at: "2024-02-26T02:34:26.000000Z",
    updated_at: "2024-02-26T02:44:47.000000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading spinner if profile or todo is missing", () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: null,
        todo: null,
      },
    });

    expect(wrapper.text()).not.toContain("Detail Todo Judul");
  });

  it("should render todo details correctly and support closing cover & edit modals", async () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
      },
    });

    expect(wrapper.text()).toContain("Detail Todo Judul");
    expect(wrapper.text()).toContain("Detail Todo Deskripsi");
    expect(wrapper.text()).toContain("Selesai");

    // Open & close cover modal
    const editCoverBtn = wrapper.find('[data-testid="edit-cover-btn"]');
    await editCoverBtn.trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);

    const closeCoverBtn = wrapper.find('[data-testid="close-cover-modal-btn"]');
    await closeCoverBtn.trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

    // Open & close edit modal
    const editDetailBtn = wrapper.find('[data-testid="edit-detail-todo-btn"]');
    await editDetailBtn.trigger("click");
    expect(wrapper.find('[data-testid="edit-todo-modal"]').exists()).toBe(true);

    const closeEditBtn = wrapper.find('[data-testid="close-edit-modal-btn"]');
    await closeEditBtn.trigger("click");
    expect(wrapper.find('[data-testid="edit-todo-modal"]').exists()).toBe(false);
  });

  it("should render unfinished badge when todo is not finished and handle description fallback", () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: {
          ...mockTodo,
          is_finished: 0,
          description: "",
          cover: null,
        },
      },
    });

    expect(wrapper.text()).toContain("Sedang Proses");
    expect(wrapper.text()).toContain("Tidak ada deskripsi rinci untuk todo ini.");
  });

  it("should trigger confirm dialog and dispatch delete on delete button click when confirmed", async () => {
    const { wrapper, todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
      },
    });

    const deleteSpy = vi
      .spyOn(todosStore, "asyncSetIsTodoDelete")
      .mockReturnValue(Promise.resolve());

    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });

    const deleteBtn = wrapper.find('[data-testid="delete-detail-todo-btn"]');
    await deleteBtn.trigger("click");

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should not dispatch delete when cancelled", async () => {
    const { wrapper, todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
      },
    });

    const deleteSpy = vi
      .spyOn(todosStore, "asyncSetIsTodoDelete")
      .mockReturnValue(Promise.resolve());

    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });

    const deleteBtn = wrapper.find('[data-testid="delete-detail-todo-btn"]');
    await deleteBtn.trigger("click");

    expect(toolsHelper.showConfirmDialog).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should navigate back to home if isTodo is true and todo is null", async () => {
    const { todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: null,
        isTodo: false,
      },
    });

    todosStore.setIsTodo(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("should stay when isTodo is true and todo exists", async () => {
    const { wrapper, todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
        isTodo: false,
      },
    });

    todosStore.setIsTodo(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.text()).toContain("Detail Todo Judul");
  });

  it("should navigate back to home if isTodoDeleted is true", async () => {
    const { todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
        isTodoDeleted: false,
      },
    });

    todosStore.setIsTodoDeleted(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("should trigger asyncSetTodo on todoId change", async () => {
    const { todosStore } = renderWithProviders(DetailPage, {
      preloadedState: {
        profile: mockProfile,
        todo: mockTodo,
      },
    });

    const setTodoSpy = vi.spyOn(todosStore, "asyncSetTodo").mockResolvedValue();
    mockRoute.params.todoId = "2";
    await new Promise((r) => setTimeout(r, 10));

    expect(setTodoSpy).toHaveBeenCalledWith("2");
  });
});
