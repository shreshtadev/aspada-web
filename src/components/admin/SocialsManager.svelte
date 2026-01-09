<script>
    import pb from "../../lib/pb";
    import toast from "svelte-french-toast";
    // Master-detail state
    let socials = $state([]);
    let selectedId = $state(null);
    let formTitle = $state("");
    let loading = $state(false);

    async function loadData() {
        try {
            const [socialsList] = await Promise.all([
                pb.collection("socials").getFullList(),
            ]);
            socials = socialsList;
        } catch (err) {
            console.error("Failed to load data:", err);
            toast.error("Failed to load data");
        }
    }

    $effect(() => {
        loadData();
    });

    function selectSocial(s) {
        selectedId = s?.id ?? null;
        formTitle = s?.title ?? "";
    }

    function newSocial() {
        selectedId = null;
        formTitle = "";
    }

    async function saveSocial() {
        if (!formTitle) {
            toast.error("Title is required");
            return;
        }

        loading = true;
        const data = { title: formTitle };

        try {
            if (selectedId) {
                const updated = await pb
                    .collection("socials")
                    .update(selectedId, data);
                socials = socials.map((it) =>
                    it.id === selectedId ? updated : it,
                );
            } else {
                const created = await pb.collection("socials").create(data);
                socials = [created, ...socials];
                selectSocial(created);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            loading = false;
        }
    }

    async function deleteSocial(id) {
        if (!confirm("Delete this social?")) return;
        try {
            await pb.collection("socials").delete(id);
            socials = socials.filter((s) => s.id !== id);
            if (selectedId === id) newSocial();
        } catch (err) {
            toast.error(err.message);
        }
    }
</script>

<div
    class="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6"
>
    <!-- Master: list -->
    <div class="md:col-span-1">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold">Socials</h3>
            <button
                onclick={newSocial}
                class="text-sm text-[#0f172a] bg-[#f8f6f2] px-3 py-1 rounded"
                >+ New</button
            >
        </div>

        <div class="space-y-2 max-h-[60vh] overflow-auto">
            {#each socials as s}
                <div
                    class="p-3 rounded-lg cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-all"
                    class:bg-slate-100={selectedId === s.id}
                    role="button"
                    tabindex="0"
                    onclick={() => selectSocial(s)}
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectSocial(s);
                        }
                    }}
                >
                    <div>
                        <div class="font-medium">{s.title}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                deleteSocial(s.id);
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
                {selectedId ? "Edit Social" : "Create Social"}
            </h3>

            <label class="block mb-3">
                <span class="text-sm font-medium text-slate-600">Title</span>
                <input
                    bind:value={formTitle}
                    class="w-full mt-1 p-3 border rounded"
                    placeholder="Title"
                />
            </label>

            <div class="flex gap-3 mt-4">
                <button
                    onclick={saveSocial}
                    disabled={loading}
                    class="bg-[#d4af37] text-white px-6 py-2 rounded font-bold"
                    >{loading
                        ? "Saving..."
                        : selectedId
                          ? "Update"
                          : "Create"}</button
                >
                {#if selectedId}
                    <button
                        onclick={() => deleteSocial(selectedId)}
                        class="bg-red-600 text-white px-6 py-2 rounded font-bold"
                        >Delete</button
                    >
                {/if}
                <button
                    onclick={newSocial}
                    class="bg-slate-100 px-4 py-2 rounded">Clear</button
                >
            </div>
        </div>
    </div>
</div>
