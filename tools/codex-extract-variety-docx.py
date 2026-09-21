import csv
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def cell_text(cell):
    parts = []
    for text in cell.findall(".//w:t", NS):
        if text.text:
            parts.append(text.text)
    return " ".join(" ".join(parts).split())


def table_rows(table):
    rows = []
    for row in table.findall("./w:tr", NS):
      cells = [cell_text(cell) for cell in row.findall("./w:tc", NS)]
      if any(cells):
          rows.append(cells)
    return rows


def paragraph_text(paragraph):
    parts = []
    for text in paragraph.findall(".//w:t", NS):
        if text.text:
            parts.append(text.text)
    return " ".join(" ".join(parts).split())


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "variety"


def normalize_key(value):
    key = value.lower().strip()
    key = re.sub(r"[^a-z0-9]+", "_", key)
    return key.strip("_") or "field"


def infer_products(tables, paragraphs):
    products = []
    seen = set()
    for table_index, rows in enumerate(tables, start=1):
        if len(rows) < 2:
            continue
        header = [normalize_key(col) for col in rows[0]]
        if len(header) < 2:
            continue
        has_variety_signal = any(
            any(token in col for token in ("variety", "crop", "commodity", "name", "product"))
            for col in header
        )
        if not has_variety_signal:
            continue

        for row_index, row in enumerate(rows[1:], start=1):
            data = {header[i]: row[i] if i < len(row) else "" for i in range(len(header))}
            values = [value for value in data.values() if value]
            if len(values) < 2:
                continue

            name = (
                data.get("product_name")
                or data.get("product")
                or data.get("variety")
                or data.get("variety_name")
                or data.get("name")
                or values[0]
            )
            crop = data.get("crop") or data.get("commodity") or data.get("crop_name") or values[0]
            region = (
                data.get("state")
                or data.get("region")
                or data.get("north_east_state")
                or data.get("location")
                or "North East India"
            )
            traits = [
                data.get("specialty_usp_biochemical_profile"),
                data.get("commercial_value_added_potential"),
                data.get("special_trait"),
                data.get("traits"),
                data.get("features"),
                data.get("characteristics"),
                data.get("description"),
            ]
            description = " | ".join([trait for trait in traits if trait]) or "North East India agricultural variety"
            price_seed = max(60, min(450, 90 + len(description) * 2))
            product_id = f"nei-{slugify(crop)}-{slugify(name)}"
            if product_id in seen:
                product_id = f"{product_id}-{table_index}-{row_index}"
            seen.add(product_id)
            products.append({
                "id": product_id,
                "name": name,
                "crop": crop,
                "category": "North East India Varieties",
                "region": region,
                "description": description,
                "estimated_price_inr": price_seed,
                "unit": "kg/seedling/bundle",
                "source_table": table_index,
                "source_row": row_index,
                "attributes": data,
            })

    if products:
        return products

    for index, paragraph in enumerate(paragraphs, start=1):
        if not re.search(r"\b(variety|rice|paddy|maize|millet|bean|chilli|ginger|turmeric|orange|pineapple)\b", paragraph, re.I):
            continue
        name = paragraph[:80].strip(" .:-")
        product_id = f"nei-note-{index:03d}-{slugify(name)}"
        products.append({
            "id": product_id,
            "name": name,
            "crop": "Regional crop variety",
            "category": "North East India Varieties",
            "region": "North East India",
            "description": paragraph,
            "estimated_price_inr": 120,
            "unit": "kg/seedling/bundle",
            "source_table": None,
            "source_row": index,
            "attributes": {"source_paragraph": paragraph},
        })
    return products


def main():
    if len(sys.argv) != 4:
        print("Usage: codex-extract-variety-docx.py input.docx output.json output.csv", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_json = Path(sys.argv[2])
    output_csv = Path(sys.argv[3])
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(input_path) as docx:
        xml = docx.read("word/document.xml")

    root = ET.fromstring(xml)
    paragraphs = [paragraph_text(p) for p in root.findall(".//w:p", NS)]
    paragraphs = [p for p in paragraphs if p]
    tables = [table_rows(t) for t in root.findall(".//w:tbl", NS)]
    products = infer_products(tables, paragraphs)

    payload = {
        "source": str(input_path),
        "paragraph_count": len(paragraphs),
        "table_count": len(tables),
        "product_count": len(products),
        "products": products,
        "paragraph_preview": paragraphs[:40],
        "table_preview": tables[:3],
    }
    output_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "id", "name", "crop", "category", "region", "description",
            "estimated_price_inr", "unit", "source_table", "source_row"
        ])
        writer.writeheader()
        for product in products:
            writer.writerow({key: product.get(key, "") for key in writer.fieldnames})

    print(json.dumps({
        "paragraph_count": len(paragraphs),
        "table_count": len(tables),
        "product_count": len(products),
        "json": str(output_json),
        "csv": str(output_csv),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
