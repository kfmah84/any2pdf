# any2pdf

Open `index.html` in a modern browser. No installation, server, account, or upload service is required. All image processing, including OCR, happens on your device. Keep the complete folder (including `vendor/ocr`) together: OCR works offline from the first launch, without a server, account, upload, CDN, or previously cached download.

- Choose 1 × 1, 1 × 2 (one column, two rows), 2 × 2, or a custom grid up to 8 × 8.
- Select or drop images into a box. Selecting multiple images fills subsequent boxes.
- Drag the lower-right handle to resize proportionally; keyboard users can focus the handle and use arrow keys. Images always retain their aspect ratio.
- Add optional captions, select A4 (default) or Letter, and adjust margins and spacing.
- Download PDF defaults to `YYYYMMDD_HHMMSS.pdf`, using your device's local date and time at download. Captions have a selectable, searchable text layer. Searchable image text (OCR) is enabled by default; it adds selectable text over recognized English words in uploaded images without changing their appearance. Download PDF uses the chosen JPEG quality and DPI. Enable a file-size limit to automatically select quality and DPI instead. An impossible size limit produces a message rather than an oversized download.
- Print page uses your browser's print dialog; choose the matching paper size and disable browser headers/footers. Download PDF gives the most consistent output and applies compression settings and image OCR. Browser printing does not include the image OCR text layer.

JPG, PNG, BMP, WebP, GIF, SVG, and other browser-decodable images are supported. TIFF uses the bundled UTIF decoder (first page only). Animated images export one frame. Unusual TIFF compression variants may not decode. Exported pages retain their raster appearance, with positioned Unicode text layers for captions and recognized image words. OCR runs on the source images before export compression and its results are reused while those images remain loaded. The bundled model recognizes English; other scripts are not supported. Clear, upright printed text works best. OCR can make mistakes or find no text in a photo. Images larger than 4,000 pixels on their longest side are reduced for recognition only. Large images or 600 DPI output need more memory. Lower DPI if your browser runs out of memory.

Grid changes retain hidden images for later reuse; Clear page removes all images and captions. Captions that cannot fit in their export cell produce a descriptive error. Current work and OCR results are held in memory and are cleared when the page is reloaded. OCR runs in a local Web Worker, which is terminated after recognition. No images or recognized text are uploaded or saved in browser storage.

Third-party libraries are bundled locally under `vendor/`: UTIF 3.1.0 (MIT) and pako 1.0.11 (MIT / zlib). See their license files in that directory.

Offline OCR bundles Tesseract.js 6.0.1, Tesseract.js-core 6.0.0 (non-SIMD LSTM WebAssembly for compatibility), and English `4.0.0_best_int` language data, under Apache-2.0. Licenses and asset provenance are in `vendor/ocr/`. These script-wrapped assets add about 8 MB and load only when OCR is used. The worker serves its bundled language bytes in memory and rejects all other fetches and script imports.

Verification: `node verify.cjs` checks PDF structure and filenames. `node verify-offline.cjs` tests Chrome with networking disabled, recognizes a generated image, and extracts the downloaded PDF text. The integration test uses Playwright 1.58.2 and pdfjs-dist 5.4.624 installed under the OS temporary directory at `any2pdf-test-tools/node_modules`; Chrome must be installed at its standard Windows location. Install these development tools with `npm install --prefix "$env:TEMP\any2pdf-test-tools" playwright@1.58.2 pdfjs-dist@5.4.624` in PowerShell. They are not required to use the app.
