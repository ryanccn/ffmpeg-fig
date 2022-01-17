/// <reference types="./fig.d.ts" />

const safifyStr = (str: string): string => str.replaceAll('"', '\\"');
const safifyArr = (arr: string[]): string[] => arr.map(safifyStr);

function safify<T extends string | string[] | undefined>(str: T): T {
  // @ts-expect-error This works, whatever
  return str !== undefined
    ? (Array.isArray(str)) ? safifyArr(str) : safifyStr(str)
    : undefined;
}

const conventionify = (str: string) => {
  let ret = str;

  ret = ret.trim()
    .replace(
      /^\w/,
      (c) => c.toUpperCase(),
    );

  if (ret.endsWith(".")) ret = ret.substring(0, ret.length - 1);

  return ret;
};

const format = async (str: string) => {
  const proc = Deno.run({
    cmd: ["deno", "fmt", "-"],
    stdin: "piped",
    stdout: "piped",
  });

  proc.stdin.write(new TextEncoder().encode(str));
  proc.stdin.close();

  const [status, stdout] = await Promise.all([proc.status(), proc.output()]);

  if (!status.success) {
    console.error(
      "%sError in formatting, skipping...%s",
      "\x1b[31m",
      "\x1b[0m",
    );
    return str;
  }

  return new TextDecoder().decode(stdout);
};

export const generateSpec = async (options: Fig.Option[]) => {
  return await format(`
/* eslint-disable @withfig/fig-linter/no-useless-arrays */

const completionSpec: Fig.Spec = {
  name: "ffmpeg",
  description: "FFmpeg is a great tool!",

  parserDirectives: {
    flagsArePosixNoncompliant: true,
  },

  args: {
    name: "outfile",
    description: "Output file",
    template: "filepaths",
  },

  options: [
    ${
    options.map((option) => {
      return `{
        name: "${safify(option.name)}",
        ${
        option.description
          ? `description: "${conventionify(safify(option.description))}",`
          : ""
      }
      ${
        option.args && !Array.isArray(option.args) && option.args.name
          ? `
        args:
              ${`{
            name: "${option.args.name}",
            ${
            option.args.description !== undefined
              ? `description: ${conventionify(option.args.description)},`
              : ""
          }
            ${
            option.args.template !== undefined
              ? `template: "${option.args.template}",`
              : ""
          }
            ${
            option.args.generators !== undefined &&
              !Array.isArray(option.args.generators)
              ? `generators: {
                script: "${option.args.generators.script}",
                postProcess: ${
                option.args.generators.postProcess
                  ? option.args.generators.postProcess.toString()
                  : "undefined"
              }},`
              : ""
          }
          }`},`
          : "" // no valid arguments, return nothing
      }
    }`;
    }).join(",\n")
  }
  ]
};

export default completionSpec;
  `);
};
