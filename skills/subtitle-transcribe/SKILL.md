---
name: subtitle-transcribe
description: 'Transcribe speech from video or audio files into subtitle files using Whisper. Use when the user asks to "transcribe video", "generate subtitles from audio", "speech to text subtitles", "extract dialogue", or when a video has no embedded subtitle tracks and the user needs one.'
argument-hint: "[video/audio path, language, output format]"
---

# Subtitle Transcribe

Extract audio from a video file (or accept audio directly), transcribe speech to text using Whisper, and deliver a timed subtitle file. Optionally remux the generated subtitle back into the video container when the user explicitly asks.

## When to Use

- Generate subtitles from a video that has no embedded subtitle tracks
- Transcribe speech from video or audio files into SRT, VTT, or ASS format
- Create a base subtitle file for subsequent translation (pairs with `subtitle-translator`)
- Produce captions for accessibility or archival purposes

## Core Rules

1. Probe the container and audio streams before any action.
2. Default to subtitle-file delivery (`.srt`); only remux when explicitly asked.
3. Never re-encode video or audio beyond what extraction requires.
4. Never overwrite the original file — write to a temporary or suffixed path first.
5. Delete temporary audio extraction artifacts after successful transcription unless the user asks to keep them.
6. Subtitle output naming: `<source-filename>.<language>.<subtitle-ext>` (e.g., `movie.en.srt`).
7. Do not assume an MP4/MOV text or data track is a real dialogue subtitle until it is verified; some files expose chapter labels or non-exportable timed-text metadata that should not divert the workflow away from transcription.

## Prerequisites

Before starting, verify that required tools are installed. Check each tool and install any that are missing.

### openai-whisper

```bash
# Check
whisper --help

# Install (requires Python 3.9+)
# Prefer uv if available:
uv tool install openai-whisper --python-preference managed

# Otherwise fall back to pip:
pip install -U openai-whisper
```

Also requires `ffmpeg` (see below) — Whisper uses it internally for audio decoding.

If Whisper model download fails with a checksum mismatch, delete the corrupted model file from the Whisper cache and retry.

### mkvtoolnix (MKV files only)

```bash
# Check
mkvmerge --version

# Windows (winget)
winget install MKVToolNix.MKVToolNix

# macOS
brew install mkvtoolnix

# Ubuntu/Debian
sudo apt install mkvtoolnix
```

### ffmpeg / ffprobe (non-MKV files, and required by Whisper)

```bash
# Check
ffmpeg -version

# Windows (winget)
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### GPAC / MP4Box (recommended for MP4 diagnostics)

MP4Box is not required for every transcription run, but it is strongly recommended when MP4/MOV files report text/data subtitle-like tracks. It can distinguish actual subtitle streams from chapter-label or timed-text metadata more clearly than `ffprobe` alone.

```bash
# Check
MP4Box -version

# Windows (winget)
winget install GPAC.GPAC

# macOS
brew install gpac

# Ubuntu/Debian
sudo apt install gpac
```

If a tool is missing and cannot be installed (e.g., no admin rights), inform the user and suggest alternatives or manual installation steps.

## Transcription Tool Selection

**Default: `openai-whisper`** — the open-source Whisper model (`pip install openai-whisper`, CLI: `whisper`).

Before running Whisper, check whether the user has an alternative transcription tool or MCP server available:

- `whisper.cpp` / `whisper-cpp` — faster CPU inference
- `faster-whisper` — CTranslate2-based, lower memory usage
- `insanely-fast-whisper` — pipeline-based, GPU-optimized
- Any MCP tool whose description mentions transcription or speech-to-text

If an alternative is found, confirm with the user which tool to use. Otherwise, proceed with `openai-whisper`.

### Whisper Model Selection

| Duration | Default Model | Notes |
|----------|--------------|-------|
| < 10 min | `medium` | Good balance of speed and accuracy |
| 10–60 min | `medium` | Recommend `large-v3` if accuracy is critical |
| > 60 min | `medium` | Suggest `large-v3` only if user accepts longer processing |

Let the user override the model with any valid Whisper model name (`tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`, `turbo`).

## Audio Extraction

### MKV Files

Use `mkvtoolnix` to extract the audio track:

1. **Probe**: `mkvmerge --identify --identification-format json <file>`
2. **Select audio track**: Pick the track that matches the user's source language, or the default audio track.
3. **Extract**: `mkvextract tracks <file> <track_id>:<output_audio_path>`

### Non-MKV Files (MP4, MOV, M4V, AVI, etc.)

Use `ffmpeg` to extract audio:

1. **Probe**: `ffprobe -v quiet -print_format json -show_streams -show_format <file>`
2. **Select audio stream**: Pick the stream matching the user's source language, or the default audio stream.
3. **Extract**: `ffmpeg -i <file> -map 0:<audio_stream_index> -vn -acodec pcm_s16le -ar 16000 -ac 1 <output.wav>`

Whisper works best with 16 kHz mono WAV. If the user's alternative tool accepts other formats, adapt accordingly.

#### MP4/MOV Subtitle-Track Sanity Check

When an MP4-family container appears to contain subtitle-like tracks, do **not** immediately assume the subtitle is there. First verify what those tracks actually are:

1. Inspect `ffprobe` stream metadata:
   - `codec_type: subtitle` with codecs such as `mov_text`, `subrip`, `ass`, or `webvtt` is usually a real subtitle track.
   - `codec_type: data` or `codec_name: bin_data` with handlers such as `SubtitleHandler` is **not** enough evidence on its own.
   - `codec_type: text` / `Media Type: text:text` may still be chapter labels or Apple/3GPP timed-text metadata rather than dialogue subtitles.
2. If `MP4Box` is available, run `MP4Box -info <file>` for confirmation.
   - Treat tracks described as `Chapter Labels`, very low sample-count text tracks, or generic `QT/3GPP text` chapter metadata as **not usable dialogue subtitles**.
   - If `MP4Box -raw <track_id>` exports only chapter names or other sparse metadata, continue with transcription instead of extraction.
3. If `ffmpeg -map 0:s:0` fails because no subtitle stream exists, and only `data`/`text` tracks remain, prefer transcription unless you can positively verify that the track contains full subtitle dialogue.
4. Only redirect the user toward subtitle extraction/translation when the embedded track has been verified as an actual subtitle track with substantive dialogue content.

In short: for MP4/MOV/M4V, “subtitle-like track exists” is not enough. Verify usability first, then choose between extraction and transcription.

### Direct Audio Input

If the user provides an audio file (`.wav`, `.mp3`, `.flac`, `.m4a`, `.ogg`), skip extraction and pass it directly to the transcription tool. Convert to 16 kHz mono WAV first only if the tool requires it.

## Workflow

### 1. Probe

Inspect the input file. Determine:
- Whether it is a video or audio file.
- For video: list audio streams with codec, language tag, channel count, and sample rate.
- Whether the file already has subtitle tracks.
- For MP4/MOV/M4V, whether any subtitle-like text/data track is a real dialogue subtitle or only chapter/timed-text metadata.

Only suggest `subtitle-translator` instead of transcription when the existing subtitle track has been verified as usable dialogue subtitles.

### 2. Select audio stream

For video files with multiple audio tracks, apply this priority:

1. Track matching the user-specified source language.
2. Default audio track.
3. First audio track.

Summarize the chosen stream: index, language, codec, channels. If ambiguous, ask one focused question.

### 3. Extract audio

Use the appropriate toolchain (see Audio Extraction above). Write the extracted audio to a temporary file in the same directory as the source.

Temporary audio naming: `<source-filename>.tmp-audio.wav`

### 4. Transcribe

Run the transcription tool:

```bash
# openai-whisper (default)
whisper <audio_path> \
  --model medium \
  --language <source_language> \
  --output_format srt \
  --output_dir <output_directory>
```

Key flags:
- `--language`: Set to the user's specified language. Omit to let Whisper auto-detect (warn user this may be less accurate).
- `--output_format`: `srt` (default), `vtt`, `ass`, `txt`, or `all`.
- `--task transcribe`: Explicit transcribe mode (default). Use `--task translate` only if the user asks Whisper to translate to English during transcription.
- `--condition_on_previous_text False`: Consider setting this for long files to avoid hallucination loops.

For alternative tools, adapt the command but produce the same output format.

### 5. Validate subtitle output

1. Output file exists and is non-empty.
2. Contains valid cue structure (numbered cues, timestamps, text).
3. No obvious hallucination artifacts (repeated lines, timestamp jumps). If detected, warn the user.
4. Rename to final output path: `<source-filename>.<language>.srt`

### 6. Clean up

Delete the temporary extracted audio file unless the user asked to keep it.

Stop here if the user only asked for subtitle output.

### 7. Remux (optional)

Skip unless the user explicitly asks. Use the same remux approach as `subtitle-translator`:
- MKV: `mkvmerge` to add the subtitle track.
- Non-MKV: `ffmpeg -c copy` with `-map` flags.

Set language metadata and a clear stream title on the new subtitle track.

For container-specific remux details, see [../subtitle-translator/references/container-toolchain.md](../subtitle-translator/references/container-toolchain.md).

## Integration with subtitle-translator

A common two-step workflow:

1. **subtitle-transcribe**: Generate subtitle from audio → `movie.en.srt`
2. **subtitle-translator**: Translate that subtitle → `movie.zh-CN.srt`

When the user asks to "transcribe and translate", run both skills in sequence. Pass the transcribed subtitle file as input to the translator.

## Anti-Patterns

- Skipping audio probe and assuming a single audio track
- Extracting audio from MKV with `ffmpeg` when `mkvextract` is available (track ID mismatch risk)
- Mixing `ffprobe` stream indices with `mkvextract` track IDs
- Treating MP4 `data`, `bin_data`, `text:text`, `SubtitleHandler`, or sparse tx3g-style tracks as verified dialogue subtitles without further inspection
- Redirecting to subtitle extraction/translation just because an MP4 file exposes a subtitle-like track in `ffprobe`
- Assuming an MP4 text track is exportable to `.srt` with `ffmpeg` without verifying the codec/container behavior first
- Running Whisper on the full video file instead of extracted audio (wastes memory, slower)
- Using `large` model by default without considering processing time
- Leaving temporary WAV files behind after successful transcription
- Remuxing by default when the user only asked for a subtitle file
- Claiming Whisper output is perfect — always note that manual review may be needed for accuracy
- Proceeding with Whisper without checking for a locally available alternative tool

## Completion Checklist

- [ ] Input file was probed for audio streams (and existing subtitle tracks noted).
- [ ] For MP4/MOV/M4V, any subtitle-like text/data track was verified before deciding to skip transcription.
- [ ] Audio stream selection follows language-preference priority.
- [ ] Audio was extracted using the correct toolchain (mkvextract for MKV, ffmpeg for non-MKV).
- [ ] Transcription tool was selected (default Whisper or user's alternative).
- [ ] Whisper model choice was appropriate for file duration.
- [ ] Subtitle output is non-empty and structurally valid.
- [ ] Output file follows the naming convention `<name>.<language>.<ext>`.
- [ ] Temporary audio files were cleaned up.
- [ ] The original file was not modified or overwritten.
- [ ] If remux was requested, subtitle metadata reflects the correct language.
