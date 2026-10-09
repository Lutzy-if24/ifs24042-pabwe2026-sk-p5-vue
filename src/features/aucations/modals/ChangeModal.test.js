import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChangeModal from "./ChangeModal.vue";
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

// Dibuat dari komponen tanggal lokal supaya hasilnya tidak bergantung zona waktu
const closedAtIso = new Date(2099, 11, 31, 10, 30).toISOString();

const baseAucation = {
  id: 5,
  title: "Jam Antik",
  description: "Deskripsi **tebal**",
  start_bid: 100000,
  closed_at: closedAtIso,
};

function mountModal(aucation = baseAucation, changeImpl = () => Promise.resolve()) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  const changeSpy = vi
    .spyOn(store, "asyncSetIsAucationChange")
    .mockImplementation(changeImpl);

  const wrapper = mount(ChangeModal, {
    props: { aucation },
    global: { plugins: [pinia], stubs: { MarkdownEditor: MarkdownEditorStub } },
  });

  return { wrapper, store, changeSpy };
}

const submitForm = (wrapper) => wrapper.find("form").trigger("submit");
const submitButton = (wrapper) => wrapper.find('button[type="submit"]');

describe("ChangeModal (aucations)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the dialog with labelled fields", () => {
    const { wrapper } = mountModal();

    expect(wrapper.find('[role="dialog"]').attributes("aria-modal")).toBe("true");
    expect(wrapper.find("h2").text()).toBe("Ubah Lelang");

    ["change-title", "change-start-bid", "change-closed-at"].forEach((id) => {
      expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true);
      expect(wrapper.find(`#${id}`).exists()).toBe(true);
    });
    expect(wrapper.find('label[for="change-desc"]').text()).toBe("Deskripsi");
    expect(submitButton(wrapper).text()).toBe("Simpan Perubahan");
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

  describe("populating the form on mount", () => {
    it("should fill the fields from the aucation", async () => {
      const { wrapper } = mountModal();
      await flushPromises();

      expect(wrapper.find("#change-title").element.value).toBe("Jam Antik");
      expect(wrapper.find('[data-testid="editor-stub"]').element.value).toBe(
        "Deskripsi **tebal**"
      );
      expect(wrapper.find("#change-start-bid").element.value).toBe("100000");
      expect(wrapper.find("#change-closed-at").element.value).toBe(
        "2099-12-31T10:30"
      );
    });

    it("should fall back to empty values when fields are missing", async () => {
      const { wrapper } = mountModal({ id: 1 });
      await flushPromises();

      expect(wrapper.find("#change-title").element.value).toBe("");
      expect(wrapper.find('[data-testid="editor-stub"]').element.value).toBe("");
      expect(wrapper.find("#change-start-bid").element.value).toBe("");
      expect(wrapper.find("#change-closed-at").element.value).toBe("");
    });

    it("should leave the form empty when no aucation is given", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { wrapper } = mountModal(null);
      await flushPromises();

      expect(wrapper.find("#change-title").element.value).toBe("");
      expect(wrapper.find("#change-start-bid").element.value).toBe("");
      expect(wrapper.find("#change-closed-at").element.value).toBe("");
    });
  });

  describe("submitting", () => {
    it("should submit trimmed data with api datetime format", async () => {
      const { wrapper, changeSpy } = mountModal();

      await wrapper.find("#change-title").setValue("  Jam Baru  ");
      await wrapper.find('[data-testid="editor-stub"]').setValue("Deskripsi baru");
      await wrapper.find("#change-start-bid").setValue("250000");
      await submitForm(wrapper);
      await flushPromises();

      expect(changeSpy).toHaveBeenCalledWith(5, {
        title: "Jam Baru",
        description: "Deskripsi baru",
        start_bid: 250000,
        closed_at: "2099-12-31 10:30:00",
      });
    });

    it("should send an empty description when it is cleared", async () => {
      const { wrapper, changeSpy } = mountModal();

      await wrapper.find('[data-testid="editor-stub"]').setValue("");
      await submitForm(wrapper);
      await flushPromises();

      expect(changeSpy).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ description: "" })
      );
    });

    it("should not submit when the title is blank", async () => {
      const { wrapper, changeSpy } = mountModal();

      await wrapper.find("#change-title").setValue("   ");
      await submitForm(wrapper);

      expect(changeSpy).not.toHaveBeenCalled();
    });

    it.each([
      ["empty", ""],
      ["zero", "0"],
      ["negative", "-5"],
    ])("should not submit when the start bid is %s", async (_label, value) => {
      const { wrapper, changeSpy } = mountModal();

      await wrapper.find("#change-start-bid").setValue(value);
      await submitForm(wrapper);

      expect(changeSpy).not.toHaveBeenCalled();
    });

    it("should not submit when the closing time is empty", async () => {
      const { wrapper, changeSpy } = mountModal();

      await wrapper.find("#change-closed-at").setValue("");
      await submitForm(wrapper);

      expect(changeSpy).not.toHaveBeenCalled();
    });

    it("should disable the submit button while saving", async () => {
      let resolveChange;
      const pending = new Promise((resolve) => {
        resolveChange = resolve;
      });
      const { wrapper } = mountModal(baseAucation, () => pending);

      expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();

      await submitForm(wrapper);

      expect(submitButton(wrapper).text()).toBe("Menyimpan...");
      expect(submitButton(wrapper).attributes("disabled")).toBeDefined();

      resolveChange();
      await flushPromises();

      expect(submitButton(wrapper).text()).toBe("Simpan Perubahan");
      expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();
    });
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

    it("should keep seconds when the time already has them", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.formatClosedAt("2099-12-31T10:30:45")).toBe(
        "2099-12-31 10:30:45"
      );
    });
  });

  describe("toDatetimeLocal", () => {
    it("should return an empty string when the value is empty", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.toDatetimeLocal("")).toBe("");
      expect(wrapper.vm.toDatetimeLocal(null)).toBe("");
    });

    it("should return an empty string for an invalid date", () => {
      const { wrapper } = mountModal();

      expect(wrapper.vm.toDatetimeLocal("bukan-tanggal")).toBe("");
    });

    it("should pad single digit month, day, hour and minute", () => {
      const { wrapper } = mountModal();
      const iso = new Date(2099, 0, 5, 3, 7).toISOString();

      expect(wrapper.vm.toDatetimeLocal(iso)).toBe("2099-01-05T03:07");
    });
  });

  it("should emit success when the aucation was changed", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationChanged = true;
    store.setIsAucationChange(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(store.isAucationChange).toBe(false);
  });

  it("should not emit success when changing the aucation failed", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationChanged = false;
    store.setIsAucationChange(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(store.isAucationChange).toBe(false);
  });
});