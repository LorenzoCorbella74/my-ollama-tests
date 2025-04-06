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
      content: "You are a helpfull AI assistant called MAX. Reply from now on in Italian even if the request are in other languages."
  }
];

// Create a function to call the Langchain API
async function chatCompletion(text) {
  const userMessage = { role: 'user', content: text };
  const model = new Ollama({
    model: "phi4:latest",
    temperature: 0.1,
    // verbose:true
  });
  try {
    const response = await model.invoke(text);
    console.log("AI:", response);
    process.stdout.write("\n")
    messages.push(userMessage);
    messages.push({ role: 'assistant', content: response });
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

getPrompt(); // Start the prompt


/*

TODO: 
https://hashnode.com/@k33g
https://k33g.hashnode.dev/lets-chat-about-programming-with-langchainjs-and-ollama


*/