import * as path from "path";
import {
  validateModelName,
  createModelContext,
  deleteDirectory,
  getAppPath,
  detectProjectConfig,
  log,
  GeneratorOptions,
  ModelContext,
} from "../lib";

type PathBuilder = (ctx: ModelContext) => string;

function destroy(
  name: string,
  type: string,
  buildPath: PathBuilder,
  options: GeneratorOptions = {}
): void {
  validateModelName(name);

  const ctx = createModelContext(name);
  const config = detectProjectConfig();
  const prefix = options.dryRun ? "[dry-run] " : "";

  log.info(`\n${prefix}Destroying ${type} ${ctx.pascalName}...\n`);

  const basePath = buildPath(ctx);
  deleteDirectory(basePath, options);

  log.info(`\nNote: Schema in ${config.dbPath}/schema.ts was not modified.`);
  log.info(`      Remove the table definition manually if needed.`);
}

export function destroyScaffold(name: string, options: GeneratorOptions = {}): void {
  destroy(name, "scaffold", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

export function destroyResource(name: string, options: GeneratorOptions = {}): void {
  destroy(name, "resource", (ctx) => path.join(getAppPath(), ctx.kebabPlural), options);
}

export function destroyApi(name: string, options: GeneratorOptions = {}): void {
  destroy(name, "API", (ctx) => path.join(getAppPath(), "api", ctx.kebabPlural), options);
}
