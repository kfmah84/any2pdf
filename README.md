# any2pdf

Open `index.html` in a modern browser. No installation, server, account, or upload service is required. All image processing happens on your device.

- Choose 1 × 1, 1 × 2 (one column, two rows), 2 × 2, or a custom grid up to 8 × 8.
- Select or drop images into a box. Selecting multiple images fills subsequent boxes.
- Drag the lower-right handle to resize proportionally; keyboard users can focus the handle and use arrow keys. Images always retain their aspect ratio.
- Add optional captions, select A4 (default) or Letter, and adjust margins and spacing.
- Download PDF uses the chosen JPEG quality and DPI. Enable a file-size limit to automatically select quality and DPI instead. An impossible size limit produces a message rather than an oversized download.
- Print page uses your browser's print dialog; choose the matching paper size and disable browser headers/footers. Download PDF gives the most consistent output and applies compression settings.

JPG, PNG, BMP, WebP, GIF, SVG, and other browser-decodable images are supported. TIFF uses the bundled UTIF decoder (first page only). Animated images export one frame. Unusual TIFF compression variants may not decode. Exported pages are rasterized, including captions. Large images or 600 DPI output need more memory. Lower DPI if your browser runs out of memory.

Grid changes retain hidden images for later reuse; Clear page removes all images and captions. Captions that cannot fit in their export cell produce a descriptive error. Current work is held in memory and is cleared when the page is reloaded.

Third-party libraries are bundled locally under `vendor/`: UTIF 3.1.0 (MIT) and pako 1.0.11 (MIT / zlib). See their license files in that directory.
