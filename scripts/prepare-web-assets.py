from pathlib import Path
import sys

from PIL import Image


def convert(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.save(destination, format="WEBP", lossless=True, method=6)


if __name__ == "__main__":
    pairs = sys.argv[1:]
    if not pairs or len(pairs) % 2:
        raise SystemExit("expected source/destination path pairs")
    for index in range(0, len(pairs), 2):
        convert(Path(pairs[index]), Path(pairs[index + 1]))
