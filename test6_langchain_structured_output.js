import { Ollama } from "@langchain/ollama"; // https://js.langchain.com/docs/integrations/llms/ollama/
import readline from "readline";

// Import environment variables
import * as dotenv from "dotenv";
dotenv.config();

// Create a readline interface to read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let messages = [
  {
      role: 'system',
      content: "You are an expert for games like D&D 5th edition."
  }
];

let jsonSchema = {
  type: "object",
  properties: {
      name: {
          type: "string"
      },
      kind: {
          type: "string"
      },
  },
  required: ["name", "kind"]
}

// Create a function to call the Langchain API
async function chatCompletion(text) {
  const userMessage = { role: 'user', content: text };
  messages.push(userMessage);
  const model = new Ollama({
    model: 'qwen2.5:0.5b', // "phi4:latest",
    temperature: 0.9,
    messages,
    format: jsonSchema,
  });
  try {
    const response = await model.invoke(messages);
    process.stdout.write("AI:"+ response + "\n")
    messages.push({ role: 'assistant', content: response });
    // process.stdout.write(JSON.stringify(messages, null, 2));
  } catch (error) {
    console.log("Error:", error);
  }
}

// Create a function to ask for user input
function getPrompt() {
  rl.question("Enter your prompt: ", (input) => {
    if (input.toUpperCase() === "EXIT") {
      rl.close();
    } else {
      chatCompletion(input).then(() => getPrompt()); // Call getPrompt again to ask for the next input
    }
  });
}

getPrompt(); // Generate a random name for an Elf (kind always equals Elf)
/*
  Oppure con ZOD:
  https://k33g.hashnode.dev/structured-output-with-ollama-and-langchainjs-the-return?source=more_series_bottom_blogs

*/