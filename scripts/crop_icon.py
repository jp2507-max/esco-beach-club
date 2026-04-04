import sys
from PIL import Image

def crop_and_resize(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening {input_path}: {e}")
        return
        
    width, height = img.size
    pixels = img.load()
    
    # Find bounding box of non-transparent pixels
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1
    
    # We will also ignore almost white/transparent pixels that might be artifacts
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Since we made outer white transparent (alpha 0)
            if a > 0:
                # DALL-E may have added a drop shadow or anti-aliasing which might be nearly transparent
                if a > 10:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y

    if min_x > max_x or min_y > max_y:
        print("Image is entirely empty/transparent.")
        return

    # To ensure we don't bring in weird corner anti-aliasing, let's crop in just a little bit more (e.g. 10 pixels)
    # Actually, DALL-E draws squircle corners. Let's just crop to the exact bounds first.
    print(f"Original size: {width}x{height}")
    print(f"Bounding box found: ({min_x}, {min_y}) to ({max_x}, {max_y})")
    
    # Crop
    cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    
    # Resize back to 1024x1024
    # Image.Resampling.LANCZOS is high quality filter
    resized = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    resized.save(output_path, "PNG")
    print(f"Saved {output_path} as 1024x1024.")

crop_and_resize("assets/app-icon.icon/Assets/icon.png", "assets/app-icon.icon/Assets/icon.png")
crop_and_resize("assets/android-icon.png", "assets/android-icon.png")
print("Done!")
