---
name: subtitle-translator
description: Use when the user asks to translate embedded subtitles, export subtitle tracks, or remux translated subtitles for MKV, MP4, MOV, M4V, or similar video files. Use this even when the user expects the current agent to translate subtitle text directly rather than calling an external translator tool.
argument-hint: "[video path, source locale, target locale]"
---

# Subtitle Translator

Extract an embedded subtitle track from a video, translate it to a target language, and mux the translated subtitle back without re-encoding the video or audio streams.

This skill handles subtitle-driven translation only — not dubbing or speech-to-text. If the file has no usable subtitle track, say so explicitly and offer an OCR or ASR alternative only if the user wants that.

## When to Use

- Translate embedded subtitles to another language
- Extract or export subtitle tracks from video files
- Select a preferred source-language subtitle when multiple tracks exist
- Remux translated subtitles back into a video container
- Handle multilingual subtitle workflows across MKV, MP4, MOV, M4V, or other containers

## Core Rules

1. Always probe the container and subtitle streams before any action.
2. Prefer a user-specified source-language text subtitle when multiple tracks exist.
3. Default to translating subtitle text with the current agent after extraction. Do not assume an external translator command is available.
4. Never re-encode video or audio unless the user explicitly asks.
5. Never overwrite the original file. Always write a new output file.
6. Warn about container limitations before promising same-container output.
7. Preserve timestamps, cue order, and structural markers during translation.

## Subtitle Selection

Choose the subtitle stream in this priority order:

1. Text-based track matching the user-specified source locale or language tag.
2. Text-based track inferred from title metadata matching the source language.
3. Default full-dialogue track in the source language when several matches exist.
4. Non-forced full-dialogue track over a forced-only track for the same language.
5. If no matching text track exists, ask whether to use another language or stop.

Source-language defaults:

- Use the user-specified source locale when provided.
- Default to English (`en`) when not specified.
- Accept explicit ISO 639-2 tags (`eng`, `jpn`, `spa`, `zho`) for precise matching.

### Text-based codecs (translate directly)

`subrip`/`srt`, `ass`/`ssa`, `webvtt`, `mov_text`

### Image-based codecs (require OCR first)

`hdmv_pgs_subtitle`, `dvd_subtitle`, `dvb_subtitle`

If the best available subtitle is image-based, state that OCR is required and that accuracy may drop. Do not silently proceed as if it were text.

## Container Rules

| Container | Extraction | Remux | Notes |
|-----------|-----------|-------|-------|
| MKV | Full support | Full support | Best for preserving styling and multiple tracks |
| MP4/MOV/M4V | Via ffmpeg | `mov_text` only | ASS/SSA styling lost; warn the user |
| AVI/TS/WMV/FLV | Partial via ffmpeg | Prefer MKV output | Subtitle support is inconsistent |

Output container logic:

- MKV input → MKV output.
- MP4-family input → same container by default, with `mov_text` codec and a styling loss warning.
- Other containers → default to MKV unless the user explicitly requests otherwise.

### Toolchain by container

- **MKV**: prefer `mkvmerge --identify` (probe) → `mkvextract` (extract) → `mkvmerge` (remux). Track IDs are consistent across the mkvtoolnix suite.
- **Non-MKV**: use `ffprobe` (probe) → `ffmpeg` (extract and remux).
- Do not mix `ffprobe` stream indices with `mkvextract` track IDs — they use different numbering systems.

## Workflow

### 1. Probe

- **MKV**: run `mkvmerge --identify --identification-format json <file>` to inspect tracks, codecs, language tags, track names, and default/forced flags.
- **Non-MKV**: run `ffprobe` to inspect container format, all streams, codec names, language tags, titles, and default/forced flags.

### 2. Select subtitle stream

Apply the selection policy above. Before extraction, summarize: stream index, detected language, codec, and whether it is text-based or image-based. If ambiguous, ask one focused question.

### 3. Extract

- **MKV**: use `mkvextract tracks <file> <track_id>:<output_path>`. The track ID comes from `mkvmerge --identify`, so there is no numbering mismatch.
- **Non-MKV**: use `ffmpeg -map 0:<stream_index>` for extraction.

Format choice:

- Keep `ass`/`ssa` if style preservation matters and the output will remain MKV.
- Convert to `srt` for broad compatibility.

### 4. Translate

Translate only the text content. The user must specify both source and target locale.

Default path:

1. Extract the subtitle track to a text subtitle file.
2. Read the extracted subtitle file in the workspace.
3. Translate the spoken text with the current agent.
4. Write a new translated subtitle file, keeping cue numbers, timestamps, and line structure intact.
5. Pass that translated subtitle file into the remux step.

Preserve:

- Cue numbers
- Timestamps exactly
- Structural separators and format control codes

Quality rules:

- Do not merge or split cues unless absolutely necessary.
- Preserve speaker separation and line breaks.
- Do not translate formatting control codes as normal text.

Direct-agent translation rules:

- Translate subtitle payloads yourself instead of delegating by default.
- Keep subtitle punctuation, music markers, and speaker prefixes when they carry meaning.
- If a cue contains multiple speakers on separate lines, keep the same line split.
- If a term is ambiguous, prefer a natural target-language rendering over a word-for-word gloss.

### 5. Remux

- **MKV**: use `mkvmerge -o <output> <input> --language <tid>:<tag> --track-name <tid>:<title> <translated_subtitle>`. Preserves all original tracks and appends the translated one with correct metadata.
- **Non-MKV**: use `ffmpeg -c copy` with `-map 0 -map 1:0` and subtitle metadata flags.

When adding the new subtitle stream:

- Set the language metadata to the target language tag.
- Set a clear stream title, e.g. `Translated from en (es-ES)`.
- Keep all original subtitle tracks unless the user explicitly asks to replace them.

### 6. Validate

Before reporting completion, verify:

1. The output file exists and is not empty.
2. Video and audio streams were copied, not re-encoded.
3. The translated subtitle stream appears in the output with correct language metadata.
4. Any container or styling compromise has been reported.

## Image-Based Subtitle OCR

When the selected subtitle is image-based:

1. Extract the image-based stream.
2. Run OCR to produce editable text.
3. Warn the user about OCR accuracy risks before proceeding.
4. Translate the OCR result.
5. Mux the translated text subtitle back into the video.
6. Preserve the original image-based track unless the user explicitly wants it removed.

The automation script does not handle OCR — this branch requires manual orchestration.

## Automation Script

`./scripts/translate-video-subtitles.cjs`

Automates the mechanical parts of the workflow in three explicit modes: `probe`, `extract`, and `remux`.

Requires `mkvmerge` and `mkvextract` (from mkvtoolnix) for MKV files, and `ffprobe`/`ffmpeg` for non-MKV files. Does not handle image-based subtitle OCR.

Preferred workflow with this skill:

1. Run the script in `probe` mode to inspect available subtitle streams.
2. Run the script in `extract` mode to export the preferred source subtitle track.
3. Translate the extracted subtitle file with the current agent.
4. Run the script in `remux` mode with `--translated-subtitle` to append the translated track.

```bash
node skills/subtitle-translator/scripts/translate-video-subtitles.cjs \
  --mode probe \
  --input ./movie.mkv

node skills/subtitle-translator/scripts/translate-video-subtitles.cjs \
  --mode extract \
  --input ./movie.mkv \
  --source-locale en \
  --extract-output ./movie.en.srt

node skills/subtitle-translator/scripts/translate-video-subtitles.cjs \
  --mode remux \
  --input ./movie.mkv \
  --target-locale zh-CN \
  --translated-subtitle ./movie.zh-CN.srt
```

If `--mode` is omitted, the script auto-selects `remux` when `--translated-subtitle` is present, `extract` when `--extract-output` is present, and `probe` otherwise.

Output naming: when `--output` is omitted, derives from the source filename plus target locale suffix (e.g. `movie.es-ES.mkv`). For MKV, MP4, MOV, M4V inputs, keeps the original container. For other containers, defaults to `.mkv`.

## Anti-Patterns

- Guessing subtitle language without probing metadata
- Altering timestamps or cue ordering during translation
- Burning subtitles into video when the user asked for a muxed track
- Overwriting the source video file
- Promising MP4-family containers will preserve ASS styling
- Treating image-based subtitles as translatable text without OCR

## Completion Checklist

- [ ] Container and subtitle streams were inspected before action.
- [ ] The selected subtitle stream follows the source-language preference.
- [ ] Text vs image-based subtitles were correctly distinguished.
- [ ] Translation preserved timestamps and subtitle structure.
- [ ] The original video file was not overwritten.
- [ ] The translated subtitle was muxed into a new output file.
- [ ] Subtitle metadata reflects the target locale.
- [ ] Container limitations were explained if relevant.
