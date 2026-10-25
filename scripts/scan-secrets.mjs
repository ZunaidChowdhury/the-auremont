#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const RULES = [
  { name: "stripe-secret-key", pattern: /[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { name: "stripe-webhook-secret", pattern: /whsec_[A-Za-z0-9+/=]{16,}/ },
  { name: "private-key-header", pattern: /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/ },
  { name: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "github-token", pattern: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "github-fine-grained-token", pattern: /github_pat_[A-Za-z0-9_]{20,}/ },
  { name: "google-api-key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "google-oauth-secret", pattern: /GOCSPX-[A-Za-z0-9_-]{20,}/ },
  { name: "cloudinary-credential-url", pattern: /cloudinary:\/\/[^:\s/]+:[^@\s/]+@/ },
  {
    name: "jwt",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
];

export function findSecrets(text) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({ line: index + 1, rule: rule.name });
      }
    }
  }
  return findings;
}

function listTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "buffer" })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function main() {
  let files;
  try {
    files = listTrackedFiles();
  } catch {
    console.error("Secret scan failed: unable to list tracked files (is git installed?).");
    process.exit(2);
  }

  let findings = 0;
  for (const file of files) {
    let buffer;
    try {
      buffer = readFileSync(file);
    } catch {
      console.error(`Secret scan failed: cannot read tracked file: ${file}`);
      process.exit(2);
    }
    if (buffer.includes(0)) continue;

    for (const finding of findSecrets(buffer.toString("utf8"))) {
      console.error(`${file}:${finding.line}: ${finding.rule}`);
      findings += 1;
    }
  }

  if (findings > 0) {
    console.error(`Secret scan failed: ${findings} finding(s). Matched values are never printed.`);
    process.exit(1);
  }

  console.log(`Secret scan passed (${files.length} tracked files).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
