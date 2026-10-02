"""Generate the link-preview image (og-image.png) and the home-screen icon (apple-touch-icon.png).

Usage: python tools/make_social.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

root = Path(__file__).resolve().parent.parent
fonts = Path(__file__).resolve().parent / "fonts"

GROUND = (251, 240, 236)
NAVY = (31, 42, 85)
MUTED = (94, 101, 137)
CORAL = (226, 87, 76)
PINK = (247, 189, 182)
BUTTER = (251, 226, 154)


def metal(size):
    """A brushed-metal gradient like the tin rim on the site."""
    w, h = size
    img = Image.new("RGB", size)
    stops = [(0, (246, 248, 249)), (.18, (170, 178, 184)), (.36, (238, 241, 243)), (.55, (138, 148, 155)), (.74, (227, 231, 234)), (1, (152, 161, 167))]
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = (x / w + y / h) / 2
            for (a, ca), (b, cb) in zip(stops, stops[1:]):
                if a <= t <= b:
                    k = (t - a) / (b - a)
                    px[x, y] = tuple(int(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))
                    break
    return img


def rounded_mask(size, r):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255)
    return m


def tin(canvas, box):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    # shadow
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0 + 10, y0 + 30, x1 + 10, y1 + 30], 96, fill=(31, 42, 85, 90))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(24)))
    # rim
    canvas.paste(metal((w, h)), (x0, y0), rounded_mask((w, h), 96))
    # tray + photo
    inset = 18
    tw, th = w - 2 * inset, h - 2 * inset
    tray = Image.new("RGB", (tw, th), (184, 192, 197))
    canvas.paste(tray, (x0 + inset, y0 + inset), rounded_mask((tw, th), 80))
    photo = Image.open(root / "img/aj.jpg").convert("RGB")
    pi = 30
    pw, ph = w - 2 * pi, h - 2 * pi
    scale = max(pw / photo.width, ph / photo.height)
    photo = photo.resize((int(photo.width * scale), int(photo.height * scale)), Image.LANCZOS)
    left = (photo.width - pw) // 2
    photo = photo.crop((left, 0, left + pw, ph))
    canvas.paste(photo, (x0 + pi, y0 + pi), rounded_mask((pw, ph), 66))
    # peeled lid curled at the bottom, with its ring-pull
    d = ImageDraw.Draw(canvas)
    cy = y1 - 40
    d.rounded_rectangle([x0 + 40, cy - 16, x1 - 40, cy + 16], 16, fill=PINK, outline=(214, 150, 142), width=2)
    d.line([x0 + 48, cy - 6, x1 - 48, cy - 6], fill=(255, 238, 234), width=4)
    cx = (x0 + x1) // 2
    d.ellipse([cx - 26, cy - 62, cx + 26, cy - 6], outline=(150, 158, 164), width=9)
    d.ellipse([cx - 9, cy - 16, cx + 9, cy + 2], fill=(205, 211, 215), outline=(125, 134, 140), width=2)


def og():
    W, H = 1200, 630
    c = Image.new("RGBA", (W, H), GROUND + (255,))
    d = ImageDraw.Draw(c)
    for x in range(0, W, 24):
        for y in range(0, H, 24):
            d.ellipse([x, y, x + 2, y + 2], fill=(31, 42, 85, 22))
    tin(c, (90, 70, 450, 550))
    d = ImageDraw.Draw(c)
    mono = ImageFont.truetype(str(fonts / "dmmono.woff2"), 22)
    disp = ImageFont.truetype(str(fonts / "fraunces.woff2"), 104)
    body = ImageFont.truetype(str(fonts / "hanken.woff2"), 38)
    x = 530
    d.text((x, 150), "HI, I'M AARON (AJ FOR SHORT)", font=mono, fill=CORAL)
    d.text((x - 4, 186), "Aaron", font=disp, fill=NAVY)
    d.text((x - 4, 292), "Hervey", font=disp, fill=NAVY)
    d.text((x, 430), "A product designer who", font=body, fill=MUTED)
    d.text((x, 476), "builds what I design.", font=body, fill=MUTED)
    d.rounded_rectangle([x, 548, x + 360, 586], 19, fill=NAVY)
    d.text((x + 22, 556), "UX · RESEARCH · FRONT-END", font=mono, fill=BUTTER)
    c.convert("RGB").save(root / "og-image.png", optimize=True)


def touch_icon():
    S = 180
    c = Image.new("RGBA", (S, S), GROUND + (255,))
    d = ImageDraw.Draw(c)
    c.paste(metal((140, 150)), (20, 15), rounded_mask((140, 150), 46))
    d.rounded_rectangle([30, 25, 150, 155], 38, fill=PINK, outline=(31, 42, 85), width=3)
    d.ellipse([72, 34, 108, 74], outline=(140, 148, 154), width=7)
    d.ellipse([84, 60, 96, 72], fill=(205, 211, 215))
    disp = ImageFont.truetype(str(fonts / "fraunces.woff2"), 52)
    d.text((90, 112), "AH", font=disp, fill=NAVY, anchor="mm")
    c.convert("RGB").save(root / "apple-touch-icon.png", optimize=True)


og()
touch_icon()
print("wrote og-image.png and apple-touch-icon.png")
