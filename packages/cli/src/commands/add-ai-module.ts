/**
 * @file Command to add a new AI module
 */

import * as fs from "fs";
import * as path from "path";
import { generateAIModuleTemplate } from "../templates/ai-module-template";

export interface AddAIModuleOptions {
  dir: string;
  providers?: string;
  defaultProvider?: string;
  defaultModel?: string;
}

/**
 * Add a new AI module to the project
 *
 * @param name - Name of the AI module (e.g., TextSummarizer)
 * @param options - Command options
 */
export async function addAIModule(
  name: string,
  options: AddAIModuleOptions,
): Promise<void> {
  try {
    // Validate name
    if (!name || !/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      console.error(
        "Error: Module name must start with an uppercase letter and contain only alphanumeric characters.",
      );
      console.error("Example: TextSummarizer, CodeAnalyzer, DataTransformer");
      process.exit(1);
    }

    // Ensure the name ends with 'Module' for clarity
    const moduleName = name.endsWith("Module") ? name : `${name}Module`;

    // Parse providers
    const providers = options.providers
      ? options.providers.split(",").map((p) => p.trim())
      : ["anthropic", "openai"];

    const defaultProvider = options.defaultProvider || providers[0];

    // Generate the module file content
    const fileContent = generateAIModuleTemplate(moduleName, {
      providers,
      defaultProvider,
      defaultModel: options.defaultModel,
    });

    // Determine the output path
    const outputDir = path.resolve(process.cwd(), options.dir);
    const outputPath = path.join(outputDir, `${moduleName}.ts`);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.error(`Error: AI module file already exists at ${outputPath}`);
      process.exit(1);
    }

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputPath, fileContent, "utf-8");

    console.log("✓ AI module created successfully!");
    console.log("");
    console.log(`Location: ${outputPath}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Implement the process() method with your AI logic");
    console.log(
      "2. Override makeAIRequest() to integrate with actual AI providers",
    );
    console.log("3. Update the module description and configuration");
    console.log("4. Import and use your AI module:");
    console.log("");
    console.log(
      `   import { ${moduleName} } from '@repo/core/ai-modules/${moduleName}';`,
    );
    console.log(`   const module = new ${moduleName}();`);
    console.log(`   const result = await module.run(input);`);
    console.log("");
    console.log("Note: Remember to set up API keys for your AI providers:");
    console.log("- ANTHROPIC_API_KEY for Anthropic");
    console.log("- OPENAI_API_KEY for OpenAI");
    console.log("");
  } catch (error) {
    console.error("Error creating AI module:", error);
    process.exit(1);
  }
}
