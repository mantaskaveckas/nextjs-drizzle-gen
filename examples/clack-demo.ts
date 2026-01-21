/**
 * Example: Using @clack/prompts for beautiful CLI output
 * Run with: npx tsx examples/clack-demo.ts
 */

import * as p from "@clack/prompts";
import { setTimeout } from "timers/promises";

async function demo() {
  // Intro banner
  p.intro("🚀 drizzle-gen");

  // Spinner for loading states
  const s = p.spinner();

  s.start("Detecting project configuration...");
  await setTimeout(800);
  s.stop("Project configuration detected");

  // Show detected config
  p.note(
    `Structure:  src/app/
Path alias: @/
Dialect:    postgresql`,
    "Configuration"
  );

  // Interactive prompts (for future interactive mode)
  const name = await p.text({
    message: "Model name:",
    placeholder: "post",
    validate: (value) => {
      if (!value) return "Model name is required";
      if (!/^[a-z][a-zA-Z0-9]*$/.test(value)) {
        return "Must be camelCase (start with lowercase)";
      }
    },
  });

  if (p.isCancel(name)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Multi-select for fields
  const fields = await p.multiselect({
    message: "Select field types to add:",
    options: [
      { value: "title:string", label: "title (string)" },
      { value: "body:text", label: "body (text)" },
      { value: "published:boolean", label: "published (boolean)" },
      { value: "authorId:references:user", label: "authorId (reference)" },
    ],
    required: true,
  });

  if (p.isCancel(fields)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Confirm
  const confirm = await p.confirm({
    message: `Generate scaffold for "${name}" with ${(fields as string[]).length} fields?`,
  });

  if (!confirm || p.isCancel(confirm)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  // Generate with spinner
  s.start("Generating model...");
  await setTimeout(500);
  s.stop("Model created");

  s.start("Generating actions...");
  await setTimeout(500);
  s.stop("Actions created");

  s.start("Generating pages...");
  await setTimeout(800);
  s.stop("Pages created");

  // Summary
  p.note(
    `db/schema.ts
app/${name}s/actions.ts
app/${name}s/page.tsx
app/${name}s/new/page.tsx
app/${name}s/[id]/page.tsx
app/${name}s/[id]/edit/page.tsx`,
    "Created files"
  );

  // Next steps
  p.outro(`Next: Run 'pnpm db:push' then visit /${name}s`);
}

demo().catch(console.error);
