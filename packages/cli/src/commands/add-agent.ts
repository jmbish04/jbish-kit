/**
 * @file Command to add a new agent
 */

import * as fs from "fs";
import * as path from "path";
import { generateAgentTemplate } from "../templates/agent-template";

export interface AddAgentOptions {
  dir: string;
  tools?: string;
  providers?: string;
}

/**
 * Add a new agent to the project
 *
 * @param name - Name of the agent (e.g., DocumentAnalyzer)
 * @param options - Command options
 */
export async function addAgent(
  name: string,
  options: AddAgentOptions,
): Promise<void> {
  try {
    // Validate name
    if (!name || !/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      console.error(
        "Error: Agent name must start with an uppercase letter and contain only alphanumeric characters.",
      );
      console.error("Example: DocumentAnalyzer, WebScraper, DataProcessor");
      process.exit(1);
    }

    // Ensure the name ends with 'Agent' for clarity
    const agentName = name.endsWith("Agent") ? name : `${name}Agent`;

    // Parse tools and providers
    const tools = options.tools
      ? options.tools.split(",").map((t) => t.trim())
      : [];
    const providers = options.providers
      ? options.providers.split(",").map((p) => p.trim())
      : [];

    // Generate the agent file content
    const fileContent = generateAgentTemplate(agentName, {
      tools,
      providers,
    });

    // Determine the output path
    const outputDir = path.resolve(process.cwd(), options.dir);
    const outputPath = path.join(outputDir, `${agentName}.ts`);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      console.error(`Error: Agent file already exists at ${outputPath}`);
      process.exit(1);
    }

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(outputPath, fileContent, "utf-8");

    console.log("✓ Agent created successfully!");
    console.log("");
    console.log(`Location: ${outputPath}`);
    console.log("");
    console.log("Next steps:");
    console.log("1. Implement the execute() method with your agent logic");
    console.log("2. Add any custom initialization in onInitialize()");
    console.log("3. Update the agent description and configuration");
    console.log("4. Import and use your agent:");
    console.log("");
    console.log(
      `   import { ${agentName} } from '@repo/core/agents/${agentName}';`,
    );
    console.log(`   const agent = new ${agentName}();`);
    console.log(`   const result = await agent.run(input);`);
    console.log("");
  } catch (error) {
    console.error("Error creating agent:", error);
    process.exit(1);
  }
}
