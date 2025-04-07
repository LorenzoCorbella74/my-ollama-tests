import readline from "node:readline";
import ollama from 'ollama';
import fs from 'fs';
import chalk from 'chalk';

// Create a readline interface to read user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Defaults
let SYSTEM_PROMPT = {
    role: 'system',
    content: "You are a helpfull AI assistant called MAX. Reply from now on in Italian even if the request are in other languages."
}
let MODEL = 'llama3.2:latest';
let messages = [ SYSTEM_PROMPT ];

// Available commands
function showCommands() {
    console.log(chalk.blueBright("Benvenuto in my Ollama chat! Ecco i comandi disponibili:"));
    console.log("\n");
    console.log(chalk.green("/list") + " - Mostra i modelli disponibili.");
    console.log(chalk.green("/system <text>") + " - Setta il content del system prompt e resetta i msgs");
    console.log(chalk.green("/save <nome>") + " - Salva la chat corrente con il nome specificato.");
    console.log(chalk.green("/load") + " - Carica una chat salvata.");
    console.log(chalk.green("/current") + " - Mostra il modello attualmente in uso.");
    console.log(chalk.green("/bye") + " - Esci dalla chat.");
    console.log("\n");
}

// list available models
async function listModels() {
    try {
        const list = await ollama.list(); // Assuming ollama has a listModels method
        const models = list.models;
        console.log(chalk.blueBright("Modelli disponibili:"));
        list.models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.name} - ${model.details.family} - ${model.details.parameter_size}`);
        });
        rl.question(chalk.cyan("Seleziona un modello inserendo il numero corrispondente: "), (input) => {
            const selectedIndex = parseInt(input) - 1;
            if (selectedIndex >= 0 && selectedIndex < models.length) {
                MODEL = models[selectedIndex].name;
                console.log(chalk.green(`Modello selezionato: ${MODEL}`));
            } else {
                console.log(chalk.red("Selezione non valida. Modello predefinito mantenuto."));
            }
            messages = [ SYSTEM_PROMPT ];
            chatLoop(); // Riprendi il ciclo della chat
        });
    } catch (error) {
        console.log(chalk.red("Errore durante il recupero dei modelli:"), error);
        chatLoop(); // Riprendi il ciclo della chat in caso di errore
    }
}

// Function to save the current chat
function saveChat(fileName) {
    const chatData = {
        model: MODEL,
        messages: messages,
    };
    fs.writeFileSync(`${fileName}.json`, JSON.stringify(chatData, null, 2));
    console.log(chalk.yellow(`Chat salvata con successo in ${fileName}.json`));
}

// Function to load a saved chat
function loadChat() {
    const files = fs.readdirSync('.').filter(file => file.endsWith('.json') && file !== 'package.json' && file !== 'package-lock.json');
    if (files.length === 0) {
        console.log(chalk.red("Nessuna chat salvata trovata."));
        chatLoop();
        return;
    }

    console.log(chalk.blueBright("Chat salvate disponibili:"));
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });

    rl.question(chalk.cyan("Seleziona una chat da caricare inserendo il numero corrispondente: "), (input) => {
        const selectedIndex = parseInt(input) - 1;
        if (selectedIndex >= 0 && selectedIndex < files.length) {
            const chatData = JSON.parse(fs.readFileSync(files[selectedIndex]));
            MODEL = chatData.model;
            messages = chatData.messages;
            console.log(chalk.green(`Chat caricata con successo da ${files[selectedIndex]}`));
        } else {
            console.log(chalk.red("Selezione non valida."));
        }
        chatLoop();
    });
}

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
        
        // Streaming response
        process.stdout.write(chalk.cyan("AI: "));
        let aiReply = "";
        for await (const part of response) {
            aiReply += part.message.content;
            process.stdout.write(chalk.yellow(part.message.content));
            if (part.done) {
                const ts = (part.eval_count / part.eval_duration) * Math.pow(10, 9);
                const load_duration = part.load_duration / Math.pow(10, 9);
                const prompt_eval_duration = part.prompt_eval_duration / Math.pow(10, 9);
                console.log(chalk.magenta(`\nToken/s: ${ts.toFixed(2)} - Load model: ${load_duration.toFixed(2)}s - Prompt eval: ${prompt_eval_duration.toFixed(2)}s`));
            }
        }
        process.stdout.write("\n");
        messages.push(userMessage);
        messages.push({ role: 'assistant', content: aiReply });
    } catch (error) {
        console.log(chalk.red("Error:"), error);
    }
}

function chatLoop() {
    process.stdout.write("\n");
    rl.question(chalk.green("Utente: "), (input) => {
        if (input.toUpperCase() === "EXIT" || input === "/bye") {
            console.log(chalk.blue("Arrivederci!"));
            rl.close();
        } else if (input === "/list") {
            listModels(); // Mostra i modelli disponibili
        } else if (input.startsWith("/save ")) {
            const fileName = input.split(" ")[1];
            if (fileName) {
                saveChat(fileName);
            } else {
                console.log(chalk.red("Errore: specifica un nome per il file di salvataggio."));
            }
            chatLoop();
        } else if (input === "/load") {
            loadChat(); // Carica una chat salvata
        } else if (input === "/current") {
            console.log(chalk.blue(`Modello attualmente in uso: ${MODEL}`));
            chatLoop();
        } else if (input.startsWith("/system ")) {
            const newSystemPrompt = input.slice(8).trim();
            if (newSystemPrompt) {
                SYSTEM_PROMPT.content = newSystemPrompt;
                messages = [SYSTEM_PROMPT]; // Resetta i messaggi con il nuovo SYSTEM_PROMPT
                console.log(chalk.green("SYSTEM_PROMPT aggiornato con successo!"));
            } else {
                console.log(chalk.red("Errore: specifica un contenuto valido per il SYSTEM_PROMPT."));
            }
            chatLoop();
        } else {
            chatCompletion(input).then(() => chatLoop());
        }
    });
}

// Mostra i comandi disponibili all'inizio
showCommands();
listModels();