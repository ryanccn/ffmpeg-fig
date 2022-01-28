export const log = (str: string): void => {
  console.log(`%c${str}`, "color: skyblue;");
};

export const warn = (str: string): void => {
  console.warn(`%c${str}`, "color: yellow;");
};

export const error = (str: string): void => {
  console.error(`%c${str}`, "color: red; font-weight: bold;");
};

const tracker: Record<string, number> = {};

export const timeStart = (label: string): void => {
  tracker[label] = performance.now();
};
export const timeEnd = (label: string): void => {
  console.log(
    `task %c${label}%c done in %c${
      (performance.now() - tracker[label]).toFixed(2)
    }ms`,
    "font-weight: bold;",
    "",
    "color: green;",
  );
};
