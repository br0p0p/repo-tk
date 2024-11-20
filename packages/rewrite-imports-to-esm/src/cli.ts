#!/usr/bin/env node

import { argv } from "node:process";
import { run } from "./index.js";

const [rootDirArg, pathGlobArg] = argv.slice(2);

run(rootDirArg, pathGlobArg);
