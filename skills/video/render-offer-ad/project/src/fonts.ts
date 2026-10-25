// Font loading. @remotion/google-fonts needs STATIC imports (one module per
// family), so we can't `import(props.fonts.display)` dynamically. Instead we
// pre-load a small set of format-appropriate families and resolve the config's
// requested id to a loaded family at runtime. Default display = a heavy black
// slam sans (Archivo Black); default body = a clean sans (Inter).
//
// To add another display/body option: add its `@remotion/google-fonts/<Name>`
// import here and register it in the FONTS map. The config passes the map KEY
// (e.g. "ArchivoBlack") in fonts.display / fonts.body.

import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const archivoBlack = loadArchivoBlack();
const inter = loadInter();
const anton = loadAnton();
const montserrat = loadMontserrat();

const FONTS: Record<string, string> = {
  ArchivoBlack: archivoBlack.fontFamily,
  Anton: anton.fontFamily,
  Inter: inter.fontFamily,
  Montserrat: montserrat.fontFamily,
};

// Resolve a config font id to a loaded family, falling back sensibly.
export function resolveFont(id: string | undefined, role: "display" | "body"): string {
  if (id && FONTS[id]) return FONTS[id];
  return role === "display" ? FONTS.ArchivoBlack : FONTS.Inter;
}
