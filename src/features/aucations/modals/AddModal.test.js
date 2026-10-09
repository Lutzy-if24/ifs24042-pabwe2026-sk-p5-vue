import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AddModal from "./AddModal.vue";
import { useAucationsStore } from "../states/aucationsStore";

const MarkdownEditorStub = defineComponent({
  name: "MarkdownEditor",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("textarea", {
        "data-testid": "editor-stub",
        value: props.modelValue,
        onInput: (e) => emit("update:modelValue", e.target.value),
      });
  },
});

function mountModal(addImpl = () => Promise.resolve()) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  const addSpy = vi
    .spyOn(store, "asyncSetIsAucationAdd")
    .mockImplementation(addImpl);

  const wrapper = mount(AddModal, {
    global: { plugins: [pinia], stubs: { MarkdownEditor: MarkdownEditorStub } },
  });

  return { wrapper, store, addSpy };
}

async function fillForm(
  wrapper,
  {
    title = "Jam Antik",
    description = "Deskripsi **tebal**",
    startBid = "100000",
    closedAt = "2099-12-31T10:30",
  } = {}
) {
  await wrapper.find("#add-title").setValue(title);
  await wrapper.find('[data-testid="editor-stub"]').setValue(description);
  await wrapper.find("#add-start-bid").setValue(startBid);
  await wrapper.find("#add-closed-at").setValue(closedAt);
}

const submitForm = (wrapper) => wrapper.find("form").trigger("submit");

describe("AddModal (aucations)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render an accessible dialog with labelled fields", () => {
    const { wrapper } = mountModal();

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.attributes("aria-modal")).toBe("true");
    const labelId = dialog.attributes("aria-labelledby");
    expect(wrapper.find(`#${labelId}`).text()).toBe("Tambah Lelang");

    ["add-title", "add-start-bid", "add-closed-at"].forEach((id) => {
      expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true);
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    });

    expect(wrapper.find('[role="group"]').attributes("aria-labelledby")).toBe(
      "add-desc-label"
    );
    expect(wrapper.find("#add-desc-label").text()).toBe("Deskripsi");
  });

  it("should emit close from the close icon button", async () => {
    const { wrapper } = mountModal();

    await wrapper.find('button[aria-label="Tutup"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("should emit close from the cancel button", async () => {
    const { wrapper } = mountModal();

    const cancel = wrapper.findAll("button").find((b) => b.text() === "Batal");
    await cancel.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("should submit trimmed data with api datetime format", async () => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { title: "  Jam Antik  " });
    await submitForm(wrapper);
    await flushPromises();

    expect(addSpy).toHaveBeenCalledWith({
      title: "Jam Antik",
      description: "Deskripsi **tebal**",
      start_bid: 100000,
      closed_at: "2099-12-31 10:30:00",
    });
  });

  it("should keep seconds when the datetime already has them", async () => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { closedAt: "2099-12-31T10:30:45" });
    await submitForm(wrapper);
    await flushPromises();

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ closed_at: "2099-12-31 10:30:45" })
    );
  });

  it("should send an empty description when none is provided", async () => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { description: "" });
    await submitForm(wrapper);
    await flushPromises();

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: "" })
    );
  });

  it("should not submit when the title is blank", async () => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { title: "   " });
    await submitForm(wrapper);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it.each([
    ["empty", ""],
    ["zero", "0"],
    ["negative", "-5"],
  ])("should not submit when the start bid is %s", async (_label, value) => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { startBid: value });
    await submitForm(wrapper);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should not submit when the closing time is empty", async () => {
    const { wrapper, addSpy } = mountModal();

    await fillForm(wrapper, { closedAt: "" });
    await submitForm(wrapper);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should disable the submit button while saving", async () => {
    let resolveAdd;
    const pending = new Promise((resolve) => {
      resolveAdd = resolve;
    });
    const { wrapper } = mountModal(() => pending);
    const submitButton = () => wrapper.find('button[type="submit"]');

    expect(submitButton().text()).toBe("Simpan");
    expect(submitButton().attributes("disabled")).toBeUndefined();

    await fillForm(wrapper);
    await submitForm(wrapper);

    expect(submitButton().text()).toBe("Menyimpan...");
    expect(submitButton().attributes("disabled")).toBeDefined();

    resolveAdd();
    await flushPromises();

    expect(submitButton().text()).toBe("Simpan");
    expect(submitButton().attributes("disabled")).toBeUndefined();
  });

  it("should emit success when the aucation was added", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationAdded = true;
    store.setIsAucationAdd(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(store.isAucationAdd).toBe(false);
  });

  it("should not emit success when adding failed", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationAdded = false;
    store.setIsAucationAdd(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(store.isAucationAdd).toBe(false);
  });

  describe("formatClosedAt", () => {
    it("should return an empty string when the value is empty", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.formatClosedAt("")).toBe("");
      expect(wrapper.vm.formatClosedAt(null)).toBe("");
    });

    it("should return the value unchanged when it has no time part", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.formatClosedAt("2099-12-31")).toBe("2099-12-31");
      expect(wrapper.vm.formatClosedAt("2099-12-31T")).toBe("2099-12-31T");
    });

    it("should append seconds when the time has none", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.formatClosedAt("2099-12-31T10:30")).toBe(
        "2099-12-31 10:30:00"
      );
    });
  });
});