---
name: subtitle-translator
description: Translate embedded subtitles, extract subtitle tracks, or remux translated subtitles for video files (MKV, MP4, MOV, M4V). Trigger phrases include "translate subtitles", "export subtitles", "extract srt", "subtitle translation".
argument-hint: "[video path, source locale, target locale]"
---

# Subtitle Translator

Extract an embedded subtitle track from a video, translate it to a target language, and deliver a translated subtitle file. Only remux the translated subtitle back into a video container when the user explicitly asks.

Handles subtitle-driven translation only — not dubbing or speech-to-text. If the file has no usable subtitle track, say so explicitly.

## When to Use

- Translate embedded subtitles to another language
- Extract or export subtitle tracks from video files
- Produce translated subtitle files (default) or remux them back into video
- Handle multilingual subtitle workflows across MKV, MP4, MOV, M4V, or other containers

## Core Rules

1. Probe the container and subtitle streams before any action.
2. Default to subtitle-file delivery; only remux when explicitly asked.
3. Never re-encode video or audio unless the user explicitly asks.
4. Never overwrite the original file — always write a new output.
5. Preserve timestamps, cue order, and structural markers during translation.
6. Delete temporary intermediate artifacts after success unless the user asks to keep them.
7. Translate with subagents — do not assume an external translator tool is available.

## Subtitle Selection

Priority order:

1. Text-based track matching the user-specified source locale or language tag.
2. Text-based track inferred from title metadata matching the source language.
3. Default full-dialogue track in the source language when several matches exist.
4. Non-forced full-dialogue track over a forced-only track for the same language.
5. If no matching text track exists, ask the user whether to use another language or stop.

Defaults: source locale = `en` when not specified. Accept ISO 639-2 tags (`eng`, `jpn`, `spa`, `zho`).

For subtitle codec types, container capabilities, and toolchain commands, see [references/container-toolchain.md](./references/container-toolchain.md).

## Workflow

### 1. Probe

Run the automation script in `probe` mode or use the appropriate toolchain command. Inspect tracks, codecs, language tags, track names, and default/forced flags.

### 2. Select subtitle stream

Apply the selection priority above. Summarize the chosen stream: index, language, codec, text-based or image-based. If ambiguous, ask one focused question.

### 3. Extract

Run the automation script in `extract` mode or use the appropriate toolchain command. Choose `srt` for broad compatibility or keep `ass`/`ssa` when style preservation matters and the output will remain MKV.

### 4. Translate

Use subagents to translate the extracted subtitle text. The reusable prompt template is in [references/subagent-translator-prompt.md](./references/subagent-translator-prompt.md).

**Chunking strategy:**

- One subagent per full file when the file is reasonably sized.
- For oversized files, split at cue boundaries and assign each chunk to a parallel subagent.
- Merge chunk outputs in original order without adding, dropping, or reordering cues.
- Delete chunk files after a successful merge unless the user asked to keep them.

**Preservation rules:**

- Cue numbers, timestamps, and structural separators — keep exactly.
- Speaker separation, line breaks, and multi-speaker line splits — preserve as-is.
- Formatting control codes and markup — do not translate as text.
- Subtitle punctuation, music markers, and speaker prefixes — keep when meaningful.
- Prefer natural, idiomatic target-language rendering over word-for-word glosses.

Stop here if the user only asked for subtitle output.

### 5. Remux (optional)

Skip unless the user explicitly asks for a remuxed video file. Run the automation script in `remux` mode or use the appropriate toolchain command. See [references/container-toolchain.md](./references/container-toolchain.md) for container-specific remux details.

### 6. Validate

**Subtitle-only deliverable:**

1. Translated file exists and is non-empty.
2. Cue numbers, timestamps, and separators preserved.
3. Output path is distinct from the extracted source.
4. Temporary files cleaned up.

**Remuxed video deliverable** (all of the above, plus):

1. Output video file exists and is non-empty.
2. Video and audio streams were copied, not re-encoded.
3. Translated subtitle stream appears with correct language metadata.
4. Any container or styling compromises reported to user.

## Automation Script

`./scripts/translate-video-subtitles.cjs`

Three modes: `probe`, `extract`, `remux`. Requires `mkvtoolnix` for MKV files and `ffprobe`/`ffmpeg` for non-MKV files. Does not handle image-based subtitle OCR or translation — only mechanical extraction and muxing.

Preferred workflow:

1. `probe` — inspect subtitle streams and get a recommended track.
2. `extract` — export the preferred source-language subtitle track.
3. Translate the extracted file with subagents.
4. `remux` — (only if requested) mux the translated subtitle back into the video.
5. Run the script in `remux` mode with `--translated-subtitle` only when the user explicitly wants the translated subtitle added back into a video file.

If subagents are used, the preferred orchestration is:

1. Probe and extract with the helper script when needed.
2. Translate full subtitle files directly with subagents when each file is reasonably sized.
3. For oversized subtitle files, split at cue boundaries, translate chunks in parallel subagents, then merge chunks back into the final subtitle file.
4. Delete temporary extracted subtitle files and chunk files after successful translation when they are no longer needed.

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
- Remuxing by default when the user only asked for translated subtitle files
- Routing subtitle translation through the current agent or a custom helper script when subagent-based text translation is sufficient
- Leaving extracted source subtitles or temporary chunk files behind after successful translation when the user did not ask to keep them
- Overwriting the source video file
- Promising MP4-family containers will preserve ASS styling
- Treating image-based subtitles as translatable text without OCR

## Completion Checklist

- [ ] Container and subtitle streams were inspected before action.
- [ ] The selected subtitle stream follows the source-language preference.
- [ ] Text vs image-based subtitles were correctly distinguished.
- [ ] Translation preserved timestamps and subtitle structure.
- [ ] The final translated subtitle file was written successfully.
- [ ] Temporary extracted subtitle files and chunk files were removed unless the user asked to keep them.
- [ ] The original video file was not overwritten.
- [ ] If remux was requested, the translated subtitle was muxed into a new output file.
- [ ] If remux was requested, subtitle metadata reflects the target locale.
- [ ] If remux was requested, container limitations were explained if relevant.
