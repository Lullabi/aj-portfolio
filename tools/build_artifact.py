"""Copy the site into a folder ready to publish as a Claude artifact.

The artifact host adds its own <!doctype>, <html>, <head> and <body>, so this strips
those wrappers from index.html and keeps everything else as-is.

Usage: python tools/build_artifact.py <output-folder>
"""
import re
import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]).resolve()
out.mkdir(parents=True, exist_ok=True)

html = (root / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
head = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', "", head)
(out / "index.html").write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")

for f in [p for ext in ("css", "js", "svg", "png") for p in root.glob("*." + ext)]:
    shutil.copy2(f, out / f.name)
for folder in ("img", "files"):
    shutil.copytree(root / folder, out / folder, dirs_exist_ok=True)
print("built", out)
