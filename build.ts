import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

mkdirSync("./dist", { recursive: true });

const result = await Bun.build({
  entrypoints: ["./src/cli.tsx"],
  outdir: "./dist",
  target: "node",
  external: ["react-devtools-core"],
  naming: "cli.js",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Patch out the react-devtools-core import (it's only used when DEV=true,
// but Node eagerly resolves ESM static imports causing a crash)
const outPath = "./dist/cli.js";
let code = readFileSync(outPath, "utf-8");
code = code.replace(
  /^import devtools from "react-devtools-core";$/m,
  "var devtools = { connectToDevTools() {} };",
);
writeFileSync(outPath, code);

console.log(`Built ${outPath}`);
