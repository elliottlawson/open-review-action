#!/usr/bin/env node
/**
 * Extracts the review JSON object from opencode's raw stdout.
 *
 * The model is instructed to emit only a JSON object, but may wrap it in
 * markdown fences or add surrounding commentary. This script finds the first
 * balanced, parseable `{...}` block (string-aware, so braces inside string
 * values don't break the scan) and prints it as compact JSON to stdout.
 *
 * Usage: node extract-json.js <raw-output-file> > result.json
 * Exit 1 with the raw output on stderr if no valid JSON object is found.
 */
const fs = require('fs');

function extractJsonObject(text) {
  // Fast path: the entire output is already valid JSON.
  try {
    return JSON.parse(text.trim());
  } catch {
    // Fall through to the balanced-block scan.
  }

  let searchFrom = 0;
  while (searchFrom < text.length) {
    const start = text.indexOf('{', searchFrom);
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    // Unbalanced or unparseable — skip this opener and try the next one.
    if (end === -1) {
      searchFrom = start + 1;
      continue;
    }

    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      searchFrom = start + 1;
    }
  }

  return null;
}

function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node extract-json.js <raw-output-file>');
    process.exit(1);
  }

  const raw = fs.readFileSync(inputFile, 'utf8');
  const result = extractJsonObject(raw);

  if (result === null) {
    console.error('ERROR: Could not extract a valid JSON object from the review output.');
    console.error('--- Raw output ---');
    console.error(raw);
    console.error('--- End raw output ---');
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(result));
}

main();
