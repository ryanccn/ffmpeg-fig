import { blue, bold, green, red, wait, yellow } from "./_deps.ts";
import type { Spinner } from "./_deps.ts";

export const log = (str: string): void => {
  console.log(blue(str));
};

export const warn = (str: string): void => {
  console.warn(yellow(str));
};

export const error = (str: string): void => {
  console.error(bold(red(str)));
};

const startTime: Record<string, number> = {};
const spinner: Record<string, Spinner> = {};

export const timeStart = (label: string): void => {
  spinner[label] = wait(`task ${bold(label)} ongoing`);
  spinner[label].start();

  startTime[label] = performance.now();
};
export const timeEnd = (label: string): void => {
  spinner[label].succeed(
    `task ${bold(label)} done in ${
      green(`${(performance.now() - startTime[label]).toFixed(2)}ms`)
    }`,
  );

  delete startTime[label];
};
