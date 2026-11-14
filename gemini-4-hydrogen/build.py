#!/usr/bin/env python3
"""将 src/ 下的模板与七个三维模块拼装为可独立打开的 index.html。"""

import argparse
from pathlib import Path

MODULES = [
    "01-primitives.js",
    "02-world-terrain.js",
    "03-entities.js",
    "04-buildings-trees.js",
    "05-boats.js",
    "06-scenes.js",
    "07-camera-ui.js",
]

CDN_TAG = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'


def build(inline_three: str | None, out_path: Path) -> None:
    root = Path(__file__).resolve().parent
    src_dir = root / "src"

    html = (src_dir / "template.html").read_text(encoding="utf-8")

    if inline_three:
        three_code = Path(inline_three).read_text(encoding="utf-8")
        three_tag = f"<script>\n{three_code}\n</script>"
    else:
        three_tag = CDN_TAG

    module_blocks = []
    for name in MODULES:
        code = (src_dir / name).read_text(encoding="utf-8")
        module_blocks.append(f"<script>\n/* === {name} === */\n{code}\n</script>")

    html = html.replace("{{THREE_SCRIPT}}", three_tag)
    html = html.replace("{{MODULES_SCRIPT}}", "\n".join(module_blocks))

    out_path.write_text(html, encoding="utf-8")
    size_kb = out_path.stat().st_size / 1024.0
    print(f"已生成独立网页: {out_path} ({size_kb:.1f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser(description="构建《清明上河图》三维独立单页 index.html")
    parser.add_argument("-o", "--output", default="index.html", help="输出文件路径（默认 index.html）")
    parser.add_argument(
        "--inline-three",
        default=None,
        help="可选：传入本地 three.min.js (r128) 路径，将其直接内嵌实现完全断网离线打开",
    )
    args = parser.parse_args()
    build(args.inline_three, Path(args.output))


if __name__ == "__main__":
    main()
