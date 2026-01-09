<script>
    import pb from "../../lib/pb";
    import { uploadAttachment, deleteAttachment } from "../../lib/utils";
    import Modal from "./Modal.svelte";
    import MilkdownEditor from "../MilkdownEditor.svelte";
    import Autocomplete from "./Autocomplete.svelte";
    import toast from "svelte-french-toast";
    // Master list state
    let posts = $state([]);
    let currentPage = $state(1);
    let totalPages = $state(0);
    let totalItems = $state(0);
    let perPage = $state(10);
    let loading = $state(true);

    // Options state
    let allCategories = $state([]);
    let allTags = $state([]);

    // Detail form state
    let selectedId = $state(null);
    let formTitle = $state("");
    let formContent = $state("");
    let formIsPublished = $state("draft");
    let formCategories = $state([]); // IDs
    let currentFeaturedImageId = $state(""); // ID of current featured image attachment record

    let featuredImageFile = $state(null);
    let featuredImageInput = $state(null);

    let formLoading = $state(false);

    // Modal state
    let showModal = $state(false);
    let modalType = $state(""); // 'category', 'tag'
    let newItemTitle = $state("");
    let modalLoading = $state(false);

    // Fetch function
    async function loadData(page) {
        loading = true;
        try {
            const [postsRes, metadataRes] = await Promise.all([
                pb.collection("posts").getList(page, perPage, {
                    sort: "-created",
                    expand: "category,featuredImage",
                }),
                pb.collection("metadata").getFullList({ sort: "title" }),
            ]);

            posts = postsRes.items;
            currentPage = postsRes.page;
            totalPages = postsRes.totalPages;
            totalItems = postsRes.totalItems;

            allCategories = metadataRes.filter(
                (m) => m.categoryType === "postCategory",
            );
            allTags = metadataRes.filter((m) => m.categoryType === "tag");
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

    function selectPost(p) {
        selectedId = p?.id ?? null;
        formTitle = p?.title ?? "";
        formContent = p?.content ?? "";
        formIsPublished = p?.isPublished ?? "draft";
        formCategories = p?.category ?? [];
        // Relation IDs are strings in the 'posts' record (if not expanded)
        currentFeaturedImageId = p?.featuredImage ?? "";

        featuredImageFile = null;
    }

    function newPost() {
        selectedId = null;
        formTitle = "";
        formContent = "";
        formIsPublished = "draft";
        formCategories = [];
        currentFeaturedImageId = "";
        featuredImageFile = null;
    }

    // Quick Add Logic
    function openModal(type) {
        modalType = type;
        newItemTitle = "";
        showModal = true;
    }

    async function handleQuickAdd() {
        if (!newItemTitle) {
            toast.error("Title is required");
            return;
        }
        modalLoading = true;
        try {
            const payload = {
                title: newItemTitle,
                categoryType: modalType === "category" ? "postCategory" : "tag",
            };

            const record = await pb.collection("metadata").create(payload);

            // Refresh list and select
            if (modalType === "category") {
                allCategories = [...allCategories, record].sort((a, b) =>
                    a.title.localeCompare(b.title),
                );
                formCategories = [...formCategories, record.id];
            } else if (modalType === "tag") {
                allTags = [...allTags, record].sort((a, b) =>
                    a.title.localeCompare(b.title),
                );
                formCategories = [...formCategories, record.id];
            }

            showModal = false;
        } catch (err) {
            console.error("Error creating metadata:", err);
            toast.error(err.message);
        } finally {
            modalLoading = false;
        }
    }

    async function savePost() {
        if (!formTitle) {
            toast.error("Title is required");
            return;
        }

        formLoading = true;
        const formData = new FormData();
        formData.append("title", formTitle);
        formData.append("content", formContent);
        formData.append("isPublished", formIsPublished);

        // Append relations
        for (let id of formCategories) formData.append("category", id);

        try {
            // Handle Featured Image
            if (featuredImageFile) {
                const urls = await uploadAttachment(`Featured - ${formTitle}`, [
                    featuredImageFile,
                ]);
                if (urls.length > 0) {
                    const newId = urls[0];
                    if (newId) {
                        formData.append("featuredImage", newId);
                        // Clean up old
                        if (currentFeaturedImageId) {
                            await deleteAttachment(currentFeaturedImageId);
                        }
                    }
                }
            }

            if (selectedId) {
                const updated = await pb
                    .collection("posts")
                    .update(selectedId, formData);
                posts = posts.map((it) =>
                    it.id === selectedId ? updated : it,
                );
                selectPost(updated);
            } else {
                const created = await pb.collection("posts").create(formData);
                posts = [created, ...posts];
                selectPost(created);
            }
        } catch (err) {
            toast.error(String(err));
            console.error(err);
        } finally {
            formLoading = false;
        }
    }

    async function deletePost(id) {
        if (!confirm("Delete this post?")) return;
        try {
            const p = posts.find((it) => it.id === id);

            // Cleanup relations if they exist
            if (p.featuredImage) await deleteAttachment(p.featuredImage);

            await pb.collection("posts").delete(id);
            posts = posts.filter((item) => item.id !== id);
            if (selectedId === id) newPost();
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
            <h3 class="font-bold text-aspada-navy text-xl">Blog Posts</h3>
            <button
                onclick={newPost}
                class="text-sm text-white bg-aspada-navy px-4 py-2 rounded-lg font-bold hover:bg-aspada-navy/80 transition-colors"
                >+ New Post</button
            >
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            {#if loading}
                <div class="text-center py-10 text-slate-400">
                    Loading posts...
                </div>
            {:else if posts.length === 0}
                <div class="text-center py-10 text-slate-400">
                    No posts found.
                </div>
            {:else}
                {#each posts as p}
                    <div
                        class="group p-4 rounded-2xl cursor-pointer border border-transparent hover:border-aspada-gold/30 hover:bg-slate-50 transition-all relative"
                        class:bg-slate-100={selectedId === p.id}
                        class:border-l-4={selectedId === p.id}
                        class:border-l-aspada-gold={selectedId === p.id}
                        role="button"
                        tabindex="0"
                        onclick={() => selectPost(p)}
                        onkeydown={(e) => e.key === "Enter" && selectPost(p)}
                    >
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div
                                    class="font-bold text-slate-900 group-hover:text-aspada-gold transition-colors"
                                >
                                    {p.title}
                                </div>
                                <div
                                    class="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1"
                                >
                                    {p.isPublished === "published"
                                        ? "Published"
                                        : "Draft"}
                                </div>
                                {#if p.expand?.category && p.expand.category.length > 0}
                                    <div class="flex flex-wrap gap-1 mt-2">
                                        {#each p.expand.category.slice(0, 2) as cat}
                                            <span
                                                class="text-xs bg-aspada-gold/10 text-aspada-gold px-2 py-0.5 rounded-full"
                                                >{cat.title}</span
                                            >
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <button
                            aria-label="Delete Post"
                            onclick={(e) => {
                                e.stopPropagation();
                                deletePost(p.id);
                            }}
                            class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        >
                            <span
                                class="i-lucide-trash-2 text-2xl text-aspada-steel"
                            ></span>
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
        class="md:col-span-2 h-full overflow-y-auto bg-white rounded-3xl border border-aspada-navy/20 shadow-xl p-8"
    >
        <div class="flex items-center justify-between mb-8">
            <h3 class="font-bold text-slate-900 text-2xl">
                {selectedId ? "Edit Post" : "Create New Post"}
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
                <label class="block md:col-span-2">
                    <span class="text-sm font-bold text-slate-700 mb-1 block"
                        >Post Title</span
                    >
                    <input
                        bind:value={formTitle}
                        class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold focus:bg-white outline-none transition-all"
                        placeholder="e.g. Amazing New Development"
                    />
                </label>

                <label class="block">
                    <span class="text-sm font-bold text-slate-700 mb-1 block"
                        >Status</span
                    >
                    <select
                        bind:value={formIsPublished}
                        class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-aspada-gold outline-none"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </label>
            </div>

            <label class="block">
                <span class="text-sm font-bold text-slate-700 mb-1 block"
                    >Content</span
                >
                <div class="prose max-w-none">
                    {#key selectedId}
                        <MilkdownEditor
                            bind:value={formContent}
                            class="w-full min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-aspada-gold focus-within:bg-white transition-all"
                            placeholder="Write your post content..."
                        />
                    {/key}
                </div>
            </label>

            <div
                class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
            >
                <Autocomplete
                    label="Categories"
                    placeholder="Select categories..."
                    options={allCategories}
                    bind:selected={formCategories}
                    allowCreate={true}
                    oncreate={() => openModal("category")}
                />

                <Autocomplete
                    label="Tags"
                    placeholder="Select tags..."
                    options={allTags}
                    bind:selected={formCategories}
                    allowCreate={true}
                    oncreate={() => openModal("tag")}
                />
            </div>

            <div class="pt-4 border-t border-slate-100">
                <div class="block">
                    <span class="text-sm font-bold text-slate-700 mb-2 block"
                        >Featured Image</span
                    >
                    <div
                        class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative"
                    >
                        {#if currentFeaturedImageId && !featuredImageFile}
                            <div class="text-xs text-green-600 font-bold mb-2">
                                ✓ Current Image Set
                            </div>
                        {/if}
                        <input
                            type="file"
                            bind:this={featuredImageInput}
                            onchange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    featuredImageFile = files[0];
                                }
                            }}
                            accept="image/*"
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div class="pointer-events-none">
                            {#if featuredImageFile}
                                <span class="text-slate-900 font-bold"
                                    >{featuredImageFile.name}</span
                                >
                            {:else}
                                <span class="text-slate-500 text-sm"
                                    >Click to upload image</span
                                >
                            {/if}
                        </div>
                    </div>
                    {#if featuredImageFile}
                        <button
                            type="button"
                            onclick={() => {
                                featuredImageFile = null;
                                if (featuredImageInput)
                                    featuredImageInput.value = "";
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
                onclick={savePost}
                disabled={formLoading}
                class="flex-1 bg-aspada-navy/90 text-aspada-silver px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 text-lg cursor-pointer"
            >
                {formLoading
                    ? "Saving..."
                    : selectedId
                      ? "Update Post"
                      : "Create Post"}
            </button>

            {#if selectedId}
                <button
                    onclick={() => deletePost(selectedId)}
                    class="px-6 py-4 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors cursor-pointer"
                >
                    Delete
                </button>
            {/if}

            <button
                onclick={newPost}
                class="px-6 py-4 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
            >
                Reset
            </button>
        </div>
    </div>
</div>

<Modal
    show={showModal}
    title={`Add New ${modalType === "category" ? "Category" : "Tag"}`}
    onClose={() => (showModal = false)}
>
    <div class="space-y-4">
        <label class="block">
            <span class="text-sm font-bold text-slate-700"
                >Title <span class="text-red-500">*</span></span
            >
            <input
                bind:value={newItemTitle}
                class="w-full mt-1 p-3 border rounded-xl focus:ring-2 focus:ring-aspada-gold/50 outline-none"
                placeholder="Enter title"
            />
        </label>

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
                class="px-6 py-2 bg-aspada-gold text-white rounded-lg font-bold hover:brightness-110 disabled:opacity-50"
            >
                {modalLoading ? "Creating..." : "Create"}
            </button>
        </div>
    </div>
</Modal>
