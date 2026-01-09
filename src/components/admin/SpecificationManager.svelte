<script lang="ts">
  import pb from "../../lib/pb";
  import { uploadAttachment, deleteAttachment } from "../../lib/utils";
  import toast from "svelte-french-toast";

  type Spec = {
    id?: string;
    title?: string;
    details?: string;
    attachments?: string[];
    collectionId?: string;
    collectionName?: string;
    [key: string]: any;
  };

  let specs = $state<Spec[]>([]);

  // Detail form state
  let selectedId = $state<string | null>(null);
  let formTitle = $state("");
  let formFiles = $state<FileList | null>(null);
  let currentAttachments = $state<string[]>([]);
  let currentAttachmentUrls = $state<{ id: string; url: string }[]>([]);
  let formLoading = $state(false);

  async function loadData() {
    try {
      formLoading = true;
      const specsList = await pb.collection("metadata").getFullList({
        filter: "categoryType = 'specification'",
        expand: "attachments", // No longer expanding since we store URLs strings directly in JSON/text array
      });

      specs = specsList as unknown as Spec[];
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
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
    currentAttachments = s?.attachments ?? [];
    const attachments = s.expand?.attachments;
    currentAttachmentUrls =
      attachments?.map(
        (attachment: { [key: string]: any; attachment: string }) => ({
          id: attachment.id,
          url: pb.files.getURL(attachment, attachment.attachment),
        }),
      ) ?? [];
    formFiles = null;
  }

  function newSpec() {
    selectedId = null;
    formTitle = "";
    currentAttachments = [];
    formFiles = null;
  }

  async function saveSpec() {
    if (!formTitle) {
      toast.error("Title is required");
      return;
    }

    formLoading = true;

    // 1. Calculate how many we can upload
    // We want max 3 attachments total (existing + new)
    const existingCount = currentAttachments.length;
    const slotsAvailable = 3 - existingCount;

    let finalAttachments = [...currentAttachments];

    try {
      // 2. Upload new files if any
      if (formFiles && formFiles.length > 0) {
        if (formFiles.length > slotsAvailable) {
          toast.success(
            `You can only have up to 3 attachments. You have ${existingCount} already.`,
          );
          formLoading = false;
          return;
        }

        const uploadedUrls = await uploadAttachment(
          `Spec - ${formTitle}` || "Specification Attachment",
          Array.from(formFiles),
        );
        finalAttachments = [...finalAttachments, ...uploadedUrls];
      }

      const formData = new FormData();
      formData.append("title", formTitle);
      formData.append("categoryType", "specification");

      // We must serialize the array of URLs effectively.
      // If PB field 'attachments' is JSON:
      formData.append("attachments", JSON.stringify(finalAttachments));

      if (selectedId) {
        const updated = await pb
          .collection("metadata")
          .update(selectedId, formData);
        specs = specs.map((it) =>
          it.id === selectedId ? (updated as unknown as Spec) : it,
        );
        selectSpec(updated as unknown as Spec);
      } else {
        const created = await pb.collection("metadata").create(formData);
        specs = [created as unknown as Spec, ...specs];
        selectSpec(created as unknown as Spec);
      }
    } catch (err) {
      toast.error(err?.message);
    } finally {
      formLoading = false;
    }
  }

  async function deleteSpec(id?: string | null) {
    if (!id) return;
    if (!confirm("Remove this specification?")) return;

    try {
      // 1. Delete all attachments associated
      const s = specs.find((item) => item.id === id);
      if (s && s.attachments && Array.isArray(s.attachments)) {
        for (const attachId of s.attachments) {
          await deleteAttachment(attachId);
        }
      }

      // 2. Delete record
      await pb.collection("metadata").delete(id);
      specs = specs.filter((s) => s.id !== id);
      if (selectedId === id) newSpec();
    } catch (err) {
      toast.error(err?.message);
    }
  }

  async function removeAttachment(url: { [key: string]: any }) {
    if (!confirm("Are you sure you want to delete this attachment?")) return;
    const success = await deleteAttachment(url.id);
    if (success) {
      currentAttachmentUrls = currentAttachmentUrls.filter(
        (u) => u.id !== url.id,
      );
      currentAttachments = currentAttachments.filter((id) => id !== url.id);
      await loadData();
    }
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
              >Current Attachments (Max 3)</span
            >
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each currentAttachmentUrls as url}
                <div
                  class="relative group border rounded-lg overflow-hidden p-2 bg-slate-50"
                >
                  <button
                    type="button"
                    onclick={() => removeAttachment(url)}
                    class="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    X
                  </button>
                  <a
                    href={url.url}
                    target="_blank"
                    class="text-xs text-blue-600 truncate block hover:underline"
                    rel="noreferrer"
                  >
                    View File
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
