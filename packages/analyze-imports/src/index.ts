import { Project } from "ts-morph";
import path from "node:path";
import { sortBy, first } from "remeda";
import pc from "picocolors";

export interface Args {
  cwd: string;
  glob?: string | undefined;
  specifier: string;
  importName?: string;
  showFilenames?: boolean;
  /** When displaying filenames, show either the absolute or relative path of the determined file. Requires `--showFilenames`. */
  filenameFormat?: "absolute" | "relative";
  /** When displaying filenames, show the determined filepath relative to this path. Requires both `--showFilenames` and `filenameFormat="relative"` */
  relativeFrom?: string;
}

export async function analyzeImports(args: Args) {
  const { cwd, glob, specifier, importName, showFilenames, filenameFormat } =
    args;

  const relativeFrom = args.relativeFrom
    ? path.isAbsolute(args.relativeFrom)
      ? args.relativeFrom
      : path.resolve(cwd, args.relativeFrom)
    : cwd;

  const specifierMatcher = new RegExp(specifier);
  const importNameMatcher = importName ? new RegExp(importName) : undefined;

  const importSymbolStatsMap = new Map<string, ImportSymbolStats>();

  const rootDir = path.isAbsolute(cwd) ? cwd : path.resolve(process.cwd(), cwd);

  // Initialize the project
  const project = new Project({
    // Adjust the tsconfig file path according to your project structure
    tsConfigFilePath: path.join(rootDir, "tsconfig.json"),
  });

  const sourceFiles = (
    glob ? project.getSourceFiles(glob) : project.getSourceFiles()
  ).filter((sourceFile) => {
    const result = sourceFile.getFilePath().startsWith(rootDir);

    if (!result) {
      sourceFile.forget();
    }

    return result;
  });

  // console.log({ sourceFiles: sourceFiles.map((file) => file.getFilePath()) });
  console.log(
    "Scanning",
    sourceFiles.length,
    "files for imports matching",
    `"${importName}"` ?? "anything",
    "from",
    `"${specifier}" ...`,
  );

  sourceFiles
    .filter((sf) => sf.getExtension() === ".tsx")
    .map((sourceFile) => {
      const imports = sourceFile?.getImportDeclarations();
      // console.log("imports for file", sourceFile?.getFilePath(), "-", imports);

      const matchedImports = (imports ?? []).filter((importDecl) => {
        // console.log({ importClause: importDecl.getModuleSpecifierValue() });
        return specifierMatcher.test(importDecl.getModuleSpecifierValue());
      });

      const importedSymbols = matchedImports.flatMap((importDecl) =>
        importDecl
          .getNamedImports()
          .map((namedImport) => namedImport.getName()),
      );

      if (importedSymbols.length > 0) {
        // console.log(
        //   "File:",
        //   sourceFile.getFilePath(),
        //   "----------------------------------------",
        // );

        // console.log({ importedSymbols });

        importedSymbols.forEach((x) => {
          if (!importNameMatcher || importNameMatcher.test(x)) {
            if (importSymbolStatsMap.has(x)) {
              importSymbolStatsMap
                .get(x)
                ?.addFilename(sourceFile.getFilePath());
            } else {
              importSymbolStatsMap.set(
                x,
                new ImportSymbolStats(x, [sourceFile.getFilePath()]),
              );
            }
            // symbolCount.set(x, (symbolCount.get(x) ?? 0) + 1);
          }
        });
      }
    });

  console.log("\nImport symbol counts:");
  console.log(
    sortBy(Array.from(importSymbolStatsMap.entries()), [first, "asc"])
      .map(([name, importSymbolStats]) => {
        let result = `${pc.green(name)} - ${importSymbolStats.count()}`;

        if (showFilenames) {
          result +=
            "\n" +
            importSymbolStats.filenames
              .map((f) => {
                const renderedFilename =
                  filenameFormat === "absolute"
                    ? f
                    : path.relative(relativeFrom, f);

                return `\t` + renderedFilename;
              })
              .join("\n");
        }

        return result;
      })
      .join("\n"),
  );
}

class ImportSymbolStats {
  symbolName: string;
  _filenames: Set<string>;

  constructor(symbolName: string, filenames: string[] = []) {
    this.symbolName = symbolName;
    this._filenames = new Set(filenames);
  }

  addFilename(filename: string) {
    this._filenames.add(filename);
  }

  get filenames() {
    return Array.from(this._filenames);
  }

  count() {
    return this._filenames.size;
  }
}

class ImportAnalyzer {}
