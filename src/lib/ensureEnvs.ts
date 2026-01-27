import { env } from "~/env";

export function ensureEnvs() {
    if (!env.AUTH_GOOGLE_CLIENT_ID) {
        throw new Error("AUTH_GOOGLE_CLIENT_ID is not set");
    }
    if (!env.AUTH_GOOGLE_CLIENT_SECRET) {
        throw new Error("AUTH_GOOGLE_CLIENT_SECRET is not set");
    }
    if (!env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set");
    }
}