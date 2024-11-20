import t from "tap";
import { shouldRewriteModuleSpecifier } from "../codemod.js";

t.test("shouldRewriteModuleSpecifier", (t) => {
  const cases: [string, boolean][] = [
    ["./somepath", true],
    ["./somepath.ts", true],
    ["./somepath.tsx", true],
    ["../../idk/somepath", true],
    ["../../idk/somepath.ts", true],
    ["../../idk/somepath.tsx", true],
    ["./something.primitive", true],
    ["../../something.primitive", true],
    [".", true],
    ["..", true],

    ["some-package", false],
    ["some-package.js", false],
    ["../../some-package.js", false],
    ["./some-package.js", false],
    ["../../some/other/path/some-package.json", false],
    ["./some-package.json", false],
    ["@scope/some-package.js", false],
    ["@scope/some-package.js", false],
  ];

  for (let [path, expected] of cases) {
    t.equal(
      shouldRewriteModuleSpecifier(path),
      expected,
      `shouldRewriteModuleSpecifier("${path}") => ${expected}`
    );
  }

  t.end();
});
