import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { buildNextjsApp, setStandaloneBuildMode } from "@opennextjs/aws/build/buildNextApp.js";
import { compileCache } from "@opennextjs/aws/build/compileCache.js";
import { createCacheAssets, createStaticAssets } from "@opennextjs/aws/build/createAssets.js";
import { createMiddleware } from "@opennextjs/aws/build/createMiddleware.js";
import * as buildHelper from "@opennextjs/aws/build/helper.js";
import { patchOriginalNextConfig } from "@opennextjs/aws/build/patch/patches/index.js";
import { ensureNextjsVersionSupported } from "../node_modules/@opennextjs/cloudflare/dist/cli/utils/nextjs-support.js";
import { bundleServer } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/bundle-server.js";
import { compileCacheAssetsManifestSqlFile } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compile-cache-assets-manifest.js";
import { compileEnvFiles } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compile-env-files.js";
import { compileImages } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compile-images.js";
import { compileInit } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compile-init.js";
import { compileSkewProtection } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compile-skew-protection.js";
import { compileDurableObjects } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/compileDurableObjects.js";
import { createServerBundle } from "../node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/createServerBundle.js";
import { compileConfig } from "../node_modules/@opennextjs/cloudflare/dist/cli/commands/utils/utils.js";
import { unstable_readConfig } from "wrangler";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const openNextDistDir = path.dirname(require.resolve("@opennextjs/aws/index.js"));

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

function resetOutputDir(outputDir) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}

function ensureCompiledConfigs(options) {
  const sourceDir = options.tempBuildDir;
  const targetDir = options.buildDir;

  fs.mkdirSync(targetDir, { recursive: true });

  for (const fileName of ["open-next.config.mjs", "open-next.config.edge.mjs"]) {
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);

    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

async function main() {
  process.chdir(appDir);
  stopWorkerdOnWindows();

  const { config, buildDir } = await compileConfig(path.join(appDir, "open-next.config.ts"));
  const options = buildHelper.normalizeOptions(config, openNextDistDir, buildDir);

  options.minify = false;
  buildHelper.checkRunningInsideNextjsApp(options);
  await ensureNextjsVersionSupported(options);
  buildHelper.checkNextVersionSupport(
    options.nextVersion,
    false,
    "--dangerouslyUseUnsupportedNextVersion",
  );

  resetOutputDir(options.outputDir);
  buildHelper.initOutputDir(options);
  ensureCompiledConfigs(options);

  setStandaloneBuildMode(options);
  buildNextjsApp(options);

  const wranglerConfig = await unstable_readConfig({});

  await patchOriginalNextConfig(options);
  compileCache(options);
  ensureCompiledConfigs(options);
  compileEnvFiles(options);
  await compileInit(options, wranglerConfig);
  await compileImages(options);
  await compileSkewProtection(options, config);
  ensureCompiledConfigs(options);
  await createMiddleware(options, { forceOnlyBuildOnce: true });
  createStaticAssets(options, { useBasePath: true });

  if (config.dangerous?.disableIncrementalCache !== true) {
    const { useTagCache, metaFiles } = createCacheAssets(options);
    if (useTagCache) {
      compileCacheAssetsManifestSqlFile(options, metaFiles);
    }
  }

  ensureCompiledConfigs(options);
  await createServerBundle(options);
  await compileDurableObjects(options);
  await bundleServer(options, { minify: true, skipNextBuild: false, sourceDir: appDir });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
