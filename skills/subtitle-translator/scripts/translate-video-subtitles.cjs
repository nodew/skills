#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TEXT_SUBTITLE_CODECS = new Set(['subrip', 'srt', 'ass', 'ssa', 'webvtt', 'mov_text', 'SubStationAlpha', 'S_TEXT/UTF8', 'S_TEXT/SSA', 'S_TEXT/ASS']);
const IMAGE_SUBTITLE_CODECS = new Set(['hdmv_pgs_subtitle', 'dvd_subtitle', 'dvb_subtitle', 'S_HDMV/PGS', 'S_VOBSUB']);

const MKV_CODEC_NORMALIZE = {
  'SubRip/SRT': 'subrip',
  'S_TEXT/UTF8': 'subrip',
  'S_TEXT/SSA': 'ssa',
  'S_TEXT/ASS': 'ass',
  'S_TEXT/WEBVTT': 'webvtt',
  'S_HDMV/PGS': 'hdmv_pgs_subtitle',
  'S_VOBSUB': 'dvd_subtitle'
};

function printHelp() {
  console.log(`Usage: node skills/subtitle-translator/scripts/translate-video-subtitles.cjs [options]

Modes:
  probe                       Inspect subtitle streams and print a JSON summary
  extract                     Extract the preferred source subtitle track to a text subtitle file
  remux                       Mux an already translated subtitle file back into the video

Options:
  --mode <probe|extract|remux>  Operation mode (default: auto)
  --input <file>                 Source video file
  --output <file>                Output video file for remux mode (optional)
  --extract-output <file>        Output subtitle path for extract mode (optional)
  --translated-subtitle <file>   Translated subtitle file to remux in remux mode
  --stream-index <index>         Force a specific subtitle stream index/track id
  --source-locale <locale>       Preferred source subtitle locale (default: en)
  --source-language-tag <tag>    Override subtitle stream language tag matching
  --target-locale <locale>       Target locale for remux metadata (default: zh-CN)
  --target-language-tag <tag>    Override subtitle metadata language tag
  --subtitle-title <title>       Override subtitle stream title
  --subtitle-format <format>     Extraction format: auto, srt, ass (default: auto)
  --manifest <file>              Write JSON manifest to a file as well as stdout
  --help                         Show this help

Examples:
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

Notes:
  - The script no longer performs subtitle translation itself.
  - Auto mode resolves to remux when --translated-subtitle is present, extract when --extract-output is present, and probe otherwise.
  - For MKV files, the script prefers mkvtoolnix when it preserves the requested subtitle format.
  - Image-based subtitle OCR is not automated here.
`);
}

function parseArgs(argv) {
  const options = {
    mode: null,
    input: null,
    output: null,
    extractOutput: null,
    translatedSubtitle: null,
    streamIndex: null,
    sourceLocale: 'en',
    sourceLanguageTag: null,
    targetLocale: 'zh-CN',
    targetLanguageTag: null,
    subtitleTitle: null,
    subtitleFormat: 'auto',
    manifest: null,
    help: false
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];

    if (token === '--mode') {
      options.mode = argv[++index];
    } else if (token === '--input') {
      options.input = argv[++index];
    } else if (token === '--output') {
      options.output = argv[++index];
    } else if (token === '--extract-output') {
      options.extractOutput = argv[++index];
    } else if (token === '--translated-subtitle') {
      options.translatedSubtitle = argv[++index];
    } else if (token === '--stream-index') {
      options.streamIndex = Number(argv[++index]);
    } else if (token === '--source-locale') {
      options.sourceLocale = argv[++index];
    } else if (token === '--source-language-tag') {
      options.sourceLanguageTag = argv[++index];
    } else if (token === '--target-locale') {
      options.targetLocale = argv[++index];
    } else if (token === '--target-language-tag') {
      options.targetLanguageTag = argv[++index];
    } else if (token === '--subtitle-title') {
      options.subtitleTitle = argv[++index];
    } else if (token === '--subtitle-format') {
      options.subtitleFormat = argv[++index];
    } else if (token === '--manifest') {
      options.manifest = argv[++index];
    } else if (token === '--help' || token === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return options;
}

function fail(message, details) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function commandExists(command) {
  const probe = process.platform === 'win32'
    ? spawnSync('where', [command], { encoding: 'utf8', windowsHide: true })
    : spawnSync('/bin/sh', ['-lc', `command -v ${command}`], { encoding: 'utf8' });

  return probe.status === 0;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options
  });

  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || '').trim();
    fail(stderr || `Command failed: ${command}`);
  }

  return result;
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function detectContainerType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.mkv') {
    return 'mkv';
  }
  if (['.mp4', '.mov', '.m4v'].includes(extension)) {
    return 'mp4-family';
  }
  return 'other';
}

function normalizeMode(mode, options) {
  if (mode) {
    const normalized = String(mode).toLowerCase();
    if (!['probe', 'extract', 'remux'].includes(normalized)) {
      fail('--mode must be one of: probe, extract, remux.');
    }
    return normalized;
  }

  if (options.translatedSubtitle) {
    return 'remux';
  }
  if (options.extractOutput) {
    return 'extract';
  }
  return 'probe';
}

function sanitizeLocaleForFilename(locale) {
  return String(locale || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function normalizeTargetLocale(locale) {
  return String(locale || 'zh-CN').trim() || 'zh-CN';
}

function normalizeSourceLocale(locale) {
  return String(locale || 'en').trim() || 'en';
}

function deriveLanguageTag(targetLocale) {
  const normalized = normalizeTargetLocale(targetLocale).toLowerCase();
  const directMap = {
    'zh': 'zho',
    'zh-cn': 'zho',
    'zh-hans': 'zho',
    'zh-tw': 'zho',
    'zh-hant': 'zho',
    'en': 'eng',
    'en-us': 'eng',
    'en-gb': 'eng',
    'ja': 'jpn',
    'ja-jp': 'jpn',
    'ko': 'kor',
    'ko-kr': 'kor',
    'es': 'spa',
    'es-es': 'spa',
    'es-mx': 'spa',
    'fr': 'fra',
    'fr-fr': 'fra',
    'de': 'deu',
    'de-de': 'deu',
    'it': 'ita',
    'it-it': 'ita',
    'pt': 'por',
    'pt-br': 'por',
    'pt-pt': 'por',
    'ru': 'rus',
    'ru-ru': 'rus'
  };

  if (directMap[normalized]) {
    return directMap[normalized];
  }

  const baseLanguage = normalized.split('-')[0];
  if (directMap[baseLanguage]) {
    return directMap[baseLanguage];
  }

  return baseLanguage.slice(0, 3) || 'und';
}

function deriveTranslatedSubtitleTitle(sourceLocale, targetLocale) {
  return `Translated from ${normalizeSourceLocale(sourceLocale)} (${normalizeTargetLocale(targetLocale)})`;
}

function deriveVideoOutputPath(inputPath, targetLocale) {
  const parsed = path.parse(inputPath);
  const inputContainer = detectContainerType(inputPath);
  const suffix = sanitizeLocaleForFilename(targetLocale);
  const outputExtension = inputContainer === 'other'
    ? '.mkv'
    : (parsed.ext || '.mkv');

  return path.join(parsed.dir, `${parsed.name}.${suffix}${outputExtension}`);
}

function deriveExtractOutputPath(inputPath, sourceLocale, format) {
  const parsed = path.parse(inputPath);
  const suffix = sanitizeLocaleForFilename(sourceLocale) || 'subtitle';
  const extension = format === 'ass' ? '.ass' : '.srt';
  return path.join(parsed.dir, `${parsed.name}.${suffix}${extension}`);
}

function relativePath(filePath) {
  return path.relative(process.cwd(), filePath) || '.';
}

function isTextSubtitle(stream) {
  const codec = String(stream.codec_name || stream.codec || '').toLowerCase();
  return TEXT_SUBTITLE_CODECS.has(codec) || TEXT_SUBTITLE_CODECS.has(stream.codec_name || stream.codec || '');
}

function isImageSubtitle(stream) {
  const codec = String(stream.codec_name || stream.codec || '').toLowerCase();
  return IMAGE_SUBTITLE_CODECS.has(codec) || IMAGE_SUBTITLE_CODECS.has(stream.codec_name || stream.codec || '');
}

function buildSourceLanguagePreference(sourceLocale, explicitLanguageTag) {
  const normalized = normalizeSourceLocale(sourceLocale).toLowerCase();
  const baseLanguage = normalized.split('-')[0];
  const derivedTag = explicitLanguageTag || deriveLanguageTag(normalized);
  const acceptedTags = new Set([normalized, baseLanguage, derivedTag].filter(Boolean));
  const titleAliases = {
    en: ['english', 'eng'],
    zh: ['chinese', 'mandarin', 'cantonese', '中文', '汉语', '漢語'],
    ja: ['japanese', 'jpn', 'nihongo', '日本語'],
    ko: ['korean', 'kor', '한국어'],
    es: ['spanish', 'espanol', 'español', 'spa'],
    fr: ['french', 'francais', 'français', 'fra'],
    de: ['german', 'deutsch', 'deu'],
    it: ['italian', 'italiano', 'ita'],
    pt: ['portuguese', 'portugues', 'português', 'por'],
    ru: ['russian', 'русский', 'rus']
  };

  return {
    normalized,
    baseLanguage,
    derivedTag,
    acceptedTags,
    titleAliases: titleAliases[baseLanguage] || [baseLanguage]
  };
}

function languageScore(stream, preference) {
  const language = String(stream.tags?.language || '').toLowerCase();
  const title = String(stream.tags?.title || '').toLowerCase();
  let score = 0;

  if (preference.acceptedTags.has(language)) {
    score += 50;
  }
  if (language.startsWith(`${preference.baseLanguage}-`)) {
    score += 35;
  }
  if (preference.titleAliases.some(alias => title.includes(alias))) {
    score += 40;
  }
  if (stream.disposition?.default) {
    score += 10;
  }
  if (stream.disposition?.forced) {
    score -= 15;
  }

  return score;
}

function streamSummary(stream) {
  return {
    index: stream.index ?? stream.trackId,
    codec: stream.codec_name || stream.codec,
    language: stream.tags?.language || null,
    title: stream.tags?.title || null,
    default: Boolean(stream.disposition?.default),
    forced: Boolean(stream.disposition?.forced),
    textBased: isTextSubtitle(stream),
    imageBased: isImageSubtitle(stream)
  };
}

function probeVideo(inputPath) {
  const result = runCommand('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_entries', 'format=format_name:stream=index,codec_type,codec_name:stream_tags=language,title:stream_disposition=default,forced',
    inputPath
  ]);

  let parsed;
  try {
    parsed = JSON.parse(result.stdout || '{}');
  } catch {
    fail('ffprobe returned invalid JSON output.', { stdout: (result.stdout || '').slice(0, 500) });
  }

  const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
  const subtitleStreams = streams.filter(stream => stream.codec_type === 'subtitle');

  return {
    formatName: parsed.format?.format_name || null,
    streams,
    subtitleStreams
  };
}

function probeVideoMkv(inputPath) {
  const result = runCommand('mkvmerge', [
    '--identify',
    '--identification-format', 'json',
    inputPath
  ]);

  let parsed;
  try {
    parsed = JSON.parse(result.stdout || '{}');
  } catch {
    fail('mkvmerge --identify returned invalid JSON output.', { stdout: (result.stdout || '').slice(0, 500) });
  }

  const tracks = Array.isArray(parsed.tracks) ? parsed.tracks : [];
  const subtitleTracks = tracks
    .filter(track => track.type === 'subtitles')
    .map(track => {
      const props = track.properties || {};
      const rawCodec = track.codec || '';
      const normalizedCodec = MKV_CODEC_NORMALIZE[rawCodec] || rawCodec;
      return {
        trackId: track.id,
        index: track.id,
        codec_name: normalizedCodec,
        codec: rawCodec,
        tags: {
          language: props.language || null,
          title: props.track_name || null
        },
        disposition: {
          default: Boolean(props.default_track),
          forced: Boolean(props.forced_track)
        }
      };
    });

  return {
    formatName: parsed.container?.type || 'matroska',
    streams: tracks,
    subtitleStreams: subtitleTracks
  };
}

function chooseSubtitleStream(subtitleStreams, forcedIndex, sourceLocale, sourceLanguageTag, failOnMissing) {
  if (typeof forcedIndex === 'number' && !Number.isNaN(forcedIndex)) {
    const explicit = subtitleStreams.find(stream => (stream.index ?? stream.trackId) === forcedIndex);
    if (!explicit && failOnMissing) {
      fail(`Requested stream/track index ${forcedIndex} was not found among subtitle streams.`);
    }
    return explicit || null;
  }

  const preference = buildSourceLanguagePreference(sourceLocale, sourceLanguageTag);

  const textSourceStreams = subtitleStreams
    .filter(isTextSubtitle)
    .map(stream => ({ stream, score: languageScore(stream, preference) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (textSourceStreams.length > 0) {
    return textSourceStreams[0].stream;
  }

  const imageSourceStreams = subtitleStreams
    .filter(isImageSubtitle)
    .map(stream => ({ stream, score: languageScore(stream, preference) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (imageSourceStreams.length > 0 && failOnMissing) {
    fail(`The best available ${preference.normalized} subtitle is image-based. OCR is required and is not automated by this helper script.`, {
      availableSubtitleStreams: subtitleStreams.map(streamSummary)
    });
  }

  if (failOnMissing) {
    fail(`No ${preference.normalized} text subtitle stream was found.`, {
      availableSubtitleStreams: subtitleStreams.map(streamSummary)
    });
  }

  return null;
}

function decideExtractionFormat(stream, subtitleFormat, outputPath) {
  const requested = String(subtitleFormat || 'auto').toLowerCase();
  const sourceCodec = String(stream.codec_name || '').toLowerCase();
  const extension = path.extname(outputPath || '').toLowerCase();

  if (extension === '.ass' || extension === '.ssa') {
    if (sourceCodec !== 'ass' && sourceCodec !== 'ssa') {
      fail('ASS output was requested, but the selected subtitle stream is not ASS/SSA.');
    }
    return 'ass';
  }

  if (extension === '.srt') {
    return 'srt';
  }

  if (requested === 'srt') {
    return 'srt';
  }

  if (requested === 'ass') {
    if (sourceCodec !== 'ass' && sourceCodec !== 'ssa') {
      fail('ASS extraction was requested, but the selected subtitle stream is not ASS/SSA.');
    }
    return 'ass';
  }

  if (sourceCodec === 'ass' || sourceCodec === 'ssa') {
    return 'ass';
  }

  return 'srt';
}

function buildExtractionPlan(stream, subtitleFormat, extractOutputPath, inputPath, sourceLocale) {
  const initialOutputPath = extractOutputPath
    ? path.resolve(process.cwd(), extractOutputPath)
    : null;
  const format = decideExtractionFormat(stream, subtitleFormat, initialOutputPath || '');
  const outputPath = initialOutputPath || deriveExtractOutputPath(inputPath, sourceLocale, format);

  return {
    format,
    outputPath,
    codecArgs: format === 'ass'
      ? ['-c:s', 'ass']
      : ['-c:s', 'srt']
  };
}

function canExtractWithMkvToolnix(stream, format) {
  const sourceCodec = String(stream.codec_name || '').toLowerCase();
  if (format === 'srt') {
    return sourceCodec === 'subrip';
  }
  if (format === 'ass') {
    return sourceCodec === 'ass' || sourceCodec === 'ssa';
  }
  return false;
}

function extractSubtitleMkv(inputPath, stream, outputPath) {
  runCommand('mkvextract', [
    'tracks',
    inputPath,
    `${stream.trackId}:${outputPath}`
  ]);
}

function extractSubtitleWithFfmpeg(inputPath, stream, plan) {
  runCommand('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-i', inputPath,
    '-map', `0:${stream.index}`,
    ...plan.codecArgs,
    plan.outputPath
  ]);
}

function detectSubtitleCodecForMux(outputPath, translatedSubtitlePath) {
  const outputContainer = detectContainerType(outputPath);
  const subtitleExtension = path.extname(translatedSubtitlePath).toLowerCase();

  if (outputContainer === 'mp4-family') {
    return 'mov_text';
  }

  if (subtitleExtension === '.ass' || subtitleExtension === '.ssa') {
    return 'ass';
  }

  return 'subrip';
}

function remuxVideoMkv(inputPath, translatedSubtitlePath, outputPath, subtitleLanguageTag, subtitleTitle) {
  runCommand('mkvmerge', [
    '-o', outputPath,
    inputPath,
    '--language', `0:${subtitleLanguageTag}`,
    '--track-name', `0:${subtitleTitle}`,
    translatedSubtitlePath
  ]);
}

function remuxVideo(inputPath, translatedSubtitlePath, outputPath, subtitleCodec, existingSubtitleCount, subtitleLanguageTag, subtitleTitle) {
  const newSubtitleIndex = existingSubtitleCount;

  runCommand('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-i', inputPath,
    '-i', translatedSubtitlePath,
    '-map', '0',
    '-map', '1:0',
    '-c', 'copy',
    `-c:s:${newSubtitleIndex}`,
    subtitleCodec,
    `-metadata:s:s:${newSubtitleIndex}`,
    `language=${subtitleLanguageTag}`,
    `-metadata:s:s:${newSubtitleIndex}`,
    `title=${subtitleTitle}`,
    outputPath
  ]);

  return newSubtitleIndex;
}

function writeJson(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function ensureFfmpegForContainer(inputContainer) {
  if (inputContainer === 'mkv') {
    return;
  }
  if (!commandExists('ffprobe') || !commandExists('ffmpeg')) {
    fail('ffprobe and ffmpeg are required for non-MKV files.');
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      process.exit(0);
    }

    if (!options.input) {
      fail('--input is required.');
    }
    if (!['auto', 'srt', 'ass'].includes(String(options.subtitleFormat).toLowerCase())) {
      fail('--subtitle-format must be one of: auto, srt, ass.');
    }

    const mode = normalizeMode(options.mode, options);
    if (mode === 'extract' && options.translatedSubtitle) {
      fail('--translated-subtitle is only valid in remux mode.');
    }
    if (mode === 'remux' && options.extractOutput) {
      fail('--extract-output is only valid in extract mode.');
    }
    if (mode === 'remux' && !options.translatedSubtitle) {
      fail('Provide --translated-subtitle in remux mode.');
    }

    const inputPath = path.resolve(process.cwd(), options.input);
    if (!fs.existsSync(inputPath)) {
      fail(`Input video not found: ${inputPath}`);
    }

    const inputContainer = detectContainerType(inputPath);
    ensureFfmpegForContainer(inputContainer);

    const hasMkvmerge = commandExists('mkvmerge');
    const hasMkvextract = commandExists('mkvextract');
    const hasFfprobe = commandExists('ffprobe');
    const hasFfmpeg = commandExists('ffmpeg');
    const canUseMkvProbe = inputContainer === 'mkv' && hasMkvmerge;
    const canUseMkvRemux = inputContainer === 'mkv' && hasMkvmerge && hasMkvextract;

    if (!canUseMkvProbe && (!hasFfprobe || !hasFfmpeg)) {
      fail('This workflow requires mkvmerge for MKV probing or ffprobe/ffmpeg as a fallback.');
    }

    const normalizedSourceLocale = normalizeSourceLocale(options.sourceLocale);
    const normalizedTargetLocale = normalizeTargetLocale(options.targetLocale);
    const sourceLanguageTag = options.sourceLanguageTag || deriveLanguageTag(normalizedSourceLocale);
    const targetLanguageTag = options.targetLanguageTag || deriveLanguageTag(normalizedTargetLocale);
    const subtitleTitle = options.subtitleTitle || deriveTranslatedSubtitleTitle(normalizedSourceLocale, normalizedTargetLocale);

    const probe = canUseMkvProbe ? probeVideoMkv(inputPath) : probeVideo(inputPath);
    const probeToolchain = canUseMkvProbe ? 'mkvmerge' : 'ffprobe';
    const availableSubtitleStreams = probe.subtitleStreams.map(streamSummary);

    if (mode === 'probe') {
      const preferredStream = chooseSubtitleStream(
        probe.subtitleStreams,
        options.streamIndex,
        normalizedSourceLocale,
        sourceLanguageTag,
        false
      );

      const manifest = {
        mode,
        input: relativePath(inputPath),
        container: probe.formatName,
        toolchain: probeToolchain,
        sourceLocale: normalizedSourceLocale,
        sourceLanguageTag,
        availableSubtitleStreams,
        preferredStream: preferredStream ? streamSummary(preferredStream) : null
      };

      if (options.manifest) {
        writeJson(path.resolve(process.cwd(), options.manifest), manifest);
      }

      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
      return;
    }

    if (probe.subtitleStreams.length === 0) {
      fail('No subtitle streams were found in the source video.');
    }

    if (mode === 'extract') {
      const selectedStream = chooseSubtitleStream(
        probe.subtitleStreams,
        options.streamIndex,
        normalizedSourceLocale,
        sourceLanguageTag,
        true
      );

      if (!isTextSubtitle(selectedStream)) {
        fail('The selected subtitle stream is not text-based. This helper script only automates text subtitle extraction.', {
          selectedStream: streamSummary(selectedStream)
        });
      }

      const extractionPlan = buildExtractionPlan(
        selectedStream,
        options.subtitleFormat,
        options.extractOutput,
        inputPath,
        normalizedSourceLocale
      );
      ensureDirectory(path.dirname(extractionPlan.outputPath));

      let extractionToolchain;
      if (inputContainer === 'mkv' && hasMkvextract && canExtractWithMkvToolnix(selectedStream, extractionPlan.format)) {
        extractionToolchain = 'mkvextract';
        extractSubtitleMkv(inputPath, selectedStream, extractionPlan.outputPath);
      } else {
        if (!hasFfmpeg) {
          fail('ffmpeg is required to convert or extract subtitles for this file.');
        }
        extractionToolchain = 'ffmpeg';
        extractSubtitleWithFfmpeg(inputPath, selectedStream, extractionPlan);
      }

      const stats = fs.statSync(extractionPlan.outputPath);
      if (stats.size === 0) {
        fail('Subtitle extraction completed, but the output subtitle file is empty.', {
          extractionPath: extractionPlan.outputPath
        });
      }

      const manifest = {
        mode,
        input: relativePath(inputPath),
        container: probe.formatName,
        toolchain: extractionToolchain,
        sourceLocale: normalizedSourceLocale,
        sourceLanguageTag,
        availableSubtitleStreams,
        selectedStream: streamSummary(selectedStream),
        extraction: {
          format: extractionPlan.format,
          path: relativePath(extractionPlan.outputPath),
          sizeBytes: stats.size
        }
      };

      if (options.manifest) {
        writeJson(path.resolve(process.cwd(), options.manifest), manifest);
      }

      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
      return;
    }

    const translatedSubtitlePath = path.resolve(process.cwd(), options.translatedSubtitle);
    if (!fs.existsSync(translatedSubtitlePath)) {
      fail(`Translated subtitle not found: ${translatedSubtitlePath}`);
    }

    const outputPath = options.output
      ? path.resolve(process.cwd(), options.output)
      : deriveVideoOutputPath(inputPath, normalizedTargetLocale);
    ensureDirectory(path.dirname(outputPath));

    const subtitleCodec = detectSubtitleCodecForMux(outputPath, translatedSubtitlePath);
    const originalSubtitleCount = probe.subtitleStreams.length;

    let remuxToolchain;
    let newSubtitleIndex;
    if (inputContainer === 'mkv' && canUseMkvRemux) {
      remuxToolchain = 'mkvmerge';
      remuxVideoMkv(inputPath, translatedSubtitlePath, outputPath, targetLanguageTag, subtitleTitle);
      newSubtitleIndex = originalSubtitleCount;
    } else {
      if (!hasFfmpeg) {
        fail('ffmpeg is required for remuxing this file.');
      }
      remuxToolchain = 'ffmpeg';
      newSubtitleIndex = remuxVideo(
        inputPath,
        translatedSubtitlePath,
        outputPath,
        subtitleCodec,
        originalSubtitleCount,
        targetLanguageTag,
        subtitleTitle
      );
    }

    const outputProbe = (inputContainer === 'mkv' && hasMkvmerge) ? probeVideoMkv(outputPath) : probeVideo(outputPath);
    const addedStream = outputProbe.subtitleStreams[newSubtitleIndex] || null;
    if (!addedStream) {
      fail('Remux completed, but the translated subtitle stream was not found in the output file.', {
        outputSubtitleStreams: outputProbe.subtitleStreams.map(streamSummary)
      });
    }

    const outputStats = fs.statSync(outputPath);
    if (outputStats.size === 0) {
      fail('Remux completed, but the output video file is empty.', {
        outputPath
      });
    }

    const manifest = {
      mode,
      input: relativePath(inputPath),
      output: relativePath(outputPath),
      container: probe.formatName,
      toolchain: remuxToolchain,
      sourceLocale: normalizedSourceLocale,
      sourceLanguageTag,
      targetLocale: normalizedTargetLocale,
      targetLanguageTag,
      subtitleTitle,
      availableSubtitleStreams,
      translatedSubtitle: relativePath(translatedSubtitlePath),
      remuxedSubtitleCodec: subtitleCodec,
      outputSubtitleStream: streamSummary(addedStream),
      outputWasAutoDerived: !options.output,
      warnings: subtitleCodec === 'mov_text'
        ? ['The output container uses mov_text, so ASS/SSA styling may not be preserved.']
        : []
    };

    if (options.manifest) {
      writeJson(path.resolve(process.cwd(), options.manifest), manifest);
    }

    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  } catch (error) {
    const payload = {
      error: error.message
    };

    if (error.details) {
      payload.details = error.details;
    }

    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
    process.exit(1);
  }
}

main();
