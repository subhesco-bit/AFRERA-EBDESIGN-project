# EBDESIGN Complete File Index

## Purpose

This directory is the authoritative generated index for the project filesystem. The indexer represents **every project file** as a library item; it does not assume that a file is unimportant because it is hidden, legacy, generated, binary, outside a module, or not yet understood.

## Scan boundary

- Scans the entire repository filesystem recursively.
- `.git/` internals are excluded because they are Git's internal object/database implementation rather than project artifacts.
- `node_modules/`, vendor, generated, backup, binary and hidden files are **indexed, not silently ignored**; they are classified so the library can distinguish them from production source.
- Symlinks are represented as records without dereferencing them.

## Outputs

- `COMPLETE_FILE_INDEX.json` — complete machine-readable manifest.
- `COMPLETE_FILE_INDEX.csv` — spreadsheet-compatible inventory.
- `LIBRARY_INDEX_SUMMARY.json` — counts, bytes, errors and completeness result.

## Identity and integrity

Every file receives a stable library item ID derived from its repository-relative path and a SHA-256 content hash when the file is readable. The hash is used to identify additions, modifications and unchanged files between scans.

## Lifecycle model

The index records discovery and change state separately from business approval. A file may be `INDEXED` while still being `generated_candidate`, `secret_name_candidate`, `backup`, `vendor`, `legacy` or otherwise requiring review. **Indexing never means production approval.**

## Completeness gate

The scan reports `PASS` only when every discovered non-symlink project file was hashed and no scan errors occurred. Any error produces `REVIEW_REQUIRED`; the system must not claim 100% completeness while files remain unreadable or unclassified.

## Run locally

From the repository root:

```powershell
node tools/library-complete-index.js
```

From `backend/` after adding the npm wrapper:

```powershell
npm run library:index:complete
```

The command is intentionally repeatable. A subsequent scan reports `ADDED`, `MODIFIED`, `UNCHANGED` and `DELETED` relative to the previous manifest.
