#!/usr/bin/env python3
"""PNG → SVG 矢量化流水线 (预处理 → 量化 → vtracer 矢量化)

注意: vtracer 0.6.15 在 Python 3.14 上会段错误，需用 py -3.13 运行。
"""
import sys, os
from pathlib import Path


def load_and_prepare(input_path):
    """加载图片，统一透明像素 RGB（防止 vtracer path 爆炸）"""
    from PIL import Image
    import numpy as np

    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)
    print(f"  原始: {img.width}x{img.height}")

    # 透明/半透明像素的 RGB 统一为白色
    # 不做这一步，vtracer 会把透明区域底下的杂色 RGB 当独立颜色，导致 path 爆炸
    mask = arr[:, :, 3] < 128
    arr[mask, :3] = 255
    arr[mask, 3] = 0

    transparent_pct = mask.sum() * 100 // (arr.shape[0] * arr.shape[1])
    print(f"  透明像素: {transparent_pct}%")

    return Image.fromarray(arr)


def remove_background(img, tolerance=60):
    """scipy flood fill 从四角检测背景 → 设为透明（已透明的图片可跳过）"""
    import numpy as np
    from scipy.ndimage import label

    arr = np.array(img)
    h, w = arr.shape[:2]

    # 检查是否已有大量透明像素
    transparent_pct = (arr[:, :, 3] < 128).sum() * 100 // (h * w)
    if transparent_pct > 10:
        print(f"  已有 {transparent_pct}% 透明像素，跳过去背景")
        return img

    # 四角采样背景色
    corners = [arr[0, 0, :3], arr[0, w-1, :3], arr[h-1, 0, :3], arr[h-1, w-1, :3]]
    bg_color = np.median(corners, axis=0).astype(np.uint8)
    print(f"  检测背景色: rgb({bg_color[0]},{bg_color[1]},{bg_color[2]})")

    diff = np.abs(arr[:, :, :3].astype(int) - bg_color.astype(int)).sum(axis=2)
    bg_mask = diff < tolerance

    labeled, num_features = label(bg_mask)
    corner_labels = set()
    for y, x in [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]:
        if labeled[y, x] > 0:
            corner_labels.add(labeled[y, x])

    removed = 0
    for lbl in corner_labels:
        m = labeled == lbl
        removed += m.sum()
        arr[m, 3] = 0

    print(f"  移除背景: {removed} px ({removed * 100 // (h * w)}%)")

    from PIL import Image as PILImage
    return PILImage.fromarray(arr)


def quantize_colors(img, n_colors=8):
    """色彩量化，把渐变压成纯色块"""
    from PIL import Image as PILImage
    import numpy as np

    arr = np.array(img)
    alpha = arr[:, :, 3].copy()

    rgb = PILImage.fromarray(arr[:, :, :3])
    quantized = rgb.quantize(colors=n_colors, method=PILImage.Quantize.MEDIANCUT).convert('RGB')

    result = np.dstack([np.array(quantized), alpha])
    print(f"  量化为 {n_colors} 色")
    return PILImage.fromarray(result)


def upscale(img, scale):
    """Pillow LANCZOS 放大（大图可跳过）"""
    from PIL import Image
    if scale <= 1:
        print(f"  跳过放大 (scale={scale})")
        return img
    new_size = (img.width * scale, img.height * scale)
    print(f"  放大 {scale}x: {img.width}x{img.height} → {new_size[0]}x{new_size[1]}")
    return img.resize(new_size, Image.LANCZOS)


def vectorize(img, output_path, **overrides):
    """vtracer 位图→矢量SVG"""
    import vtracer
    import io

    params = {
        'colormode': 'color',
        'hierarchical': 'stacked',
        'mode': 'spline',
        'filter_speckle': 48,
        'color_precision': 6,
        'layer_difference': 32,
        'corner_threshold': 80,
        'length_threshold': 8.0,
        'max_iterations': 10,
        'splice_threshold': 45,
        'path_precision': 2,
    }
    params.update(overrides)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    img_bytes = buf.getvalue()

    svg_str = vtracer.convert_raw_image_to_svg(
        img_bytes=img_bytes,
        img_format='png',
        **params
    )

    Path(output_path).write_text(svg_str, encoding='utf-8')
    path_count = svg_str.count('<path')
    print(f"  生成 {path_count} 条 path, {len(svg_str) // 1024}KB")
    return svg_str


def auto_scale(img):
    """根据图片大小自动决定放大倍数"""
    pixels = img.width * img.height
    if pixels >= 1_000_000:  # >= 1MP, 不放大
        return 1
    elif pixels >= 250_000:  # >= 0.25MP, 2x
        return 2
    else:  # 小图, 4x
        return 4


def main():
    if len(sys.argv) < 2:
        print("用法: py -3.13 png2svg.py <input.png> [output.svg] [n_colors] [scale]")
        print()
        print("参数:")
        print("  input.png   输入 PNG 文件")
        print("  output.svg  输出 SVG 路径 (默认: 同名.svg)")
        print("  n_colors    量化色数 (默认: 8, 范围 4-32)")
        print("  scale       放大倍数 (默认: auto, 大图不放大)")
        print()
        print("注意: vtracer 在 Python 3.14 上段错误，请用 py -3.13 运行")
        sys.exit(1)

    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"错误: 文件不存在 {input_path}")
        sys.exit(1)

    stem = Path(input_path).stem
    output_path = sys.argv[2] if len(sys.argv) > 2 else f"{stem}.svg"
    n_colors = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    scale_arg = sys.argv[4] if len(sys.argv) > 4 else 'auto'

    print("[1/5] 加载 + 清理透明像素 ...")
    img = load_and_prepare(input_path)

    print("[2/5] 去背景 ...")
    img = remove_background(img)

    print("[3/5] 色彩量化 ...")
    img = quantize_colors(img, n_colors)

    scale = auto_scale(img) if scale_arg == 'auto' else int(scale_arg)
    print(f"[4/5] 放大 (scale={scale}) ...")
    img = upscale(img, scale)

    print("[5/5] vtracer 矢量化 ...")
    vectorize(img, output_path)

    print(f"Done -> {output_path}")


if __name__ == '__main__':
    main()
