var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { history, userMessage, topic } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "\u064A\u0631\u062C\u0649 \u0625\u0636\u0627\u0641\u0629 \u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 Settings > Secrets \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0627\u0644\u0630\u0643\u064A\u0629."
        });
      }
      const systemInstruction = `You are a highly supportive, friendly, and engaging native English-speaking conversation partner and tutor named "Oliver". You are having an English conversation with an Arabic student to help them practice speaking on the "Qavanti" platform.
The current conversation situation/topic is: "${topic || "General English Conversation"}".

Instructions:
1. Actively maintain the scenario, replying naturally but in simplified English. Max 1-3 sentences.
2. If the user makes grammatical or spelling mistakes, gently point them out in "corrections" using easy English or Arabic.
3. If they wrote well, leave "corrections" empty.
4. Translate any idiom or complex word into Arabic inside "arabicHelp", or write comments, explanations, and encouraging words in Arabic there.
5. End your response with one simple, engaging conversational question to keep the chat going.

You MUST respond strictly with the JSON format:
{
  "english": "The text to say in English.",
  "arabicHelp": "Optional Arabic help/translation or friendly support context.",
  "corrections": "Optional grammar/spelling correction. If there is nothing to fix or it is fine, keep this field as empty string."
}`;
      const formattedContents = [
        ...history.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.message }]
        })),
        { role: "user", parts: [{ text: userMessage }] }
      ];
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              english: {
                type: import_genai.Type.STRING,
                description: "The conversational response in English. Short and sweet (1-3 sentences)."
              },
              arabicHelp: {
                type: import_genai.Type.STRING,
                description: "Arabic notes, words of support, vocabulary translation or translation for the English parts."
              },
              corrections: {
                type: import_genai.Type.STRING,
                description: "Gently highlight a grammar corrections or spelling fixes. Keep as empty string if none."
              }
            },
            required: ["english"]
          }
        }
      });
      const jsonText = response.text || "{}";
      const parsedData = JSON.parse(jsonText.trim());
      return res.json(parsedData);
    } catch (err) {
      console.error("Gemini Tutor Chat API Error:", err);
      return res.status(500).json({
        error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u062E\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0648\u0641\u0631 \u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A Secrets."
      });
    }
  });
  app.get("/api/gemini/ready", (req, res) => {
    res.json({ ready: !!process.env.GEMINI_API_KEY });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
