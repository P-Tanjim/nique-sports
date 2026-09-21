import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db(process.env.DATABASE_NAME);

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client
    }),

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
                input: false,
            },
        },
    },

    // nextCookies must be the LAST plugin in the array
    plugins: [nextCookies()],
});