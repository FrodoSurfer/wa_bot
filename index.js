import {
    default as makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadContentFromMessage,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { agent } from "./agent.js";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const conversationHistory = new Map();
const sessionState = new Map();

function initialState() {
    return {
        service: null, // 'color' | 'extensiones' | 'nanoplastia' | 'corte' | null
        photos: { current: null, reference: null },
        chemicalHistory: null,
        stage: "init",
        lastPrompted: null,
        // --> NUEVO: Campo para futura memoria de clientas
        lastVisit: null,
        booking: { dayText: null, timeText: null, iso: null },
        budget: {
            limitUSD: isFinite(Number(process.env.CONVO_BUDGET_USD))
                ? Number(process.env.CONVO_BUDGET_USD)
                : 1,
            spentUSD: 0,
            spentTokens: 0,
            calls: 0,
            lastModel: null,
            mode: "normal", // 'normal' | 'low' | 'exhausted'
        },
    };
}

// ====== Pausas realistas (presencia escribiendo) ======
function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
function estimateTypingMs(text = "") {
    const TYPING_WPM = Number(process.env.TYPING_WPM || 180); // Velocidad más realista
    const BASE_MS = Number(process.env.TYPING_BASE_MS || 1200); // Tiempo base más natural
    const MIN_MS = Number(process.env.TYPING_MIN_MS || 1500); // Mínimo más realista
    const MAX_MS = Number(process.env.TYPING_MAX_MS || 8000); // Máximo más realista
    const JITTER = Number(process.env.TYPING_JITTER || 0.35); // Más variación
    const words = (text.trim().match(/\S+/g) || []).length;
    const msByWords = (words / Math.max(TYPING_WPM, 60)) * 60000;
    let ms = BASE_MS + msByWords;
    const factor = 1 + (Math.random() * 2 - 1) * JITTER;
    ms = Math.round(ms * factor);
    ms = Math.max(MIN_MS, Math.min(MAX_MS, ms));
    return ms;
}
async function sendWithTyping(sock, jid, text) {
    try {
        const ms = estimateTypingMs(text);
        await sock.presenceSubscribe(jid);
        await sock.sendPresenceUpdate("composing", jid);
        await sleep(ms);
        await sock.sendPresenceUpdate("paused", jid);
        await sock.sendMessage(jid, { text });
    } catch {
        await sock.sendMessage(jid, { text });
    }
}

// ====== Helpers de extracción de mensaje ======
function unwrapContent(message) {
    let content = message;
    let guard = 0;
    while (
        content?.ephemeralMessage ||
        content?.viewOnceMessageV2 ||
        content?.viewOnceMessageV2Extension
    ) {
        if (content?.ephemeralMessage)
            content = content.ephemeralMessage.message;
        else if (content?.viewOnceMessageV2)
            content = content.viewOnceMessageV2.message;
        else if (content?.viewOnceMessageV2Extension)
            content = content.viewOnceMessageV2Extension.message;
        guard++;
        if (guard > 5) break;
    }
    return content;
}
function getMessageText(msg) {
    if (!msg?.message) return "";
    const m = unwrapContent(msg.message);
    return (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        ""
    );
}
async function extractImagesFromMessage(msg) {
    try {
        const content = unwrapContent(msg.message);
        const img = content?.imageMessage;
        if (!img) return [];
        const stream = await downloadContentFromMessage(img, "image");
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const mimeType = img.mimetype || "image/jpeg";
        const dataBase64 = buffer.toString("base64");
        return [{ dataBase64, mimeType }];
    } catch (e) {
        console.warn(
            "No se pudo extraer la(s) imagen(es) del mensaje:",
            e?.message || e,
        );
        return [];
    }
}

// ====== Lógica de servicio/fotos ======
function parseServiceFromText(text) {
    const t = (text || "").toLowerCase();
    const isColor =
        /(balayage|babylights|iluminaci[oó]n|mechas|efectos?\s+de\s+color|efecto\s+color|tinte|color(aci[oó]n)?)/i.test(
            t,
        );
    const isExt =
        /(extensiones?|micro(?:beads|ring)|queratina|keratina(?:\s*extensiones)?|hair\s*extensions?)/i.test(
            t,
        );
    const isNano = /(nanoplastia|alisado(?:\s+nanoplastia)?)/i.test(t);
    const isCut = /\b(corte|peinado|styling|estilo|secado)\b/i.test(t);
    if (isColor) return "color";
    if (isExt) return "extensiones";
    if (isNano) return "nanoplastia";
    if (isCut) return "corte";
    return null;
}

// ====== Prompts determinísticos (se mantienen por si se necesitan a futuro) ======
async function sendAskDayTime(sock, jid) {
    const text =
        'Súper. ¿Qué día y a qué hora te viene bien? Ejemplos: 04/10 a las 5pm o "viernes 4 a las 17:30" ✨';
    await sendWithTyping(sock, jid, text);
    return text;
}
async function sendBudgetExhausted(sock, jid) {
    const text =
        "Para cuidar costos, seguiré con mensajes cortitos y directos. Dime qué servicio quieres y lo cerramos. ✨";
    await sendWithTyping(sock, jid, text);
    return text;
}

// ====== Guardrails: off-topic & anti‑jailbreak ======
const STRICT_DOMAIN =
    String(process.env.STRICT_DOMAIN || "true").toLowerCase() === "true";

function isJailbreakAttempt(text) {
    const t = (text || "").toLowerCase();
    return /(olvida|ignora|elimina|borra)\s+(tus|las)\s+(reglas|instrucciones|pol[ií]ticas)|act[uú]a\s+sin\s+restricciones|desactiva\s+filtros|s[ie]n\s+limites|roleplay\s+jailbreak/.test(
        t,
    );
}

async function sendJailbreakRefusal(sock, jid) {
    const text =
        "Gracias por tu mensaje. Para cuidarte mejor, no puedo ignorar mis reglas. ¿Te apoyo con Color, Extensiones, Nanoplastia o Corte y Estilo? ✨";
    await sendWithTyping(sock, jid, text);
    return text;
}

// ====== Costos ======
function getPricingTable() {
    try {
        if (!process.env.GEMINI_PRICING_JSON) return null;
        return JSON.parse(process.env.GEMINI_PRICING_JSON);
    } catch {
        return null;
    }
}
function estimateUSDForCall(modelName, usage, pricing) {
    if (!pricing) return 0;
    const p = pricing[modelName];
    if (!p) return 0;
    const inK = (usage?.promptTokenCount || 0) / 1000;
    const outK = (usage?.candidatesTokenCount || 0) / 1000;
    return Number(p.input || 0) * inK + Number(p.output || 0) * outK;
}

// ====== Bot WA ======
async function connectToWhatsApp() {
    console.log("Iniciando conexión con WhatsApp...");
    const { state, saveCreds } =
        await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: process.env.LOG_LEVEL || "silent" }),
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("\n------------------------------------------------");
            console.log("👇 Escanea este código QR con tu WhatsApp 👇");
            qrcode.generate(qr, { small: true });
            console.log("------------------------------------------------\n");
        }
        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(
                "🔌 Conexión cerrada. Reintentando:",
                shouldReconnect,
                "code:",
                statusCode,
            );
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === "open") {
            console.log("✅ ¡Conexión con WhatsApp establecida!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (event) => {
        const msg = event.messages?.[0];
        if (!msg || msg.key.fromMe) return;
        if ((msg.key.remoteJid || "").endsWith("@g.us")) return;

        const senderJid = msg.key.remoteJid;
        const text = getMessageText(msg);
        const images = await extractImagesFromMessage(msg);
        if (!text && images.length === 0) return;

        const history = conversationHistory.get(senderJid) ?? [];
        history.push({
            role: "user",
            content:
                text ||
                (images.length ? "Te envío una foto para referencia ✨" : ""),
            media: images,
        });

        const session = sessionState.get(senderJid) ?? initialState();

        // --> MODIFICACIÓN: Guarda de 'isOnTopic' eliminada para dar control a la IA.
        if (STRICT_DOMAIN) {
            if (isJailbreakAttempt(text)) {
                const t = await sendJailbreakRefusal(sock, senderJid);
                history.push({ role: "assistant", content: t });
                conversationHistory.set(senderJid, history);
                sessionState.set(senderJid, session);
                return;
            }
        }

        console.log(
            `💬 ${senderJid}: "${text || "(sin texto)"}"${images.length ? ` + ${images.length} img` : ""}`,
        );

        // --> MODIFICACIÓN: Lógica simplificada para ceder el control a la IA.
        // La IA ahora es el cerebro principal, ya no necesitamos una máquina de estados compleja aquí.
        // El 'agent.js' es lo suficientemente inteligente para guiar la conversación.

        // Si el presupuesto está agotado, no llamar a la IA
        if (session.budget.mode === "exhausted") {
            if (session.lastPrompted !== "budget_exhausted_notice") {
                const t = await sendBudgetExhausted(sock, senderJid);
                history.push({ role: "assistant", content: t });
                session.lastPrompted = "budget_exhausted_notice";
            }
            sessionState.set(senderJid, session);
            conversationHistory.set(senderJid, history);
            return;
        }

        // Llamar siempre al agente de IA para que maneje la lógica
        try {
            const lowCost = session.budget.mode === "low";
            const responseObj = await agent(history, { lowCost });
            const response =
                typeof responseObj === "string"
                    ? responseObj
                    : responseObj.text;
            const usage = responseObj?.usage;
            const modelName = responseObj?.modelName;

            // Actualiza presupuesto
            const pricing = getPricingTable();
            const cost = estimateUSDForCall(modelName, usage, pricing);
            session.budget.calls += 1;
            session.budget.spentTokens +=
                usage?.totalTokenCount ||
                (usage?.promptTokenCount || 0) +
                    (usage?.candidatesTokenCount || 0);
            session.budget.spentUSD += cost;
            session.budget.lastModel = modelName;

            if (
                session.budget.spentUSD >= session.budget.limitUSD * 0.7 &&
                session.budget.mode === "normal"
            ) {
                session.budget.mode = "low";
            }
            if (session.budget.spentUSD >= session.budget.limitUSD) {
                session.budget.mode = "exhausted";
            }

            await sendWithTyping(sock, senderJid, response);
            history.push({ role: "assistant", content: response });

            console.log(`🤖 Respuesta enviada a ${senderJid}: "${response}"`);
            if (modelName || usage) {
                console.log(
                    `🧮 Modelo: ${modelName || "n/d"} | Tokens: ${usage?.totalTokenCount || 0} | USD call: ${cost.toFixed(4)}`,
                );
                console.log(
                    `💰 Conversación → USD acumulado: ${session.budget.spentUSD.toFixed(4)} / Límite: ${session.budget.limitUSD}`,
                );
            }
        } catch (error) {
            console.error("Error al procesar con el agente de IA:", error);
            await sendWithTyping(
                sock,
                senderJid,
                "¡Uups! Mi cerebro digital tuvo un corto circuito. Inténtalo de nuevo en un momento, porfa.",
            );
        }

        // Guardar estado y historial al final
        sessionState.set(senderJid, session);
        conversationHistory.set(senderJid, history);
    });

    const shutdown = async () => {
        console.log("🛑 Cerrando bot...");
        try {
            await sock.ws.close();
        } catch (_) {}
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

connectToWhatsApp().catch((err) =>
    console.log("❌ Error inesperado al iniciar:", err),
);
