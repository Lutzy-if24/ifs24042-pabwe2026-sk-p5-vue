import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ChangeCoverModal from "./ChangeCoverModal.vue";
import { useAucationsStore } from "../states/aucationsStore";

function mountModal(changeImpl = () => Promise.resolve(), props = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const store = useAucationsStore();
  const changeSpy = vi
    .spyOn(store, "asyncSetIsAucationChangeCover")
    .mockImplementation(changeImpl);

  const wrapper = mount(ChangeCoverModal, {
    props: { aucationId: 7, ...props },
    global: { plugins: [pinia] },
  });

  return { wrapper, store, changeSpy };
}

// jsdom tidak mengizinkan set input.files secara langsung,
// jadi properti `files` didefinisikan manual lalu event change dipicu.
async function selectFiles(wrapper, files) {
  const input = wrapper.find("#cover-file");
  Object.defineProperty(input.element, "files", {
    value: files,
    configurable: true,
  });
  await input.trigger("change");
}

const makeFile = (name = "cover.png") =>
  new File(["isi"], name, { type: "image/png" });

const submitForm = (wrapper) => wrapper.find("form").trigger("submit");
const submitButton = (wrapper) => wrapper.find('button[type="submit"]');

describe("ChangeCoverModal (aucations)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // jsdom tidak punya URL.createObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview-url");
  });

  it("should render the dialog with a labelled file input", () => {
    const { wrapper } = mountModal();

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.attributes("aria-modal")).toBe("true");
    expect(wrapper.find("h2").text()).toBe("Ganti Cover");

    const input = wrapper.find("#cover-file");
    expect(wrapper.find('label[for="cover-file"]').text()).toBe("Pilih Gambar");
    expect(input.attributes("type")).toBe("file");
    expect(input.attributes("accept")).toBe("image/*");
  });

  it("should disable the submit button and hide the preview initially", () => {
    const { wrapper } = mountModal();

    expect(submitButton(wrapper).text()).toBe("Unggah Cover");
    expect(submitButton(wrapper).attributes("disabled")).toBeDefined();
    expect(wrapper.find('img[alt="Preview cover"]').exists()).toBe(false);
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

  it("should show a preview and enable submit after choosing a file", async () => {
    const { wrapper } = mountModal();
    const file = makeFile();

    await selectFiles(wrapper, [file]);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    const img = wrapper.find('img[alt="Preview cover"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("blob:preview-url");
    expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();
  });

  it("should ignore the change event when no file is chosen", async () => {
    const { wrapper } = mountModal();

    await selectFiles(wrapper, []);

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(wrapper.find('img[alt="Preview cover"]').exists()).toBe(false);
    expect(submitButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("should ignore the change event when files is undefined", async () => {
    const { wrapper } = mountModal();

    await selectFiles(wrapper, undefined);

    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(wrapper.find('img[alt="Preview cover"]').exists()).toBe(false);
  });

  it("should not submit when no file has been chosen", async () => {
    const { wrapper, changeSpy } = mountModal();

    await submitForm(wrapper);

    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("should submit the chosen file with the aucation id", async () => {
    const { wrapper, changeSpy } = mountModal(undefined, { aucationId: 42 });
    const file = makeFile();

    await selectFiles(wrapper, [file]);
    await submitForm(wrapper);
    await flushPromises();

    expect(changeSpy).toHaveBeenCalledTimes(1);
    expect(changeSpy).toHaveBeenCalledWith(42, file);
  });

  it("should disable the submit button while uploading", async () => {
    let resolveChange;
    const pending = new Promise((resolve) => {
      resolveChange = resolve;
    });
    const { wrapper } = mountModal(() => pending);

    await selectFiles(wrapper, [makeFile()]);
    expect(submitButton(wrapper).text()).toBe("Unggah Cover");

    await submitForm(wrapper);

    expect(submitButton(wrapper).text()).toBe("Mengunggah...");
    expect(submitButton(wrapper).attributes("disabled")).toBeDefined();

    resolveChange();
    await flushPromises();

    expect(submitButton(wrapper).text()).toBe("Unggah Cover");
    expect(submitButton(wrapper).attributes("disabled")).toBeUndefined();
  });

  it("should emit success when the cover was changed", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationChangedCover = true;
    store.setIsAucationChangeCover(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(store.isAucationChangeCover).toBe(false);
  });

  it("should not emit success when changing the cover failed", async () => {
    const { wrapper, store } = mountModal();

    store.isAucationChangedCover = false;
    store.setIsAucationChangeCover(true);
    await flushPromises();

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(store.isAucationChangeCover).toBe(false);
  });
});