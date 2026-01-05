<script>
  import pb from "../../lib/pb";
  import Modal from "./Modal.svelte";
  import MilkdownEditor from "../MilkdownEditor.svelte";

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
  let formStatus = $state("ongoing");
  let formDescription = $state("");
  let formSocials = $state([]);
  let formAmenities = $state([]);
  let formSpecs = $state([]);
  let coverFile = $state();
  let brochureFile = $state();
  let formLoading = $state(false);

  // Modal state
  let showModal = $state(false);
  let modalType = $state(""); // 'amenity', 'specification', 'social'
  let newItemTitle = $state("");
  let newItemExtra = $state(""); // description for spec
  let shareUrl = $state("");
  let shareUrlType = $state("instagram");
  let modalLoading = $state(false);

  // Fetch function
  async function loadData(page) {
    loading = true;

    try {
      const [projectsRes, socialsRes, amenitiesRes, specsRes] =
        await Promise.all([
          pb.collection("projects").getList(page, perPage),
          pb.collection("socials").getFullList(),
          pb.collection("amenities").getFullList(),
          pb.collection("specifications").getFullList(),
        ]);

      projects = projectsRes.items;
      currentPage = projectsRes.page;
      totalPages = projectsRes.totalPages;
      totalItems = projectsRes.totalItems;

      allSocials = socialsRes;
      allAmenities = amenitiesRes;
      allSpecs = specsRes;
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      loading = false;
    }
  }

  function selectProject(p) {
    selectedId = p?.id ?? null;
    formTitle = p?.title ?? "";
    formSlug = p?.slug ?? "";
    formCategory = p?.category ?? "residential";
    formStatus = p?.status ?? "ongoing";
    formDescription = p?.description ?? "";
    formSocials = p?.socials ?? [];
    formAmenities = p?.amenities ?? [];
    formSpecs = p?.specifications ?? [];
    coverFile = undefined;
    brochureFile = undefined;
  }

  function newProject() {
    selectedId = null;
    formTitle = "";
    formSlug = "";
    formCategory = "residential";
    formStatus = "ongoing";
    formDescription = "";
    formSocials = [];
    formAmenities = [];
    formSpecs = [];
    coverFile = undefined;
    brochureFile = undefined;
  }

  function toggleSelection(list, id) {
    if (list.includes(id)) {
      return list.filter((i) => i !== id);
    } else {
      return [...list, id];
    }
  }

  // Quick Add Logic
  function openModal(type) {
    modalType = type;
    newItemTitle = "";
    newItemExtra = "";
    showModal = true;
  }

  async function handleQuickAdd() {
    if (!newItemTitle) {
      alert("Title is required");
      return;
    }
    modalLoading = true;
    try {
      let collection = "";
      let payload = { title: newItemTitle };

      if (modalType === "amenity") collection = "amenities";
      if (modalType === "social") {
        collection = "socials";
        payload.shareUrl = shareUrl;
        payload.shareUrlType = shareUrlType;
      }
      if (modalType === "specification") {
        collection = "specifications";
        payload.description = newItemExtra;
      }

      const record = await pb.collection(collection).create(payload);

      // Refresh just the relevant list and auto-select
      if (modalType === "amenity") {
        allAmenities = await pb
          .collection("amenities")
          .getFullList({ sort: "title" });
        formAmenities = [...formAmenities, record.id];
      } else if (modalType === "social") {
        allSocials = await pb
          .collection("socials")
          .getFullList({ sort: "title" });
        formSocials = [...formSocials, record.id];
      } else if (modalType === "specification") {
        allSpecs = await pb
          .collection("specifications")
          .getFullList({ sort: "title" });
        formSpecs = [...formSpecs, record.id];
      }

      showModal = false;
    } catch (err) {
      alert(err.message);
    } finally {
      modalLoading = false;
    }
  }

  async function saveProject() {
    if (!formTitle) {
      alert("Title is required");
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

    if (coverFile) {
      formData.append("coverImage", coverFile[0]);
    }
    if (brochureFile) {
      formData.append("brochure", brochureFile[0]);
    }

    try {
      if (selectedId) {
        const updated = await pb
          .collection("projects")
          .update(selectedId, formData);
        projects = projects.map((it) => (it.id === selectedId ? updated : it));
      } else {
        const created = await pb.collection("projects").create(formData);
        projects = [created, ...projects];
        selectProject(created);
      }
    } catch (err) {
      alert(String(err));
    } finally {
      formLoading = false;
    }
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project?")) return;
    try {
      await pb.collection("projects").delete(id);
      projects = projects.filter((p) => p.id !== id);
      if (selectedId === id) newProject();
    } catch (err) {
      alert(String(err));
    }
  }

  // Runs once on mount and whenever dependencies change
  $effect(() => {
    loadData(currentPage);
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Projects</h3>
        <button
          onclick={newProject}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold"
          >+ New</button
        >
      </div>

      {#if loading}
        <div class="p-10 text-center text-slate-400 text-sm">Loading...</div>
      {:else}
        <div class="space-y-2 max-h-[60vh] overflow-auto">
          {#each projects as p}
            <div
              class="p-3 rounded-lg cursor-pointer flex flex-col hover:bg-slate-50 transition-all"
              class:bg-slate-100={selectedId === p.id}
              role="button"
              tabindex="0"
              onclick={() => selectProject(p)}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectProject(p);
                }
              }}
            >
              <div class="font-medium text-slate-900">{p.title}</div>
              <div class="text-xs text-slate-500 capitalize">{p.category}</div>
              <div class="text-xs mt-1">
                <span
                  class="px-2 py-0.5 rounded text-white text-[10px] font-bold
                  {p.status === 'ongoing' ? 'bg-yellow-600' : 'bg-green-600'}"
                >
                  {p.status}
                </span>
              </div>
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  deleteProject(p.id);
                }}
                class="text-red-500 text-xs mt-2 hover:underline">Delete</button
              >
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        <div class="mt-4 flex gap-2 flex-wrap">
          <button
            onclick={() => loadData(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            class="px-2 py-1 text-xs border rounded disabled:opacity-30"
          >
            Prev
          </button>

          {#each Array(totalPages) as _, i}
            <button
              onclick={() => loadData(i + 1)}
              class="w-6 h-6 text-xs rounded font-bold transition-all
              {currentPage === i + 1
                ? 'bg-slate-900 text-[#d4af37]'
                : 'border hover:bg-slate-50'}"
            >
              {i + 1}
            </button>
          {/each}

          <button
            onclick={() => loadData(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            class="px-2 py-1 text-xs border rounded disabled:opacity-30"
          >
            Next
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <h3 class="font-bold text-slate-900 text-lg mb-6">
        {selectedId ? "Edit Project" : "Create Project"}
      </h3>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-bold text-slate-700">Project Title</span>
          <input
            bind:value={formTitle}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Enter title"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Slug</span>
          <input
            readonly
            bind:value={formSlug}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Project Slug"
          />
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-bold text-slate-700">Category</span>
            <select
              bind:value={formCategory}
              class="w-full mt-1 p-3 border rounded-xl"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plots">Plots</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-bold text-slate-700">Status</span>
            <select
              bind:value={formStatus}
              class="w-full mt-1 p-3 border rounded-xl"
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Description</span>
          <MilkdownEditor
            bind:value={formDescription}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Project description..."
          />
        </label>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Amenities -->
          <div class="block">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-bold text-slate-700">Amenities</span>
              <button
                onclick={() => openModal("amenity")}
                class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
                >+ Add</button
              >
            </div>
            <div
              class="h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50 space-y-1"
            >
              {#each allAmenities as item}
                <label
                  class="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formAmenities.includes(item.id)}
                    onchange={() =>
                      (formAmenities = toggleSelection(formAmenities, item.id))}
                    class="rounded text-[#d4af37] focus:ring-[#d4af37]"
                  />
                  <span class="text-xs font-medium text-slate-700"
                    >{item.title}</span
                  >
                </label>
              {/each}
            </div>
          </div>

          <!-- Specifications -->
          <div class="block">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-bold text-slate-700"
                >Specifications</span
              >
              <button
                onclick={() => openModal("specification")}
                class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
                >+ Add</button
              >
            </div>
            <div
              class="h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50 space-y-1"
            >
              {#each allSpecs as item}
                <label
                  class="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formSpecs.includes(item.id)}
                    onchange={() =>
                      (formSpecs = toggleSelection(formSpecs, item.id))}
                    class="rounded text-[#d4af37] focus:ring-[#d4af37]"
                  />
                  <span class="text-xs font-medium text-slate-700"
                    >{item.title}</span
                  >
                </label>
              {/each}
            </div>
          </div>

          <!-- Socials -->
          <div class="block">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-bold text-slate-700">Socials</span>
              <button
                onclick={() => openModal("social")}
                class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors"
                >+ Add</button
              >
            </div>
            <div
              class="h-40 overflow-y-auto border rounded-xl p-2 bg-slate-50 space-y-1"
            >
              {#each allSocials as item}
                <label
                  class="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formSocials.includes(item.id)}
                    onchange={() =>
                      (formSocials = toggleSelection(formSocials, item.id))}
                    class="rounded text-aspada-silver focus:ring-aspada-steel"
                  />
                  <span class="text-xs font-medium text-slate-700"
                    >{item.title}</span
                  >
                </label>
              {/each}
            </div>
          </div>
        </div>

        <label class="block">
          <span class="text-sm font-bold text-slate-700"
            >Cover Image (JPEG/PNG/WebP)</span
          >
          <input
            type="file"
            bind:files={coverFile}
            accept="image/*"
            class="w-full mt-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#d4af37]/10 file:text-[#d4af37] file:font-bold"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Brochure (PDF)</span>
          <input
            type="file"
            bind:files={brochureFile}
            accept=".pdf"
            class="w-full mt-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-100 file:text-slate-700 file:font-bold"
          />
        </label>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={saveProject}
          disabled={formLoading}
          class="bg-slate-900 text-[#d4af37] px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
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
            class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90"
          >
            Delete
          </button>
        {/if}

        <button
          onclick={newProject}
          class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-slate-700"
        >
          Clear
        </button>
      </div>
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
          required
        />
      </label>
      <label class="block">
        <span class="text-sm font-bold text-slate-700">Share URL Type</span>
        <select
          bind:value={shareUrlType}
          class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">Youtube</option>
        </select>
      </label>
    {/if}

    {#if modalType === "specification"}
      <label class="block">
        <span class="text-sm font-bold text-slate-700">Description</span>
        <MilkdownEditor
          bind:value={newItemExtra}
          class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
          placeholder="Details..."
        />
      </label>
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
