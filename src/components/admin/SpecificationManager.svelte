<script lang="ts">
  import pb from "../../lib/pb";

  type Spec = {
    id?: string;
    title?: string;
    details?: string;
    attachments?: string[];
    collectionId?: string;
    collectionName?: string;
  };

  let specs = $state<Spec[]>([]);

  // Detail form state
  let selectedId = $state<string | null>(null);
  let formTitle = $state("");
  let formDescription = $state("");
  let formFiles = $state<FileList | null>(null);
  let currentAttachments = $state<string[]>([]);
  let currentCollectionId = $state("");
  let formLoading = $state(false);

  async function loadData() {
    try {
      formLoading = true;
      const specsList = await pb.collection("specifications").getList(1, 50, {
        sort: "-created",
      });

      specs = specsList.items as unknown as Spec[];
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      formLoading = false;
    }
  }

  $effect(() => {
    loadData();
  });

  function selectSpec(s: Spec) {
    selectedId = s?.id ?? null;
    formTitle = s?.title ?? "";
    formDescription = s?.details ?? "";
    currentAttachments = s?.attachments ?? [];
    currentCollectionId = s?.collectionId ?? "";
    formFiles = null; // Reset file input
  }

  function newSpec() {
    selectedId = null;
    formTitle = "";
    formDescription = "";
    currentAttachments = [];
    currentCollectionId = "";
    formFiles = null;
  }

  async function saveSpec() {
    if (!formTitle) {
      alert("Title is required");
      return;
    }

    formLoading = true;

    const formData = new FormData();
    formData.append("title", formTitle);
    formData.append("details", formDescription);

    if (formFiles && formFiles.length > 0) {
      for (let i = 0; i < formFiles.length; i++) {
        formData.append("attachments", formFiles[i]);
      }
    }

    try {
      if (selectedId) {
        const updated = await pb
          .collection("specifications")
          .update(selectedId, formData);
        specs = specs.map((it) =>
          it.id === selectedId ? (updated as unknown as Spec) : it,
        );
        selectSpec(updated as unknown as Spec);
      } else {
        const created = await pb.collection("specifications").create(formData);
        specs = [created as unknown as Spec, ...specs];
        selectSpec(created as unknown as Spec);
      }
    } catch (err) {
      alert(String(err));
    } finally {
      formLoading = false;
    }
  }

  async function deleteSpec(id?: string | null) {
    if (!id) return;
    if (!confirm("Remove this specification?")) return;

    try {
      await pb.collection("specifications").delete(id);
      specs = specs.filter((s) => s.id !== id);
      if (selectedId === id) newSpec();
    } catch (err) {
      alert(String(err));
    }
  }

  // Helper to get image URL
  function getAttachmentUrl(filename: string) {
    if (!selectedId || !currentCollectionId) return "";
    return pb.files.getUrl(
      {
        collectionId: currentCollectionId,
        id: selectedId,
        collectionName: "specifications",
      },
      filename,
    );
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Specifications</h3>
        <button
          onclick={newSpec}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold"
          >+ New</button
        >
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-auto">
        {#each specs as s}
          <div
            class="p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
            class:bg-slate-100={selectedId === s.id}
            role="button"
            tabindex="0"
            onclick={() => selectSpec(s)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectSpec(s);
              }
            }}
          >
            <div class="font-medium text-slate-900">{s.title}</div>
            <button
              onclick={(e) => {
                e.stopPropagation();
                deleteSpec(s.id);
              }}
              class="text-red-500 text-xs mt-2 hover:underline">Delete</button
            >
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <h3 class="font-bold text-slate-900 text-lg mb-6">
        {selectedId ? "Edit Specification" : "Create Specification"}
      </h3>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-bold text-slate-700">Category/Title</span>
          <input
            bind:value={formTitle}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="e.g., Flooring, Plumbing"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700"
            >Details / Materials</span
          >
          <input
            bind:value={formDescription}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="e.g., Describe the materials used..."
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700"
            >Attachments (Images/Files)</span
          >
          <input
            type="file"
            multiple
            bind:files={formFiles}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#d4af37]/10 file:text-[#d4af37] hover:file:bg-[#d4af37]/20"
          />
          {#if formFiles && formFiles.length > 0}
            <div class="mt-2 text-sm text-slate-500">
              Selected {formFiles.length} file(s) to upload.
            </div>
          {/if}
        </label>

        {#if currentAttachments && currentAttachments.length > 0}
          <div class="mt-4">
            <span class="text-sm font-bold text-slate-700 mb-2 block"
              >Current Attachments</span
            >
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each currentAttachments as att}
                <div
                  class="relative group border rounded-lg overflow-hidden p-2 bg-slate-50"
                >
                  <!-- Basic logic to try showing thumb if image, else link -->
                  <!-- svelte-ignore a11y_img_redundant_alt -->
                  <img
                    src={getAttachmentUrl(att)}
                    alt="Attachment"
                    class="w-full h-24 object-cover rounded mb-2 bg-slate-200"
                    onerror={(e) => {
                      // Fallback for non-images
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                  <a
                    href={getAttachmentUrl(att)}
                    target="_blank"
                    class="text-xs text-blue-600 truncate block hover:underline"
                    rel="noreferrer"
                  >
                    {att}
                  </a>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={saveSpec}
          disabled={formLoading}
          class="bg-slate-900 text-[#d4af37] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
        >
          {formLoading ? "Saving..." : selectedId ? "Update" : "Create"}
        </button>

        {#if selectedId}
          <button
            onclick={() => deleteSpec(selectedId)}
            class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90"
          >
            Delete
          </button>
        {/if}

        <button
          onclick={newSpec}
          class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-slate-700"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</div>
