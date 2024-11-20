import path from "node:path";
import resolve from "enhanced-resolve";
import { Project } from "ts-morph";

const extensions = [".js", ".jsx", ".ts", ".tsx"];

const resolver = resolve.create.sync({
	extensions: extensions,
	preferRelative: true,
});

export async function run(
	rootDirArg: string = process.cwd(),
	pathGlobArg = "**/*.{ts,tsx}",
) {
	const rootDir = path.isAbsolute(rootDirArg)
		? rootDirArg
		: path.resolve(process.cwd(), rootDirArg);

	// Initialize the project
	const project = new Project({
		// Adjust the tsconfig file path according to your project structure
		tsConfigFilePath: path.join(rootDir, "tsconfig.json"),
	});

	// Replace this with the path to your source files
	const sourceFiles = project.addSourceFilesAtPaths(
		path.join(rootDir, pathGlobArg),
	);

	if (sourceFiles.length <= 0) {
		console.log("No files found under that path.");
		return;
	}

	let totalUpdatedFiles = 0;
	let totalImports = 0;
	let totalExports = 0;

	for (const sourceFile of sourceFiles) {
		const filePath = sourceFile.getFilePath();
		const importDeclarations = sourceFile.getImportDeclarations();

		let fileUpdated = false;
		console.group(filePath);

		for (const importDeclaration of importDeclarations) {
			const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

			// Only process relative paths without extensions
			if (shouldRewriteModuleSpecifier(moduleSpecifier)) {
				const resolvedModule = resolver(
					path.dirname(filePath),
					moduleSpecifier,
				);

				if (resolvedModule) {
					console.group("import from:", moduleSpecifier);
					console.log("resolvedModule:", resolvedModule);

					const updatedModuleSpecifier = rewriteModuleSpecifier(
						filePath,
						resolvedModule,
					);

					console.log(
						"updated module specifier",
						moduleSpecifier,
						"to",
						updatedModuleSpecifier,
					);

					// Replace the module specifier with .js extension
					importDeclaration.setModuleSpecifier(updatedModuleSpecifier);
					totalImports += 1;
					fileUpdated = true;
					console.groupEnd();
				} else {
					console.warn(
						"Could not resolve moduleSpecifier",
						moduleSpecifier,
						"from path",
						filePath,
					);
				}
			}
		}

		const exportDeclarations = sourceFile.getExportDeclarations();

		for (const exportDeclaration of exportDeclarations) {
			const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();

			// Only process relative paths without extensions
			if (moduleSpecifier && shouldRewriteModuleSpecifier(moduleSpecifier)) {
				const resolvedModule = resolver(
					path.dirname(filePath),
					moduleSpecifier,
				);

				if (resolvedModule) {
					console.group("export from:", moduleSpecifier);
					console.log("resolvedModule:", resolvedModule);

					const updatedModuleSpecifier = rewriteModuleSpecifier(
						filePath,
						resolvedModule,
					);

					console.log(
						"updated module specifier",
						moduleSpecifier,
						"to",
						updatedModuleSpecifier,
					);

					// Replace the module specifier with .js extension
					exportDeclaration.setModuleSpecifier(updatedModuleSpecifier);
					totalExports += 1;
					fileUpdated = true;
					console.groupEnd();
				} else {
					console.warn(
						"Could not resolve moduleSpecifier",
						moduleSpecifier,
						"from path",
						filePath,
					);
				}
			}
		}

		console.groupEnd();

		// Save the modified file
		sourceFile.saveSync();

		if (fileUpdated) {
			totalUpdatedFiles += 1;
		}
	}

	console.group(
		`Found ${sourceFiles.length} files matching "${path.join(
			rootDirArg,
			pathGlobArg,
		)}"`,
	);
	console.log("Updated files:", totalUpdatedFiles);
	console.log("Imports:", totalImports);
	console.log("Exports:", totalExports);
	console.groupEnd();
}

export function shouldRewriteModuleSpecifier(moduleSpecifier: string) {
	// const hasExtension = /\.[^\/\\]+$/.test(moduleSpecifier);
	const hasJsExtension = path.extname(moduleSpecifier) === ".js";
	const hasJsonExtension = path.extname(moduleSpecifier) === ".json";

	return (
		(moduleSpecifier === "." ||
			moduleSpecifier === ".." ||
			moduleSpecifier.startsWith("./") ||
			moduleSpecifier.startsWith("../")) &&
		!(hasJsExtension || hasJsonExtension)
	);
}

export function rewriteModuleSpecifier(
	filePath: string,
	resolvedModule: string,
) {
	const resolvedJsPath = path
		.relative(path.dirname(filePath), resolvedModule)
		.replace(path.extname(resolvedModule), ".js");

	return resolvedJsPath.startsWith(".")
		? resolvedJsPath
		: `./${resolvedJsPath}`;
}
