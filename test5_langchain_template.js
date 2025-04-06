import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import readline from "readline";

const prompt = PromptTemplate.fromTemplate(
  "How to say {input} in {output_language}. Do not add anything but the translation.\n"
);

// Create a readline interface to read user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let messages = [
  {
      role: 'system',
      content: "You are a helpfull AI assistant able to translate from any language to any language."
  }
];
// Create a function to call the Langchain API
async function chatCompletion(text) {
  const userMessage = { role: 'user', content: text };
  const model = new Ollama({
    model: "phi4:latest",
    temperature: 0.1,
    verbose: true
  });
  try {
    const chain = prompt.pipe(model);
    const response = await chain.stream({
      output_language: "English",
      input: text,
    });
    process.stdout.write("AI: ");
    let aiReply = "";
    for await (const part of response) {
      aiReply += part;
      process.stdout.write(part);
    }
    process.stdout.write("\n")
    messages.push(userMessage);
    messages.push({ role: 'assistant', content: aiReply });
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
      chatCompletion(input).then(() => getPrompt());
    }
  });
}

getPrompt();