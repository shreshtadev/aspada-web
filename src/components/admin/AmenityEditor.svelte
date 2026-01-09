<script>
  import pb from "../../lib/pb";
  import toast from "svelte-french-toast";

  // Master-detail state
  let amenities = $state([]);
  let selectedId = $state(null);
  let formTitle = $state("");
  let loading = $state(false);

  async function loadData() {
    try {
      const amenitiesList = await pb.collection("metadata").getFullList({
        filter: "categoryType = 'amenity'",
      });
      amenities = amenitiesList;
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load data:");
    }
  }

  $effect(() => {
    loadData();
  });

  function selectAmenity(a) {
    selectedId = a?.id ?? null;
    formTitle = a?.title ?? "";
  }

  function newAmenity() {
    selectedId = null;
    formTitle = "";
  }

  async function saveAmenity() {
    if (!formTitle) {
      toast.error("Title is required");
      return;
    }

    loading = true;
    const data = { title: formTitle, categoryType: "amenity" };

    try {
      if (selectedId) {
        const updated = await pb
          .collection("metadata")
          .update(selectedId, data);
        amenities = amenities.map((it) =>
          it.id === selectedId ? updated : it,
        );
      } else {
        const created = await pb.collection("metadata").create(data);
        amenities = [created, ...amenities];
        selectAmenity(created);
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      loading = false;
    }
  }

  async function deleteAmenity(id) {
    if (!confirm("Delete this amenity?")) return;
    try {
      await pb.collection("metadata").delete(id);
      amenities = amenities.filter((a) => a.id !== id);
      if (selectedId === id) newAmenity();
    } catch (err) {
      toast.error(String(err));
    }
  }
</script>

<div
  class="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6"
>
  <!-- Master: list -->
  <div class="md:col-span-1">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold">Amenities</h3>
      <button
        onclick={newAmenity}
        class="text-sm text-aspada-navy bg-aspada-navy/10 px-3 py-1 rounded"
        >+ New</button
      >
    </div>

    <div class="space-y-2 max-h-[60vh] overflow-auto">
      {#each amenities as a}
        <div
          class="p-3 rounded-lg cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-all"
          class:bg-slate-100={selectedId === a.id}
          role="button"
          tabindex="0"
          onclick={() => selectAmenity(a)}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectAmenity(a);
            }
          }}
        >
          <div>
            <div class="font-medium">{a.title}</div>
            <div class="text-xs uppercase text-slate-500">
              {a.categoryType}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick={(e) => {
                e.stopPropagation();
                deleteAmenity(a.id);
              }}
              class="text-red-500 text-sm">Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Detail: form -->
  <div class="md:col-span-2">
    <div class="bg-white p-4 rounded-lg border">
      <h3 class="font-bold mb-4">
        {selectedId ? "Edit Amenity" : "Create Amenity"}
      </h3>

      <label class="block mb-3">
        <span class="text-sm font-medium text-slate-600">Title</span>
        <input
          bind:value={formTitle}
          class="w-full mt-1 p-3 border rounded"
          placeholder="Amenity name"
        />
      </label>

      <div class="flex gap-3 mt-4">
        <button
          onclick={saveAmenity}
          disabled={loading}
          class="bg-aspada-gold text-white px-6 py-2 rounded font-bold"
          >{loading ? "Saving..." : selectedId ? "Update" : "Create"}</button
        >
        {#if selectedId}
          <button
            onclick={() => deleteAmenity(selectedId)}
            class="bg-red-600 text-white px-6 py-2 rounded font-bold"
            >Delete</button
          >
        {/if}
        <button onclick={newAmenity} class="bg-slate-100 px-4 py-2 rounded"
          >Clear</button
        >
      </div>
    </div>
  </div>
</div>
