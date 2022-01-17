const run = async (cmd: string[]): Promise<string> => {
  const p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "null",
  });
  const [status, stdout] = await Promise.all([p.status(), p.output()]);

  if (!status.success) {
    throw new Error(
      `error in running \`${cmd.map((k) => `"${k}"`).join(" ")}\` from ffmpeg`,
    );
  }

  return new TextDecoder().decode(stdout);
};

export const getHelpText = async () => {
  return await run(["ffmpeg", "-h", "full"]);
};

export const getDevices = async () => {
  return await run(["ffmpeg", "-devices"]);
};
