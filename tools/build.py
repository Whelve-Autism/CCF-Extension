"""Build a portable sharing ZIP using only Python's standard library."""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
files = {"manifest.json", "LICENSE", "package.json", "script.js"}
for content in manifest["content_scripts"]:
    files.update(content.get("js", []))
    files.update(content.get("css", []))
files.update(manifest["icons"].values())
for folder in ("test", "tools"):
    files.update(str(p.relative_to(ROOT)) for p in (ROOT / folder).rglob("*") if p.suffix in (".cjs", ".js", ".py"))

PACKAGE_NAME = "CCF_Extension"
output = ROOT.parent / f"{PACKAGE_NAME}.zip"
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(files):
        source = ROOT / name
        if not source.is_file():
            raise FileNotFoundError(source)
        archive.write(source, PACKAGE_NAME + "/" + name)
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for name in files:
        assert archive.read(PACKAGE_NAME + "/" + name) == (ROOT / name).read_bytes()
print(f"Validated sharing package: {output} ({output.stat().st_size:,} bytes)")
