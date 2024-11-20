import { argv } from "node:process";
import mri from "mri";
import { type Args, analyzeImports } from "./index.js";

const defaultArgs: Omit<Args, "specifier"> = {
	cwd: process.cwd(),
	filenameFormat: "relative",
};

analyzeImports({ ...defaultArgs, ...mri<Args>(argv) });
