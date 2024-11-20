import { argv } from "node:process";
import { run } from "./codemod.js";

const [rootDirArg, pathGlobArg] = argv.slice(2);

run(rootDirArg, pathGlobArg);
