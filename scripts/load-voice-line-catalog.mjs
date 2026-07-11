import { build } from "esbuild";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
  });
}

function staticStrings(expression) {
  if (ts.isStringLiteralLike(expression)) return [expression.text];
  if (ts.isParenthesizedExpression(expression)) return staticStrings(expression.expression);
  if (ts.isConditionalExpression(expression)) return [...staticStrings(expression.whenTrue), ...staticStrings(expression.whenFalse)];
  return [];
}

function loadStaticSourceLines() {
  const root = path.resolve("src");
  if (!statSync(root).isDirectory()) return [];
  const lines = [];
  for (const file of sourceFiles(root)) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node) => {
      let expressions = [];
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ["speak", "reteach"].includes(node.expression.name.text) &&
        node.arguments[0]
      ) {
        expressions = staticStrings(node.arguments[0]);
      } else if (
        ts.isPropertyDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "instruction" &&
        node.initializer
      ) {
        expressions = staticStrings(node.initializer);
      }
      expressions.forEach((text, index) => {
        const cleanText = text.trim();
        if (!cleanText) return;
        lines.push({
          id: `source-${path.relative(root, file).replace(/\\/g, "/")}-${node.pos}-${index}`,
          text: cleanText,
          spokenText: cleanText,
          category: "source-static"
        });
      });
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return lines;
}

export async function loadVoiceLineCatalog() {
  const result = await build({
    entryPoints: [path.resolve("src", "game", "voiceLineCatalog.ts")],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    target: "node20",
    logLevel: "silent"
  });
  const output = result.outputFiles.find((file) => file.path.endsWith(".js")) ?? result.outputFiles[0];
  const source = Buffer.from(output.contents).toString("base64");
  const catalogModule = await import(`data:text/javascript;base64,${source}`);
  const combined = [...catalogModule.CURRENT_VOICE_LINE_CATALOG, ...loadStaticSourceLines()];
  return [...new Map(combined.map((line) => [line.text, line])).values()];
}
