"""Build app icons from the original user-supplied ColdLoop mark."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
BG = "#F3F1EA"


def source_mark() -> Image.Image:
    source = Image.open(PUBLIC / "coldloop-logo-source.png").convert("RGBA")
    pixels = source.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b, _ = pixels[x, y]
            distance = max(255 - r, 255 - g, 255 - b)
            alpha = max(0, min(255, (distance - 1) * 12))
            pixels[x, y] = (r, g, b, alpha)
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("Supplied logo image has no visible mark")
    return source.crop(bounds)


def fit_mark(size: int, background: str | None = None) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    mark = source_mark()
    mark.thumbnail((round(size * 0.78), round(size * 0.78)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def save_web_assets() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    logo = source_mark()
    logo.save(PUBLIC / "coldloop-logo.png", optimize=True)
    favicon = Image.new("RGBA", (512, 512), BG)
    mark = logo.copy()
    mark.thumbnail((388, 388), Image.Resampling.LANCZOS)
    favicon.alpha_composite(mark, ((512 - mark.width) // 2, (512 - mark.height) // 2))
    favicon.save(PUBLIC / "favicon.png", optimize=True)
    old_svg = PUBLIC / "favicon.svg"
    if old_svg.exists():
        old_svg.unlink()


def splash(path: Path) -> None:
    with Image.open(path) as old:
        width, height = old.size
    scale = 4
    canvas = Image.new("RGBA", (width * scale, height * scale), BG)
    draw = ImageDraw.Draw(canvas)
    mark = source_mark()
    shortest = min(width, height)
    mark.thumbnail((round(shortest * 0.6 * scale), round(shortest * 0.38 * scale)), Image.Resampling.LANCZOS)
    y = round(height * scale * 0.30)
    canvas.alpha_composite(mark, ((width * scale - mark.width) // 2, y))
    font_path = Path("C:/Windows/Fonts/segoeui.ttf")
    title_font = ImageFont.truetype(str(font_path), max(14, round(shortest * 0.075)) * scale) if font_path.exists() else ImageFont.load_default()
    title = "ColdLoop"
    box = draw.textbbox((0, 0), title, font=title_font)
    draw.text(((width * scale - (box[2] - box[0])) / 2, y + mark.height + round(shortest * 0.035 * scale) - box[1]), title, font=title_font, fill="#20251F")
    canvas.convert("RGB").resize((width, height), Image.Resampling.LANCZOS).save(path, format="PNG", optimize=True)


def main() -> None:
    save_web_assets()
    for density, size in (("mdpi", 108), ("hdpi", 162), ("xhdpi", 216), ("xxhdpi", 324), ("xxxhdpi", 432)):
        folder = RES / f"mipmap-{density}"
        foreground = fit_mark(size)
        foreground.save(folder / "ic_launcher_foreground.png", format="PNG", optimize=True)
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            icon = fit_mark(size, BG)
            if name.endswith("round.png"):
                mask = Image.new("L", icon.size, 0)
                ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
                icon.putalpha(mask)
            icon.save(folder / name, format="PNG", optimize=True)
    splash_paths = list(RES.rglob("splash.png"))
    for path in splash_paths:
        splash(path)
    print(f"Generated PNG favicon, in-app mark, five launcher densities and {len(splash_paths)} splash assets from supplied PNG")


if __name__ == "__main__":
    main()
