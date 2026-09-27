import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

const PRIVACY_POLICY_VERSION = "2026-09-27";

const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db(process.env.DATABASE_NAME);

export const auth = betterAuth({
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
                            privacyPolicyVersion: PRIVACY_POLICY_VERSION,
                            privacyPolicyAcceptedAt: new Date().toISOString(),
                        },
                    };
                },
            },
            update: {
                before: async (user) => {
                    if (
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