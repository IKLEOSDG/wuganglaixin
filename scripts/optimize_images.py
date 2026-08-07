"""Generate web-sized image assets used by the game.

Run with the workspace Python runtime (Pillow required). The original source
files stay untouched; page references point at the generated WebP variants.
"""

from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def webp(source: str, target: str, max_size: tuple[int, int], quality: int) -> None:
    source_path = PUBLIC / source
    target_path = PUBLIC / target
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source_path) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        image.save(target_path, "WEBP", quality=quality, method=6)
    before = source_path.stat().st_size
    after = target_path.stat().st_size
    print(f"{target}: {before:,} -> {after:,} bytes")


if __name__ == "__main__":
    webp("og.png", "og.webp", (1280, 720), 76)
    webp("phone-screen-reference.png", "phone-screen-reference.webp", (439, 796), 80)
    webp("photos/surveillance-room.png", "photos/surveillance-room.webp", (1280, 720), 74)
    webp("avatars/wu-doctor.jpg", "avatars/wu-doctor.webp", (256, 256), 78)
    webp("avatars/jiang.jpg", "avatars/jiang.webp", (256, 256), 78)
