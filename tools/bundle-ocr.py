"""Rebuild the offline OCR scripts. Development-only: downloads pinned, hash-checked sources."""
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

OUT = Path(__file__).resolve().parents[1] / "vendor" / "ocr"
sources = json.loads((OUT / "sources.json").read_text(encoding="utf-8"))
def download(key):
    source = sources[key]
    data = urllib.request.urlopen(source["url"], timeout=60).read()
    if hashlib.sha256(data).hexdigest() != source["sha256"]:
        raise ValueError("Source checksum mismatch: " + key)
    return data

def unpack(data, name):
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        return archive.extractfile("package/" + name).read()

tesseract, core = download("tesseract"), download("core")
worker = unpack(tesseract, "dist/worker.min.js").decode()
engine = unpack(core, "tesseract-core-lstm.wasm.js").decode()
assert "data:application/octet-stream;base64," in engine
(OUT / "worker-source.js").write_text("window.OfflineOCRWorkerSource = " + json.dumps(engine + "\n;" + worker) + ";\n", encoding="utf-8")
(OUT / "eng-data.js").write_text("window.OfflineOCREnglish = " + json.dumps(base64.b64encode(download("english")).decode()) + ";\n", encoding="utf-8")
(OUT / "tesseract.min.js").write_bytes(unpack(tesseract, "dist/tesseract.min.js"))
(OUT / "tesseract.js-LICENSE.txt").write_bytes(unpack(tesseract, "LICENSE.md"))
(OUT / "tesseract.js-core-LICENSE.txt").write_bytes(unpack(core, "LICENSE"))
(OUT / "eng-LICENSE.txt").write_bytes(download("english_license"))
print("Offline OCR assets rebuilt with verified source checksums.")
