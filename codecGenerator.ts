export const codecGenerator = {
  script: "ffmpeg -codecs",
  postProcess: (out: string) => {
    return out.split("\n").filter(Boolean).map((k) =>
      k.split(" ").filter(Boolean)[1]
    ).filter((k) => k !== "=").map((k) => ({
      name: k,
    }));
  },
};
