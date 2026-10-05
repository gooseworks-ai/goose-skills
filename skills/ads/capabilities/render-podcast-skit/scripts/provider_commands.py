"""Resolve the same paid steps in Studio or an installed skill collection.

Public capabilities already implement image, voice and video generation. Keep
their names and billing behavior rather than publishing duplicate internal atoms.
No provider is imported until an approved command actually executes.
"""
from __future__ import annotations

import argparse
import importlib.util
import os
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
INTERNAL = {
    "voice": ("voiceover/create-voiceover-elevenlabs", "generate.py"),
    "image": ("image-generation/create-image-gpt-image-fal", "generate.py"),
    "lipsync": ("lipsync/create-lipsync-veed-fal", "generate.py"),
}
PUBLIC = {
    "voice": ("create-vo-elevenlabs", "gen_vo.py"),
    "image": ("create-image-gpt-image-fal", "generate.py"),
    "lipsync": ("create-video-fal", "gen_video.py"),
}


def resolve(kind):
    explicit = os.environ.get("PODCAST_SKILLS_DIR")
    if not explicit:
        rel, script = INTERNAL[kind]
        folder = HERE.parents[2] / "skills" / "atoms" / rel
        if (folder / "scripts" / script).is_file():
            return folder, script, False
    roots = [Path(explicit)] if explicit else [HERE.parent.parent, Path("/tmp/gooseworks-scripts")]
    slug, script = PUBLIC[kind]
    for root in roots:
        folder = root / slug
        if (folder / "scripts" / script).is_file():
            return folder, script, True
    raise RuntimeError(f"Missing installed {slug}. Install the recipe's required skills "
                       "together, or set PODCAST_SKILLS_DIR to their parent directory.")


def command(kind):
    folder, script, public = resolve(kind)
    if public and kind in ("image", "lipsync"):
        return [sys.executable, str(HERE / "provider_commands.py"), kind]
    return [sys.executable, str(folder / "scripts" / script)]


def load_proxy(kind):
    folder, _, _ = resolve(kind)
    file = folder / "scripts" / "media_proxy.py"
    spec = importlib.util.spec_from_file_location("podcast_media_proxy", file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    # These commands are composed by gen_paid.py only after its approval flags.
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["image", "lipsync"])
    args, rest = ap.parse_known_args()
    proxy = load_proxy(args.kind)
    if args.kind == "image":
        folder, script, _ = resolve("image")
        forwarded = []
        i = 0
        while i < len(rest):
            if rest[i] == "--ref-image":
                ref = rest[i + 1]
                url = ref if ref.startswith(("https://", "http://")) else proxy.fal_upload(ref)
                forwarded += ["--ref-url", url]
                i += 2
            else:
                forwarded.append(rest[i])
                i += 1
        subprocess.run([sys.executable, str(folder / "scripts" / script), *forwarded], check=True)
    else:
        lp = argparse.ArgumentParser()
        lp.add_argument("--image", required=True)
        lp.add_argument("--audio", required=True)
        lp.add_argument("--resolution", choices=["480p", "720p"], required=True)
        lp.add_argument("--output", required=True)
        a = lp.parse_args(rest)
        # Validate BOTH local inputs before uploading either one.
        for value in (a.image, a.audio):
            if not value.startswith(("https://", "http://")):
                p = Path(value)
                if not p.is_file() or p.stat().st_size == 0:
                    raise RuntimeError(f"Missing input: {p}")
                if p.read_bytes()[:80].startswith(b"version https://git-lfs.github.com/spec/v1"):
                    raise RuntimeError(f"Input is an LFS pointer: {p}")
        host = lambda value: value if value.startswith(("https://", "http://")) else proxy.fal_upload(value)
        payload = {"image_url": host(a.image), "audio_url": host(a.audio), "resolution": a.resolution}
        url = proxy.fal_generate_video("veed/fabric-1.0", payload)
        Path(a.output).parent.mkdir(parents=True, exist_ok=True)
        proxy.download(url, a.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
