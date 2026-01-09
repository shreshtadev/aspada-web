<script>
  import pb from "../../lib/pb";
  import { uploadAttachment, deleteAttachment } from "../../lib/utils";
  import Modal from "./Modal.svelte";
  import MilkdownEditor from "../MilkdownEditor.svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import FileUploadTracker from "./FileUploadTracker.svelte";
  import toast from "svelte-french-toast";
  // Master list state
  let projects = $state([]);
  let currentPage = $state(1);
  let totalPages = $state(0);
  let totalItems = $state(0);
  let perPage = $state(10);
  let loading = $state(true);

  // Options state
  let allSocials = $state([]);
  let allAmenities = $state([]);
  let allSpecs = $state([]);

  // Detail form state
  let selectedId = $state(null);
  let formTitle = $state("");
  let formSlug = $state("");
  let formCategory = $state("residential");
  let formStatus = $state("upcoming");
  let formDescription = $state("");
  let formSocials = $state([]); // IDs
  let formAmenities = $state([]); // IDs
  let formSpecs = $state([]); // IDs
  let currentCoverId = $state(""); // ID of current cover attachment record
  let currentBrochureId = $state(""); // ID of current brochure attachment record

  let specificationAttachmentIds = $state([]);
  let fileUploadTracker = $state(null);

  let coverFile = $state(null);
  let brochureFile = $state(null);
  let coverFileInput = $state(null);
  let brochureFileInput = $state(null);

  let formLoading = $state(false);

  // Modal state
  let showModal = $state(false);
  let modalType = $state(""); // 'amenity', 'specification', 'social'
  let newItemTitle = $state("");
  let newItemExtra = $state(""); // description for spec
  let shareUrl = $state("");
  let modalLoading = $state(false);

  // Fetch function
  async function loadData(page) {
    loading = true;
    try {
      const [projectsRes, socialsRes, metadataRes] = await Promise.all([
        pb.collection("projects").getList(page, perPage),
        pb.collection("socials").getFullList({ sort: "title" }),
        pb.collection("metadata").getFullList({ sort: "title" }),
      ]);

      projects = projectsRes.items;
      currentPage = projectsRes.page;
      totalPages = projectsRes.totalPages;
      totalItems = projectsRes.totalItems;

      allSocials = socialsRes;
      allAmenities = metadataRes.filter((m) => m.categoryType === "amenity");
      allSpecs = metadataRes.filter((m) => m.categoryType === "specification");
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data");
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadData(currentPage);
  });

  function selectProject(p) {
    selectedId = p?.id ?? null;
    formTitle = p?.title ?? "";
    formSlug = p?.slug ?? "";
    formCategory = p?.category ?? "residential";
    formStatus = p?.status ?? "upcoming";
    formDescription = p?.description ?? "";
    formSocials = p?.socials ?? [];
    formAmenities = p?.amenities ?? [];
    formSpecs = p?.specifications ?? [];

    // Relation IDs are strings in the 'projects' record (if not expanded)
    currentCoverId = p?.coverImage ?? "";
    currentBrochureId = p?.brochure ?? "";

    coverFile = null;
    brochureFile = null;
    specificationAttachmentIds = [];
  }

  function newProject() {
    selectedId = null;
    formTitle = "";
    formSlug = "";
    formCategory = "residential";
    formStatus = "upcoming";
    formDescription = "";
    formSocials = [];
    formAmenities = [];
    formSpecs = [];
    currentCoverId = "";
    currentBrochureId = "";
    coverFile = null;
    brochureFile = null;
    specificationAttachmentIds = [];
  }

  // Quick Add Logic
  function openModal(type) {
    modalType = type;
    newItemTitle = "";
    newItemExtra = "";
    shareUrl = "";
    showModal = true;
  }

  async function handleQuickAdd() {
    if (!newItemTitle) {
      toast.error("Title is required");
      return;
    }
    modalLoading = true;
    try {
      let collection = "";
      let payload = { title: newItemTitle };

      if (modalType === "amenity") {
        collection = "metadata";
        payload.categoryType = "amenity";
      }
      if (modalType === "social") {
        collection = "socials";
        payload.shareUrl = shareUrl;
        payload.shareUrlType =
          shareUrl.indexOf("instagram") > -1
            ? "instagram"
            : shareUrl.indexOf("facebook") > -1
              ? "facebook"
              : "youtube";
      }
      if (modalType === "specification") {
        collection = "metadata";
        payload.categoryType = "specification";

        // Upload attachments if any
        if (fileUploadTracker) {
          const selectedFiles = fileUploadTracker.getSelectedFiles();
          if (selectedFiles.length > 0) {
            const uploadedIds = await uploadAttachment(
              `Spec - ${newItemTitle}`,
              selectedFiles,
            );
            payload.attachments = uploadedIds;
          }
        }
      }

      const record = await pb.collection(collection).create(payload);

      // Refresh list and select
      if (modalType === "amenity") {
        allAmenities = [...allAmenities, record].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        formAmenities = [...formAmenities, record.id];
      } else if (modalType === "social") {
        allSocials = [...allSocials, record].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        formSocials = [...formSocials, record.id];
      } else if (modalType === "specification") {
        allSpecs = [...allSpecs, record].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        formSpecs = [...formSpecs, record.id];

        // Clear file tracker
        if (fileUploadTracker) {
          fileUploadTracker.clearFiles();
        }
      }

      showModal = false;
    } catch (err) {
      toast.error(err.message);
    } finally {
      modalLoading = false;
    }
  }

  async function saveProject() {
    if (!formTitle) {
      toast.error("Title is required");
      return;
    }

    formLoading = true;
    const formData = new FormData();
    formData.append("title", formTitle);
    formData.append("category", formCategory);
    formData.append("status", formStatus);
    formData.append("description", formDescription);

    // Append relations
    for (const id of formSocials) formData.append("socials", id);
    for (const id of formAmenities) formData.append("amenities", id);
    for (const id of formSpecs) formData.append("specifications", id);

    try {
      // 1. Handle Cover Image
      if (coverFile) {
        const urls = await uploadAttachment(`Cover - ${formTitle}`, [
          coverFile,
        ]);
        if (urls.length > 0) {
          const newId = urls[0];
          if (newId) {
            formData.append("coverImage", newId);
            // Clean up old
            if (currentCoverId) {
              await deleteAttachment(currentCoverId);
            }
          }
        }
      }

      // 2. Handle Brochure
      if (brochureFile) {
        const urls = await uploadAttachment(`Brochure - ${formTitle}`, [
          brochureFile,
        ]);
        if (urls.length > 0) {
          const newId = urls[0];
          if (newId) {
            formData.append("brochure", newId);
            // Clean up old
            if (currentBrochureId) {
              await deleteAttachment(currentBrochureId);
            }
          }
        }
      }

      if (selectedId) {
        const updated = await pb
          .collection("projects")
          .update(selectedId, formData);
        projects = projects.map((it) => (it.id === selectedId ? updated : it));
        selectProject(updated);
      } else {
        const created = await pb.collection("projects").create(formData);
        projects = [created, ...projects];
        selectProject(created);
      }
    } catch (err) {
      toast.error(String(err));
      console.error(err);
    } finally {
      formLoading = false;
    }
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project?")) return;
    try {
      const p = projects.find((it) => it.id === id);

      // Cleanup relations if they exist
      if (p.coverImage) await deleteAttachment(p.coverImage);
      if (p.brochure) await deleteAttachment(p.brochure);

      await pb.collection("projects").delete(id);
      projects = projects.filter((item) => item.id !== id);
      if (selectedId === id) newProject();
    } catch (err) {
      toast.error(String(err));
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
  <!-- Master: list -->
  <div
    class="md:col-span-1 flex flex-col h-full bg-white rounded-3xl border border-aspada-navy/20 shadow-xl overflow-hidden"
  >
    <div
      class="flex items-center justify-between p-6 border-b border-gray-100 shrink-0"
    >
      <h3 class="font-bold text-aspada-navy text-xl">Projects</h3>
      <button
        onclick={newProject}
        class="text-sm text-white bg-aspada-navy px-4 py-2 rounded-lg font-bold hover:bg-aspada-navy/80 transition-colors"
        >+ New Project</button
      >
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      {#if loading}
        <div class="text-center py-10 text-slate-400">Loading projects...</div>
      {:else if projects.length === 0}
        <div class="text-center py-10 text-slate-400">No projects found.</div>
      {:else}
        {#each projects as p}
          <div
            class="group p-4 rounded-2xl cursor-pointer border border-transparent hover:border-[#d4af37]/30 hover:bg-slate-50 transition-all relative"
            class:bg-slate-100={selectedId === p.id}
            class:border-l-4={selectedId === p.id}
            class:border-l-[#d4af37]={selectedId === p.id}
            role="button"
            tabindex="0"
            onclick={() => selectProject(p)}
            onkeydown={(e) => e.key === "Enter" && selectProject(p)}
          >
            <div class="flex justify-between items-start">
              <div>
                <div
                  class="font-bold text-slate-900 group-hover:text-[#d4af37] transition-colors"
                >
                  {p.title}
                </div>
                <div
                  class="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1"
                >
                  {p.category} • {p.status}
                </div>
              </div>
            </div>

            <button
              aria-label="Delete Project"
              onclick={(e) => {
                e.stopPropagation();
                deleteProject(p.id);
              }}
              class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
            >
              <span class="i-lucide-trash-2 text-2xl text-aspada-steel"></span>
            </button>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Pagination Footer -->
    <div
      class="p-4 border-t border-gray-100 bg-slate-50 shrink-0 flex justify-center gap-2"
    >
      <button
        onclick={() => loadData(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        class="px-3 py-1 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Previous
      </button>
      <span class="text-sm flex items-center px-2 text-slate-500"
        >Page {currentPage} of {totalPages}</span
      >
      <button
        onclick={() => loadData(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        class="px-3 py-1 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  </div>

  <!-- Detail: form -->
  <div
    class="md:col-span-2 h-full overflow-y-auto bg-white rounded-3xl border border-[#d4af37]/20 shadow-xl p-8"
  >
    <div class="flex items-center justify-between mb-8">
      <h3 class="font-bold text-slate-900 text-2xl">
        {selectedId ? "Edit Project" : "Create New Project"}
      </h3>
      {#if selectedId}
        <div
          class="bg-slate-100 text-xs px-3 py-1 rounded-full text-slate-500 font-mono"
        >
          ID: {selectedId}
        </div>
      {/if}
    </div>

    <div class="space-y-6 max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block"
            >Project Title</span
          >
          <input
            bind:value={formTitle}
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] focus:bg-white outline-none transition-all"
            placeholder="e.g. The Grand Residence"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block"
            >Slug (Auto-generated)</span
          >
          <input
            readonly
            bind:value={formSlug}
            class="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            placeholder="project-slug"
          />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block"
            >Category</span
          >
          <select
            bind:value={formCategory}
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] outline-none"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="plots">Plots</option>
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700 mb-1 block">Status</span
          >
          <select
            bind:value={formStatus}
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d4af37] outline-none"
          >
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-bold text-slate-700 mb-1 block"
          >Description</span
        >
        <div class="prose max-w-none">
          {#key selectedId}
            <MilkdownEditor
              bind:value={formDescription}
              class="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-[#d4af37] focus-within:bg-white transition-all"
              placeholder="Describe the project..."
            />
          {/key}
        </div>
      </label>

      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
      >
        <Autocomplete
          label="Amenities"
          placeholder="Select amenities..."
          options={allAmenities}
          bind:selected={formAmenities}
          allowCreate={true}
          oncreate={() => openModal("amenity")}
        />

        <Autocomplete
          label="Specifications"
          placeholder="Select specifications..."
          options={allSpecs}
          bind:selected={formSpecs}
          allowCreate={true}
          oncreate={() => openModal("specification")}
        />
      </div>

      <div class="pt-2">
        <Autocomplete
          label="Social Links"
          placeholder="Select social links..."
          options={allSocials}
          bind:selected={formSocials}
          allowCreate={true}
          oncreate={() => openModal("social")}
        />
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
      >
        <div class="block">
          <span class="text-sm font-bold text-slate-700 mb-2 block"
            >Cover Image</span
          >
          <div
            class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative"
          >
            {#if currentCoverId && !coverFile}
              <div class="text-xs text-green-600 font-bold mb-2">
                ✓ Current Image Set
              </div>
            {/if}
            <input
              type="file"
              bind:this={coverFileInput}
              onchange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  coverFile = files[0];
                }
              }}
              accept="image/*"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="pointer-events-none">
              {#if coverFile}
                <span class="text-slate-900 font-bold">{coverFile.name}</span>
              {:else}
                <span class="text-slate-500 text-sm">Click to upload image</span
                >
              {/if}
            </div>
          </div>
          {#if coverFile}
            <button
              type="button"
              onclick={() => {
                coverFile = null;
                if (coverFileInput) coverFileInput.value = "";
              }}
              class="mt-2 text-xs text-red-600 hover:underline"
            >
              Clear selection
            </button>
          {/if}
        </div>

        <div class="block">
          <span class="text-sm font-bold text-slate-700 mb-2 block"
            >Brochure (PDF)</span
          >
          <div
            class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative"
          >
            {#if currentBrochureId && !brochureFile}
              <div class="text-xs text-green-600 font-bold mb-2">
                ✓ Current Brochure Set
              </div>
            {/if}
            <input
              type="file"
              bind:this={brochureFileInput}
              onchange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  brochureFile = files[0];
                }
              }}
              accept=".pdf"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="pointer-events-none">
              {#if brochureFile}
                <span class="text-slate-900 font-bold">{brochureFile.name}</span
                >
              {:else}
                <span class="text-slate-500 text-sm">Click to upload PDF</span>
              {/if}
            </div>
          </div>
          {#if brochureFile}
            <button
              type="button"
              onclick={() => {
                brochureFile = null;
                if (brochureFileInput) brochureFileInput.value = "";
              }}
              class="mt-2 text-xs text-red-600 hover:underline"
            >
              Clear selection
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex gap-4 mt-8 pt-6 border-t border-slate-100">
      <button
        onclick={saveProject}
        disabled={formLoading}
        class="flex-1 bg-aspada-navy/90 text-aspada-silver px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 text-lg cursor-pointer"
      >
        {formLoading
          ? "Saving..."
          : selectedId
            ? "Update Project"
            : "Create Project"}
      </button>

      {#if selectedId}
        <button
          onclick={() => deleteProject(selectedId)}
          class="px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
        >
          Delete
        </button>
      {/if}

      <button
        onclick={newProject}
        class="px-6 py-4 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
      >
        Reset
      </button>
    </div>
  </div>
</div>

<Modal
  show={showModal}
  title={`Add New ${
    modalType === "amenity"
      ? "Amenity"
      : modalType === "specification"
        ? "Specification"
        : "Social"
  }`}
  onClose={() => (showModal = false)}
>
  <div class="space-y-4">
    <label class="block">
      <span class="text-sm font-bold text-slate-700"
        >Title <span class="text-red-500">*</span></span
      >
      <input
        bind:value={newItemTitle}
        class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
        placeholder="Enter title"
        autofocus
      />
    </label>

    {#if modalType === "social"}
      <label class="block">
        <span class="text-sm font-bold text-slate-700">Share URL</span>
        <input
          type="url"
          bind:value={shareUrl}
          class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
          placeholder="Enter share URL"
        />
      </label>
    {/if}

    {#if modalType === "specification"}
      <FileUploadTracker
        bind:this={fileUploadTracker}
        label="Attachments (Optional)"
        bind:attachmentIds={specificationAttachmentIds}
        maxFiles={5}
        accept="image/*,.pdf"
      />
    {/if}

    <div class="flex justify-end gap-2 mt-6">
      <button
        onclick={() => (showModal = false)}
        class="px-4 py-2 rounded-lg hover:bg-slate-100 text-slate-600 font-medium"
      >
        Cancel
      </button>
      <button
        onclick={handleQuickAdd}
        disabled={modalLoading}
        class="px-6 py-2 bg-[#d4af37] text-white rounded-lg font-bold hover:brightness-110 disabled:opacity-50"
      >
        {modalLoading ? "Creating..." : "Create"}
      </button>
    </div>
  </div>
</Modal>
