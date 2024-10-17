import { run } from "./codemod";
import { argv } from "node:process";

const [rootDirArg, pathGlobArg] = argv.slice(2);

run(rootDirArg, pathGlobArg);
