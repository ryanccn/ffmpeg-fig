import {
  decode,
  encode,
} from "https://deno.land/std@0.123.0/encoding/base64.ts";
import { Spinner, wait } from "https://deno.land/x/wait@0.1.12/mod.ts";
import {
  bold,
  green,
  red,
  yellow,
} from "https://deno.land/std@0.123.0/fmt/colors.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

if (!BOT_TOKEN) {
  console.error(red("No BOT_TOKEN provided!"));
  Deno.exit(1);
}

const fetchGitHub = async (
  path: string,
  options?: RequestInit,
  // deno-lint-ignore no-explicit-any
): Promise<any> => {
  const r = await fetch(
    `https://api.github.com${path}`,
    {
      ...options,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${BOT_TOKEN}`,
        ...options?.headers,
      },
    },
  );

  if (!r.ok) {
    throw new Error(
      `requesting ${path} failed with status code ${r.status}, text ${await r
        .text()}`,
    );
  }

  return await r.json();
};

const stepSpinners: { [id: string]: Spinner } = {};
const stepStartTimes: { [id: string]: number } = {};

const stepStart = (id: string, display: string) => {
  const spinner = wait(display);
  spinner.start();
  stepSpinners[id] = spinner;
  stepStartTimes[id] = performance.now();
};
const stepEnd = (id: string) => {
  stepSpinners[id].succeed(
    `${id} done in ${(performance.now() - stepStartTimes[id]).toFixed(1)}ms!`,
  );

  delete stepSpinners[id];
  delete stepStartTimes[id];
};

/** Update the README */
const updateREADME = async () => {
  const oldREADME: { content: string; sha: string } = await fetchGitHub(
    "/repos/ryanccn/ffmpeg-fig/contents/README.md",
  );
  oldREADME.content = new TextDecoder().decode(decode(oldREADME.content));

  const newREADME = oldREADME.content.split("\n").map((line) => {
    if (line.startsWith("**Last updated:")) {
      return `**Last updated: ${new Date().toUTCString()}`;
    }
    return line;
  }).join("\n");

  await fetchGitHub(
    "/repos/ryanccn/ffmpeg-fig/contents/README.md",
    {
      method: "PUT",
      body: JSON.stringify({
        message: "chore(automated): update README",
        content: encode(newREADME),
        sha: oldREADME.sha,
      }),
    },
  );

  stepEnd("readme");
};

stepStart("read-file", "Reading two versions of the files");

const newContents = await Deno.readTextFile("./ffmpeg.ts");
const oldContents: { content: string; sha: string } = await fetchGitHub(
  "/repos/ryanccn-bot/autocomplete/contents/src/ffmpeg.ts",
);
oldContents.content = new TextDecoder().decode(decode(oldContents.content));

stepEnd("read-file");

if (oldContents.content === newContents) {
  console.warn(yellow("Content of files are same, no need to open PR"));
  Deno.exit(0);
}

stepStart("push", "Pushing the changes to the fork");

await fetchGitHub(
  "/repos/ryanccn-bot/autocomplete/contents/src/ffmpeg.ts",
  {
    method: "PUT",
    body: JSON.stringify({
      message: "automated update of ffmpeg.ts",
      content: encode(newContents),
      sha: oldContents.sha,
    }),
  },
);

stepEnd("push");

stepStart("pr", "Creating pull request");

const existingPulls: unknown[] = await fetchGitHub(
  `/repos/withfig/autocomplete/pulls?head=${
    encodeURIComponent("ryanccn-bot:master")
  }`,
);
if (existingPulls.length === 0) {
  await fetchGitHub(
    "/repos/withfig/autocomplete/pulls",
    {
      method: "POST",
      body: JSON.stringify({
        title: "automated update of ffmpeg.ts",
        head: "ryanccn-bot:master",
        base: "master",
      }),
    },
  );
} else {
  console.warn(yellow("PR already exists, not creating a new one"));
}

stepEnd("pr");

stepStart("readme", "Updating README");

await updateREADME();

console.log(bold(green("done!")));
