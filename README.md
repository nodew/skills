# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions, references, scripts, and templates that extend agent capabilities across branding, UI prototyping, subtitle transcription, and subtitle translation workflows.

This repository is designed to host multiple skills that can be activated on demand for specific task domains.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### logo-creator

Creates production-ready logo systems and export-ready brand assets from briefs, references, or existing SVG sources.

- Entry: `skills/logo-creator/SKILL.md`
- Scripts: `export-logo-assets.cjs`
- References: `geometry.md`, `lockups.md`, `modernism.md`, `typography.md`

### pencil-dev

Designs structured product prototypes in pencil.dev and `.pen` files with a token-first, reusable-component workflow.

- Entry: `skills/pencil-dev/SKILL.md`

### subtitle-transcribe

Transcribes speech from video or audio files into subtitle files using Whisper, with optional remuxing back into the source container.

- Entry: `skills/subtitle-transcribe/SKILL.md`
- Notes: Uses `mkvtoolnix` for MKV, `ffmpeg` for other containers, and recommends GPAC/MP4Box for ambiguous MP4/MOV subtitle diagnostics.

### subtitle-translator

Extracts embedded subtitle tracks, translates them with subagents, and optionally remuxes translated subtitles into MKV, MP4, MOV, or M4V containers.

- Entry: `skills/subtitle-translator/SKILL.md`
- Scripts: `translate-video-subtitles.cjs`
- References: `container-toolchain.md`, `subagent-reviewer-prompt.md`, `subagent-translator-prompt.md`
- Notes: Recommends GPAC/MP4Box when MP4-family subtitle tracks or remux behavior are ambiguous.

## Installation

```bash
npx skills add nodew/skills
```

## Usage

Skills are automatically available once installed. The agent should activate the matching skill when a task falls within that skill's scope.

**Examples:**
```text
Create a logo system for a developer tool called QuillStack.
Translate the embedded English subtitles in movie.mkv to zh-CN and give me an .srt file.
Transcribe this interview.mp4 into English subtitles and keep the output as .srt.
Create a reusable dashboard prototype in pencil.dev with light and dark themes.
```

## Repository Structure

Each skill may contain:
- `SKILL.md` - the primary skill definition
- `references/` - supporting documentation loaded on demand
- `scripts/` - helper scripts for automation
- `templates/` - starter files and presets when needed

The repository can also include:
- `examples/` - example prompts and example outputs for individual skills

## License

MIT
