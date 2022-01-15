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
    throw new Error(
      `error in running \`deno fmt\``,
    );
  }

  return new TextDecoder().decode(stdout);
};

export const generateSpec = async (options: Fig.Option[]) => {
  return await format(`
/* eslint-disable @withfig/fig-linter/no-useless-arrays */

const completionSpec: Fig.Spec = {
  name: "ffmpeg",
  description: "FFmpeg is a great tool!",

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
        option.args && Array.isArray(option.args) && option.args.length > 0
          ? `
        args: [
          ${
            option.args.map((arg) =>
              `{
            name: "${arg.name}",
            ${
                arg.description !== undefined
                  ? `description: ${conventionify(arg.description)},`
                  : ""
              }
            ${arg.template !== undefined ? `template: "${arg.template}",` : ""}
          }`
            ).join(",\n")
          }
      ],`
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
