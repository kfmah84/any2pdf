# Bundled offline OCR

- Tesseract.js 6.0.1 worker and browser API (Apache-2.0).
- Tesseract.js-core 6.0.0 non-SIMD LSTM build, with its WebAssembly embedded (Apache-2.0).
- English `4.0.0_best_int` traineddata from naptha/tessdata (Apache-2.0).

`worker-source.js` wraps the concatenated core and worker source in a JavaScript string. `eng-data.js` wraps gzip-compressed English data as base64. This permits local script loading on file:// without fetching local binaries or contacting a CDN. The app creates a blob worker from these sources, serves language bytes from memory, and blocks all other worker fetches/imports. Browser storage caching is disabled.

Source URLs and SHA-256 checksums are in `sources.json`. Rebuild from the project root with `python tools/bundle-ocr.py`; network access is needed only for this development step. Downloaded sources must match the recorded checksums. Normal app use requires no network access.
