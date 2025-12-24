#!/usr/bin/env node

/**
 * .env.example Completeness Checker
 *
 * Ensures every environment variable referenced by the runtime environment
 * validation schema is present in `.env.example`.
 *
 * Why regex-based extraction?
 * - `src/lib/env-validation.ts` is TypeScript and uses Vite `import.meta.env`.
 * - CI runs this script with plain Node; importing TS would require extra tooling.
 * - We treat `env-validation.ts` as the single source of truth and extract keys.
 */

import { readFileSync } from 'node:fs';

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function extractEnvKeysFromValidationSource(source) {
  const matches = source.match(/\bVITE_[A-Z0-9_]+\b/g) ?? [];
  return [...new Set(matches)].sort();
}

function extractEnvKeysFromDotEnvExample(dotEnvExample) {
  const keys = new Set();
  const duplicates = new Set();

  for (const rawLine of dotEnvExample.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!key) continue;

    if (keys.has(key)) {
      duplicates.add(key);
    }
    keys.add(key);
  }

  return {
    keys: [...keys].sort(),
    duplicates: [...duplicates].sort(),
  };
}

function main() {
  const validationSourcePath = 'src/lib/env-validation.ts';
  const envExamplePath = '.env.example';

  const validationSource = readText(validationSourcePath);
  const envKeys = extractEnvKeysFromValidationSource(validationSource);

  const envExample = readText(envExamplePath);
  const { keys: exampleKeys, duplicates } = extractEnvKeysFromDotEnvExample(envExample);
  const exampleKeySet = new Set(exampleKeys);

  const missing = envKeys.filter(k => !exampleKeySet.has(k));

  if (duplicates.length > 0) {
    writeStderr(`⚠️  Duplicate keys found in ${envExamplePath}:`);
    duplicates.forEach(k => writeStderr(`   - ${k}`));
  }

  if (missing.length > 0) {
    writeStderr(
      `❌ ${envExamplePath} is missing ${missing.length} key(s) referenced by ${validationSourcePath}:`,
    );
    missing.forEach(k => writeStderr(`   - ${k}`));
    process.exit(1);
  }

  writeStdout(
    `✅ ${envExamplePath} contains all ${envKeys.length} env key(s) referenced by ${validationSourcePath}.`,
  );
  process.exit(0);
}

main();
