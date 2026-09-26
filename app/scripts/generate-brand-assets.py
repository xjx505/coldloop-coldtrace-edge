"""Generate the ColdLoop launcher, splash, and favicon assets deterministically."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android" / "app" / "src" / "main" / "res"
BG = "#F4F2EC"
GREEN = "#42685C"
INK = "#292D2A"
MUTED = "#68716C"
SCALE = 4


def cubic(p0, p1, p2, p3, steps=20):
    points = []
    for index in range(steps + 1):
        t = index / steps
        u = 1 - t
        points.append((
            u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1],
        ))
    return points


def mark(size, background=None):
    side = size * SCALE
    image = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if background:
        draw.rectangle((0, 0, side, side), fill=background)

    scale = side / 108
    segments = [
        ((76, 32), (92, 46), (92, 62), (76, 76)),
        ((76, 76), (62, 92), (46, 92), (32, 76)),
        ((32, 76), (18, 62), (18, 46), (32, 32)),
        ((32, 32), (43, 21), (58, 20), (69, 26)),
    ]
    points = []
    for segment in segments:
        section = cubic(*segment)
        points.extend(section if not points else section[1:])
    mapped = [(round(x * scale), round(y * scale)) for x, y in points]
    stroke = max(2, round(7 * scale))
    draw.line(mapped, fill=GREEN, width=stroke, joint="curve")
    cap = max(1, round(stroke / 2))
    for x, y in (mapped[0], mapped[-1]):
        draw.ellipse((x - cap, y - cap, x + cap, y + cap), fill=GREEN)
    draw.polygon([(round(x * scale), round(y * scale)) for x, y in ((77, 31), (66, 30), (72, 23))], fill=GREEN)

    stem_width = max(2, round(5.2 * scale))
    center_x = round(54 * scale)
    draw.line((center_x, round(39 * scale), center_x, round(66 * scale)), fill=GREEN, width=stem_width)
    bulb_radius = round(9 * scale)
    draw.ellipse(
        (center_x - bulb_radius, round(65 * scale) - bulb_radius,
         center_x + bulb_radius, round(65 * scale) + bulb_radius),
        fill=BG, outline=GREEN, width=stem_width,
    )
    draw.line((center_x, round(47 * scale), center_x, round(65 * scale)), fill=GREEN, width=stem_width)
    return image.resize((size, size), Image.Resampling.LANCZOS)


def launcher_icon(path, round_icon=False):
    with Image.open(path) as old:
        width, height = old.size
    size = min(width, height)
    if round_icon:
        image = mark(size * SCALE, BG)
        mask = Image.new("L", image.size, 0)
        ImageDraw.Draw(mask).ellipse((0, 0, image.width - 1, image.height - 1), fill=255)
        image.putalpha(mask)
        image = image.resize((width, height), Image.Resampling.LANCZOS)
    else:
        image = mark(size, BG).resize((width, height), Image.Resampling.LANCZOS)
    image.save(path, format="PNG", optimize=True)


def font(size, bold=False):
    windows_fonts = Path("C:/Windows/Fonts")
    candidates = [windows_fonts / ("seguisb.ttf" if bold else "segoeui.ttf"), windows_fonts / "arial.ttf"]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def splash(path):
    with Image.open(path) as old:
        width, height = old.size
    factor = SCALE
    image = Image.new("RGB", (width * factor, height * factor), BG)
    draw = ImageDraw.Draw(image)
    shortest = min(width, height)
    mark_px = round(shortest * 0.38)
    mark_image = mark(mark_px, None).resize((mark_px * factor, mark_px * factor), Image.Resampling.LANCZOS)
    title_font = font(max(14, round(shortest * 0.075)) * factor, bold=True)
    label_font = font(max(8, round(shortest * 0.034)) * factor)
    title, label = "ColdLoop", "COLD-CHAIN MONITORING"
    title_box = draw.textbbox((0, 0), title, font=title_font)
    label_box = draw.textbbox((0, 0), label, font=label_font)
    title_h, label_h = title_box[3] - title_box[1], label_box[3] - label_box[1]
    gap1, gap2 = round(shortest * 0.035 * factor), round(shortest * 0.015 * factor)
    total_h = mark_image.height + gap1 + title_h + gap2 + label_h
    y = (height * factor - total_h) // 2
    image.paste(mark_image, ((width * factor - mark_image.width) // 2, y), mark_image)
    y += mark_image.height + gap1
    draw.text(((width * factor - (title_box[2] - title_box[0])) / 2, y - title_box[1]), title, font=title_font, fill=INK)
    y += title_h + gap2
    draw.text(((width * factor - (label_box[2] - label_box[0])) / 2, y - label_box[1]), label, font=label_font, fill=MUTED)
    image.resize((width, height), Image.Resampling.LANCZOS).save(path, format="PNG", optimize=True)


def main():
    for density, size in (("mdpi", 108), ("hdpi", 162), ("xhdpi", 216), ("xxhdpi", 324), ("xxxhdpi", 432)):
        foreground = RES / f"mipmap-{density}" / "ic_launcher_foreground.png"
        mark(size, None).save(foreground, format="PNG", optimize=True)
    for density in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"):
        folder = RES / f"mipmap-{density}"
        launcher_icon(folder / "ic_launcher.png")
        launcher_icon(folder / "ic_launcher_round.png", round_icon=True)
    splash_paths = list(RES.rglob("splash.png"))
    for path in splash_paths:
        splash(path)

    favicon = ROOT / "public" / "favicon.svg"
    favicon.parent.mkdir(parents=True, exist_ok=True)
    favicon.write_text(
        f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" role="img" aria-label="ColdLoop">
  <rect width="108" height="108" rx="22" fill="{BG}"/>
  <path d="M76 32 C92 46 92 62 76 76 C62 92 46 92 32 76 C18 62 18 46 32 32 C43 21 58 20 69 26" fill="none" stroke="{GREEN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M77 31 66 30 72 23Z" fill="{GREEN}"/>
  <path d="M54 39v26" fill="none" stroke="{GREEN}" stroke-width="5.2" stroke-linecap="round"/>
  <circle cx="54" cy="65" r="9" fill="{BG}" stroke="{GREEN}" stroke-width="5.2"/>
  <path d="M54 47v18" fill="none" stroke="{GREEN}" stroke-width="5.2" stroke-linecap="round"/>
</svg>
''',
        encoding="utf-8",
    )
    print(f"Generated {len(splash_paths)} splash assets, launcher assets, and {favicon}")


if __name__ == "__main__":
    main()
