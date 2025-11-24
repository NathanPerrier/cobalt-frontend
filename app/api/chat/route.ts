import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export async function POST(req: Request) {
  const text = await req.text();
  if (!text) {
    return new Response("Empty body", { status: 400 });
  }
  
  let body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    console.error("Invalid JSON:", e);
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("API Route received body:", JSON.stringify(body, null, 2));
  const { messages, socketId } = body;
  
  if (!messages || messages.length === 0) {
    return new Response("No messages", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];

  // Prevent loop: If the last message is from the assistant, do not send to connector
  if (lastMessage.role === 'assistant') {
    console.log("Ignoring request where last message is from assistant");
    return new Response("Ignored", { status: 200 });
  }

  // Extract text content from the message parts
  const messageContent = lastMessage.parts?.find((p: any) => p.type === "text")?.text || "";

  // Use the socketId passed from the client as the session ID
  // This ensures the reply goes back to the correct browser client
  const sessionId = socketId; 

  console.log("Sending message to connector with sessionId:", sessionId);
  console.log("Message content:", messageContent);

  socket.emit("message:send", {
    sessionId,
    content: messageContent,
  });

  // Return a JSON response to satisfy assistant-ui
  return new Response(JSON.stringify({ status: "sent" }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
