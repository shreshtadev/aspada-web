import { defineAction } from "astro:actions";
import { z } from 'astro:schema';
import pb from "../lib/pb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Collections } from "../types/pocketbase-types";
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
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

    chatWithAI: defineAction({
    accept: 'json',
    input: z.object({
      message: z.string(),
      history: z.array(z.any()).optional(),
    }),
    handler: async ({ message, history }) => {
      let validHistory = history || [];
      if (validHistory.length > 0 && validHistory[0].role === 'model') {
        validHistory = validHistory.slice(1);
      }
      // 1. Fetch live data from PocketBase to feed the AI context
      const projects = await pb.collection(Collections.Projects).getFullList({
        filter: "status = 'ongoing'",
        fields: "title,category,status,addressLine1,city,district,state,pincode,description"
      });

      // 2. Format project data into a readable string for the AI
      const projectContext = projects.map(p => 
        `- ${p.title}: A ${p.category} project located in ${p.addressLine1}, ${p.city}, ${p.district}, ${p.state}, ${p.pincode}. ${p.description}`
      ).join("\n");

      // 3. Initialize Gemini 2.0 Flash
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", // Using the latest Flash model
        systemInstruction: `
          You are the Aspada Assistant. You represent Aspada Developers in Shivamogga.
          Use the following live project data to answer user queries:
          ${projectContext}
          
          Guidelines:
          - If a user asks about a project not listed above, say we are constantly expanding and ask for their contact info.
          - Be concise, professional, and luxury-oriented.
          - Always mention that site visits are available upon request.
        `
      });

      const chat = model.startChat({ history: validHistory || [] });
      const result = await chat.sendMessage(message);
      return result.response.text();
    }
  })
};
