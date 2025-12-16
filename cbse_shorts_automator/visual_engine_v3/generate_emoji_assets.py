import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

# --- Configuration ---
OUTPUT_DIR = "emoji_icons"
IMAGE_SIZE = (160, 160)  # Canvas size (pixels)
FONT_SIZE =     109          # Emoji font size (pixels) - Noto bitmaps are optimized for 128px
BG_COLOR = (0, 0, 0, 0)  # Fully transparent background

EMOJI_LIST = {
    '⚡': 'high_voltage.png',
    '🚀': 'rocket.png',
    '⏱️': 'stopwatch.png',
    '💯': 'hundred_points.png',
    '🔥': 'fire.png',
    '🎯': 'bullseye.png',
    '✨': 'sparkles.png',
    '💥': 'collision.png',
    '🌟': 'glowing_star.png',
    '🔔': 'bell.png',
    '📎': 'paperclip.png',
    '📚': 'books.png',
    '💪': 'flexed_biceps.png',
    '📖': 'open_book.png',
    '⏱': 'stopwatch.png', # Note: This will overwrite the previous stopwatch.png
}

def get_noto_emoji_path():
    """
    Robustly finds the Noto Color Emoji font path on Ubuntu.
    """
    # 1. Check standard path for Ubuntu/Debian
    standard_path = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
    if os.path.exists(standard_path):
        return standard_path

    # 2. Fallback: Ask fontconfig (fc-list) where the file is
    try:
        # Use subprocess to ask the system for the path
        result = subprocess.check_output(['fc-list', 'Noto Color Emoji', ':file'], text=True)
        # Result looks like: "/usr/share/fonts/.../NotoColorEmoji.ttf: \n"
        if result:
            path = result.split(":")[0].strip()
            if os.path.exists(path):
                return path
    except Exception as e:
        print(f"Warning: Could not use fontconfig to find font ({e})")

    raise OSError("Could not locate 'NotoColorEmoji.ttf'. Please ensure 'fonts-noto-color-emoji' is installed.")

def create_emoji_image(emoji_char, filename, font_path):
    try:
        # Create a transparent image
        img = Image.new("RGBA", IMAGE_SIZE, BG_COLOR)
        draw = ImageDraw.Draw(img)

        # Load the font
        # We explicitly use the layout_engine=ImageFont.LAYOUT_RAQM if available, 
        # but basic rendering works in newer Pillow versions.
        font = ImageFont.truetype(font_path, FONT_SIZE)

        # Calculate position to center the emoji
        # Note: Emojis can have tricky bounding boxes. 
        # using anchor='mm' (middle-middle) is the modern way to center text.
        
        # Draw the text with embedded_color=True (Crucial for Noto Color Emoji)
        draw.text(
            (IMAGE_SIZE[0] // 2, IMAGE_SIZE[1] // 2),
            emoji_char,
            font=font,
            anchor="mm",
            embedded_color=True
        )

        # Save the file
        full_path = os.path.join(OUTPUT_DIR, filename)
        img.save(full_path)
        print(f"✅ Generated: {filename}")

    except Exception as e:
        print(f"❌ Error generating {filename}: {e}")

def main():
    # 1. Create output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 2. Locate Font
    try:
        font_path = get_noto_emoji_path()
        print(f"Using font: {font_path}")
    except OSError as e:
        print(f"CRITICAL ERROR: {e}")
        return

    # 3. Generate Images
    print("Starting generation...")
    for emoji_char, filename in EMOJI_LIST.items():
        create_emoji_image(emoji_char, filename, font_path)
    
    print("\nProcessing complete.")

if __name__ == "__main__":
    main()