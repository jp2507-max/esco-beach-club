from PIL import Image

def make_transparent(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
    except OSError as exc:
        print(f"Error opening {input_path}: {exc}")
        return False

    width, height = img.size
    pixels = img.load()

    visited = set()
    queue = []

    # Add borders to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    for q in queue:
        visited.add(q)

    # High threshold to catch compressions artifacts, but since it's an AI generated flat image, 230 should be safe.
    def is_white_ish(c):
        return c[0] > 230 and c[1] > 230 and c[2] > 230 and c[3] > 0

    while queue:
        x, y = queue.pop(0)
        curr_pixel = pixels[x, y]

        if is_white_ish(curr_pixel):
            pixels[x, y] = (255, 255, 255, 0) # Make transparent

            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny))

    try:
        img.save(output_path, "PNG")
    except OSError as exc:
        print(f"Error saving {output_path}: {exc}")
        return False
    return True

if __name__ == "__main__":
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
