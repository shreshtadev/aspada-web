import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import pb from "../lib/pb";

export const server = {
    logout: defineAction({
        accept: "form",
        handler: async (_, context) => {
            pb.authStore.clear();
            context.cookies.delete("pb_auth", { path: "/" });
            // Also clear any other potential auth cookies if the name varies, 
            // but typically PocketBase js sdk uses 'pb_auth' by default if we were using auto-loading, 
            // OR we manually managed it. 
            // In middleware.ts, we used: pb.authStore.loadFromCookie(cookieHeader);
            // And: response.headers.append("set-cookie", pb.authStore.exportToCookie(...));

            // pb.authStore.exportToCookie() typically uses the name "pb_auth".
            // Let's explicitly overwrite it to be safe using the same method as middleware if possible, 
            // OR just simple cookie deletion which is cleaner.

            // Context.cookies.delete is the Astro way.
            context.cookies.delete("pb_auth", { path: "/" });
            return { success: true };
        },
    }),
};
