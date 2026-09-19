"""
Convert the tool's generated blog Markdown into downloadable .docx / .pdf
bytes, without needing pandoc/LibreOffice/pdflatex installed on the host.

- DOCX: python-docx, with a small hand-rolled Markdown block/inline parser
  (headings, bold/italic/code/links, bullet lists, code blocks, images).
- PDF: `markdown` -> HTML -> fpdf2's write_html(). fpdf2's built-in fonts are
  Latin-1 only, so text is normalized first (smart quotes/dashes -> ASCII);
  anything outside Latin-1 is dropped rather than raising.

All third-party imports are lazy (inside the functions), so importing this
module never fails even if a package isn't installed yet - only calling the
relevant function does, and callers are expected to catch that.
"""
from __future__ import annotations

import os
import re
from io import BytesIO
from pathlib import Path
from typing import List, Optional


# -----------------------------
# Shared: a tiny Markdown block parser
# -----------------------------
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_IMAGE_RE = re.compile(r"^!\[(?P<alt>[^\]]*)\]\((?P<src>[^)]+)\)\s*$")
_BULLET_RE = re.compile(r"^[-*]\s+(.*)$")


def _parse_markdown_blocks(md_text: str) -> List[dict]:
    lines = (md_text or "").splitlines()
    blocks: List[dict] = []
    i = 0
    in_code = False
    code_lines: List[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                blocks.append({"type": "code", "text": "\n".join(code_lines)})
                in_code = False
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped:
            i += 1
            continue

        m = _IMAGE_RE.match(stripped)
        if m:
            blocks.append({"type": "image", "alt": m.group("alt"), "src": m.group("src")})
            i += 1
            continue

        m = _HEADING_RE.match(stripped)
        if m:
            blocks.append({"type": "heading", "level": len(m.group(1)), "text": m.group(2).strip()})
            i += 1
            continue

        m = _BULLET_RE.match(stripped)
        if m:
            blocks.append({"type": "bullet", "text": m.group(1).strip()})
            i += 1
            continue

        if stripped.startswith(">"):
            blocks.append({"type": "quote", "text": stripped.lstrip("> ").strip()})
            i += 1
            continue

        if len(stripped) > 1 and stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
            blocks.append({"type": "caption", "text": stripped.strip("*")})
            i += 1
            continue

        blocks.append({"type": "paragraph", "text": stripped})
        i += 1

    if in_code and code_lines:
        blocks.append({"type": "code", "text": "\n".join(code_lines)})

    return blocks


# -----------------------------
# DOCX
# -----------------------------
_INLINE_TOKEN_RE = re.compile(
    r"(?P<bold>\*\*(?P<bold_text>.+?)\*\*)"
    r"|(?P<code>`(?P<code_text>[^`]+)`)"
    r"|(?P<link>\[(?P<link_text>[^\]]+)\]\((?P<link_url>[^)]+)\))"
    r"|(?P<italic>\*(?P<italic_text>[^*]+)\*)"
)


def _add_hyperlink(paragraph, text: str, url: str):
    """Standard python-docx hyperlink workaround (no native API for this)."""
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    part = paragraph.part
    r_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)

    new_run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "0563C1")
    rpr.append(color)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    rpr.append(underline)
    new_run.append(rpr)

    t = OxmlElement("w:t")
    t.text = text
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


def _add_inline_runs(paragraph, text: str):
    pos = 0
    for m in _INLINE_TOKEN_RE.finditer(text):
        if m.start() > pos:
            paragraph.add_run(text[pos : m.start()])
        if m.group("bold_text") is not None:
            paragraph.add_run(m.group("bold_text")).bold = True
        elif m.group("code_text") is not None:
            run = paragraph.add_run(m.group("code_text"))
            run.font.name = "Consolas"
        elif m.group("link_text") is not None:
            _add_hyperlink(paragraph, m.group("link_text"), m.group("link_url"))
        elif m.group("italic_text") is not None:
            paragraph.add_run(m.group("italic_text")).italic = True
        pos = m.end()
    if pos < len(text):
        paragraph.add_run(text[pos:])


def markdown_to_docx_bytes(md_text: str, base_dir: Optional[Path] = None) -> bytes:
    """
    Raises ImportError if python-docx isn't installed - callers should catch
    that and show a friendly "export unavailable" message instead of crashing.
    """
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    base_dir = base_dir or Path(".")
    doc = Document()
    blocks = _parse_markdown_blocks(md_text)

    for block in blocks:
        btype = block["type"]

        if btype == "heading":
            level = min(max(block["level"], 1), 5)
            style = "Title" if level == 1 else f"Heading {level - 1}"
            try:
                p = doc.add_paragraph(style=style)
            except KeyError:
                p = doc.add_paragraph()
            _add_inline_runs(p, block["text"])

        elif btype == "bullet":
            try:
                p = doc.add_paragraph(style="List Bullet")
            except KeyError:
                p = doc.add_paragraph("• ")
            _add_inline_runs(p, block["text"])

        elif btype == "code":
            p = doc.add_paragraph()
            run = p.add_run(block["text"])
            run.font.name = "Consolas"
            run.font.size = Pt(9)

        elif btype == "quote":
            p = doc.add_paragraph()
            _add_inline_runs(p, block["text"])
            for run in p.runs:
                run.italic = True

        elif btype == "caption":
            p = doc.add_paragraph()
            run = p.add_run(block["text"])
            run.italic = True
            run.font.size = Pt(9)
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

        elif btype == "image":
            src = block["src"]
            try:
                if src.startswith("http://") or src.startswith("https://"):
                    import requests

                    resp = requests.get(src, timeout=10)
                    resp.raise_for_status()
                    doc.add_picture(BytesIO(resp.content), width=Inches(5.5))
                else:
                    img_path = (base_dir / src).resolve()
                    if img_path.exists():
                        doc.add_picture(str(img_path), width=Inches(5.5))
                    else:
                        doc.add_paragraph(f"[Image not found: {src}]")
            except Exception:
                doc.add_paragraph(f"[Image could not be embedded: {src}]")

        else:  # paragraph
            p = doc.add_paragraph()
            _add_inline_runs(p, block["text"])

    buf = BytesIO()
    doc.save(buf)
    return buf.getvalue()


# -----------------------------
# PDF
# -----------------------------
_UNICODE_REPLACEMENTS = {
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": "--", "\u2026": "...", "\u00a0": " ",
}


def _to_latin1_safe(text: str) -> str:
    for k, v in _UNICODE_REPLACEMENTS.items():
        text = text.replace(k, v)
    # fpdf2's built-in core fonts only support Latin-1; anything else is
    # dropped rather than crashing the export.
    return text.encode("latin-1", errors="replace").decode("latin-1")


def markdown_to_pdf_bytes(md_text: str, base_dir: Optional[Path] = None) -> bytes:
    """
    Raises ImportError if `markdown` or `fpdf2` aren't installed - callers
    should catch that and show a friendly "export unavailable" message.
    """
    import markdown as md_lib
    from fpdf import FPDF

    base_dir = base_dir or Path(".")
    safe_md = _to_latin1_safe(md_text or "")

    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)

    original_cwd = os.getcwd()
    try:
        # write_html resolves relative <img src="..."> against the current
        # working directory, so point it at the blog's images/ folder.
        os.chdir(str(base_dir))
        html = md_lib.markdown(safe_md, extensions=["extra", "sane_lists"])
        pdf.write_html(html)
    except Exception:
        # If HTML rendering trips on something unexpected, fall back to a
        # plain-text dump rather than losing the export entirely.
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 6, safe_md)
    finally:
        os.chdir(original_cwd)

    return bytes(pdf.output())