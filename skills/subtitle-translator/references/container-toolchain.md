# Container & Toolchain Reference

## Container Capabilities

| Container | Extraction | Remux | Notes |
|-----------|-----------|-------|-------|
| MKV | Full support | Full support | Best for preserving styling and multiple tracks |
| MP4/MOV/M4V | Via ffmpeg | `mov_text` only | ASS/SSA styling lost; warn the user |
| AVI/TS/WMV/FLV | Partial via ffmpeg | Prefer MKV output | Subtitle support is inconsistent |

## Output Container Logic

- MKV input → MKV output.
- MP4-family input → same container by default, with `mov_text` codec and a styling loss warning.
- Other containers → default to MKV unless the user explicitly requests otherwise.

## Toolchain by Container

### MKV

Prefer `mkvtoolnix` tools:

1. **Probe**: `mkvmerge --identify --identification-format json <file>`
2. **Extract**: `mkvextract tracks <file> <track_id>:<output_path>`
3. **Remux**: `mkvmerge -o <output> <input> --language <tid>:<tag> --track-name <tid>:<title> <translated_subtitle>`

Track IDs are consistent across the mkvtoolnix suite.

### Non-MKV

Use `ffprobe`/`ffmpeg`:

1. **Probe**: `ffprobe` — inspect container format, all streams, codec names, language tags, titles, and default/forced flags.
2. **Extract**: `ffmpeg -map 0:<stream_index>` for extraction.
3. **Remux**: `ffmpeg -c copy` with `-map 0 -map 1:0` and subtitle metadata flags.

### Important

Do not mix `ffprobe` stream indices with `mkvextract` track IDs — they use different numbering systems.

## Subtitle Codecs

### Text-based (translate directly)

`subrip`/`srt`, `ass`/`ssa`, `webvtt`, `mov_text`

### Image-based (require OCR first)

`hdmv_pgs_subtitle`, `dvd_subtitle`, `dvb_subtitle`

If the best available subtitle is image-based, state that OCR is required and that accuracy may drop. Do not silently proceed as if it were text.

## Image-Based Subtitle OCR

When the selected subtitle is image-based:

1. Extract the image-based stream.
2. Run OCR to produce editable text.
3. Warn the user about OCR accuracy risks before proceeding.
4. Translate the OCR result.
5. Mux the translated text subtitle back into the video.
6. Preserve the original image-based track unless the user explicitly wants it removed.

The automation script does not handle OCR — this branch requires manual orchestration.

## Extraction Format Choice

- Keep `ass`/`ssa` if style preservation matters and the output will remain MKV.
- Convert to `srt` for broad compatibility.

## Remux Metadata

When adding the new subtitle stream:

- Set the language metadata to the target language tag.
- Set a clear stream title, e.g. `es-ES`, `Simplified Chinese`.
- Keep all original subtitle tracks unless the user explicitly asks to replace them.
