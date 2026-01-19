# Aspada Web - AI Coding Agent Instructions

## Project Overview

This is an **Astro + Svelte + PocketBase** real estate development website with an admin dashboard. The site showcases projects, testimonials, and blog content, backed by a headless CMS (PocketBase).

**Tech Stack:**

- **Framework:** Astro 5.16 (server-side rendering with Netlify adapter)
- **UI Components:** Svelte 5 (interactive components)
- **Styling:** UnoCSS utility-first CSS
- **Backend:** PocketBase 0.26 (self-hosted CMS)
- **Deployment:** Netlify

## Critical Architecture Patterns

### 1. PocketBase Integration

- **Singleton pattern:** `src/lib/pb.ts` exports a single typed PocketBase instance used across the app
- **Type generation:** Types are auto-generated via `pnpm run typegen` from the PocketBase database schema
- **Environment:** Uses `PUBLIC_PB_URL` from `.env` (check `astro.config.mjs` for loading pattern)
- **Auth workflow:** Middleware in `src/middleware.ts` validates tokens via cookie and calls `authRefresh()` on admin routes
- **Key collections:** `projects`, `metadata` (amenities/specs), `socials`, `attachments`, `users`, `blog_posts`, `testimonials`

### 2. Data Models & Expand Relations

Every data fetch uses **expand relations** for nested data. Common patterns from `src/types/index.ts`:

```typescript
// Projects include: coverImage, projectDetails (metadata), socials, brochure, etc.
type ProjectInfoExpand = {
  coverImage: AttachmentsResponse
  socials: SocialsResponse[]
  projectDetails: MetadataResponse[]
}
```

When querying PocketBase: `pb.collection('projects').getOne(id, { expand: 'coverImage,projectDetails,socials' })`

### 3. File Attachment Handling

- **Attachment workflow:** Upload → create attachment record → link to parent (project/blog/testimonial)
- **Utilities in `src/lib/utils.ts`:**
  - `uploadAttachment()` - handles file upload + record creation
  - `deleteAttachment()` - removes record + local file
- **Used in:** `src/components/admin/ProjectManager.svelte`, ContentManager, etc.

### 4. Admin Manager Components Pattern

All CRUD managers follow this structure (see ProjectManager.svelte):

1. **State:** `$state()` runes for reactive form, list data, pagination
2. **Data loading:** `Promise.all()` to fetch related collections in parallel
3. **Modal for creation:** Dedicated modal component (Modal.svelte) for adding items
4. **Modal for editing relations:** Inline metadata editor modal for editing amenities/specs without leaving the parent form
5. **Error handling:** `svelte-french-toast` for user feedback
6. **Pagination:** Manual implementation with `getList(page, perPage)`
7. **Autocomplete component:** Custom multi-select with create + edit handlers for managing relations (see Autocomplete.svelte)

### 5. Inline Metadata Editing in Relations

ProjectManager demonstrates a pattern for editing related metadata (amenities, specs) without navigating away:

- **Autocomplete component:** Displays selected metadata with an edit pencil icon (hover to reveal)
- **Click edit icon:** Opens modal with `openMetadataEditor(id, type)` passing metadata ID and category type
- **Modal state:** Separate editor state (`editorFormTitle`, `editorCurrentAttachments`, etc.) prevents form conflicts
- **Save flow:** Updates metadata in PocketBase, syncs `allAmenities`/`allSpecs` arrays to reflect changes
- **Attachment handling:** Reuses `uploadAttachment()` and `deleteAttachment()` utilities

Example in Autocomplete:

```svelte
<Autocomplete onedit={(id) => openMetadataEditor(id, 'amenity')} />
```

### 6. Admin Auth & Middleware

- **Route protection:** `src/middleware.ts` blocks `/admin/*` routes unless authenticated
- **Login page:** `/admin/login` has LoginForm.svelte (no auth required)
- **Token refresh:** Uses PocketBase `authRefresh()` to validate server-side
- **Logout action:** Astro server action in `src/actions/index.ts`

### 7. Public Site Structure

- **Layouts:**
  - `Layout.astro` - public pages (Navbar, Footer)
  - `AdminLayout.astro` - admin pages (sidebar nav)
- **Dynamic routes:** Use brackets: `[category]/[id].astro` for projects, blog, etc.
- **Data fetching:** Astro pages use static `pb.collection().getOne()` calls at build time
- **Image domains:** Configured in astro.config.mjs (includes PocketBase URL)

## Development Workflow

### Scripts

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Build for Netlify
pnpm preview      # Preview production build locally
pnpm typegen      # Regenerate PocketBase types (run after DB schema changes)
```

### Adding a New Feature

1. **Backend:** Create collection in PocketBase, run `pnpm run typegen`
2. **Types:** Manually extend `src/types/index.ts` with expand relations if needed
3. **Public display:** Create Astro page/component, fetch via `pb.collection()` in component script
4. **Admin CRUD:** Create manager component in `src/components/admin/`, follow ProjectManager pattern
5. **API calls:** Use `pb.collection()` directly (already typed via TypeScript)

### Key Conventions

- **No separate API routes:** Use PocketBase directly from Svelte/Astro
- **Error toasts:** Always wrap mutations in try/catch with `toast.error()` for user feedback
- **Loading states:** Use `$state()` booleans like `loading`, `formLoading` for UI feedback
- **Slug generation:** Use `paramCase()` or similar for URL-friendly slugs (common in form managers)
- **CSS:** UnoCSS classes (`bg-aspada-navy`, `rounded-3xl`) - check `uno.config.ts` for custom theme
- **Svelte versions:** Project uses Svelte 5 with runes syntax (`$state`, `$effect`)

## Common File Locations

| Purpose              | Location                                                               |
| -------------------- | ---------------------------------------------------------------------- |
| PocketBase singleton | `src/lib/pb.ts`                                                        |
| Utility functions    | `src/lib/utils.ts`                                                     |
| Type definitions     | `src/types/index.ts`, `src/types/pocketbase-types.ts` (auto-generated) |
| Public page layouts  | `src/layouts/Layout.astro`                                             |
| Admin layout         | `src/layouts/AdminLayout.astro`                                        |
| Admin CRUD managers  | `src/components/admin/*Manager.svelte`                                 |
| Public components    | `src/components/*.astro`, `src/components/*.svelte`                    |
| Astro server actions | `src/actions/index.ts`                                                 |
| Styles               | `src/styles/global.css`, component inline styles                       |

## Debugging Tips

- **PocketBase auth issues:** Check `src/middleware.ts` - ensure token is valid and in cookies
- **Type errors after schema changes:** Run `pnpm typegen` to regenerate types
- **Image not loading:** Verify domain is in `astro.config.mjs` image.domains
- **Admin data not updating:** Check console for PocketBase errors; toast messages show feedback
- **Build fails:** Usually PocketBase connection issue - ensure `PUBLIC_PB_URL` is set in `.env`

## Integration with External Services

- **Geolocation:** OpenStreetMap Nominatim API (see `getLocationName()` in utils.ts)
- **Maps:** Leaflet.js for interactive maps (LeafMap.svelte)
- **Rich editor:** Milkdown with upload plugin for blog/project descriptions
- **Chat:** Gemini API integration (AspadaChat.svelte uses @google/generative-ai)
- **Embed social:** Social embed component for Instagram feeds (SocialEmbed.svelte)
