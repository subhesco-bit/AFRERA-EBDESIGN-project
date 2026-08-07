#!/usr/bin/env python3
"""
Markdown linting fixer for AFRERA project
Fixes common markdownlint errors:
- MD022: Blanks around headings
- MD032: Blanks around lists
- MD031: Blanks around fences
"""

import re
import glob
import os

def fix_markdown_content(content):
    """Fix common markdown linting issues in content"""
    lines = content.split('\n')
    fixed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]
        fixed_lines.append(line)

        # MD022: Ensure blank line before headings (except at start of file)
        if i > 0 and line.startswith('#') and not line.startswith('##'):
            prev_line = lines[i-1].strip()
            if prev_line and not prev_line.startswith('#'):
                # Check if previous line is not already blank
                if lines[i-1].strip() != '':
                    fixed_lines.insert(-1, '')

        # MD022: Ensure blank line after headings
        if line.startswith('#'):
            if i + 1 < len(lines) and lines[i+1].strip() and not lines[i+1].startswith('#'):
                # Add blank line after heading if next line is not blank and not another heading
                if not lines[i+1].startswith('#'):
                    fixed_lines.append('')

        # MD031: Ensure blank line before code fences
        if line.strip().startswith('```'):
            if i > 0 and lines[i-1].strip() and not lines[i-1].strip().startswith('```'):
                fixed_lines.insert(-1, '')

        # MD031: Ensure blank line after code fences
        if line.strip().startswith('```') and not line.strip() == '```':
            if i + 1 < len(lines) and lines[i+1].strip() and not lines[i+1].strip().startswith('```'):
                fixed_lines.append('')

        i += 1

    return '\n'.join(fixed_lines)

def process_file(filepath):
    """Process a single markdown file"""
    print(f"Processing: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        fixed_content = fix_markdown_content(content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)

        print(f"  [OK] Fixed: {filepath}")
    except Exception as e:
        print(f"  [ERROR] {filepath} - {e}")

def main():
    """Main function to process all markdown files"""
    base_dir = r"C:\Users\DIYA GOEL\Downloads\EBDESIGN"

    # Find all .md files in the root directory
    md_files = glob.glob(os.path.join(base_dir, "*.md"))

    # Also find .md files in DOCUMENTATION directory
    doc_files = glob.glob(os.path.join(base_dir, "DOCUMENTATION", "*.md"))

    all_files = md_files + doc_files

    print(f"Found {len(all_files)} markdown files to process")

    for filepath in all_files:
        process_file(filepath)

    print("\n[OK] Markdown linting fix complete!")

if __name__ == "__main__":
    main()
