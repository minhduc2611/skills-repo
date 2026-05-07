import sharp from "npm:sharp@0.34.5";

const MAX_DIMENSION = 1500;
const WEBP_QUALITY = 80;

async function processToWebp(data: Uint8Array): Promise<Uint8Array> {
  // Only resize when either dimension exceeds MAX_DIMENSION.
  // This keeps original resolution for images that are already within bounds.
  const img = sharp(data).rotate();
  const meta = await img.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
  const out = needsResize
    ? img.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    : img;

  const buf = await out.webp({ quality: WEBP_QUALITY }).toBuffer();
  return new Uint8Array(buf);
}

function printUsage(): void {
  console.error("Usage: ./setup-and-run.sh <input-image> <output.webp>  (from scripts/)");
  console.error(
    "   or: deno run -A --no-lock --config=deno.json script.ts <input-image> <output.webp>",
  );
}

async function main(): Promise<void> {
  const args = Deno.args;
  if (args[0] === "-h" || args[0] === "--help") {
    printUsage();
    Deno.exit(0);
  }
  if (args.length < 2) {
    printUsage();
    Deno.exit(1);
  }

  const [inputPath, outputPath] = args;
  const data = await Deno.readFile(inputPath);
  const webp = await processToWebp(new Uint8Array(data));
  await Deno.writeFile(outputPath, webp);
  console.error(`Wrote ${outputPath}`);
}

if (import.meta.main) {
  await main();
}
