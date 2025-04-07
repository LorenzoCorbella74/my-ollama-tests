import readline from "node:readline";
import ollama from 'ollama';

// Create a readline interface to read user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const MODEL = "llama3.2-vision:latest";

let messages = [
    {
        role: 'system',
        content: "You are a helpfull AI assistant called MAX able to analise images. Reply from now on in Italian even if the request are in other languages."
    }
];

const format =  {
    "type": "object",
    "properties": {
      "Codice Avviso": {
        "type": "string"
      },
      "Ente Creditore": {
        "type": "string"
      }
    },
    "required": [
      "Codice Avviso",
      "Ente Creditore"
    ]
  }

async function chatCompletion(text) {
    const userMessage = { 
        role: 'user', 
        content: text,
        images:['./multa.jpg'] // con .png   error: 'illegal base64 data at input byte 6',
    };
    try {
        const response = await ollama.chat({
            model: MODEL,
            temperature: 0,
            stream: true,
            verbose: true,
            format,
            messages: [...messages, userMessage]
        });
        process.stdout.write("AI: ");
        let aiReply = "";
        for await (const part of response) {
            aiReply += part.message.content;
            process.stdout.write(part.message.content);
            if (part.done) {
                const ts = (part.eval_count / part.eval_duration) * Math.pow(10, 9);
                const load_duration = part.load_duration / Math.pow(10, 9);
                const prompt_eval_duration = part.prompt_eval_duration / Math.pow(10, 9);
                console.log(chalk.magenta(`\nToken/s: ${ts.toFixed(2)} - Load model: ${load_duration.toFixed(2)}s - Prompt eval: ${prompt_eval_duration.toFixed(2)}s`));
            }
        }
        process.stdout.write("\n")
        messages.push(userMessage);
        messages.push({ role: 'assistant', content: aiReply });
        // process.stdout.write(JSON.stringify(messages, null, 2));
    } catch (error) {
        console.log("Error:", error);
    }
}

function chatLoop() {
    process.stdout.write("\n")
    rl.question("Utente: ", (input) => {
        if (input.toUpperCase() === "EXIT") {
            rl.close();
        } else {
            chatCompletion(input).then(() => chatLoop());
        }
    });
}

chatLoop(); // Start the chat loop