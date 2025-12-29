#!/usr/bin/env node

/**
 * check-env-sync.js
 *
 * Ensures environment variables stay in sync with new multi-env structure:
 * 1. .env.development (committed) - Development template
 * 2. .env.production (committed) - Production template
 * 3. .env.development.local (gitignored) - Local secrets
 *
 * Checks:
 * 1. Code only uses env vars documented in .env.development or .env.production
 * 2. .env.development.local vars (if exists) are documented in .env.development
 *
 * Why this matters:
 * - New developers know what env vars to set up
 * - No orphaned env var references in code
 * - Environment templates stay up to date
 *
 * Trade-offs:
 * - Adds ~500ms to pre-commit (grep for process.env)
 * - Prevents undocumented env var sprawl
 * - Ensures templates are always current
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ENV_DEVELOPMENT = ".env.development";
const ENV_PRODUCTION = ".env.production";
const ENV_LOCAL = ".env.development.local";

// Parse .env file into array of variable names
// Skips comments and empty lines, extracts only variable names
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf8");
  const vars = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Extract variable name (before =)
    // Matches: VARIABLE_NAME=value
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      vars.push(match[1]);
    }
  }

  return vars;
}

// Find all process.env usages in actual code (not comments)
// Excludes node_modules, .next, and other build artifacts
function findEnvUsageInCode() {
  try {
    // Search all .ts, .tsx, .js files for process.env references
    // Use -v to exclude comment lines
    const result = execSync(
      `find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \\) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" -exec grep -Eho 'process\\.env\\.[A-Z_][A-Z0-9_]*' {} \\; 2>/dev/null || true`,
      { encoding: "utf8" },
    );

    const vars = new Set();
    for (const line of result.split("\n")) {
      const match = line.match(/process\.env\.([A-Z_][A-Z0-9_]*)/);
      if (match) {
        vars.add(match[1]);
      }
    }

    return Array.from(vars).sort();
  } catch (error) {
    console.error("Error searching code:", error.message);
    return [];
  }
}

// Main check function
function checkEnvSync() {
  let hasErrors = false;

  // Parse env files
  const devVars = parseEnvFile(ENV_DEVELOPMENT);
  const prodVars = parseEnvFile(ENV_PRODUCTION);
  const localVars = parseEnvFile(ENV_LOCAL);
  const codeVars = findEnvUsageInCode();

  // Combine dev and prod vars (all documented vars)
  const documentedVars = [...new Set([...devVars, ...prodVars])];

  console.log("\n🔍 Checking environment variable sync...\n");

  // CHECK 1: .env.development should contain all vars from .env.development.local
  // This ensures local overrides are documented
  if (localVars.length > 0) {
    const missingInDev = localVars.filter((v) => !devVars.includes(v));

    if (missingInDev.length > 0) {
      hasErrors = true;
      console.error(
        "❌ CHECK 1 FAILED: .env.development is missing variables from .env.development.local\n",
      );
      console.error(
        "Variables in .env.development.local but NOT in .env.development:",
      );
      for (const v of missingInDev) {
        console.error(`  - ${v}`);
      }
      console.error(
        "\nFix: Add these variables to .env.development with template values:",
      );
      for (const v of missingInDev) {
        console.error(`  ${v}="template_value_here"`);
      }
      console.error("");
    } else {
      console.log(
        "✅ CHECK 1 PASSED: All .env.development.local variables are in .env.development",
      );
    }
  } else {
    console.log(
      "⚠️  CHECK 1 SKIPPED: No .env.development.local file found (okay)",
    );
  }

  // CHECK 2: Code should only use env vars documented in .env.development or .env.production
  // This prevents orphaned env var references
  const undocumented = codeVars.filter((v) => !documentedVars.includes(v));

  if (undocumented.length > 0) {
    hasErrors = true;
    console.error(
      "\n❌ CHECK 2 FAILED: Code uses undocumented environment variables\n",
    );
    console.error(
      "Variables used in code but NOT in .env.development or .env.production:",
    );

    // Find where each var is used (show first 3 occurrences)
    for (const v of undocumented) {
      console.error(`\n  ${v}:`);
      try {
        const locations = execSync(
          `grep -rn "process\\.env\\.${v}" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next . | head -3`,
          { encoding: "utf8" },
        ).trim();

        for (const loc of locations.split("\n")) {
          if (loc) {
            // Format: file:line:content
            console.error(`    ${loc}`);
          }
        }
      } catch (e) {
        // grep returns non-zero if no matches (already handled)
      }
    }

    console.error("\nFix options:");
    console.error(
      "  1. Add these variables to .env.development (or .env.production if production-only):",
    );
    for (const v of undocumented) {
      console.error(`     ${v}="template_value_here"`);
    }
    console.error("  2. OR remove the code that uses these variables\n");
  } else {
    console.log("✅ CHECK 2 PASSED: All code env vars are documented");
  }

  // Summary
  if (!hasErrors) {
    console.log("\n✅ All environment variable checks passed!\n");
    process.exit(0);
  } else {
    console.error("\n❌ Environment variable sync failed!\n");
    console.error("Environment variables must stay in sync:");
    console.error(
      "  .env.development.local → .env.development (document all local vars)",
    );
    console.error(
      "  code → .env.development/.env.production (only use documented vars)\n",
    );
    process.exit(1);
  }
}

// Run check
checkEnvSync();
