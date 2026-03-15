#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildIcoBuffer,
  convertPngToJpg,
  ensureDirectory,
  findAvailableCommands,
  normalizeHexColor,
  normalizeVariants,
  pickPreferredRasterizer,
  rasterizeSvg,
  writeJson
} = require('./lib/export-logo-assets-lib.cjs');

function printHelp() {
  console.log(`Usage: node skills/logo-creator/scripts/export-logo-assets.cjs [options]

Options:
  --input <file>            Primary SVG input file
  --variant <key=file>      Variant-specific SVG input, repeatable
  --output <dir>            Output directory for exported assets
  --name <slug>             Base brand or project name (default: source filename)
  --jpg-background <hex>    JPG background color (default: #FFFFFF)
  --help                    Show this help

Examples:
  node skills/logo-creator/scripts/export-logo-assets.cjs \
    --input ./logo.svg \
    --output ./logos \
    --name docklet

  node skills/logo-creator/scripts/export-logo-assets.cjs \
    --variant mark=./mark.svg \
    --variant horizontal=./lockup.svg \
    --output ./logos

Notes:
  - A bare --input export is treated as the primary logo only.
  - Provide --variant entries when you want mark, wordmark, horizontal, or vertical assets.
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    output: null,
    name: null,
    jpgBackground: '#FFFFFF',
    sources: {},
    variants: []
  };

  for (let index = 0; index < args.length; index++) {
    const token = args[index];

    if (token === '--input') {
      options.input = args[++index];
    } else if (token === '--output') {
      options.output = args[++index];
    } else if (token === '--name') {
      options.name = args[++index];
    } else if (token === '--jpg-background') {
      options.jpgBackground = args[++index];
    } else if (token === '--variant') {
      const pair = args[++index];
      const delimiterIndex = pair.indexOf('=');
      if (delimiterIndex === -1) {
        throw new Error(`Invalid --variant value: ${pair}`);
      }

      const key = pair.slice(0, delimiterIndex);
      const filePath = pair.slice(delimiterIndex + 1);
      options.sources[key] = filePath;
      options.variants.push({ key, source: filePath });
    } else if (token === '--help' || token === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return options;
}

function relativeToCwd(filePath) {
  return path.relative(process.cwd(), filePath) || '.';
}

function buildManifestSkeleton({ outputDir, rasterizer, warnings }) {
  return {
    output_dir: outputDir,
    rasterizer: rasterizer?.command || null,
    warnings,
    variants: []
  };
}

function copySvg(source, destination) {
  ensureDirectory(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function main() {
  let tempDir;

  try {
    const options = parseArgs();

    if (options.help) {
      printHelp();
      process.exit(0);
    }

    if (!options.output) {
      throw new Error('--output is required');
    }

    if (!options.input && Object.keys(options.sources).length === 0) {
      throw new Error('Provide --input or at least one --variant key=file pair');
    }

    const primaryInput = options.input || Object.values(options.sources)[0];
    const safeBackground = normalizeHexColor(options.jpgBackground);
    const safeName = options.name || path.parse(primaryInput).name;
    const variants = normalizeVariants({
      input: primaryInput,
      name: safeName,
      sources: options.sources,
      variants: options.variants
    });

    const outputDir = path.resolve(process.cwd(), options.output);
    ensureDirectory(outputDir);

    const warnings = [];
    const rasterizer = pickPreferredRasterizer(findAvailableCommands());
    if (!rasterizer) {
      warnings.push('No supported SVG rasterizer found. SVG files were copied, but PNG, JPG, and favicon exports were skipped.');
    }

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logo-export-'));
    const manifest = buildManifestSkeleton({ outputDir: relativeToCwd(outputDir), rasterizer, warnings });

    for (const variant of variants) {
      const variantSummary = {
        key: variant.key,
        source: variant.source ? relativeToCwd(path.resolve(process.cwd(), variant.source)) : null,
        outputs: []
      };

      if (!variant.source) {
        warnings.push(`Skipping ${variant.key}: no SVG source was provided.`);
        variantSummary.warning = 'missing-source';
        manifest.variants.push(variantSummary);
        continue;
      }

      const sourcePath = path.resolve(process.cwd(), variant.source);
      if (!fs.existsSync(sourcePath)) {
        warnings.push(`Skipping ${variant.key}: source file not found at ${sourcePath}.`);
        variantSummary.warning = 'source-not-found';
        manifest.variants.push(variantSummary);
        continue;
      }

      const variantDir = path.join(outputDir, variant.key);
      ensureDirectory(variantDir);

      const svgOutput = path.join(variantDir, `${variant.baseName}.svg`);
      copySvg(sourcePath, svgOutput);
      variantSummary.outputs.push(relativeToCwd(svgOutput));

      if (!rasterizer) {
        manifest.variants.push(variantSummary);
        continue;
      }

      const pngOutputs = [];
      for (const size of variant.pngSizes) {
        const pngOutput = path.join(variantDir, `${variant.baseName}-${size}.png`);
        try {
          rasterizeSvg({
            rasterizer,
            source: sourcePath,
            size,
            outputPath: pngOutput,
            tempDir
          });
          pngOutputs.push({ size, path: pngOutput });
          variantSummary.outputs.push(relativeToCwd(pngOutput));
        } catch (error) {
          warnings.push(`Skipping PNG export for ${variant.key} at ${size}px: ${error.message}`);
        }
      }

      for (const size of variant.jpgSizes) {
        const pngSource = pngOutputs.find(entry => entry.size >= size) || pngOutputs[pngOutputs.length - 1];
        if (!pngSource) {
          warnings.push(`Skipping JPG export for ${variant.key}: no PNG source was generated.`);
          continue;
        }

        const jpgOutput = path.join(variantDir, `${variant.baseName}-${size}.jpg`);
        try {
          convertPngToJpg({
            inputPath: pngSource.path,
            outputPath: jpgOutput,
            background: safeBackground,
            rasterizer
          });
          variantSummary.outputs.push(relativeToCwd(jpgOutput));
        } catch (error) {
          warnings.push(`Skipping JPG export for ${variant.key}: ${error.message}`);
        }
      }

      if (variant.favicon) {
        const faviconFrames = pngOutputs.filter(entry => [16, 32, 48].includes(entry.size));
        if (faviconFrames.length === 3) {
          for (const frame of faviconFrames) {
            const aliasPath = path.join(variantDir, `favicon-${frame.size}.png`);
            fs.copyFileSync(frame.path, aliasPath);
            variantSummary.outputs.push(relativeToCwd(aliasPath));
          }

          const faviconOutput = path.join(variantDir, 'favicon.ico');
          const ico = buildIcoBuffer(
            faviconFrames.map(frame => ({
              size: frame.size,
              png: fs.readFileSync(frame.path)
            }))
          );
          fs.writeFileSync(faviconOutput, ico);
          variantSummary.outputs.push(relativeToCwd(faviconOutput));
        } else {
          warnings.push(`Skipping favicon.ico for ${variant.key}: required 16, 32, and 48 PNG sizes were not all generated.`);
        }
      }

      manifest.variants.push(variantSummary);
    }

    writeJson(path.join(outputDir, 'export-manifest.json'), manifest);
    console.log(`Exported logo assets to ${outputDir}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

main();