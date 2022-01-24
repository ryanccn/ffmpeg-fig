import * as Fig from "./fig.types.ts";

import { getHelpText } from "./getter.ts";
import { generateSpec } from "./spec.ts";
import { codecGenerator, deviceGenerator } from "./generators.ts";

console.time("read help text in");
const HELP_TEXT = await getHelpText();
console.timeEnd("read help text in");

const HELP_LINES = HELP_TEXT.split("\n").filter(Boolean);

const rawOptions = HELP_LINES
  .filter(Boolean)
  .filter((k) => k.startsWith("-"));

const genOptions: Fig.Option[] = [{
  name: "-i",
  description: "Input file",
  args: [{
    name: "infile",
    template: "filepaths",
  }],
}];

console.time("generated options in");
for (const rawOption of rawOptions) {
  const splitted = rawOption.split(/  +/g).filter(Boolean);
  const mainPart = splitted[0].split(" ");
  const description = splitted[1];

  const argName = mainPart.slice(1).join(" ");

  if (genOptions.filter((k) => k.name === mainPart[0]).length === 0) {
    genOptions.push({
      name: mainPart[0],
      args: {
        name: argName,
        ...((argName === "codec")
          ? {
            generators: codecGenerator,
          }
          : (argName === "device")
          ? {
            generators: deviceGenerator,
          }
          : {}),
      },
      description,
      ...description
        ? description.toLowerCase().search("deprecated") > -1
          ? { deprecated: true }
          : {}
        : {},
    });
  }
}
console.timeEnd("generated options in");

console.time("generated spec in");
await Deno.writeTextFile("ffmpeg.ts", await generateSpec(genOptions));
console.timeEnd("generated spec in");
