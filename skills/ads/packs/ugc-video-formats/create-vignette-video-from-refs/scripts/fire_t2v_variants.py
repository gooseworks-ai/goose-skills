"""Fire all 6 T2V variants in parallel.

2 concepts (α Chrome Molecular Swarm, β Black Ink in Cream Bloom)
× 3 models (Veo 3.1 via Higgsfield CLI, Kling v2.5 Turbo Pro via FAL,
             Seedance 2.0 via FAL)
= 6 parallel generations.

Outputs:
  source/t2v-outputs/α-VEO.mp4
  source/t2v-outputs/α-KLING.mp4
  source/t2v-outputs/α-SEED.mp4
  source/t2v-outputs/β-VEO.mp4
  source/t2v-outputs/β-KLING.mp4
  source/t2v-outputs/β-SEED.mp4
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.request
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SHARED = PROJECT_ROOT.parent.parent.parent / "skills" / "atoms" / "_shared"
sys.path.insert(0, str(SHARED))

from fal_helpers import download, load_fal_key, subscribe  # noqa: E402

OUT = PROJECT_ROOT / "source" / "t2v-outputs"
OUT.mkdir(parents=True, exist_ok=True)

# ── PROMPTS ─────────────────────────────────────────────────────────────

PROMPT_ALPHA_VEO = """A continuous extreme-macro shot at real-time speed, no cuts, no scene changes. Floating chrome silver liquid-metal molecular spheres swarm into frame and multiply energetically against a soft cream gradient backdrop, lit gently from the upper-left.

PHASE 1 (0-1s): A few chrome spheres drift quickly into frame from edges, catching light on mirror-finish curved surfaces. Cream backdrop holds steady.

PHASE 2 (1-4s): Many more spheres emerge in rapid succession, joining the formation. They drift at real-time speed through 3D space, rotating gently, occasionally bouncing past each other.

PHASE 3 (4-8s): Spheres continue kinetic dance across frame, real-time motion, never colliding hard. Mirror surfaces flash and shift. Motion energetic but contained — spheres stay in mid-z-plane.

Premium clinical-luxury cosmetic-science aesthetic. Soft cream palette with chrome metallic spheres as the only high-contrast element. Real-time kinetic motion, intimate macro framing.

Camera locked tripod throughout, real-time speed. NO push-in, NO pan, NO zoom, NO dolly. Only the spheres move.

NO people, hands, products, text, logos, slow motion, or scene cuts."""

PROMPT_ALPHA_KLING = """Extreme-macro real-time shot of chrome silver liquid-metal molecular spheres swarming into frame and multiplying energetically against a soft cream gradient. ONE continuous unbroken take, no cuts, no camera movement.

PHASE 1 (0-1s): Chrome spheres drift quickly into frame from edges, mirror-finish light catching.

PHASE 2 (1-4s): Many more spheres emerge rapidly, join the swarm, drift through 3D space at real-time speed with gentle rotation.

PHASE 3 (4-10s): Kinetic dance continues, spheres flash and shift positions, never colliding hard. Motion energetic but contained.

Premium clinical-luxury cosmetic-science aesthetic. Cream backdrop, chrome spheres only high-contrast element. Real-time kinetic motion.

Camera completely locked tripod-static. NO push-in, pan, zoom, dolly. Only the spheres move at natural real-time speed.

NO people, hands, products, text, logos, slow motion, or scene cuts."""

PROMPT_ALPHA_SEED = """Chrome silver molecular spheres swarm into frame and multiply at real-time speed against soft cream gradient backdrop, extreme macro. Camera locked tripod, no movement.

PHASE 1 (0-1s): Spheres drift quickly into frame, mirror-finish light.

PHASE 2 (1-4s): Many more spheres emerge rapidly, join swarm, drift through 3D at real-time speed, gentle rotation.

PHASE 3 (4-8s): Kinetic dance continues, spheres flash and shift, never colliding hard. Motion energetic but contained.

Premium clinical-luxury science aesthetic. Cream palette, chrome spheres only high-contrast element. Real-time motion. Camera does not move.

NO people, hands, products, text, logos, slow motion, or scene cuts."""

PROMPT_BETA_VEO = """A continuous overhead macro shot at real-time speed, no cuts. Top-down view of a shallow glass dish filled with still cream-colored liquid. The surface is calm and reflective, lit softly from above.

PHASE 1 (0-0.8s): Cream liquid surface holds completely still. Faint reflection of overhead light.

PHASE 2 (0.8-1.5s): A single drop of pure black ink falls from above at real-time speed (natural gravity, NOT slow motion) and impacts the surface dead-center with a real splash. Energetic ripples spread outward.

PHASE 3 (1.5-5s): Black ink blooms outward through cream liquid at real-time speed, organic fractal expansion. Motion energetic and continuous — ink tendrils branch and spread visibly fast, filling half the frame in 3-4 seconds.

PHASE 4 (5-8s): Ink bloom continues to spread and twist at real-time speed, evolving organically. Cream surface around bloom holds calm. Continuous kinetic motion through to end.

Premium clinical-luxury science aesthetic. Like a Vogue beauty editorial captured in real time. Cream and obsidian palette only. NOT slow motion — real-time natural speed throughout.

Camera locked overhead tripod, completely stationary. NO push-in, pan, zoom, dolly. Only the ink moves at real-time speed.

NO people, hands, products, text, logos, slow motion, or scene cuts. The cream liquid remains contained in the dish."""

PROMPT_BETA_KLING = """Overhead extreme-macro real-time shot of a shallow glass dish filled with still cream-colored liquid. A drop of pure black ink falls from above at natural gravity speed, impacts the surface, and blooms outward in organic fractal tendrils at real-time speed. ONE continuous unbroken take, no cuts, no camera movement.

PHASE 1 (0-0.8s): Cream liquid surface still. Soft overhead reflection.

PHASE 2 (0.8-1.5s): Drop of black ink falls at real-time speed (natural gravity, NOT slow motion), impacts center, splash.

PHASE 3 (1.5-6s): Black ink blooms outward at real-time speed in fractal tendrils, organic expansion. Energetic continuous motion, ink spreads visibly fast.

PHASE 4 (6-10s): Ink bloom continues evolving at real-time speed, twisting and branching. Cream surface around bloom stays calm.

Premium clinical-luxury cosmetic-science aesthetic. Cream and obsidian palette only. Real-time natural motion throughout — NO slow motion.

Camera completely locked overhead tripod, stationary. NO push-in, pan, zoom, dolly. Only the ink moves at real-time speed.

NO people, hands, products, text, logos, slow motion, or scene cuts."""

PROMPT_BETA_SEED = """Overhead macro shot, shallow glass dish with still cream-colored liquid, drop of pure black ink falls at real-time speed and blooms outward in fractal tendrils. Real-time natural motion throughout, NOT slow motion. Camera locked overhead, no movement.

PHASE 1 (0-0.8s): Cream surface still, soft overhead reflection.

PHASE 2 (0.8-1.5s): Ink drop falls at real-time speed, impacts center, splash.

PHASE 3 (1.5-6s): Ink blooms outward at real-time speed in fractal tendrils, organic expansion, energetic continuous motion.

PHASE 4 (6-8s): Bloom continues evolving, twisting and branching. Cream surface around bloom stays calm.

Premium clinical-luxury science aesthetic. Cream and obsidian palette only. Real-time motion throughout, NOT slow motion. Camera stationary.

NO people, hands, products, text, logos, slow motion, or scene cuts."""

NEGATIVE_PROMPT = "blur, distort, low quality, slow motion, slow, sluggish, jitter, camera shake, pan, zoom, cut, scene change, text, watermark, people, hands, product, static"

# ── FIRING FUNCTIONS ────────────────────────────────────────────────────

def fire_veo(slug: str, prompt: str) -> dict:
    """Fire Veo 3.1 via Higgsfield CLI. Returns dict with url + status."""
    print(f"[{slug}] firing Higgsfield Veo 3.1 (16:9 → will crop later)…", flush=True)
    cmd = [
        "/opt/homebrew/bin/higgsfield", "generate", "create", "veo3_1",
        "--prompt", prompt,
        "--aspect_ratio", "16:9",  # only 16:9 or 9:16 supported, crop to 1:1 post
        "--duration", "8",
        "--model", "veo-3-1-preview",
        "--quality", "ultra",
        "--wait",
        "--wait-timeout", "20m",
        "--json",
    ]
    start = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1500)
        elapsed = time.time() - start
        if r.returncode != 0:
            return {"slug": slug, "status": "ERROR", "error": r.stderr[-1000:], "elapsed_s": elapsed}
        # Parse JSON for output URL
        try:
            data = json.loads(r.stdout)
        except json.JSONDecodeError:
            # CLI may print other text — try to extract JSON from output
            for line in r.stdout.splitlines():
                line = line.strip()
                if line.startswith("{"):
                    try:
                        data = json.loads(line)
                        break
                    except Exception:
                        continue
            else:
                return {"slug": slug, "status": "ERROR_PARSE", "stdout": r.stdout[-2000:], "elapsed_s": elapsed}
        # Find video URL in the response
        video_url = None
        # Higgsfield response structure varies; try common shapes
        for key in ["output", "result", "data", "video"]:
            obj = data.get(key) if isinstance(data, dict) else None
            if obj is None:
                continue
            if isinstance(obj, dict):
                if "url" in obj:
                    video_url = obj["url"]
                    break
                if "video" in obj and isinstance(obj["video"], dict) and "url" in obj["video"]:
                    video_url = obj["video"]["url"]
                    break
                for v in obj.values():
                    if isinstance(v, str) and v.startswith("http") and (".mp4" in v or "video" in v.lower()):
                        video_url = v
                        break
                if video_url:
                    break
        # Fallback: regex hunt for any .mp4 URL in raw stdout
        if not video_url:
            import re
            m = re.search(r'https?://[^\s"]+\.mp4[^\s"]*', r.stdout)
            if m:
                video_url = m.group(0)
        if not video_url:
            return {"slug": slug, "status": "ERROR_NO_URL", "raw": r.stdout[-2000:], "elapsed_s": elapsed}
        dst = OUT / f"{slug}.mp4"
        download(video_url, dst)
        return {"slug": slug, "status": "OK", "url": video_url, "path": str(dst.relative_to(PROJECT_ROOT)),
                "size_mb": round(dst.stat().st_size/1024/1024, 1), "elapsed_s": round(elapsed, 1)}
    except subprocess.TimeoutExpired:
        return {"slug": slug, "status": "TIMEOUT", "elapsed_s": time.time() - start}
    except Exception as e:
        return {"slug": slug, "status": "EXCEPTION", "error": str(e)[:500], "elapsed_s": time.time() - start}


def fire_kling(slug: str, prompt: str) -> dict:
    """Fire Kling v2.5 Turbo Pro T2V via FAL."""
    print(f"[{slug}] firing Kling v2.5 Turbo Pro T2V (1:1, 10s)…", flush=True)
    start = time.time()
    try:
        result = subscribe(
            "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
            {
                "prompt": prompt,
                "aspect_ratio": "1:1",
                "duration": "10",
                "negative_prompt": NEGATIVE_PROMPT,
            },
            timeout_sec=1500,
        )
        elapsed = time.time() - start
        video_url = (result or {}).get("video", {}).get("url") if result else None
        if not video_url:
            return {"slug": slug, "status": "ERROR_NO_URL", "result": str(result)[:1000], "elapsed_s": elapsed}
        dst = OUT / f"{slug}.mp4"
        download(video_url, dst)
        return {"slug": slug, "status": "OK", "url": video_url, "path": str(dst.relative_to(PROJECT_ROOT)),
                "size_mb": round(dst.stat().st_size/1024/1024, 1), "elapsed_s": round(elapsed, 1)}
    except Exception as e:
        return {"slug": slug, "status": "EXCEPTION", "error": str(e)[:500], "elapsed_s": time.time() - start}


def fire_seedance(slug: str, prompt: str) -> dict:
    """Fire Seedance 2.0 T2V via FAL."""
    print(f"[{slug}] firing Seedance 2.0 T2V (1:1, 8s, 720p, audio off)…", flush=True)
    start = time.time()
    try:
        result = subscribe(
            "bytedance/seedance-2.0/text-to-video",
            {
                "prompt": prompt,
                "aspect_ratio": "1:1",
                "duration": "8",
                "resolution": "720p",
                "generate_audio": False,
            },
            timeout_sec=1500,
        )
        elapsed = time.time() - start
        video_url = (result or {}).get("video", {}).get("url") if result else None
        if not video_url:
            return {"slug": slug, "status": "ERROR_NO_URL", "result": str(result)[:1000], "elapsed_s": elapsed}
        dst = OUT / f"{slug}.mp4"
        download(video_url, dst)
        return {"slug": slug, "status": "OK", "url": video_url, "path": str(dst.relative_to(PROJECT_ROOT)),
                "size_mb": round(dst.stat().st_size/1024/1024, 1), "elapsed_s": round(elapsed, 1)}
    except Exception as e:
        return {"slug": slug, "status": "EXCEPTION", "error": str(e)[:500], "elapsed_s": time.time() - start}


def main():
    load_fal_key()

    JOBS = [
        ("alpha-VEO", fire_veo, PROMPT_ALPHA_VEO),
        ("alpha-KLING", fire_kling, PROMPT_ALPHA_KLING),
        ("alpha-SEED", fire_seedance, PROMPT_ALPHA_SEED),
        ("beta-VEO", fire_veo, PROMPT_BETA_VEO),
        ("beta-KLING", fire_kling, PROMPT_BETA_KLING),
        ("beta-SEED", fire_seedance, PROMPT_BETA_SEED),
    ]

    print(f"firing {len(JOBS)} T2V jobs in parallel…")
    print(f"  expected wallclock: 10-20 min, bottlenecked by slowest model")

    results = []
    with ThreadPoolExecutor(max_workers=len(JOBS)) as ex:
        futures = {ex.submit(fn, slug, prompt): slug for slug, fn, prompt in JOBS}
        for fut in as_completed(futures):
            slug = futures[fut]
            try:
                r = fut.result()
                results.append(r)
                print(f"\n>>> DONE [{r['slug']}]: {r['status']}", flush=True)
                if r["status"] == "OK":
                    print(f"    {r['path']} ({r['size_mb']} MB, {r['elapsed_s']}s)")
                else:
                    print(f"    error: {r.get('error', r.get('result', r.get('raw', '?')))[:300]}")
            except Exception as e:
                results.append({"slug": slug, "status": "FUTURE_EXC", "error": str(e)})
                print(f"\n>>> FUTURE FAILED [{slug}]: {e}")

    manifest = OUT / "manifest.json"
    manifest.write_text(json.dumps({"results": results}, indent=2, default=str))
    print(f"\n→ manifest: {manifest}")
    ok = sum(1 for r in results if r.get("status") == "OK")
    print(f"→ {ok}/{len(JOBS)} succeeded")
    return 0 if ok == len(JOBS) else 1


if __name__ == "__main__":
    sys.exit(main())
