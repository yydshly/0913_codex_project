"""只读取生成 PNG，记录分格与透明边界；不修改或重绘图片。"""
from pathlib import Path
from PIL import Image
import hashlib
import json
import struct

assets = Path(__file__).resolve().parent.parent / "assets"
path = assets / "xian-scenic-sprites-v1.png"
image = Image.open(path).convert("RGBA")
plan = json.loads((assets / "xian-position-plan.json").read_text(encoding="utf-8"))
ids = ["bell", "pagoda", "daming", "hanyang", "huaqing", "terracotta", "cuihua", "louguan"]
rows = []
cache = Path(__file__).resolve().parent / "node_modules" / ".cache" / "scenic-rgba"
cache.mkdir(parents=True, exist_ok=True)
for i, identity in enumerate(ids):
    x0, x1 = (i % 4) * image.width // 4, (i % 4 + 1) * image.width // 4
    y0, y1 = (i // 4) * image.height // 2, (i // 4 + 1) * image.height // 2
    alpha = image.crop((x0, y0, x1, y1)).getchannel("A")
    solid = alpha.point(lambda a: 255 if a >= 128 else 0)
    bounds = solid.getbbox()
    if not bounds:
        raise ValueError(f"{identity}: 没有可见主体")
    edge_count = sum(solid.getpixel((x, y)) > 0 for x in range(solid.width) for y in (0, solid.height - 1))
    edge_count += sum(solid.getpixel((x, y)) > 0 for y in range(solid.height) for x in (0, solid.width - 1))
    if edge_count:
        raise ValueError(f"{identity}: 主体触及分格边界，需要重新生成或调整素材")
    p = next(p for p in plan["places"] if p["id"] == identity)
    # 解码像素缓存用于离线合成测试；原始PNG保持不变，不生成裁切图片。
    decoded = image.crop((x0, y0, x1, y1)).tobytes()
    (cache / f"{identity}.rgba").write_bytes(decoded)
    rows.append({"id": identity, "name": p["name"], "label": p["label"], "description": p["headline"],
                 "source": p["introSource"], "crop": {"x": x0, "y": y0, "width": x1-x0, "height": y1-y0},
                 "alphaBounds": list(bounds), "solidBoundaryPixels": edge_count,
                 "decodedSha256": hashlib.sha256(struct.pack(">II", x1-x0, y1-y0) + decoded).hexdigest(),
                 "identityStatus": "unverified", "kind": "generated-candidate",
                 "anchor": {"u": .5, "v": .5}, "anchorMeaning": "素材分格中心，仅为构图锚点，不代表真实建筑接地基部"})
manifest = {"version": 1, "date": "2026-09-14", "sheet": "xian-scenic-sprites-v1.png",
            "width": image.width, "height": image.height, "format": "RGBA",
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "generator": "Codex 内置 image_gen", "model": "工具未提供可核实模型版本",
            "prompt": "xian-scenic-sprites-v1-prompt.txt", "license": "待核实",
            "originalPath": "D:/codex/home/generated_images/01a09e56-c2f3-7e53-a467-4c7a6354f4d1/exec-4f6ac0f3-83c6-4a46-84e5-e32e5ae63427.png",
            "scope": "4列2行候选景区素材，按提示词槽位绑定ID；透明边界通过不等于景区外形已核实。",
            "places": rows}
(assets / "xian-scenic-sprites-v1.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"registered": len(rows), "size": [image.width, image.height], "solidBoundaryPixels": 0}))
