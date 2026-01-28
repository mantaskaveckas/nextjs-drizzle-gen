import * as path from "path";
import {
  parseFields,
  toCamelCase,
  toSnakeCase,
  pluralize,
  escapeString,
  drizzleType,
  writeFile,
  fileExists,
  readFile,
  validateModelName,
  createModelContext,
  modelExistsInSchema,
  removeModelFromSchemaContent,
  detectDialect,
  getDrizzleImport,
  getTableFunction,
  getIdColumn,
  getTimestampColumns,
  getRequiredImports,
  updateSchemaImports,
  getDbPath,
  Field,
  GeneratorOptions,
  Dialect,
} from "../lib";

export function generateModel(name: string, fieldArgs: string[], options: GeneratorOptions = {}): void {
  validateModelName(name);

  const ctx = createModelContext(name);
  const fields = parseFields(fieldArgs);
  const dialect = detectDialect();

  // Check for duplicate model
  if (modelExistsInSchema(ctx.tableName) && !options.force) {
    throw new Error(
      `Model "${ctx.pascalName}" already exists in schema. Use --force to regenerate.`
    );
  }

  const schemaPath = path.join(getDbPath(), "schema.ts");

  if (!fileExists(schemaPath)) {
    const schemaContent = generateSchemaContent(ctx.camelPlural, ctx.tableName, fields, dialect, options);
    writeFile(schemaPath, schemaContent, options);
  } else if (modelExistsInSchema(ctx.tableName)) {
    // Model exists and --force was used — replace it
    replaceInSchema(schemaPath, ctx.camelPlural, ctx.tableName, fields, dialect, options);
  } else {
    appendToSchema(schemaPath, ctx.camelPlural, ctx.tableName, fields, dialect, options);
  }
}

function generateSchemaContent(
  modelName: string,
  tableName: string,
  fields: Field[],
  dialect: Dialect,
  options: GeneratorOptions = {}
): string {
  const imports = getRequiredImports(fields, dialect, options);
  const drizzleImport = getDrizzleImport(dialect);
  const enumDefinitions = generateEnumDefinitions(fields, dialect);
  const tableDefinition = generateTableDefinition(modelName, tableName, fields, dialect, options);

  return `import { ${imports.join(", ")} } from "${drizzleImport}";
${enumDefinitions}
${tableDefinition}
`;
}

function generateEnumDefinitions(fields: Field[], dialect: Dialect): string {
  if (dialect !== "postgresql") {
    return "";
  }

  const enumFields = fields.filter((f) => f.isEnum && f.enumValues);
  if (enumFields.length === 0) {
    return "";
  }

  return enumFields
    .map((field) => {
      const enumName = `${field.name}Enum`;
      const values = field.enumValues!.map((v) => `"${escapeString(v)}"`).join(", ");
      return `\nexport const ${enumName} = pgEnum("${toSnakeCase(field.name)}", [${values}]);`;
    })
    .join("\n");
}

function generateTableDefinition(
  modelName: string,
  tableName: string,
  fields: Field[],
  dialect: Dialect,
  options: GeneratorOptions = {}
): string {
  const tableFunction = getTableFunction(dialect);
  const idColumn = getIdColumn(dialect, options.uuid);
  const timestampColumns = getTimestampColumns(dialect, options.noTimestamps);
  const fieldDefinitions = generateFieldDefinitions(fields, dialect, options);

  // Build table content
  const lines = [`  ${idColumn},`];
  if (fieldDefinitions) {
    lines.push(fieldDefinitions);
  }
  if (timestampColumns) {
    lines.push(`  ${timestampColumns},`);
  }

  return `export const ${modelName} = ${tableFunction}("${tableName}", {
${lines.join("\n")}
});`;
}

function generateFieldDefinitions(fields: Field[], dialect: Dialect, options: GeneratorOptions = {}): string {
  return fields
    .map((field) => {
      const columnName = toSnakeCase(field.name);
      const modifiers = getFieldModifiers(field);

      // Handle enum fields
      if (field.isEnum && field.enumValues) {
        return generateEnumField(field, columnName, dialect);
      }

      const drizzleTypeDef = drizzleType(field, dialect);

      if (field.isReference && field.referenceTo) {
        const refTarget = `${toCamelCase(pluralize(field.referenceTo))}.id`;
        return `  ${field.name}: ${getReferenceType(dialect, columnName, options.uuid)}.references(() => ${refTarget})${modifiers},`;
      }

      // MySQL varchar needs length option
      if (dialect === "mysql" && drizzleTypeDef === "varchar") {
        // UUID needs exactly 36 characters
        const length = field.type === "uuid" ? 36 : 255;
        return `  ${field.name}: varchar("${columnName}", { length: ${length} })${modifiers},`;
      }

      // Handle types with options like integer({ mode: "boolean" })
      if (drizzleTypeDef.includes("(")) {
        const [typeName] = drizzleTypeDef.split("(");
        const typeOptions = drizzleTypeDef.match(/\(.*\)/)?.[0] ?? "";
        return `  ${field.name}: ${typeName}("${columnName}", ${typeOptions})${modifiers},`;
      }

      return `  ${field.name}: ${drizzleTypeDef}("${columnName}")${modifiers},`;
    })
    .join("\n");
}

function getFieldModifiers(field: Field): string {
  const modifiers: string[] = [];

  if (!field.nullable) {
    modifiers.push(".notNull()");
  }
  if (field.unique) {
    modifiers.push(".unique()");
  }

  return modifiers.join("");
}

function getReferenceType(dialect: Dialect, columnName: string, useUuid = false): string {
  if (useUuid) {
    switch (dialect) {
      case "postgresql":
        return `uuid("${columnName}")`;
      case "mysql":
        return `varchar("${columnName}", { length: 36 })`;
      default:
        return `text("${columnName}")`;
    }
  }

  switch (dialect) {
    case "mysql":
      return `int("${columnName}")`;
    default:
      return `integer("${columnName}")`;
  }
}

function generateEnumField(field: Field, columnName: string, dialect: Dialect): string {
  const values = field.enumValues!;
  const modifiers = getFieldModifiers(field);

  switch (dialect) {
    case "postgresql":
      // PostgreSQL uses pgEnum reference
      return `  ${field.name}: ${field.name}Enum("${columnName}")${modifiers},`;

    case "mysql":
      // MySQL uses inline mysqlEnum
      const mysqlValues = values.map((v) => `"${escapeString(v)}"`).join(", ");
      return `  ${field.name}: mysqlEnum("${columnName}", [${mysqlValues}])${modifiers},`;

    default:
      // SQLite uses text with enum option
      const sqliteValues = values.map((v) => `"${escapeString(v)}"`).join(", ");
      return `  ${field.name}: text("${columnName}", { enum: [${sqliteValues}] })${modifiers},`;
  }
}

function appendToSchema(
  schemaPath: string,
  modelName: string,
  tableName: string,
  fields: Field[],
  dialect: Dialect,
  options: GeneratorOptions
): void {
  const existingContent = readFile(schemaPath);
  const newImports = getRequiredImports(fields, dialect, options);
  const updatedContent = updateSchemaImports(existingContent, newImports, dialect);
  const enumDefinitions = generateEnumDefinitions(fields, dialect);
  const tableDefinition = generateTableDefinition(modelName, tableName, fields, dialect, options);
  const newContent = updatedContent + enumDefinitions + "\n" + tableDefinition + "\n";

  writeFile(schemaPath, newContent, { force: true, dryRun: options.dryRun });
}

function replaceInSchema(
  schemaPath: string,
  modelName: string,
  tableName: string,
  fields: Field[],
  dialect: Dialect,
  options: GeneratorOptions
): void {
  const existingContent = readFile(schemaPath);
  const cleanedContent = removeModelFromSchemaContent(existingContent, tableName);
  const newImports = getRequiredImports(fields, dialect, options);
  const updatedContent = updateSchemaImports(cleanedContent, newImports, dialect);
  const enumDefinitions = generateEnumDefinitions(fields, dialect);
  const tableDefinition = generateTableDefinition(modelName, tableName, fields, dialect, options);
  const newContent = updatedContent.trimEnd() + "\n" + enumDefinitions + "\n" + tableDefinition + "\n";

  writeFile(schemaPath, newContent, { force: true, dryRun: options.dryRun });
}
