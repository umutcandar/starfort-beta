"""Build textured GLBs from the game's transparent battle artwork using SF3D."""
import argparse
import shutil
from pathlib import Path

from gradio_client import Client, handle_file

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets" / "heroes-3d"
HEROES = ("aldren", "lyra", "rovan", "mira", "doran", "vesper", "eira")


def generate(hero):
    destination = ASSETS / f"{hero}-reconstructed.glb"
    if destination.exists():
        print(f"Cached {hero}", flush=True)
        return
    client = Client("https://stabilityai-stable-fast-3d.hf.space", verbose=False)
    source = ASSETS / "source" / f"{hero}.png"
    client.predict(handle_file(str(source)), 0.85, api_name="/requires_bg_remove")
    result = client.predict(
        "Run", handle_file(str(source)), 0.85, "Triangle", 14000, 2048,
        api_name="/run_button",
    )
    files = [value.get("value") for value in result if isinstance(value, dict)]
    model = next((path for path in files if isinstance(path, str) and path.endswith(".glb")), None)
    if not model:
        raise RuntimeError(f"{hero} returned no GLB: {result}")
    shutil.copyfile(model, destination)
    print(f"Built {hero}: {destination.stat().st_size} bytes", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("heroes", nargs="*", choices=HEROES)
    arguments = parser.parse_args()
    for hero in arguments.heroes or HEROES:
        generate(hero)
