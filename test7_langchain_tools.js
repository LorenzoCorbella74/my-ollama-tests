/*
    https://github.com/ollama-tlms-langchainjs/03-tools/blob/main/index.js
*/

import { ChatOllama } from "@langchain/ollama"
import { z } from "zod"
import { tool } from "@langchain/core/tools"

// ''mistral:latest', vede 4 funzioni addition, multipication, addition, multiplication
// 'qwen2.5-coder:latest', vede solo addition
//  deepseek-r1:8b does not support tools
// 'llama3.2:latest', vede correttamente addition, multipication ma poi va in errore

const llm = new ChatOllama({
    model: 'qwen2.5:0.5b', // FUNZIONAAAAA
    temperature: 0.0, 
})

const calculationSchema = z.object({
    a: z.number().describe("first number"),
    b: z.number().describe("second number"),
})

const additionTool = tool(
    async ({ a, b }) => {
      return a + b
    },
    {
      name: "addition",
      description: "Add numbers.",
      schema: calculationSchema,
    }
)

const multiplicationTool = tool(
  async ({ a, b }) => {
    return a * b
  },
  {
    name: "multiplication",
    description: "Multiply numbers.",
    schema: calculationSchema,
  }
)

const llmWithTools = llm.bindTools([
  additionTool,
  multiplicationTool
])

let toolMapping = {
    "addition": additionTool,
    "multiplication": multiplicationTool
}

let llmOutput = await llmWithTools.invoke("Add 30 and 12. Then multiply 21 by 2.")

// Detected tools
for (let toolCall of llmOutput.tool_calls) {
    console.log("🛠️ Tool:", toolCall.name, "Args:", toolCall.args)
}

// Invoke the tools
for (let toolCall of llmOutput.tool_calls) {
    let functionToCall = toolMapping[toolCall.name]
    let result = await functionToCall.invoke(toolCall.args)
    console.log("🤖 Result for:", toolCall.name, "with:", toolCall.args, "=", result)
}