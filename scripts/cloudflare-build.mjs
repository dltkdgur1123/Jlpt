import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const cloudflareLoadManifestPatchPath = path.join(
  appDir,
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "build",
  "patches",
  "plugins",
  "load-manifest.js",
);

function runCommand(file, args, stdio = "inherit") {
  execFileSync(file, args, {
    cwd: appDir,
    stdio,
    windowsHide: true,
  });
}

function stopWorkerdOnWindows() {
  if (process.platform !== "win32") {
    return;
  }

  try {
    runCommand("taskkill.exe", ["/IM", "workerd.exe", "/F"], "ignore");
  } catch {
    // Ignore when no preview process is running.
  }
}

function ensureOpenNextManifestPatch() {
  const original = fs.readFileSync(cloudflareLoadManifestPatchPath, "utf8");
  const source = 'join(dotNextDir, "**/{*-manifest,required-server-files}.json")';
  const target = 'join(dotNextDir, "**/{*-manifest,required-server-files,prefetch-hints}.json")';

  if (original.includes(target)) {
    return;
  }

  if (!original.includes(source)) {
    throw new Error("OpenNext load-manifest patch format changed unexpectedly.");
  }

  fs.writeFileSync(cloudflareLoadManifestPatchPath, original.replace(source, target));
}

async function main() {
  process.chdir(appDir);
  stopWorkerdOnWindows();
  ensureOpenNextManifestPatch();

  const [{ build }, utilsModule] = await Promise.all([
    import("../node_modules/@opennextjs/cloudflare/dist/cli/build/build.js"),
    import("../node_modules/@opennextjs/cloudflare/dist/cli/commands/utils/utils.js"),
  ]);

  const { compileConfig, getNormalizedOptions, readWranglerConfig, nextAppDir } = utilsModule;
  const { config, buildDir } = await compileConfig(path.join(appDir, "open-next.config.ts"));
  const options = getNormalizedOptions(config, buildDir);
  const wranglerConfig = await readWranglerConfig({});

  await build(
    options,
    config,
    {
      minify: true,
      sourceDir: nextAppDir,
      skipNextBuild: false,
      wranglerConfigPath: undefined,
    },
    wranglerConfig,
    false,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
