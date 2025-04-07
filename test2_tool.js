import readline from "node:readline";
import ollama from 'ollama';

// Simulates an API call to get flight times
// In a real application, this would fetch data from a live database or API
function getFlightTimes(args) {
    // this is where you would validate the arguments you received
    const departure = args.departure;
    const arrival = args.arrival;

    const flights = {
        "LGA-LAX": { departure: "08:00 AM", arrival: "11:30 AM", duration: "5h 30m" },
        "LAX-LGA": { departure: "02:00 PM", arrival: "10:30 PM", duration: "5h 30m" },
        "LHR-JFK": { departure: "10:00 AM", arrival: "01:00 PM", duration: "8h 00m" },
        "JFK-LHR": { departure: "09:00 PM", arrival: "09:00 AM", duration: "7h 00m" },
        "CDG-DXB": { departure: "11:00 AM", arrival: "08:00 PM", duration: "6h 00m" },
        "DXB-CDG": { departure: "03:00 AM", arrival: "07:30 AM", duration: "7h 30m" }
    };

    const key = `${departure}-${arrival}`.toUpperCase();
    return JSON.stringify(flights[key] || { error: "Flight not found" });
}

const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'get_flight_times',
            description: 'Get the flight times between two cities',
            parameters: {
                type: 'object',
                properties: {
                    departure: {
                        type: 'string',
                        description: 'The departure city (airport code)',
                    },
                    arrival: {
                        type: 'string',
                        description: 'The arrival city (airport code)',
                    },
                },
                required: ['departure', 'arrival'],
            },
        },
    },
];

// Create a readline interface to read user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const MODEL = 'qwen2.5:0.5b'; // "mistral:latest" non ha buoni risultati

let messages = [
    {
        role: 'system',
        content: "You are a helpfull AI assistant called MAX. Reply from now on in Italian even if the request are in other languages."
    }
];

async function chatCompletion(text, role = "user") {
    const userMessage = { role, content: text };
    messages.push(userMessage);
    try {
        const response = await ollama.chat({
            model: MODEL,
            temperature: 0,
            verbose: true,
            tools: TOOLS,
            messages: [...messages]
            // sembra NON possibile avere i tools quando stream: true
        });
        messages.push(response.message);

        // Check if the model decided to use the provided function
        if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
            console.log("The model didn't use any function tools");
            process.stdout.write("AI: "+response.message.content+"\n");
            return;
        }

        // Process function calls made by the model
        if (response.message.tool_calls) {
            const availableFunctions = {
                get_flight_times: getFlightTimes,
            };
            for (const tool of response.message.tool_calls) {
                const functionToCall = availableFunctions[tool.function.name];
                const functionResponse = functionToCall(tool.function.arguments);
                console.log('Using function: ', tool.function.name)
                console.log('Function response: ', functionResponse)
                // Add function response to the conversation
                messages.push({
                    role: 'tool',
                    content: functionResponse,
                });
            }
        }

        // Second API call: Get final response from the model
        const finalResponse = await ollama.chat({
            model: MODEL,
            messages: messages,
        });
        process.stdout.write(finalResponse.message.content + "\n")
        messages.push({ role: 'assistant', content: finalResponse.message.content });
        process.stdout.write(JSON.stringify(messages, null, 2));
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

// const prompt = "Qual'è il tempo di viaggio in treno tra Roma e Firenze?";
// const prompt = "Come mai il cielo è blu?";
// const prompt = "What is the flight time from New York (LGA) to Los Angeles (LAX)?";
