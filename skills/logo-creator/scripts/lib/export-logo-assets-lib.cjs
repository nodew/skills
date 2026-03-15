const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_VARIANT_KEYS = ['primary', 'mark', 'wordmark', 'horizontal', 'vertical'];
const RASTERIZER_PRECEDENCE = ['magick', 'inkscape', 'rsvg-convert', 'qlmanage', 'sips'];

function sanitizeName(name) {
  return String(name || 'logo')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'logo';
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left - right);
}

function variantDefaults(key) {
  if (key === 'mark') {
    return {
      pngSizes: [16, 32, 48, 64, 128, 256, 512, 1024],
      jpgSizes: [1024],
      favicon: true
    };
  }

  return {
    pngSizes: [512, 1024],
    jpgSizes: [1024],
    favicon: false
  };
}

function normalizeVariants(options) {
  const safeName = sanitizeName(options.name);
  const sourcesByKey = { ...(options.sources || {}) };

  if (options.input && !sourcesByKey.primary) {
    sourcesByKey.primary = options.input;
  }

  const fallbackSource = sourcesByKey.primary || Object.values(sourcesByKey)[0] || options.input;
  const requestedKeys = options.variants?.length
    ? options.variants.map(variant => variant.key)
    : (options.input ? ['primary'] : DEFAULT_VARIANT_KEYS);

  return requestedKeys.map(key => {
    const explicitVariant = options.variants?.find(variant => variant.key === key) || {};
    const defaults = variantDefaults(key);
    const source = explicitVariant.source || sourcesByKey[key] || fallbackSource;

    return {
      key,
      source,
      baseName: `${safeName}-${key}`,
      pngSizes: uniqueSorted(explicitVariant.pngSizes || defaults.pngSizes),
      jpgSizes: uniqueSorted(explicitVariant.jpgSizes || defaults.jpgSizes),
      favicon: explicitVariant.favicon ?? defaults.favicon
    };
  });
}

function pickPreferredRasterizer(availableCommands) {
  for (const command of RASTERIZER_PRECEDENCE) {
    if (availableCommands[command]) {
      return {
        command,
        path: availableCommands[command]
      };
    }
  }

  return null;
}

function commandExists(command) {
  const probe = spawnSync('/bin/sh', ['-lc', `command -v ${command}`], {
    encoding: 'utf8'
  });

  if (probe.status === 0) {
    return probe.stdout.trim() || command;
  }

  return null;
}

function findAvailableCommands() {
  return RASTERIZER_PRECEDENCE.reduce((result, command) => {
    const executablePath = commandExists(command);
    if (executablePath) {
      result[command] = executablePath;
    }
    return result;
  }, {});
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildIcoBuffer(frames) {
  const sanitizedFrames = frames
    .filter(frame => frame && frame.png && frame.png.length > 0)
    .sort((left, right) => left.size - right.size);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sanitizedFrames.length, 4);

  const directory = Buffer.alloc(sanitizedFrames.length * 16);
  let offset = header.length + directory.length;

  sanitizedFrames.forEach((frame, index) => {
    const entryOffset = index * 16;
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, entryOffset);
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, entryOffset + 1);
    directory.writeUInt8(0, entryOffset + 2);
    directory.writeUInt8(0, entryOffset + 3);
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(frame.png.length, entryOffset + 8);
    directory.writeUInt32LE(offset, entryOffset + 12);
    offset += frame.png.length;
  });

  return Buffer.concat([header, directory, ...sanitizedFrames.map(frame => frame.png)]);
}

function normalizeHexColor(color) {
  const value = String(color || '#FFFFFF').trim();
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    throw new Error(`Invalid hex color: ${color}`);
  }

  if (match[1].length === 3) {
    return `#${match[1].split('').map(character => character + character).join('').toUpperCase()}`;
  }

  return `#${match[1].toUpperCase()}`;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options
  });

  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || `Command failed: ${command}`;
    throw new Error(stderr.trim());
  }

  return result;
}

function rasterizeSvg({ rasterizer, source, size, outputPath, tempDir }) {
  ensureDirectory(path.dirname(outputPath));

  if (rasterizer.command === 'magick') {
    runCommand('magick', ['-background', 'none', '-density', '384', source, '-resize', `${size}x${size}`, outputPath]);
    return outputPath;
  }

  if (rasterizer.command === 'inkscape') {
    runCommand('inkscape', [source, '--export-type=png', '--export-filename', outputPath, '-w', String(size), '-h', String(size)]);
    return outputPath;
  }

  if (rasterizer.command === 'rsvg-convert') {
    runCommand('rsvg-convert', ['-w', String(size), '-h', String(size), source, '-o', outputPath]);
    return outputPath;
  }

  if (rasterizer.command === 'sips') {
    runCommand('sips', ['-s', 'format', 'png', source, '--resampleWidth', String(size), '--out', outputPath]);
    return outputPath;
  }

  if (rasterizer.command === 'qlmanage') {
    ensureDirectory(tempDir);
    const sourceBasename = path.basename(source);
    runCommand('qlmanage', ['-t', '-s', String(size), '-o', tempDir, source], {
      env: {
        ...process.env,
        QL_DISABLE_DIRECTORY_LOCKING: '1'
      }
    });

    const candidates = [
      path.join(tempDir, `${sourceBasename}.png`),
      path.join(tempDir, `${sourceBasename}.svg.png`),
      path.join(tempDir, `${path.parse(sourceBasename).name}.png`)
    ];
    const generated = candidates.find(candidate => fs.existsSync(candidate));

    if (!generated) {
      throw new Error(`qlmanage did not generate a PNG for ${source}`);
    }

    fs.copyFileSync(generated, outputPath);
    return outputPath;
  }

  throw new Error(`Unsupported rasterizer: ${rasterizer.command}`);
}

function convertPngToJpg({ inputPath, outputPath, background, rasterizer }) {
  ensureDirectory(path.dirname(outputPath));

  if (rasterizer?.command === 'magick') {
    runCommand('magick', [inputPath, '-background', background, '-alpha', 'remove', '-alpha', 'off', outputPath]);
    return outputPath;
  }

  if (commandExists('sips')) {
    if (normalizeHexColor(background) !== '#FFFFFF') {
      throw new Error('JPG background colors other than #FFFFFF require ImageMagick on the current toolchain');
    }

    runCommand('sips', ['-s', 'format', 'jpeg', inputPath, '--out', outputPath]);
    return outputPath;
  }

  throw new Error('No available converter for JPG export');
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

module.exports = {
  buildIcoBuffer,
  commandExists,
  convertPngToJpg,
  ensureDirectory,
  findAvailableCommands,
  normalizeHexColor,
  normalizeVariants,
  pickPreferredRasterizer,
  rasterizeSvg,
  sanitizeName,
  writeJson
};