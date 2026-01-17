// src/lib/utils.ts
import toast from "svelte-french-toast";
import pb from "./pb";
import type { Address } from "../types";

// Simple in-memory cache to avoid redundant API calls during a single build/session
const geoCache = new Map<string, string>();

export async function getLocationName(lat: string, lon: string): Promise<Address> {
    if(parseInt(lat) === 0 || parseInt(lon) === 0) return {name: "Location Details"};
    const precision = 3;
    const roundedLat = Number(lat).toFixed(precision);
    const roundedLon = Number(lon).toFixed(precision);
    const cacheKey = `${roundedLat},${roundedLon}`;

    // 1. Check Memory Cache
    if (geoCache.has(cacheKey)) {
        return JSON.parse(geoCache.get(cacheKey)!) as Address;
    }

    try {
        // 2. Fetch from API (Server-side fetch)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLon}&format=json`
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const name = data.display_name;
        const state = data.address.state;
        const suburb = data.address.suburb;
        const postcode = data.address.postcode;
        const county = data.address.county;
        const district = data.address.state_district;   
        const address = {name, state, suburb, postcode,county,district}
        // 3. Save to Cache
        geoCache.set(cacheKey, JSON.stringify(address));
        return address;

    } catch (error) {
        console.error("Geocoding Server Error:", error);
        toast.error("Geocoding Server Error");
        return {name: "Location Details"};
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
            console.error('upload failed', err);
            toast.error('upload failed');
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
        console.error('delete failed', err);
        toast.error('delete failed');
    }
    return isDeleted;
};

export const uploadAttachment = async (title: string, files: File[]) => {
    const uploadedFiles: string[] = [];
    const MAX_SIZE_MB = 5;

    for (const file of files) {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`File exceeds ${MAX_SIZE_MB}MB`);
            return [];
        }
        try {
            const record = await pb.collection('attachments').create({
                attachment: file,
                title: title,
            });

            uploadedFiles.push(record.id);
        } catch (err) {
            console.error('upload failed', err);
            toast.error('upload failed');
            return [];
        }
    }

    return uploadedFiles;
};

export const encodeForQuery = (str: string): string => {
  return encodeURIComponent(str).replace(/%20/g, '+');
};