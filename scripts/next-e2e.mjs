import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const command = process.argv[2];

if (command !== "build" && command !== "start") {
  console.error('Usage: node scripts/next-e2e.mjs "build" | "start"');
  process.exit(2);
}

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

const result = spawnSync(process.execPath, [nextCli, command], {
  env: {
    ...process.env,
    PLAYWRIGHT_TEST: "1",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(`Could not run next ${command}:`, result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
