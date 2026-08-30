from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps


SITE_ROOT = Path(__file__).resolve().parents[1]
DESKTOP_ROOT = Path(r"E:\CHEN网站作品素材")
WORK_ITEMS_FILE = SITE_ROOT / "app" / "work-items.generated.json"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".m4v"}
MAX_DEPLOYABLE_VIDEO_BYTES = 11 * 1024 * 1024
TARGET_VIDEO_BYTES = 10 * 1024 * 1024
WEB_VIDEO_AUDIO_BITRATE = 128_000
PLACEHOLDER_FILE = SITE_ROOT / "public" / "works" / "placeholder-16x9.webp"


STATIC_SLOTS = [
    ("00_封面/01_封面主图", "public/intro-cover-default-final-v2.png"),
    ("00_封面/01_封面主图", "public/intro-cover-default-final-v2-lossless.webp"),
    ("04_科技AI产品/02_AIGC商业化落地/01_首页项目主图", "public/works/ace/cover.webp"),
    ("03_海外科技品牌/02_品牌视觉设计/01_首页项目主图", "public/works/emooff/cover.webp"),
    ("02_原创IP资产/02_IP角色设定/01_首页项目主图", "public/works/cloner/cover.webp"),
    ("01_品牌整合创新/02_绝味品牌重构/01_首页项目主图", "public/works/juewei/cover.webp"),
    ("01_品牌整合创新/03_绝味AIGC视觉矩阵/01_首页项目主图", "public/works/aigc/cover.webp"),
    ("01_品牌整合创新/04_品牌超级IP/01_首页项目主图", "public/works/fyra/cover.webp"),
    ("05_创业与审美进化/02_原创品牌运营/01_首页项目主图", "public/works/lab/cover.webp"),
    ("05_创业与审美进化/03_创新审美与跨界视觉/01_首页项目主图", "public/works/lab-cross/cover.webp"),
    ("05_创业与审美进化/04_AI视觉探索/01_首页项目主图", "public/works/lab-ai/cover.webp"),
    ("06_个人简介/01_个人照片", "public/intro-portrait-clean-v3.png"),
    ("06_个人简介/01_个人照片", "public/intro-portrait-clean-v3-lossless.webp"),
]

EXTRA_FOLDERS = [
    "06_个人简介/02_简介资料",
    "06_个人简介/03_个人视频",
]

PROJECTS = [
    {
        "folder": "04_科技AI产品/02_AIGC商业化落地",
        "key": "ace",
        "asset": "ace",
        "items": ["AIGC 商业化落地", "数字影像设计"],
    },
    {
        "folder": "03_海外科技品牌/02_品牌视觉设计",
        "key": "emoof",
        "asset": "emooff",
        "items": ["品牌视觉设计", "多元产品设计", "数字影像设计"],
    },
    {
        "folder": "02_原创IP资产/02_IP角色设定",
        "key": "cloner",
        "asset": "cloner",
        "items": ["IP角色设定", "角色视觉设计", "ip衍生产品", "数字影像设计"],
    },
    {
        "folder": "01_品牌整合创新/02_绝味品牌重构",
        "key": "juewei",
        "asset": "juewei",
        "items": ["门店营销活动物料", "涅槃调改店", "艺人合作", "品牌视觉系统"],
    },
    {
        "folder": "01_品牌整合创新/03_绝味AIGC视觉矩阵",
        "key": "aigc",
        "asset": "aigc",
        "items": ["AIGC 视频", "AI 赋能设计"],
    },
    {
        "folder": "01_品牌整合创新/04_品牌超级IP",
        "key": "fyra",
        "asset": "fyra",
        "items": ["角色形象设定", "商业应用延展"],
    },
    {
        "folder": "05_创业与审美进化/02_原创品牌运营",
        "key": "lab",
        "asset": "lab",
        "items": ["原创品牌运营"],
    },
    {
        "folder": "05_创业与审美进化/03_创新审美与跨界视觉",
        "key": "lab-cross",
        "asset": "lab-cross",
        "items": ["创新视觉版式", "插画影像实验", "跨界视觉实验", "游戏视觉与场景实验"],
        "optional_items": {4},
    },
    {
        "folder": "05_创业与审美进化/04_AI视觉探索",
        "key": "lab-ai",
        "asset": "lab-ai",
        "items": ["动态视觉测试"],
    },
]


def parse_item_folder(folder: Path) -> tuple[int, str] | None:
    match = re.match(r"^(\d{2})[_\s-]*(.+)$", folder.name)
    if not match:
        return None
    index = int(match.group(1))
    if index not in range(1, 100):
        return None
    title = match.group(2).strip(" _-")
    return index, title or f"项目 {index:02d}"


def project_item_folders(project_root: Path) -> dict[int, Path]:
    details_root = project_root / "02_详情项目"
    details_root.mkdir(parents=True, exist_ok=True)
    found: dict[int, Path] = {}
    for folder in sorted(details_root.iterdir(), key=lambda path: path.name):
        if not folder.is_dir():
            continue
        parsed = parse_item_folder(folder)
        if parsed and parsed[0] not in found:
            found[parsed[0]] = folder
    return found


def move_folder_contents(source: Path, destination: Path) -> None:
    if not source.exists() or not source.is_dir():
        return
    destination.mkdir(parents=True, exist_ok=True)
    for item in source.iterdir():
        target = destination / item.name
        if target.exists():
            continue
        shutil.move(str(item), str(target))
    try:
        source.rmdir()
    except OSError:
        pass


def setup_directories() -> None:
    DESKTOP_ROOT.mkdir(parents=True, exist_ok=True)
    for folder, _ in STATIC_SLOTS:
        (DESKTOP_ROOT / Path(folder)).mkdir(parents=True, exist_ok=True)
    for folder in EXTRA_FOLDERS:
        (DESKTOP_ROOT / Path(folder)).mkdir(parents=True, exist_ok=True)

    for project in PROJECTS:
        project_root = DESKTOP_ROOT / Path(project["folder"])
        project_root.mkdir(parents=True, exist_ok=True)
        found = project_item_folders(project_root)

        item_count = len(project["items"])
        for index, folder in list(found.items()):
            if index > item_count and not any(folder.iterdir()):
                folder.rmdir()
                del found[index]

        for index, default_title in enumerate(project["items"], start=1):
            desired = project_root / "02_详情项目" / f"{index:02d}_{default_title}"
            current = found.get(index)
            if current is None:
                desired.mkdir(parents=True, exist_ok=True)
            elif current != desired:
                if desired.exists():
                    move_folder_contents(current, desired)
                else:
                    current.rename(desired)
            found[index] = desired

        if 1 in found:
            move_folder_contents(project_root / "02_详情图片_01", found[1])
        if 2 in found:
            move_folder_contents(project_root / "03_详情图片_02", found[2])

    guide = """CHEN 网站作品素材使用说明

1. 本文件夹与网站框架一一对应：分类 → 首页项目 → 详情内容项。
2. 首页分类顺序：01 品牌整合创新、02 原创 IP 资产、03 海外科技品牌、04 科技 AI 产品、05 创业与审美进化。
3. 首页项目图放入项目文件夹的“01_首页项目主图”。
4. 详情图片或视频直接放入“02_详情项目”下对应子类文件夹；视频放在哪个子类，就只在该子类页面播放。
5. 内容文件夹必须保留开头编号；同一文件夹内按文件名自然顺序展示。
6. 网站首页右上角会汇总当前大类下所有项目与详情内容项的视频，并按顺序轮播。
7. 双击“同步素材到网站.cmd”同步素材，再让 Codex 发布最新版本。
8. 00_封面和06_个人简介分别管理封面主图、个人照片与简介资料。
9. E 盘原视频不会被修改；同步时会自动生成不超过 10 MiB、H.264/AAC、支持快速起播的网站版本。
10. 少量游戏美术作品放在“创新审美与跨界视觉/02_详情项目/04_游戏视觉与场景实验”；形成完整系列后再独立为首页项目。

支持图片：JPG、JPEG、PNG、WebP、BMP、TIF、TIFF
支持视频：MP4、WebM、MOV、M4V
"""
    (DESKTOP_ROOT / "使用说明.txt").write_text(guide, encoding="utf-8-sig")


def newest_file(folder: Path, extensions: set[str]) -> Path | None:
    if not folder.exists():
        return None
    candidates = [
        path for path in folder.iterdir()
        if path.is_file() and not path.name.startswith((".", "_")) and path.suffix.lower() in extensions
    ]
    return max(candidates, key=lambda path: path.stat().st_mtime) if candidates else None


def sync_image(source: Path, target: Path) -> tuple[int, int]:
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(f"{target.stem}.tmp{target.suffix}")
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
        if image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "transparency" in image.info else "RGB")
        suffix = target.suffix.lower()
        if suffix == ".png":
            image.save(temporary, "PNG", optimize=True)
        elif suffix in {".jpg", ".jpeg"}:
            image.convert("RGB").save(temporary, "JPEG", quality=92, optimize=True)
        elif target.stem.endswith("-lossless"):
            image.save(temporary, "WEBP", lossless=True, quality=100, method=6)
        else:
            image.save(temporary, "WEBP", quality=88, method=6)
        size = image.size
    temporary.replace(target)
    return size


def ensure_item_fallback(project: dict[str, object], index: int, target: Path) -> None:
    if target.exists():
        return
    asset = str(project["asset"])
    candidates = [
        SITE_ROOT / "public" / "works" / asset / "cover.webp",
        SITE_ROOT / "public" / "works" / asset / "detail-01.webp",
        SITE_ROOT / "public" / "works" / asset / "detail-02.webp",
        SITE_ROOT / "public" / "works" / asset / "detail-02.webp",
    ]
    fallback = candidates[index - 1] if index <= len(candidates) else PLACEHOLDER_FILE
    if not fallback.exists():
        fallback = PLACEHOLDER_FILE
    if fallback.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(fallback, target)


def natural_key(path: Path) -> list[object]:
    return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", path.name.lower())]


def media_files(folder: Path, extensions: set[str]) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [
            path for path in folder.iterdir()
            if path.is_file() and not path.name.startswith((".", "_")) and path.suffix.lower() in extensions
        ],
        key=natural_key,
    )


def image_files(folder: Path) -> list[Path]:
    return media_files(folder, IMAGE_EXTENSIONS)


def video_files(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return sorted(
        [
            path for path in folder.rglob("*")
            if path.is_file() and not path.name.startswith((".", "_")) and path.suffix.lower() in VIDEO_EXTENSIONS
        ],
        key=natural_key,
    )


def probe_video(source: Path) -> tuple[str, float]:
    ffprobe = shutil.which("ffprobe")
    if ffprobe is None:
        raise RuntimeError("ffprobe is required to inspect website videos.")
    completed = subprocess.run(
        [
            ffprobe,
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "format=duration:stream=codec_name",
            "-of", "json",
            str(source),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    metadata = json.loads(completed.stdout)
    streams = metadata.get("streams") or []
    duration = float((metadata.get("format") or {}).get("duration") or 0)
    if not streams or duration <= 0:
        raise RuntimeError(f"Unable to read video metadata: {source}")
    return str(streams[0].get("codec_name") or ""), duration


def mp4_is_faststart(video: Path) -> bool:
    data = video.read_bytes()
    moov_position = data.find(b"moov")
    mdat_position = data.find(b"mdat")
    return moov_position >= 0 and (mdat_position < 0 or moov_position < mdat_position)

def sync_video(source: Path, target: Path) -> tuple[str, int]:
    if target.exists() and target.stat().st_mtime_ns >= source.stat().st_mtime_ns:
        target_codec, _ = probe_video(target)
        if target_codec == "h264" and target.stat().st_size <= TARGET_VIDEO_BYTES and mp4_is_faststart(target):
            return "cached", target.stat().st_size

    codec, duration = probe_video(source)
    source_size = source.stat().st_size
    target.parent.mkdir(parents=True, exist_ok=True)

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required to create a browser-compatible website video.")

    if codec == "h264" and source.suffix.lower() == ".mp4" and source_size <= TARGET_VIDEO_BYTES:
        temporary = target.with_suffix(".tmp.mp4")
        try:
            subprocess.run(
                [
                    ffmpeg, "-y", "-nostdin", "-loglevel", "error", "-i", str(source),
                    "-map", "0", "-c", "copy", "-movflags", "+faststart", str(temporary),
                ],
                check=True,
                capture_output=True,
            )
            temporary.replace(target)
        finally:
            if temporary.exists():
                temporary.unlink()
        return "remuxed", target.stat().st_size

    total_bitrate = int((TARGET_VIDEO_BYTES * 8 / duration) * 0.94)
    video_bitrate = total_bitrate - WEB_VIDEO_AUDIO_BITRATE
    if video_bitrate < 650_000:
        raise RuntimeError(
            f"Video is too long for a smooth static-site version under 10 MiB: {source}"
        )

    temporary = target.with_suffix(".tmp.mp4")
    passlog = target.parent / f".{target.stem}-pass"
    common_video_args = [
        "-map", "0:v:0",
        "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-c:v", "libx264",
        "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-b:v", str(video_bitrate),
        "-passlogfile", str(passlog),
    ]
    try:
        subprocess.run(
            [
                ffmpeg, "-y", "-nostdin", "-loglevel", "error", "-i", str(source),
                *common_video_args,
                "-pass", "1",
                "-an",
                "-f", "mp4",
                "NUL",
            ],
            check=True,
            capture_output=True,
        )
        subprocess.run(
            [
                ffmpeg, "-y", "-nostdin", "-loglevel", "error", "-i", str(source),
                *common_video_args,
                "-pass", "2",
                "-map", "0:a:0?",
                "-c:a", "aac",
                "-b:a", str(WEB_VIDEO_AUDIO_BITRATE),
                "-movflags", "+faststart",
                str(temporary),
            ],
            check=True,
            capture_output=True,
        )
        if temporary.stat().st_size > MAX_DEPLOYABLE_VIDEO_BYTES:
            raise RuntimeError(
                f"Optimized video still exceeds the 11 MiB deployment limit: {source}"
            )
        temporary.replace(target)
    finally:
        if temporary.exists():
            temporary.unlink()
        for artifact in target.parent.glob(f"{passlog.name}*"):
            artifact.unlink()

    return "optimized", target.stat().st_size


def sync_video_poster(video: Path, poster: Path) -> str:
    if poster.exists() and poster.stat().st_mtime_ns >= video.stat().st_mtime_ns:
        return "cached"

    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required to create website video posters.")

    poster.parent.mkdir(parents=True, exist_ok=True)
    temporary = poster.with_suffix(".tmp.webp")
    try:
        subprocess.run(
            [
                ffmpeg, "-y", "-nostdin", "-loglevel", "error",
                "-ss", "0.04", "-i", str(video),
                "-frames:v", "1",
                "-vf", "scale='min(1600,iw)':-2",
                "-c:v", "libwebp", "-quality", "88", "-compression_level", "6",
                str(temporary),
            ],
            check=True,
            capture_output=True,
        )
        temporary.replace(poster)
    finally:
        if temporary.exists():
            temporary.unlink()
    return "created"


def sync_work_items() -> tuple[int, dict[str, list[dict[str, object]]]]:
    synced = 0
    generated: dict[str, list[dict[str, object]]] = {}

    for project in PROJECTS:
        project_root = DESKTOP_ROOT / Path(str(project["folder"]))
        folders = project_item_folders(project_root)
        items: list[dict[str, object]] = []
        asset = str(project["asset"])
        target_folder = SITE_ROOT / "public" / "works" / asset
        optional_items = set(project.get("optional_items", set()))
        for index in range(1, len(project["items"]) + 1):
            folder = folders[index]
            parsed = parse_item_folder(folder)
            title = (parsed[1] if parsed else str(project["items"][index - 1])).replace("／", " / ")
            sources = image_files(folder)
            video_sources = video_files(folder)
            if index in optional_items and not sources and not video_sources:
                for stale in target_folder.glob(f"item-{index:02d}*.*"):
                    stale.unlink()
                continue
            image_urls: list[str] = []
            expected_targets: set[Path] = set()

            if sources:
                for media_index, source in enumerate(sources, start=1):
                    suffix = "" if media_index == 1 else f"-{media_index:02d}"
                    filename = f"item-{index:02d}{suffix}.webp"
                    destination = f"public/works/{asset}/{filename}"
                    target = SITE_ROOT / destination
                    width, height = sync_image(source, target)
                    print(f"[PROJECT] {folder.relative_to(DESKTOP_ROOT)} / {source.name} -> {destination} ({width}x{height})")
                    image_urls.append(f"/works/{asset}/{filename}")
                    expected_targets.add(target)
                    synced += 1
            elif not video_sources:
                filename = f"item-{index:02d}.webp"
                target = target_folder / filename
                ensure_item_fallback(project, index, target)
                image_urls.append(f"/works/{asset}/{filename}")
                expected_targets.add(target)
            else:
                # Video-only items must not inherit a synthetic image slide.
                # Remove a fallback or stale primary image left by an earlier sync.
                stale_primary = target_folder / f"item-{index:02d}.webp"
                if stale_primary.exists():
                    stale_primary.unlink()

            for stale in target_folder.glob(f"item-{index:02d}-*.webp"):
                if stale not in expected_targets:
                    stale.unlink()

            video_urls: list[str] = []
            expected_video_targets: set[Path] = set()

            for media_index, source in enumerate(video_sources, start=1):
                filename = f"item-{index:02d}-video-{media_index:02d}.mp4"
                target = target_folder / filename
                mode, size = sync_video(source, target)
                video_urls.append(f"/works/{asset}/{filename}")
                expected_video_targets.add(target)
                poster = target.with_name(f"{target.stem}-poster.webp")
                poster_mode = sync_video_poster(target, poster)
                expected_video_targets.add(poster)
                synced += 1
                print(
                    f"[PROJECT VIDEO] {source.relative_to(DESKTOP_ROOT)} -> "
                    f"{target.relative_to(SITE_ROOT)} ({mode}, {size / 1024 / 1024:.1f} MiB)"
                )
                print(
                    f"[PROJECT POSTER] {poster.relative_to(SITE_ROOT)} ({poster_mode})"
                )

            for stale in target_folder.glob(f"item-{index:02d}-video-*.*"):
                if stale not in expected_video_targets:
                    stale.unlink()

            items.append({
                "title": title,
                "label": f"PROJECT {index:02d}",
                "images": image_urls,
                "videos": video_urls,
            })

        max_item_index = len(project["items"])
        for stale in target_folder.glob("item-*.*"):
            match = re.match(r"^item-(\d{2})(?:[-.]|$)", stale.name)
            if match and int(match.group(1)) > max_item_index:
                stale.unlink()

        generated[str(project["key"])] = items

    return synced, generated


def write_work_items(generated: dict[str, list[dict[str, object]]]) -> bool:
    content = json.dumps(generated, ensure_ascii=False, indent=2) + "\n"
    current = WORK_ITEMS_FILE.read_text(encoding="utf-8") if WORK_ITEMS_FILE.exists() else ""
    if current == content:
        return False
    WORK_ITEMS_FILE.write_text(content, encoding="utf-8")
    return True


def main() -> int:
    setup_directories()
    if "--setup-only" in sys.argv:
        print(f"SETUP: {DESKTOP_ROOT}")
        return 0

    item_media, generated = sync_work_items()
    names_changed = write_work_items(generated)

    if "--setup-only" in sys.argv:
        print(f"SETUP: {DESKTOP_ROOT}")
        print(f"NAVIGATION: {'updated' if names_changed else 'unchanged'}")
        return 0

    synced = item_media
    for folder, destination in STATIC_SLOTS:
        source_folder = DESKTOP_ROOT / Path(folder)
        source = newest_file(source_folder, IMAGE_EXTENSIONS)
        if source is None:
            continue
        target = SITE_ROOT / destination
        width, height = sync_image(source, target)
        print(f"[IMAGE] {source_folder.relative_to(DESKTOP_ROOT)} -> {destination} ({width}x{height})")
        synced += 1

    print(f"NAVIGATION: {'updated' if names_changed else 'unchanged'}")
    print(f"DONE: {synced} visible media item(s).")
    if synced == 0 and not names_changed:
        print("No new media or project-name changes found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
