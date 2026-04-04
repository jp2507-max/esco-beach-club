"""
Trim uniform outer border from a logo PNG (e.g. excess black/transparent margin).

Uses edge flood-fill: pixels matching the corner color and connected to the image
edge are treated as background and cropped away. Inner regions of the same color
sealed off by other colors are kept.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def trim_edge_connected_background(
    im: Image.Image, color_tolerance: int = 14
) -> Image.Image:
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg = px[0, 0]

    def matches_bg(p: tuple[int, int, int, int]) -> bool:
        return all(abs(p[i] - bg[i]) <= color_tolerance for i in range(4))

    visited = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        if not matches_bg(px[x, y]):
            continue
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    min_x, min_y = w, h
    max_x, max_y = -1, -1
    found = False
    for y in range(h):
        for x in range(w):
            if visited[y][x] and matches_bg(px[x, y]):
                continue
            found = True
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    if not found:
        return rgba

    # small safety pad so anti-aliased edge isn’t clipped
    pad = 2
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w - 1, max_x + pad)
    max_y = min(h - 1, max_y + pad)
    return rgba.crop((min_x, min_y, max_x + 1, max_y + 1))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Defaults to overwriting input",
    )
    parser.add_argument(
        "-t",
        "--tolerance",
        type=int,
        default=14,
        help="Per-channel distance from corner color to treat as background",
    )
    args = parser.parse_args()
    out = args.output or args.input

    with Image.open(args.input) as img:
        before = img.size
        trimmed = trim_edge_connected_background(img, color_tolerance=args.tolerance)
        after = trimmed.size
        trimmed.save(out, optimize=True)
    print(f"{args.input}: {before[0]}x{before[1]} -> {after[0]}x{after[1]} -> {out}")


if __name__ == "__main__":
    main()
