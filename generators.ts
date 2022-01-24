import * as Fig from "./fig.types.ts";

const generatorTmpl = (script: string) => {
  return {
    script: script,
    postProcess: (out: string) => {
      return out
        .split("\n")
        .filter(Boolean)
        .map((k) => k.split(" ").filter(Boolean)[1])
        .filter(Boolean)
        .filter((k) => k !== "=")
        .map((k) => ({ name: k }));
    },
  };
};

export const codecGenerator: Fig.Generator = generatorTmpl("ffmpeg -codecs");

export const deviceGenerator: Fig.Generator = generatorTmpl("ffmpeg -devices");
