const url = process.env.DATABASE_URL ?? "";

let dbName = "";
try {
  dbName = new URL(url).pathname.replace("/", "");
} catch {
  
}

if (!dbName.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL must point to a database ending in "_test" (got "${dbName || "none"}")`,
  );
}