#!/usr/bin/env python3
"""Check a Dunhuang commercial-visual prompt before image generation."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


STYLE_GROUPS = {
    "palette": (
        "charcoal",
        "cave black",
        "炭黑",
        "cinnabar",
        "朱砂",
        "malachite",
        "石绿",
        "lapis",
        "石青",
        "ochre",
        "赭石",
        "mineral",
        "矿物",
    ),
    "material": (
        "rock",
        "stone",
        "mural",
        "plaster",
        "ceramic",
        "glass",
        "岩",
        "石",
        "壁画",
        "灰泥",
        "陶瓷",
        "玻璃",
    ),
    "composition": (
        "composition",
        "foreground",
        "middle",
        "background",
        "left",
        "right",
        "构图",
        "前景",
        "中景",
        "背景",
        "左",
        "右",
    ),
    "lighting": (
        "light",
        "shadow",
        "reflection",
        "rim light",
        "光",
        "阴影",
        "反射",
        "倒影",
    ),
    "constraints": (
        "constraints",
        "avoid",
        "do not",
        "no ",
        "不要",
        "禁止",
        "避免",
    ),
}

TEXT_FREE_TERMS = (
    "no text",
    "no letters",
    "no numbers",
    "no typography",
    "无文字",
    "不要文字",
    "无字",
    "禁止文字",
)

SLOP_TERMS = {
    "AI purple": ("ai purple", "purple gradient", "紫色渐变", "紫色光晕"),
    "generic AI symbols": (
        "robot head",
        "ai brain",
        "circuit brain",
        "机器人头",
        "ai大脑",
        "电路大脑",
    ),
    "vague quality words": ("make it premium", "more premium", "高级一点", "更高级"),
}


def contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def check_ratio(text: str, ratio: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    alternatives = {
        ratio.lower(),
        ratio.lower().replace(":", "x"),
        ratio.lower().replace(":", "："),
    }
    return any(item in compact for item in alternatives)


def has_unnegated_term(text: str, term: str) -> bool:
    """Return True when a term appears without a nearby negative instruction."""
    start = 0
    negatives = ("no ", "avoid", "do not", "without", "不要", "避免", "禁止", "无")
    while True:
        index = text.find(term, start)
        if index < 0:
            return False
        prefix = text[max(0, index - 48) : index]
        if not any(marker in prefix for marker in negatives):
            return True
        start = index + len(term)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate a prompt for the dunhuang-aura skill."
    )
    parser.add_argument("prompt", type=Path, help="UTF-8 prompt text file")
    parser.add_argument(
        "--mode",
        choices=("text-free", "exact-text", "placeholder-free"),
        default="text-free",
        help="Expected text mode",
    )
    parser.add_argument("--ratio", default="5:2", help="Expected aspect ratio")
    args = parser.parse_args()

    if not args.prompt.is_file():
        print(f"ERROR: prompt file not found: {args.prompt}")
        return 2

    raw = args.prompt.read_text(encoding="utf-8")
    text = raw.casefold()
    errors: list[str] = []
    warnings: list[str] = []
    passes: list[str] = []

    if check_ratio(text, args.ratio):
        passes.append(f"aspect ratio {args.ratio} is explicit")
    else:
        errors.append(f"aspect ratio {args.ratio} is missing")

    for label, terms in STYLE_GROUPS.items():
        if contains_any(text, terms):
            passes.append(f"{label} guidance is present")
        else:
            errors.append(f"{label} guidance is missing")

    if args.mode == "text-free":
        if contains_any(text, TEXT_FREE_TERMS):
            passes.append("text-free constraint is explicit")
        else:
            errors.append(
                "text-free mode requires an explicit ban on text, letters, or numbers"
            )

        risky_sources = ("phone", "screen", "label", "poster", "seal", "手机", "屏幕", "标签", "海报", "印章")
        has_label_ban = bool(
            re.search(r"no\s+[^.\n]{0,80}(?:labels?|logos?)", text)
            or re.search(r"(?:不要|禁止|无)[^。\n]{0,30}(?:标签|标识|logo)", text)
        )
        if contains_any(text, risky_sources) and not has_label_ban:
            warnings.append(
                "objects that often generate accidental glyphs are present; also ban labels and logos"
            )

    if args.mode == "exact-text":
        if "text (verbatim)" in text or "准确文字" in text or "原文" in text:
            passes.append("exact-text instruction is present")
        else:
            errors.append("exact-text mode requires quoted verbatim copy")

    for label, terms in SLOP_TERMS.items():
        if any(has_unnegated_term(text, term) for term in terms):
            warnings.append(f"possible {label}: replace it with visible design instructions")

    if not contains_any(text, ("religious", "buddha", "apsara", "宗教", "佛", "飞天")):
        warnings.append("religious-figure policy is unspecified")

    print("Dunhuang commercial prompt check")
    print(f"File: {args.prompt}")
    print(f"Mode: {args.mode}")
    print(f"Ratio: {args.ratio}")
    print()

    for item in passes:
        print(f"PASS: {item}")
    for item in warnings:
        print(f"WARN: {item}")
    for item in errors:
        print(f"ERROR: {item}")

    if errors:
        print(f"\nResult: FAIL ({len(errors)} error(s), {len(warnings)} warning(s))")
        return 1

    print(f"\nResult: PASS ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
