import readline from "node:readline";
import ollama from 'ollama';

// Create a readline interface to read user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const MODEL = 'deepseek-r1:8b'; //  "llama3.2:latest";

let messages = [
    {
        role: 'system',
        content: "You are a helpfull AI assistant called MAX. Reply from now on in Italian even if the request are in other languages."
    }
];

async function chatCompletion(text) {
    const userMessage = { role: 'user', content: text };
    try {
        const response = await ollama.chat({
            model: MODEL,
            temperature: 0.1,
            stream: true,
            verbose: true,
            messages: [...messages, userMessage]
        });
        
        // straeming response
        process.stdout.write("AI: ");
        let aiReply = "";
        for await (const part of response) {
            aiReply += part.message.content;
            process.stdout.write(part.message.content);
            if (part.done) {
                const ts = (part.eval_count / part.eval_duration) * Math.pow(10, 9);
                process.stdout.write("Token/s: " + ts.toFixed(2).toString());
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

chatLoop();