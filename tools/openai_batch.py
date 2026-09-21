#!/usr/bin/env python3
"""Safe, token-budgeted OpenAI Batch operations for AFRERA.

Builds JSONL locally by default. Submission is deliberately explicit because it
creates billable remote work. The API key is read only from OPENAI_API_KEY and
is never written to manifests, output, or logs.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterable

API_ROOT = "https://api.openai.com/v1"
MAX_REQUESTS = 50_000
MAX_BYTES = 200 * 1024 * 1024


def fail(message: str) -> None:
    raise SystemExit(f"error: {message}")


def load_records(path: Path) -> list[dict[str, Any]]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read input JSON: {exc}")
    records = raw if isinstance(raw, list) else raw.get("records") if isinstance(raw, dict) else None
    if not isinstance(records, list) or not all(isinstance(item, dict) for item in records):
        fail("input must be an array of objects or an object with a records array")
    return records


def compact_input(record: dict[str, Any]) -> str:
    fields = ("title", "commodity", "variety", "state", "district", "season", "description", "attributes")
    compact = {key: record[key] for key in fields if record.get(key) not in (None, "", [], {})}
    return json.dumps(compact, ensure_ascii=False, separators=(",", ":"))


def batch_lines(records: Iterable[dict[str, Any]], model: str, max_output_tokens: int) -> Iterable[dict[str, Any]]:
    instructions = (
        "Create concise, factual agricultural product listing copy. Use only supplied facts. "
        "Do not invent nutrition, certifications, pricing, medical claims, or legal compliance. "
        "Return JSON with title, summary, highlights (max 3), and missingFacts (max 5)."
    )
    for position, record in enumerate(records, start=1):
        record_id = str(record.get("id") or record.get("caseCode") or position)
        yield {
            "custom_id": f"afrera-listing-{record_id}",
            "method": "POST",
            "url": "/v1/responses",
            "body": {
                "model": model,
                "store": False,
                "instructions": instructions,
                "input": compact_input(record),
                "max_output_tokens": max_output_tokens,
                "text": {"format": {"type": "json_object"}},
            },
        }


def write_jsonl(output: Path, records: list[dict[str, Any]], model: str, max_output_tokens: int) -> None:
    if not records:
        fail("input contains no records")
    if len(records) > MAX_REQUESTS:
        fail(f"batch supports at most {MAX_REQUESTS} requests")
    if not model.strip():
        fail("model is required")
    identifiers = [str(record.get("id") or record.get("caseCode") or position) for position, record in enumerate(records, start=1)]
    if len(set(identifiers)) != len(identifiers):
        fail("record id values must be unique so Batch custom_id values are unique")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="\n") as handle:
        for request in batch_lines(records, model, max_output_tokens):
            handle.write(json.dumps(request, ensure_ascii=False, separators=(",", ":")) + "\n")
    size = output.stat().st_size
    if size > MAX_BYTES:
        output.unlink(missing_ok=True)
        fail("generated JSONL exceeds the 200 MB Batch API limit")
    print(json.dumps({"status": "built", "requests": len(records), "bytes": size, "output": str(output)}))


def api_request(
    path: str,
    method: str = "GET",
    body: bytes | None = None,
    content_type: str = "application/json",
    parse_json: bool = True,
) -> Any:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        fail("OPENAI_API_KEY is not available in the environment")
    request = urllib.request.Request(
        f"{API_ROOT}{path}", data=body, method=method,
        headers={"Authorization": f"Bearer {key}", "Content-Type": content_type},
    )
    if not parse_json:
        return payload
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        fail(f"OpenAI API returned HTTP {exc.code}: {detail}")
    except urllib.error.URLError as exc:
        fail(f"OpenAI API connection failed: {exc.reason}")
    try:
        return json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError:
        return payload


def upload_batch_file(path: Path) -> dict[str, Any]:
    boundary = "----afrera-batch-boundary"
    content = path.read_bytes()
    payload = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"purpose\"\r\n\r\nbatch\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{path.name}\"\r\nContent-Type: application/jsonl\r\n\r\n".encode(),
        content, b"\r\n", f"--{boundary}--\r\n".encode(),
    ])
    return api_request("/files", "POST", payload, f"multipart/form-data; boundary={boundary}")


def print_json(data: Any) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="AFRERA OpenAI Batch utility")
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build", help="Build local JSONL; no network request")
    build.add_argument("input", type=Path)
    build.add_argument("output", type=Path)
    build.add_argument("--model", default=os.getenv("OPENAI_BATCH_MODEL", "gpt-5-mini"))
    build.add_argument("--max-output-tokens", type=int, default=int(os.getenv("OPENAI_BATCH_MAX_OUTPUT_TOKENS", "300")))
    submit = commands.add_parser("submit", help="Upload JSONL and create a Batch")
    submit.add_argument("input", type=Path)
    submit.add_argument("--confirm-submit", action="store_true", help="Required: creates billable remote work")
    submit.add_argument("--label", default="afrera-product-copy")
    status = commands.add_parser("status", help="Fetch batch status")
    status.add_argument("batch_id")
    download = commands.add_parser("download", help="Download a batch output/error file")
    download.add_argument("file_id")
    download.add_argument("output", type=Path)
    args = parser.parse_args()

    if args.command == "build":
        if not 64 <= args.max_output_tokens <= 2000:
            fail("max-output-tokens must be between 64 and 2000")
        write_jsonl(args.output, load_records(args.input), args.model, args.max_output_tokens)
    elif args.command == "submit":
        if not args.confirm_submit:
            fail("submission requires --confirm-submit")
        if not args.input.is_file() or args.input.suffix != ".jsonl":
            fail("submit requires an existing .jsonl file")
        if args.input.stat().st_size > MAX_BYTES:
            fail("input exceeds the 200 MB Batch API limit")
        uploaded = upload_batch_file(args.input)
        batch = api_request("/batches", "POST", json.dumps({
            "input_file_id": uploaded["id"], "endpoint": "/v1/responses", "completion_window": "24h",
            "metadata": {"product": "afrera", "label": args.label[:512]},
        }).encode())
        print_json({"file_id": uploaded.get("id"), "batch": batch})
    elif args.command == "status":
        print_json(api_request(f"/batches/{args.batch_id}"))
    else:
        data = api_request(f"/files/{args.file_id}/content", parse_json=False)
        if not isinstance(data, bytes):
            fail("file content response was not binary")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(data)
        print(json.dumps({"status": "downloaded", "bytes": len(data), "output": str(args.output)}))


if __name__ == "__main__":
    main()
