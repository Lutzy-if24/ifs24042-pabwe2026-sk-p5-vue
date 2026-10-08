import { defineStore } from "pinia";
import todoApi from "../api/todoApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export const useTodosStore = defineStore("todos", {
  state: () => ({
    todos: [],
    todo: null,
    isTodo: false,
    isTodoAdd: false,
    isTodoAdded: false,
    isTodoChange: false,
    isTodoChanged: false,
    isTodoChangeCover: false,
    isTodoChangedCover: false,
    isTodoDelete: false,
    isTodoDeleted: false,
  }),
  actions: {
    setTodos(todos) {
      this.todos = todos;
    },
    setTodo(todo) {
      this.todo = todo;
    },
    setIsTodo(status) {
      this.isTodo = status;
    },
    setIsTodoAdd(status) {
      this.isTodoAdd = status;
    },
    setIsTodoAdded(status) {
      this.isTodoAdded = status;
    },
    setIsTodoChange(status) {
      this.isTodoChange = status;
    },
    setIsTodoChanged(status) {
      this.isTodoChanged = status;
    },
    setIsTodoChangeCover(status) {
      this.isTodoChangeCover = status;
    },
    setIsTodoChangedCover(status) {
      this.isTodoChangedCover = status;
    },
    setIsTodoDelete(status) {
      this.isTodoDelete = status;
    },
    setIsTodoDeleted(status) {
      this.isTodoDeleted = status;
    },
    async asyncSetTodos(is_finished = "") {
      try {
        const todos = await todoApi.getTodos(is_finished);
        this.setTodos(todos);
      } catch (error) {
        this.setTodos([]);
      }
    },
    async asyncSetTodo(todoId) {
      try {
        const todo = await todoApi.getTodoById(todoId);
        this.setTodo(todo);
      } catch (error) {
        this.setTodo(null);
      } finally {
        this.setIsTodo(true);
      }
    },
    async asyncSetIsTodoAdd(title, description) {
      try {
        await todoApi.postTodo(title, description);
        showSuccessDialog("Todo berhasil ditambahkan!");
        this.setIsTodoAdded(true);
      } catch (error) {
        showErrorDialog(error.message);
        this.setIsTodoAdded(false);
      } finally {
        this.setIsTodoAdd(true);
      }
    },
    async asyncSetIsTodoChange(todoId, title, description, is_finished) {
      try {
        const message = await todoApi.putTodo(
          todoId,
          title,
          description,
          is_finished
        );
        showSuccessDialog(message || "Todo berhasil diperbarui!");
        this.setIsTodoChanged(true);
      } catch (error) {
        showErrorDialog(error.message);
        this.setIsTodoChanged(false);
      } finally {
        this.setIsTodoChange(true);
      }
    },
    async asyncSetIsTodoChangeCover(todoId, cover) {
      try {
        const message = await todoApi.postTodoCover(todoId, cover);
        showSuccessDialog(message || "Cover berhasil diperbarui!");
        this.setIsTodoChangedCover(true);
      } catch (error) {
        showErrorDialog(error.message);
        this.setIsTodoChangedCover(false);
      } finally {
        this.setIsTodoChangeCover(true);
      }
    },
    async asyncSetIsTodoDelete(todoId) {
      try {
        const message = await todoApi.deleteTodo(todoId);
        showSuccessDialog(message || "Todo berhasil dihapus!");
        this.setIsTodoDeleted(true);
      } catch (error) {
        showErrorDialog(error.message);
        this.setIsTodoDeleted(false);
      } finally {
        this.setIsTodoDelete(true);
      }
    },
  },
});
