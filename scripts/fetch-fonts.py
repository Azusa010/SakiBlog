"""把 Google Fonts 的自托管字体文件与 @font-face CSS 拉取到 public/fonts。

用法：
    python scripts/fetch-fonts.py

与线上服务器使用的文件名规则一致（md5(url)[:6]-原文件名），
这样本地仓库与服务器部署目录中的字体文件可以逐字节对应。
"""

import hashlib
import os
import re
import urllib.request

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

FAMILIES = [
    "Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400",
    "EB+Garamond:ital,wght@0,400;0,500;1,400",
    "Geist:wght@300;400;500",
    "Cinzel:wght@500;600",
]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")


def main() -> None:
    css = ""
    for family in FAMILIES:
        url = f"https://fonts.googleapis.com/css2?family={family}&display=swap"
        req = urllib.request.Request(url, headers=UA)
        css += urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

    os.makedirs(OUT, exist_ok=True)
    urls = sorted(set(re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", css)))
    print(f"remote urls: {len(urls)}")

    count = 0
    for url in urls:
        base = url.split("/")[-1].split("?")[0]
        digest = hashlib.md5(url.encode()).hexdigest()[:6]
        filename = f"{digest}-{base}"
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        with open(os.path.join(OUT, filename), "wb") as fh:
            fh.write(data)
        css = css.replace(url, f"/fonts/{filename}")
        count += 1

    # 用 LF 换行写盘，保证 Windows 与 Linux 生成的 CSS 逐字节一致
    with open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(css)
    print(f"downloaded {count} files -> {OUT}")


if __name__ == "__main__":
    main()
