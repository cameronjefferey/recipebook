import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Hot reload in dev would otherwise open a new pool on every edit.
const globalForDb = globalThis as unknown as {
  __pinkboxClient?: ReturnType<typeof postgres>;
  __pinkboxDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client =
    globalForDb.__pinkboxClient ??
    postgres(url, {
      // Render's free web service is one small instance; a large pool buys
      // nothing and the database is shared with other projects.
      max: 5,
      idle_timeout: 20,
      connect_timeout: 30,
    });

  globalForDb.__pinkboxClient = client;
  return drizzle(client, { schema });
}

// Resolved on first query rather than on import, so a build that runs before
// the environment is populated does not fail outright.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    globalForDb.__pinkboxDb ??= connect();
    return Reflect.get(globalForDb.__pinkboxDb, prop, receiver);
  },
});

export { schema };
