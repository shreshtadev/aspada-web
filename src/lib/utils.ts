// src/lib/utils.ts

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
        return "Location Details"; // Fallback
    }
}