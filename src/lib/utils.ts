// src/lib/utils.ts
import toast from "svelte-french-toast";
import pb from "./pb";

// Simple in-memory cache to avoid redundant API calls during a single build/session
const geoCache = new Map<string, string>();

export async function getLocationName(lat: number | string, lon: number | string): Promise<string> {
    const precision = 3;
    const roundedLat = Number(lat).toFixed(precision);
    const roundedLon = Number(lon).toFixed(precision);
    const cacheKey = `${roundedLat},${roundedLon}`;

    // 1. Check Memory Cache
    if (geoCache.has(cacheKey)) {
        return geoCache.get(cacheKey)!;
    }

    try {
        // 2. Fetch from API (Server-side fetch)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            {
                headers: {
                    // Nominatim requires a User-Agent for server-side calls
                    'User-Agent': 'AspadaDevelopers/1.0 (contact: aspadadevelopers@gmail.com)'
                }
            }
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const name = data.display_name;

        // 3. Save to Cache
        geoCache.set(cacheKey, name);
        return name;

    } catch (error) {
        console.error("Geocoding Server Error:", error);
        toast.error("Geocoding Server Error");
        return "Location Details"; // Fallback
    }
}


export const markdownAttachmentUploader = async (files: File[], schema: any) => {
    const imageType = schema.nodes.image;

    for (const file of files) {
        // 1. Size validation
        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            console.error(`File exceeds ${MAX_SIZE_MB}MB`);
            toast.error(`File exceeds ${MAX_SIZE_MB}MB`);
            continue;
        }

        // 2. MIME validation
        const allowed = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowed.includes(file.type)) {
            console.error('Only JPEG, PNG, GIF allowed');
            toast.error('Only JPEG, PNG, GIF allowed');
            continue;
        }

        try {
            // 3. Upload to PocketBase
            const record = await pb.collection('attachments').create({
                attachment: file,
            });

            // 4. Build file URL
            const imageUrl = pb.files.getURL(record, record.attachment);

            // 5. Return Milkdown node
            return imageType.create({
                src: imageUrl,
                alt: file.name,
            });
        } catch (err) {
            console.error('PocketBase upload failed', err);
            toast.error('PocketBase upload failed');
            return null;
        }
    }

    return null;
};

export const deleteAttachment = async (id: string) => {
    let isDeleted = false;
    try {
        await pb.collection('attachments').delete(id);
        isDeleted = true;
    } catch (err) {
        console.error('PocketBase delete failed', err);
        toast.error('PocketBase delete failed');
    }
    return isDeleted;
};

export const uploadAttachment = async (title: string, files: File[]) => {
    const uploadedFiles: string[] = [];
    for (const file of files) {
        try {
            const record = await pb.collection('attachments').create({
                attachment: file,
                title: title,
            });

            uploadedFiles.push(record.id);
        } catch (err) {
            console.error('PocketBase upload failed', err);
            toast.error('PocketBase upload failed');
            return [];
        }
    }

    return uploadedFiles;
};