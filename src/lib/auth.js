import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

const PRIVACY_POLICY_VERSION = "2026-09-27";

const mongoUri = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/nique_sports";
const dbName = process.env.DATABASE_NAME || "nique_sports";

let client;
if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClient) {
    globalThis._mongoClient = new MongoClient(mongoUri);
  }
  client = globalThis._mongoClient;
} else {
  client = new MongoClient(mongoUri);
}
export const db = client.db(dbName);

const appUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth = betterAuth({
    baseURL: appUrl,
    trustedOrigins: [
        appUrl,
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean),
    database: mongodbAdapter(db, {
        client
    }),
    emailAndPassword: {
        enabled: true,
    },

    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false,
                // input: false → set once at sign-up / by you, never editable
                // from the client. Flip to true only if you want users changing
                // it themselves later.
                input: true,
            },
            address: {
                type: "string",
                required: false,
                input: true,
            },
            privacyPolicyAccepted: {
                type: "boolean",
                required: true,
                input: true,
            },
            privacyPolicyVersion: {
                type: "string",
                required: false,
                input: false,
            },
            privacyPolicyAcceptedAt: {
                type: "string",
                required: false,
                input: false,
            },
            // 'user' for everyone; 'admin' can only be granted by editing the
            // user document in MongoDB. input: false means no sign-up or
            // profile-update request can ever set it.
            userRole: {
                type: "string",
                required: false,
                defaultValue: "user",
                input: false,
            },
        },
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    if (user.privacyPolicyAccepted !== true) return false;

                    return {
                        data: {
                            ...user,
                            userRole: "user",
                            privacyPolicyVersion: PRIVACY_POLICY_VERSION,
                            privacyPolicyAcceptedAt: new Date().toISOString(),
                        },
                    };
                },
            },
            update: {
                before: async (user) => {
                    if (
                        "userRole" in user ||
                        "privacyPolicyAccepted" in user ||
                        "privacyPolicyVersion" in user ||
                        "privacyPolicyAcceptedAt" in user
                    ) {
                        return false;
                    }
                },
            },
        },
    },

    // nextCookies must be the LAST plugin in the array
    plugins: [nextCookies()],
});