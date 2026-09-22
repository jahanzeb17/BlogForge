"""
Convert the tool's generated blog Markdown into downloadable .docx / .pdf
bytes, without needing pandoc/LibreOffice/pdflatex installed on the host.

DOCX:
- python-docx
- Small hand-rolled Markdown block/inline parser
- headings
- bold / italic / code / links
- bullet lists
- code blocks
- images

PDF:
- fpdf2 directly
- Uses the same Markdown block parser as DOCX
- Does not rely on fpdf2.write_html()
- Supports headings, paragraphs, bold/italic/code, links,
  bullet lists, quotes, captions, code blocks, and images
- Handles page breaks and long content explicitly
- Smart quotes/dashes are normalized for fpdf2's built-in fonts
- Characters outside Latin-1 are safely replaced rather than
  crashing the export

All third-party imports are lazy (inside the functions), so importing
this module never fails even if a package isn't installed yet.
"""


from __future__ import annotations

import re

from io import BytesIO
from pathlib import Path
from typing import List, Optional


# -----------------------------
# Shared: Markdown block parser
# -----------------------------

_HEADING_RE = re.compile(
    r"^(#{1,6})\s+(.*)$"
)

_IMAGE_RE = re.compile(
    r"^!\[(?P<alt>[^\]]*)\]\((?P<src>[^)]+)\)\s*$"
)

_BULLET_RE = re.compile(
    r"^[-*]\s+(.*)$"
)


def _parse_markdown_blocks(
    md_text: str,
) -> List[dict]:
    lines = (md_text or "").splitlines()

    blocks: List[dict] = []

    i = 0
    in_code = False
    code_lines: List[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # -------------------------
        # Code block
        # -------------------------

        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_lines = []
            else:
                blocks.append(
                    {
                        "type": "code",
                        "text": "\n".join(code_lines),
                    }
                )

                in_code = False
                code_lines = []

            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # -------------------------
        # Empty line
        # -------------------------

        if not stripped:
            i += 1
            continue

        # -------------------------
        # Image
        # -------------------------

        m = _IMAGE_RE.match(stripped)

        if m:
            blocks.append(
                {
                    "type": "image",
                    "alt": m.group("alt"),
                    "src": m.group("src"),
                }
            )

            i += 1
            continue

        # -------------------------
        # Heading
        # -------------------------

        m = _HEADING_RE.match(stripped)

        if m:
            blocks.append(
                {
                    "type": "heading",
                    "level": len(m.group(1)),
                    "text": m.group(2).strip(),
                }
            )

            i += 1
            continue

        # -------------------------
        # Bullet
        # -------------------------

        m = _BULLET_RE.match(stripped)

        if m:
            blocks.append(
                {
                    "type": "bullet",
                    "text": m.group(1).strip(),
                }
            )

            i += 1
            continue

        # -------------------------
        # Quote
        # -------------------------

        if stripped.startswith(">"):
            blocks.append(
                {
                    "type": "quote",
                    "text": stripped.lstrip("> ").strip(),
                }
            )

            i += 1
            continue

        # -------------------------
        # Caption
        # -------------------------

        if (
            len(stripped) > 1
            and stripped.startswith("*")
            and stripped.endswith("*")
            and not stripped.startswith("**")
        ):
            blocks.append(
                {
                    "type": "caption",
                    "text": stripped.strip("*"),
                }
            )

            i += 1
            continue

        # -------------------------
        # Normal paragraph
        # -------------------------

        blocks.append(
            {
                "type": "paragraph",
                "text": stripped,
            }
        )

        i += 1

    # Handle an unclosed code block.
    if in_code and code_lines:
        blocks.append(
            {
                "type": "code",
                "text": "\n".join(code_lines),
            }
        )

    return blocks


# -----------------------------
# Shared: inline Markdown parser
# -----------------------------

_INLINE_TOKEN_RE = re.compile(
    r"(?P<bold>\*\*(?P<bold_text>.+?)\*\*)"
    r"|(?P<code>`(?P<code_text>[^`]+)`)"
    r"|(?P<link>\[(?P<link_text>[^\]]+)\]\((?P<link_url>[^)]+)\))"
    r"|(?P<italic>\*(?P<italic_text>[^\*]+)\*)"
)


def _iter_inline_tokens(text: str):
    pos = 0

    for match in _INLINE_TOKEN_RE.finditer(text):
        if match.start() > pos:
            yield {
                "type": "text",
                "text": text[pos:match.start()],
            }

        if match.group("bold_text") is not None:
            yield {
                "type": "bold",
                "text": match.group("bold_text"),
            }

        elif match.group("code_text") is not None:
            yield {
                "type": "code",
                "text": match.group("code_text"),
            }

        elif match.group("link_text") is not None:
            yield {
                "type": "link",
                "text": match.group("link_text"),
                "url": match.group("link_url"),
            }

        elif match.group("italic_text") is not None:
            yield {
                "type": "italic",
                "text": match.group("italic_text"),
            }

        pos = match.end()

    if pos < len(text):
        yield {
            "type": "text",
            "text": text[pos:],
        }


# -----------------------------
# DOCX
# -----------------------------

def _add_hyperlink(
    paragraph,
    text: str,
    url: str,
):
    """Standard python-docx hyperlink workaround."""

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


def _add_inline_runs(
    paragraph,
    text: str,
):
    for token in _iter_inline_tokens(text):
        token_type = token["type"]

        if token_type == "text":
            paragraph.add_run(token["text"])

        elif token_type == "bold":
            paragraph.add_run(
                token["text"]
            ).bold = True

        elif token_type == "italic":
            paragraph.add_run(
                token["text"]
            ).italic = True

        elif token_type == "code":
            run = paragraph.add_run(
                token["text"]
            )

            run.font.name = "Consolas"

        elif token_type == "link":
            _add_hyperlink(
                paragraph,
                token["text"],
                token["url"],
            )


def markdown_to_docx_bytes(
    md_text: str,
    base_dir: Optional[Path] = None,
) -> bytes:
    """
    Convert Markdown to DOCX.

    Raises ImportError if python-docx isn't installed.
    """

    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    base_dir = base_dir or Path(".")

    doc = Document()

    blocks = _parse_markdown_blocks(
        md_text
    )

    for block in blocks:
        btype = block["type"]

        # -------------------------
        # Heading
        # -------------------------

        if btype == "heading":
            level = min(
                max(block["level"], 1),
                5,
            )

            style = (
                "Title"
                if level == 1
                else f"Heading {level - 1}"
            )

            try:
                p = doc.add_paragraph(
                    style=style
                )
            except KeyError:
                p = doc.add_paragraph()

            _add_inline_runs(
                p,
                block["text"],
            )

        # -------------------------
        # Bullet
        # -------------------------

        elif btype == "bullet":
            try:
                p = doc.add_paragraph(
                    style="List Bullet"
                )
            except KeyError:
                p = doc.add_paragraph("• ")

            _add_inline_runs(
                p,
                block["text"],
            )

        # -------------------------
        # Code
        # -------------------------

        elif btype == "code":
            p = doc.add_paragraph()

            run = p.add_run(
                block["text"]
            )

            run.font.name = "Consolas"
            run.font.size = Pt(9)

        # -------------------------
        # Quote
        # -------------------------

        elif btype == "quote":
            p = doc.add_paragraph()

            _add_inline_runs(
                p,
                block["text"],
            )

            for run in p.runs:
                run.italic = True

        # -------------------------
        # Caption
        # -------------------------

        elif btype == "caption":
            p = doc.add_paragraph()

            run = p.add_run(
                block["text"]
            )

            run.italic = True
            run.font.size = Pt(9)

            p.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
            )

        # -------------------------
        # Image
        # -------------------------

        elif btype == "image":
            src = block["src"]

            try:
                if (
                    src.startswith("http://")
                    or src.startswith("https://")
                ):
                    import requests

                    resp = requests.get(
                        src,
                        timeout=10,
                    )

                    resp.raise_for_status()

                    doc.add_picture(
                        BytesIO(
                            resp.content
                        ),
                        width=Inches(5.5),
                    )

                else:
                    img_path = (
                        base_dir / src
                    ).resolve()

                    if img_path.exists():
                        doc.add_picture(
                            str(img_path),
                            width=Inches(5.5),
                        )
                    else:
                        doc.add_paragraph(
                            f"[Image not found: {src}]"
                        )

            except Exception:
                doc.add_paragraph(
                    "[Image could not be embedded: "
                    f"{src}]"
                )

        # -------------------------
        # Paragraph
        # -------------------------

        else:
            p = doc.add_paragraph()

            _add_inline_runs(
                p,
                block["text"],
            )

    buf = BytesIO()

    doc.save(buf)

    return buf.getvalue()


# -----------------------------
# PDF
# -----------------------------

_UNICODE_REPLACEMENTS = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2013": "-",
    "\u2014": "--",
    "\u2026": "...",
    "\u00a0": " ",
    "\u2022": "-",
    "\u2011": "-",
    "\u2012": "-",
    "\u2032": "'",
    "\u2033": '"',
    "\u00b7": "-",
}


def _to_latin1_safe(
    text: str,
) -> str:
    """
    Normalize text for fpdf2's built-in Helvetica/Times fonts.

    Characters that cannot be represented are replaced rather than
    causing PDF generation to fail.
    """

    text = text or ""

    for key, value in _UNICODE_REPLACEMENTS.items():
        text = text.replace(
            key,
            value,
        )

    return (
        text.encode(
            "latin-1",
            errors="replace",
        )
        .decode("latin-1")
    )


def _resolve_image_path(
    src: str,
    base_dir: Path,
) -> Optional[Path]:
    """
    Resolve a Markdown image path safely.

    Supports:
    - absolute filesystem paths
    - relative paths
    - file:// paths
    """

    src = (src or "").strip()

    if not src:
        return None

    if src.startswith("file://"):
        src = src[7:]

    path = Path(src)

    if path.is_absolute():
        resolved = path.resolve()
    else:
        resolved = (
            base_dir / path
        ).resolve()

    if resolved.exists() and resolved.is_file():
        return resolved

    return None


def _pdf_write_inline(
    pdf,
    text: str,
    font_size: float = 11,
):
    """
    Write inline Markdown while preserving basic formatting.

    This deliberately uses FPDF.write() instead of write_html(), which
    gives much more predictable wrapping and page handling.
    """

    for token in _iter_inline_tokens(text):
        token_type = token["type"]

        safe_text = _to_latin1_safe(
            token["text"]
        )

        if not safe_text:
            continue

        if token_type == "bold":
            pdf.set_font(
                "Helvetica",
                "B",
                font_size,
            )

            pdf.write(
                6,
                safe_text,
            )

        elif token_type == "italic":
            pdf.set_font(
                "Helvetica",
                "I",
                font_size,
            )

            pdf.write(
                6,
                safe_text,
            )

        elif token_type == "code":
            pdf.set_font(
                "Courier",
                "",
                font_size - 1,
            )

            pdf.write(
                6,
                safe_text,
            )

        elif token_type == "link":
            pdf.set_font(
                "Helvetica",
                "U",
                font_size,
            )

            pdf.write(
                6,
                safe_text,
            )

        else:
            pdf.set_font(
                "Helvetica",
                "",
                font_size,
            )

            pdf.write(
                6,
                safe_text,
            )


def _pdf_add_paragraph(
    pdf,
    text: str,
):
    pdf.set_font(
        "Helvetica",
        "",
        11,
    )

    _pdf_write_inline(
        pdf,
        text,
        11,
    )

    pdf.ln(8)


def _pdf_add_heading(
    pdf,
    text: str,
    level: int,
):
    level = min(
        max(level, 1),
        6,
    )

    sizes = {
        1: 20,
        2: 17,
        3: 15,
        4: 13,
        5: 12,
        6: 11,
    }

    size = sizes[level]

    # Keep headings together with at least some following content.
    if pdf.get_y() > 245:
        pdf.add_page()

    pdf.set_font(
        "Helvetica",
        "B",
        size,
    )

    _pdf_write_inline(
        pdf,
        text,
        size,
    )

    pdf.ln(
        5 if level <= 2 else 4
    )


def _pdf_add_bullet(
    pdf,
    text: str,
):
    """
    Render a bullet using FPDF primitives rather than HTML.
    """

    left_margin = pdf.l_margin
    bullet_indent = 6

    pdf.set_x(
        left_margin
    )

    pdf.set_font(
        "Helvetica",
        "",
        11,
    )

    pdf.write(
        6,
        "- ",
    )

    pdf.set_x(
        left_margin + bullet_indent
    )

    _pdf_write_inline(
        pdf,
        text,
        11,
    )

    pdf.ln(7)


def _pdf_add_quote(
    pdf,
    text: str,
):
    """
    Render block quotes with a simple indentation.
    """

    left_margin = pdf.l_margin

    pdf.set_x(
        left_margin + 6
    )

    pdf.set_font(
        "Helvetica",
        "I",
        11,
    )

    _pdf_write_inline(
        pdf,
        text,
        11,
    )

    pdf.ln(8)


def _pdf_add_caption(
    pdf,
    text: str,
):
    pdf.set_font(
        "Helvetica",
        "I",
        9,
    )

    available_width = (
        pdf.w - pdf.l_margin - pdf.r_margin
    )

    pdf.multi_cell(
        available_width,
        5,
        _to_latin1_safe(text),
        align="C",
    )

    pdf.ln(4)


def _pdf_add_code(
    pdf,
    text: str,
):
    """
    Render code blocks using Courier.

    multi_cell() is used here because code blocks can contain long
    lines and multiple lines.
    """

    safe_text = _to_latin1_safe(
        text
    )

    if not safe_text:
        return

    pdf.set_font(
        "Courier",
        "",
        8.5,
    )

    available_width = (
        pdf.w - pdf.l_margin - pdf.r_margin
    )

    lines = safe_text.splitlines()

    for line in lines:
        if not line:
            line = " "

        pdf.multi_cell(
            available_width,
            4.5,
            line,
        )

    pdf.ln(3)


def _pdf_add_image(
    pdf,
    src: str,
    alt: str,
    base_dir: Path,
):
    """
    Add a local image to the PDF.

    Remote images are intentionally downloaded first because FPDF's
    image handling is filesystem-oriented and direct HTTP URLs are
    unreliable.
    """

    image_path = _resolve_image_path(
        src,
        base_dir,
    )

    temporary_path = None

    try:
        if image_path is None and (
            src.startswith("http://")
            or src.startswith("https://")
        ):
            import requests

            response = requests.get(
                src,
                timeout=15,
            )

            response.raise_for_status()

            suffix = (
                Path(src.split("?")[0])
                .suffix
            )

            if not suffix:
                suffix = ".img"

            import tempfile

            fd, temporary_name = (
                tempfile.mkstemp(
                    suffix=suffix
                )
            )

            import os

            os.close(fd)

            temporary_path = Path(
                temporary_name
            )

            temporary_path.write_bytes(
                response.content
            )

            image_path = temporary_path

        if image_path is None:
            pdf.set_font(
                "Helvetica",
                "I",
                9,
            )

            pdf.multi_cell(
                0,
                5,
                _to_latin1_safe(
                    f"[Image not found: {alt or src}]"
                ),
            )

            pdf.ln(3)

            return

        # Leave enough space for the image.
        if pdf.get_y() > 235:
            pdf.add_page()

        available_width = (
            pdf.w
            - pdf.l_margin
            - pdf.r_margin
        )

        # Use the image's actual dimensions to calculate a sensible
        # display size while keeping the image inside the page.
        from PIL import Image

        try:
            with Image.open(
                image_path
            ) as img:
                width_px, height_px = (
                    img.size
                )

            if width_px <= 0:
                raise ValueError(
                    "Invalid image width"
                )

            aspect_ratio = (
                height_px / width_px
            )

            display_width = min(
                available_width,
                170,
            )

            display_height = (
                display_width
                * aspect_ratio
            )

            # Prevent extremely tall images from consuming the page.
            max_height = 230

            if display_height > max_height:
                display_height = max_height

                display_width = (
                    display_height
                    / aspect_ratio
                )

            pdf.image(
                str(image_path),
                x=pdf.l_margin,
                y=pdf.get_y(),
                w=display_width,
                h=display_height,
            )

            pdf.ln(
                display_height + 6
            )

        except ImportError:
            # Pillow is not required by requirements.txt.
            # FPDF itself can still determine image dimensions.
            pdf.image(
                str(image_path),
                x=pdf.l_margin,
                w=min(
                    available_width,
                    170,
                ),
            )

            pdf.ln(8)

        except Exception:
            # Last safe image fallback.
            pdf.image(
                str(image_path),
                x=pdf.l_margin,
                w=min(
                    available_width,
                    170,
                ),
            )

            pdf.ln(8)

    except Exception:
        pdf.set_font(
            "Helvetica",
            "I",
            9,
        )

        pdf.multi_cell(
            0,
            5,
            _to_latin1_safe(
                f"[Image could not be embedded: "
                f"{alt or src}]"
            ),
        )

        pdf.ln(3)

    finally:
        if temporary_path is not None:
            try:
                temporary_path.unlink(
                    missing_ok=True
                )
            except Exception:
                pass


def markdown_to_pdf_bytes(
    md_text: str,
    base_dir: Optional[Path] = None,
) -> bytes:
    """
    Convert Markdown to a properly structured PDF.

    Unlike the previous implementation, this does NOT use
    fpdf2.write_html().

    This gives explicit control over:
    - headings
    - paragraphs
    - lists
    - quotes
    - code blocks
    - images
    - page breaks
    - inline formatting
    - long content

    Raises ImportError if fpdf2 isn't installed.
    """

    from fpdf import FPDF

    base_dir = (
        Path(base_dir)
        if base_dir is not None
        else Path(".")
    )

    base_dir = base_dir.resolve()

    pdf = FPDF(
        orientation="P",
        unit="mm",
        format="A4",
    )

    pdf.set_margins(
        left=18,
        top=18,
        right=18,
    )

    pdf.set_auto_page_break(
        auto=True,
        margin=18,
    )

    pdf.add_page()

    # Default body font.
    pdf.set_font(
        "Helvetica",
        "",
        11,
    )

    blocks = _parse_markdown_blocks(
        md_text or ""
    )

    for block in blocks:
        btype = block["type"]

        try:
            # -------------------------
            # Heading
            # -------------------------

            if btype == "heading":
                _pdf_add_heading(
                    pdf,
                    block["text"],
                    block["level"],
                )

            # -------------------------
            # Paragraph
            # -------------------------

            elif btype == "paragraph":
                _pdf_add_paragraph(
                    pdf,
                    block["text"],
                )

            # -------------------------
            # Bullet
            # -------------------------

            elif btype == "bullet":
                _pdf_add_bullet(
                    pdf,
                    block["text"],
                )

            # -------------------------
            # Quote
            # -------------------------

            elif btype == "quote":
                _pdf_add_quote(
                    pdf,
                    block["text"],
                )

            # -------------------------
            # Caption
            # -------------------------

            elif btype == "caption":
                _pdf_add_caption(
                    pdf,
                    block["text"],
                )

            # -------------------------
            # Code
            # -------------------------

            elif btype == "code":
                _pdf_add_code(
                    pdf,
                    block["text"],
                )

            # -------------------------
            # Image
            # -------------------------

            elif btype == "image":
                _pdf_add_image(
                    pdf,
                    block["src"],
                    block.get("alt", ""),
                    base_dir,
                )

        except Exception:
            # Never allow one malformed Markdown block to destroy
            # the entire PDF export.
            safe_text = _to_latin1_safe(
                block.get(
                    "text",
                    "",
                )
            )

            if safe_text:
                pdf.set_font(
                    "Helvetica",
                    "",
                    10,
                )

                pdf.multi_cell(
                    0,
                    5,
                    safe_text,
                )

                pdf.ln(3)

    return bytes(
        pdf.output()
    )











# """
# Convert the tool's generated blog Markdown into downloadable .docx / .pdf
# bytes, without needing pandoc/LibreOffice/pdflatex installed on the host.

# - DOCX: python-docx, with a small hand-rolled Markdown block/inline parser
#   (headings, bold/italic/code/links, bullet lists, code blocks, images).
# - PDF: `markdown` -> HTML -> fpdf2's write_html(). fpdf2's built-in fonts are
#   Latin-1 only, so text is normalized first (smart quotes/dashes -> ASCII);
#   anything outside Latin-1 is dropped rather than raising.

# All third-party imports are lazy (inside the functions), so importing this
# module never fails even if a package isn't installed yet - only calling the
# relevant function does, and callers are expected to catch that.
# """
# from __future__ import annotations

# import os
# import re
# from io import BytesIO
# from pathlib import Path
# from typing import List, Optional


# # -----------------------------
# # Shared: a tiny Markdown block parser
# # -----------------------------
# _HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
# _IMAGE_RE = re.compile(r"^!\[(?P<alt>[^\]]*)\]\((?P<src>[^)]+)\)\s*$")
# _BULLET_RE = re.compile(r"^[-*]\s+(.*)$")


# def _parse_markdown_blocks(md_text: str) -> List[dict]:
#     lines = (md_text or "").splitlines()
#     blocks: List[dict] = []
#     i = 0
#     in_code = False
#     code_lines: List[str] = []

#     while i < len(lines):
#         line = lines[i]
#         stripped = line.strip()

#         if stripped.startswith("```"):
#             if not in_code:
#                 in_code = True
#                 code_lines = []
#             else:
#                 blocks.append({"type": "code", "text": "\n".join(code_lines)})
#                 in_code = False
#             i += 1
#             continue

#         if in_code:
#             code_lines.append(line)
#             i += 1
#             continue

#         if not stripped:
#             i += 1
#             continue

#         m = _IMAGE_RE.match(stripped)
#         if m:
#             blocks.append({"type": "image", "alt": m.group("alt"), "src": m.group("src")})
#             i += 1
#             continue

#         m = _HEADING_RE.match(stripped)
#         if m:
#             blocks.append({"type": "heading", "level": len(m.group(1)), "text": m.group(2).strip()})
#             i += 1
#             continue

#         m = _BULLET_RE.match(stripped)
#         if m:
#             blocks.append({"type": "bullet", "text": m.group(1).strip()})
#             i += 1
#             continue

#         if stripped.startswith(">"):
#             blocks.append({"type": "quote", "text": stripped.lstrip("> ").strip()})
#             i += 1
#             continue

#         if len(stripped) > 1 and stripped.startswith("*") and stripped.endswith("*") and not stripped.startswith("**"):
#             blocks.append({"type": "caption", "text": stripped.strip("*")})
#             i += 1
#             continue

#         blocks.append({"type": "paragraph", "text": stripped})
#         i += 1

#     if in_code and code_lines:
#         blocks.append({"type": "code", "text": "\n".join(code_lines)})

#     return blocks


# # -----------------------------
# # DOCX
# # -----------------------------
# _INLINE_TOKEN_RE = re.compile(
#     r"(?P<bold>\*\*(?P<bold_text>.+?)\*\*)"
#     r"|(?P<code>`(?P<code_text>[^`]+)`)"
#     r"|(?P<link>\[(?P<link_text>[^\]]+)\]\((?P<link_url>[^)]+)\))"
#     r"|(?P<italic>\*(?P<italic_text>[^*]+)\*)"
# )


# def _add_hyperlink(paragraph, text: str, url: str):
#     """Standard python-docx hyperlink workaround (no native API for this)."""
#     from docx.oxml.ns import qn
#     from docx.oxml import OxmlElement

#     part = paragraph.part
#     r_id = part.relate_to(
#         url,
#         "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
#         is_external=True,
#     )
#     hyperlink = OxmlElement("w:hyperlink")
#     hyperlink.set(qn("r:id"), r_id)

#     new_run = OxmlElement("w:r")
#     rpr = OxmlElement("w:rPr")
#     color = OxmlElement("w:color")
#     color.set(qn("w:val"), "0563C1")
#     rpr.append(color)
#     underline = OxmlElement("w:u")
#     underline.set(qn("w:val"), "single")
#     rpr.append(underline)
#     new_run.append(rpr)

#     t = OxmlElement("w:t")
#     t.text = text
#     new_run.append(t)
#     hyperlink.append(new_run)
#     paragraph._p.append(hyperlink)


# def _add_inline_runs(paragraph, text: str):
#     pos = 0
#     for m in _INLINE_TOKEN_RE.finditer(text):
#         if m.start() > pos:
#             paragraph.add_run(text[pos : m.start()])
#         if m.group("bold_text") is not None:
#             paragraph.add_run(m.group("bold_text")).bold = True
#         elif m.group("code_text") is not None:
#             run = paragraph.add_run(m.group("code_text"))
#             run.font.name = "Consolas"
#         elif m.group("link_text") is not None:
#             _add_hyperlink(paragraph, m.group("link_text"), m.group("link_url"))
#         elif m.group("italic_text") is not None:
#             paragraph.add_run(m.group("italic_text")).italic = True
#         pos = m.end()
#     if pos < len(text):
#         paragraph.add_run(text[pos:])


# def markdown_to_docx_bytes(md_text: str, base_dir: Optional[Path] = None) -> bytes:
#     """
#     Raises ImportError if python-docx isn't installed - callers should catch
#     that and show a friendly "export unavailable" message instead of crashing.
#     """
#     from docx import Document
#     from docx.shared import Inches, Pt
#     from docx.enum.text import WD_ALIGN_PARAGRAPH

#     base_dir = base_dir or Path(".")
#     doc = Document()
#     blocks = _parse_markdown_blocks(md_text)

#     for block in blocks:
#         btype = block["type"]

#         if btype == "heading":
#             level = min(max(block["level"], 1), 5)
#             style = "Title" if level == 1 else f"Heading {level - 1}"
#             try:
#                 p = doc.add_paragraph(style=style)
#             except KeyError:
#                 p = doc.add_paragraph()
#             _add_inline_runs(p, block["text"])

#         elif btype == "bullet":
#             try:
#                 p = doc.add_paragraph(style="List Bullet")
#             except KeyError:
#                 p = doc.add_paragraph("• ")
#             _add_inline_runs(p, block["text"])

#         elif btype == "code":
#             p = doc.add_paragraph()
#             run = p.add_run(block["text"])
#             run.font.name = "Consolas"
#             run.font.size = Pt(9)

#         elif btype == "quote":
#             p = doc.add_paragraph()
#             _add_inline_runs(p, block["text"])
#             for run in p.runs:
#                 run.italic = True

#         elif btype == "caption":
#             p = doc.add_paragraph()
#             run = p.add_run(block["text"])
#             run.italic = True
#             run.font.size = Pt(9)
#             p.alignment = WD_ALIGN_PARAGRAPH.CENTER

#         elif btype == "image":
#             src = block["src"]
#             try:
#                 if src.startswith("http://") or src.startswith("https://"):
#                     import requests

#                     resp = requests.get(src, timeout=10)
#                     resp.raise_for_status()
#                     doc.add_picture(BytesIO(resp.content), width=Inches(5.5))
#                 else:
#                     img_path = (base_dir / src).resolve()
#                     if img_path.exists():
#                         doc.add_picture(str(img_path), width=Inches(5.5))
#                     else:
#                         doc.add_paragraph(f"[Image not found: {src}]")
#             except Exception:
#                 doc.add_paragraph(f"[Image could not be embedded: {src}]")

#         else:  # paragraph
#             p = doc.add_paragraph()
#             _add_inline_runs(p, block["text"])

#     buf = BytesIO()
#     doc.save(buf)
#     return buf.getvalue()


# # -----------------------------
# # PDF
# # -----------------------------
# _UNICODE_REPLACEMENTS = {
#     "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
#     "\u2013": "-", "\u2014": "--", "\u2026": "...", "\u00a0": " ",
# }


# def _to_latin1_safe(text: str) -> str:
#     for k, v in _UNICODE_REPLACEMENTS.items():
#         text = text.replace(k, v)
#     # fpdf2's built-in core fonts only support Latin-1; anything else is
#     # dropped rather than crashing the export.
#     return text.encode("latin-1", errors="replace").decode("latin-1")


# def markdown_to_pdf_bytes(md_text: str, base_dir: Optional[Path] = None) -> bytes:
#     """
#     Raises ImportError if `markdown` or `fpdf2` aren't installed - callers
#     should catch that and show a friendly "export unavailable" message.
#     """
#     import markdown as md_lib
#     from fpdf import FPDF

#     base_dir = base_dir or Path(".")
#     safe_md = _to_latin1_safe(md_text or "")

#     pdf = FPDF(format="A4")
#     pdf.set_auto_page_break(auto=True, margin=15)
#     pdf.add_page()
#     pdf.set_font("Helvetica", size=11)

#     original_cwd = os.getcwd()
#     try:
#         # write_html resolves relative <img src="..."> against the current
#         # working directory, so point it at the blog's images/ folder.
#         os.chdir(str(base_dir))
#         html = md_lib.markdown(safe_md, extensions=["extra", "sane_lists"])
#         pdf.write_html(html)
#     except Exception:
#         # If HTML rendering trips on something unexpected, fall back to a
#         # plain-text dump rather than losing the export entirely.
#         pdf.set_font("Helvetica", size=11)
#         pdf.multi_cell(0, 6, safe_md)
#     finally:
#         os.chdir(original_cwd)

#     return bytes(pdf.output())