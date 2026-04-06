import argparse
from collections import deque

from PIL import Image


def _flood_fill_image(input_path, output_path, predicate, clear_color):
    try:
        img = Image.open(input_path).convert("RGBA")
    except OSError as exc:
        print(f"Error opening {input_path}: {exc}")
        return False

    width, height = img.size
    pixels = img.load()

    visited = set()
    queue = deque()

    # Add borders to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    for q in queue:
        visited.add(q)

    while queue:
        x, y = queue.popleft()
        curr_pixel = pixels[x, y]

        if predicate(curr_pixel):
            pixels[x, y] = clear_color

            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    try:
        alpha_bbox = img.split()[3].getbbox()
        result = img.crop(alpha_bbox) if alpha_bbox is not None else img
        result.save(output_path, "PNG")
    except OSError as exc:
        print(f"Error saving {output_path}: {exc}")
        return False
    return True


def make_transparent(input_path, output_path):
    # High threshold to catch compressions artifacts, but since it's an AI generated flat image, 230 should be safe.
    def is_white_ish(c):
        return c[0] > 230 and c[1] > 230 and c[2] > 230 and c[3] > 0
    return _flood_fill_image(input_path, output_path, is_white_ish, (255, 255, 255, 0))


def make_black_transparent(input_path, output_path):
    """Flood from image borders; black-ish pixels connected to the edge become transparent."""
    def is_black_ish(c):
        return c[0] < 25 and c[1] < 25 and c[2] < 25 and c[3] > 0
    return _flood_fill_image(input_path, output_path, is_black_ish, (0, 0, 0, 0))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Remove background connected to image edges (PNG)."
    )
    parser.add_argument(
        "input",
        nargs="?",
        help="Input PNG path (omit to run default app icon batch)",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Output PNG path (default: overwrite input)",
    )
    parser.add_argument(
        "--black",
        action="store_true",
        help="Remove black-ish edge-connected background (default mode is white)",
    )
    args = parser.parse_args()

    if args.input:
        out = args.output or args.input
        fn = make_black_transparent if args.black else make_transparent
        ok = fn(args.input, out)
        if ok:
            print(f"Background removed: {out}")
        raise SystemExit(0 if ok else 1)

    if args.output:
        parser.error("--output requires an input path")
    if args.black:
        parser.error("--black requires an input path")

    results = [
        make_transparent(
            "assets/app-icon.icon/Assets/icon.png",
            "assets/app-icon.icon/Assets/icon.png",
        ),
        make_transparent(
            "assets/android-icon.png",
            "assets/android-icon.png",
        ),
    ]
    if not all(results):
        raise SystemExit(1)
    print("Background removed successfully")
