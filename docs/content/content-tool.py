#!/usr/bin/env python3
"""
Round-trip the editable text of a page between HTML and Markdown.

    python3 content-tool.py export index.html   ->  index-content.md
    python3 content-tool.py apply  index.html   <-  reads index-content.md, rewrites the page

Design notes, both of which came out of a round-trip test that failed:

1. The HTML is never re-serialised. An earlier version parsed with BeautifulSoup
   and wrote `str(soup)` back out; that reformatted the entire document - doctype
   recased, attributes reordered and alphabetised, void tags gaining `/>` - 1750
   changed lines for a two-word edit. This version instead scans the raw source,
   records the byte offsets of each text run, and splices new text in at those
   offsets. Everything outside the edited runs is left untouched, so the diff
   contains only the words that actually changed.

2. Field values stop at the next heading of ANY level. The first version split
   the Markdown on `#### ` alone, so each value swallowed the trailing blank line
   and the following `## block-name` header, and those got written into the page.

Only text between tags is ever read or written. Tags, attributes, classes, image
paths and layout are not represented in the Markdown at all, so no edit made
there can break the page structure.
"""
import json
import re
import sys
from pathlib import Path

SKIP_CONTENT = {"script", "style", "svg", "noscript"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr"}

CLASS_LABELS = [
    ("eyebrow-section", "eyebrow"), ("eyebrow-item", "card eyebrow"),
    ("gsap_split", "heading line"), ("button-text", "button"),
    ("stats-bar-number", "stat number"), ("stats-bar-label", "stat label"),
    ("partner-banner-heading", "tile heading"), ("partner-marquee-item", "marquee chip"),
    ("hero-trust-item", "trust tick"), ("lifecycle-stage", "stage"),
    ("slide-content-text", "slide text"), ("u-text-size-large", "large text"),
    ("badge", "badge"), ("tag-item", "tag"), ("u-text-color-muted", "label"),
]
TAG_LABELS = {"h1": "h1", "h2": "h2", "h3": "h3", "h4": "h4", "p": "paragraph",
              "blockquote": "quote", "strong": "bold", "li": "list item",
              "title": "page title", "label": "form label", "button": "button"}


def scan(html):
    """Every text run in the raw source, as (start, end, text, stack)."""
    nodes, stack, i, n = [], [], 0, len(html)
    while i < n:
        if html.startswith("<!", i):                      # comment or doctype
            end = html.find("-->", i) + 3 if html.startswith("<!--", i) else html.find(">", i) + 1
            i = end if end > 0 else n
            continue
        if html[i] == "<":
            gt = html.find(">", i)
            if gt == -1:
                break
            raw = html[i:gt + 1]
            close = re.match(r"</\s*([a-zA-Z0-9:-]+)", raw)
            if close:
                name = close.group(1).lower()
                for k in range(len(stack) - 1, -1, -1):   # unwind to match
                    if stack[k][0] == name:
                        del stack[k:]
                        break
                i = gt + 1
                continue
            open_m = re.match(r"<\s*([a-zA-Z0-9:-]+)([^>]*)", raw)
            if open_m:
                name, attrs = open_m.group(1).lower(), open_m.group(2)
                if name in SKIP_CONTENT:                  # jump the whole element
                    endtag = html.find(f"</{name}", gt)
                    i = (html.find(">", endtag) + 1) if endtag != -1 else n
                    continue
                if not (raw.rstrip().endswith("/>") or name in VOID):
                    stack.append((name, attrs))
            i = gt + 1
            continue
        lt = html.find("<", i)
        lt = n if lt == -1 else lt
        run = html[i:lt]
        if run.strip():
            nodes.append((i, lt, run, list(stack)))
        i = lt
    return nodes


def block_of(stack):
    for name, attrs in reversed(stack):
        if name == "header":
            return "nav"
        if name == "footer":
            return "footer"
        if name == "section":
            m = re.search(r'id="([^"]+)"', attrs)
            if m:
                return m.group(1)
            c = re.search(r'class="([^"]+)"', attrs)
            return c.group(1).split()[0] if c else "section"
    return "page"


def label_of(stack):
    if not stack:
        return "text"
    name, attrs = stack[-1]
    cls = (re.search(r'class="([^"]*)"', attrs) or [None, ""])[1] if 'class="' in attrs else ""
    for needle, lbl in CLASS_LABELS:
        if needle in cls:
            return lbl
    for nm, _ in reversed(stack):                          # inherit from a parent
        if nm in TAG_LABELS:
            return TAG_LABELS[nm]
    return TAG_LABELS.get(name, name)


def parse_md(text):
    """key -> value. Values end at the next heading of any level."""
    edits, key, buf = {}, None, []
    for line in text.split("\n"):
        if line.startswith("#### "):
            if key:
                edits[key] = "\n".join(buf).strip()
            key, buf = line[5:].split("·")[0].strip(), []
        elif line.startswith("#"):
            if key:
                edits[key] = "\n".join(buf).strip()
            key, buf = None, []
        elif key is not None:
            buf.append(line)
    if key:
        edits[key] = "\n".join(buf).strip()
    return edits


def keyed(html):
    """Stable key -> node, using position in the scan order."""
    out, counters = [], {}
    for idx, (a, b, run, stack) in enumerate(scan(html)):
        blk = block_of(stack)
        counters[blk] = counters.get(blk, 0) + 1
        out.append((f"{blk}.{counters[blk]:02d}", label_of(stack), a, b, run))
    return out


def export(path: Path):
    html = path.read_text(encoding="utf-8")
    fields = keyed(html)
    lines = [
        f"# Editable content — {path.name}", "",
        "Edit **only the text on the line(s) directly under each `####` heading.**",
        "",
        "- Leave every `####` and `##` line exactly as it is — they are how each",
        "  piece of text is matched back to its place on the page.",
        "- To blank a field, put a single `-` on its line.",
        "- `&amp;` means an ampersand and `<br>` is a line break; keep them as-is.",
        "",
        "Send the edited file back and it will be applied to the page.", "",
    ]
    current = None
    for key, label, _a, _b, run in fields:
        blk = key.rsplit(".", 1)[0]
        if blk != current:
            lines += [f"## {blk}", ""]
            current = blk
        lines += [f"#### {key} · {label}", run.strip(), ""]

    md = path.parent / "content" / f"{path.stem}-content.md"
    md.parent.mkdir(exist_ok=True)
    md.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {md.relative_to(path.parent)}  ({len(fields)} editable fields)")


def apply(path: Path):
    html = path.read_text(encoding="utf-8")
    md = path.parent / "content" / f"{path.stem}-content.md"
    edits = parse_md(md.read_text(encoding="utf-8"))
    fields = keyed(html)

    changes = []
    for key, _label, a, b, run in fields:
        if key not in edits:
            continue
        new = "" if edits[key] == "-" else edits[key]
        if new != run.strip():
            lead = run[: len(run) - len(run.lstrip())]
            trail = run[len(run.rstrip()):]
            changes.append((a, b, lead + new + trail, run.strip(), new))

    for a, b, repl, old, new in reversed(changes):        # back-to-front keeps offsets valid
        html = html[:a] + repl + html[b:]
        print(f"  {old[:58]!r} -> {new[:58]!r}")

    path.write_text(html, encoding="utf-8")
    print(f"\napplied {len(changes)} change(s) to {path.name}")


if __name__ == "__main__":
    mode, target = sys.argv[1], Path(sys.argv[2])
    if not target.is_absolute():
        target = Path(__file__).resolve().parent.parent / target
    (export if mode == "export" else apply)(target)
