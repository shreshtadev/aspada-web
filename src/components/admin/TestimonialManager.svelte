<script>
  import pb from "../../lib/pb";

  // Master list state
  let testimonials = $state([]);
  let projects = $state([]);

  // Detail form state
  let selectedId = $state(null);
  let formName = $state("");
  let formContent = $state("");
  let formRating = $state(5);
  let formProject = $state("");
  let avatarFile = $state(null);
  let formLoading = $state(false);
  let deleteAvatar = $state(false);
  let fileInputEl = $state(null);

  async function loadData() {
    try {
      const [projectsList, testimonialsList] = await Promise.all([
        pb.collection("projects").getFullList({ sort: "title" }),
        pb.collection("testimonials").getList(1, 50, {
          sort: "-created",
          expand: "project",
        }),
      ]);
      projects = projectsList;
      testimonials = testimonialsList.items;
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }

  $effect(() => {
    loadData();
  });

  function selectTestimonial(t) {
    selectedId = t?.id ?? null;
    formName = t?.name ?? t?.authorName ?? "";
    formContent = t?.content ?? "";
    formRating = t?.rating ?? 5;
    formProject =
      t?.project && typeof t.project === "object"
        ? t.project.id
        : t?.project || "";
    avatarFile = undefined;
  }

  function clearAvatarSelection() {
    avatarFile = null;
    deleteAvatar = true; // mark for backend delete

    if (fileInputEl) {
      fileInputEl.value = ""; // required
    }
  }

  function newTestimonial() {
    selectedId = null;
    formName = "";
    formContent = "";
    formRating = 5;
    formProject = "";
    avatarFile = null;
  }

  async function saveTestimonial() {
    if (!formName || !formContent) {
      alert("Name and testimonial text are required");
      return;
    }

    formLoading = true;

    const formData = new FormData();
    formData.append("authorName", formName);
    formData.append("content", formContent);
    formData.append("rating", String(formRating));
    formData.append("source", "web");

    if (formProject) {
      formData.append("project", formProject);
    }

    // IMPORTANT: append only if a real file exists
    if (avatarFile instanceof FileList && avatarFile.length === 1) {
      formData.append("authorAvatar", avatarFile[0], avatarFile[0].name);
    }

    if (deleteAvatar) {
      formData.append("authorAvatar", ""); // 🔥 deletes stored file
    }

    try {
      let record;
      if (selectedId) {
        record = await pb
          .collection("testimonials")
          .update(selectedId, formData);
        testimonials = testimonials.map((t) =>
          t.id === record.id ? record : t,
        );
      } else {
        record = await pb.collection("testimonials").create(formData);
        testimonials = [record, ...testimonials];
      }
      selectTestimonial(record);
    } catch (err) {
      console.error("PocketBase error:", err?.response?.data || err);
      alert(err?.response?.data?.message ?? "Upload failed");
    } finally {
      formLoading = false;
      deleteAvatar = false;
    }
  }

  async function deleteTestimonial(id) {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await pb.collection("testimonials").delete(id);
      testimonials = testimonials.filter((t) => t.id !== id);
      if (selectedId === id) newTestimonial();
    } catch (err) {
      alert(String(err));
    }
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="bg-white p-6 rounded-3xl border border-[#d4af37]/20 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-900">Testimonials</h3>
        <button
          onclick={newTestimonial}
          class="text-sm text-white bg-[#d4af37] px-3 py-1 rounded font-bold"
          >+ New</button
        >
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-auto">
        {#each testimonials as t}
          <div
            class="p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
            class:bg-slate-100={selectedId === t.id}
            role="button"
            tabindex="0"
            onclick={() => selectTestimonial(t)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTestimonial(t);
              }
            }}
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0"
              >
                {#if t.authorAvatar}
                  <img
                    src={pb.files.getURL(t, t.authorAvatar)}
                    alt={t.authorName}
                    class="w-full h-full object-cover"
                  />
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-900 truncate">
                  {t.authorName}
                </div>
                <div class="text-xs text-[#d4af37]">
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
              </div>
            </div>
            <button
              onclick={(e) => {
                e.stopPropagation();
                deleteTestimonial(t.id);
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
        {selectedId ? "Edit Testimonial" : "Create Testimonial"}
      </h3>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-bold text-slate-700">Client Name</span>
          <input
            bind:value={formName}
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Enter client name"
          />
        </label>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Testimonial Text</span>
          <textarea
            bind:value={formContent}
            rows="5"
            class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-[#d4af37]/50 outline-none"
            placeholder="Enter testimonial text..."
          ></textarea>
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-bold text-slate-700">Rating</span>
            <select
              bind:value={formRating}
              class="w-full mt-1 p-3 border rounded-xl"
            >
              <option value={1}>1 Star</option>
              <option value={2}>2 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </label>

          <label class="block">
            <span class="text-sm font-bold text-slate-700"
              >Assign to Project</span
            >
            <select
              bind:value={formProject}
              class="w-full mt-1 p-3 border rounded-xl"
            >
              <option value="">General</option>
              {#each projects as p}
                <option value={p.id}>{p.title}</option>
              {/each}
            </select>
          </label>
        </div>

        <label class="block">
          <span class="text-sm font-bold text-slate-700">Avatar Image</span>
          <input
            type="file"
            bind:this={fileInputEl}
            bind:files={avatarFile}
            accept="image/*"
            class="w-full mt-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#d4af37]/10 file:text-[#d4af37] file:font-bold"
          />
        </label>
        {#if avatarFile && avatarFile.length > 0}
          <button
            type="button"
            onclick={clearAvatarSelection}
            class="mt-1 text-xs hover:text-lg text-red-600 hover:underline cursor-pointer"
          >
            X
          </button>
        {/if}
      </div>

      <div class="flex gap-3 mt-6">
        <button
          onclick={saveTestimonial}
          disabled={formLoading}
          class="bg-slate-900 text-aspada-cream px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
        >
          {formLoading
            ? "Saving..."
            : selectedId
              ? "Update Testimonial"
              : "Create Testimonial"}
        </button>

        {#if selectedId}
          <button
            onclick={() => deleteTestimonial(selectedId)}
            class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 cursor-pointer"
          >
            Delete
          </button>
        {/if}

        <button
          onclick={newTestimonial}
          class="bg-slate-100 px-6 py-3 rounded-xl font-bold text-aspada-steel cursor-pointer hover:scale-105 transition-transform"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</div>
