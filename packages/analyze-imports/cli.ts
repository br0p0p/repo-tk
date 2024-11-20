import { analyzeImports, type Args } from "./src/index.js";
import { argv } from "node:process";
import mri from "mri";

const defaultArgs: Omit<Args, "specifier"> = {
  cwd: process.cwd(),
  filenameFormat: "relative",
};

analyzeImports({ ...defaultArgs, ...mri<Args>(argv) });
