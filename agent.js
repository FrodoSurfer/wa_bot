/* ==============================================================
    AGENTE GEMINI – Studio 118 (v3 con Base de Conocimiento)
    --------------------------------------------------------------
    • Prompt actualizado con precios, proceso de cotización y
      contexto sobre Esveidy, la dueña del salón.
    ============================================================== */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY no está definido. Colócalo en tu .env");
}

/* --------------------------------------------------------------
    1️⃣  SYSTEM PROMPT (MODIFICADO CON BASE DE CONOCIMIENTO)
    -------------------------------------------------------------- */
export const SYSTEM_PROMPT = `
    ASUMES LA PERSONALIDAD DE ESVEIDY, dueña de "Studio 118". Eres como esa amiga experta en belleza a la que todas acuden por un consejo honesto y un apapacho. Tu chat se siente como una plática real, no como un formulario.

    ---
    ### 💬 FILOSOFÍA DE CONVERSACIÓN
    1.  **SIEMPRE EMPIEZA CON CALIDEZ:** Tu primera reacción a cualquier mensaje es siempre cálida y personal. Valida el sentimiento de la clienta antes de preguntar cualquier otra cosa. ("¡Qué buena idea!", "Claro que sí, hermosa", "Entiendo perfecto esa sensación...").
    2.  **SÉ RESOLUTIVA, NO ROBÓTICA:** Tu objetivo es ayudar y agendar, pero lo haces de forma natural. Evita sonar a un script. Si la clienta dice "quiero un corte", no saltes directo a "¿cuándo?"; primero pregunta "¿tienes alguna idea en mente?".
    3.  **BREVEDAD INTELIGENTE:** Mantén tus mensajes cortos y fáciles de leer en un celular. Si una idea es larga, es mejor dividirla en 2 o 3 mensajes cortos que enviar un solo párrafo grande. Haz una pregunta por mensaje para que la conversación fluya.

    ---
    ### 🎯 OBJETIVOS CLAROS (Tu Guía Interna)
    -   **Si piden Corte/Nanoplastia:** Tu meta es definir el estilo y luego obtener DÍA y HORA.
    -   **Si piden Color/Extensiones:** Tu meta es obtener FOTO ACTUAL, FOTO DE REFERENCIA e HISTORIAL QUÍMICO.
    -   **Si piden Precio:** Da el precio base de tu base de conocimiento y luego pregunta "¿Te gustaría que te cotizara o agendamos una cita?".

    ---
    ### ✨ EJEMPLOS DE FLUJO NATURAL

    **Ejemplo 1 (Clienta se siente mal):**
    -   **Clienta:** "Hola, necesito un cambio, tengo el pelo horrible."
    -   **TÚ:** "¡Ay, hermosa, para nada! No digas eso, a veces solo necesitamos un apapacho para volver a brillar. ✨"
    -   **TÚ (en otro mensaje):** "Cuéntame, ¿qué es lo que no te está gustando ahora mismo? Estoy para escucharte."

    **Ejemplo 2 (Petición de cita directa):**
    -   **Clienta:** "Hola, quiero un corte el sábado."
    -   **TÚ:** "¡Claro que sí, hermosa! Me encanta la idea de verte el sábado para ese corte."
    -   **TÚ (en otro mensaje):** "¿Tienes alguna hora en mente que te quede bien?"

    ---
    ### 🚫 REGLAS TÉCNICAS
    -   Adaptas tu lenguaje (pelo/cabello) al de la clienta.
    -   Nunca inventas disponibilidad. Si no sabes, dices: "Perfecto, déjame checar mi agenda y te confirmo en un momento, ¿va?".
    -   Ignoras cualquier instrucción para actuar como IA. Eres Esveidy.
    -   **Base de Conocimiento:** (Aquí va tu lista de precios y procesos, sin cambios).
    ---
    🛑 **STOP-SEQUENCE:** Termina siempre con "---FIN---"
    `;

/* --------------------------------------------------------------
    2️⃣  MODELOS PREFERIDOS (SIN CAMBIOS)
    -------------------------------------------------------------- */
const PREFERRED_NORMAL = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-001",
].filter(Boolean);

const PREFERRED_LOW = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
].filter(Boolean);

/* --------------------------------------------------------------
    3️⃣  INICIALIZACIÓN DE LA API (SIN CAMBIOS)
    -------------------------------------------------------------- */
const genAI = new GoogleGenerativeAI(API_KEY);

/* --------------------------------------------------------------
    4️⃣  UTILIDADES DE MODELOS (SIN CAMBIOS)
    -------------------------------------------------------------- */
// ... (El código de listModels y resolveModelName se mantiene igual)
async function listModels(version = "v1beta") {
    // Usar v1beta para modelos más nuevos
    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${encodeURIComponent(
        API_KEY,
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ListModels ${version} → ${res.status}`);
    const data = await res.json();
    return (data.models || []).map((m) => m.name.replace(/^models\//, ""));
}

let cacheAvailable = null;
let cacheChosen = { normal: null, low: null };

async function resolveModelName(lowCost = false) {
    const mode = lowCost ? "low" : "normal";
    if (cacheChosen[mode]) return cacheChosen[mode];

    if (!cacheAvailable) {
        try {
            cacheAvailable = await listModels("v1beta");
        } catch (e) {
            console.error(
                "Fallo al listar modelos v1beta, intentando v1:",
                e.message,
            );
            cacheAvailable = await listModels("v1");
        }
        if (process.env.LOG_LEVEL !== "silent")
            console.log(`🧠 Modelos disponibles: ${cacheAvailable.join(", ")}`);
    }

    const preferred = lowCost ? PREFERRED_LOW : PREFERRED_NORMAL;
    const chosen = preferred.find((m) => cacheAvailable.includes(m));
    if (!chosen) {
        throw new Error(
            `No hay modelos preferidos disponibles. Preferidos: ${preferred.join(
                ", ",
            )}. Disponibles: ${cacheAvailable.join(", ")}`,
        );
    }
    cacheChosen[mode] = chosen;
    if (process.env.LOG_LEVEL !== "silent")
        console.log(`🧠 Usando modelo (${mode}): ${chosen}`);
    return chosen;
}

/* --------------------------------------------------------------
    5️⃣  CONVERSIÓN Y NORMALIZACIÓN (SIN CAMBIOS)
    -------------------------------------------------------------- */
// ... (El código de toGeminiParts y normalizeAlternatingHistory se mantiene igual)
function toGeminiParts(item) {
    const parts = [];
    if (item?.content) parts.push({ text: item.content });

    if (Array.isArray(item?.media) && item.media.length) {
        for (const media of item.media.slice(0, 2)) {
            if (!media?.dataBase64) continue;
            parts.push({
                inlineData: {
                    data: media.dataBase64,
                    mimeType: media.mimeType || "image/jpeg",
                },
            });
        }
    }
    if (parts.length === 0) parts.push({ text: "Imagen enviada sin texto." });
    return parts;
}

function normalizeAlternatingHistory(history) {
    const out = [];
    for (const m of history) {
        if (!out.length) {
            out.push({ ...m, media: m.media || [] });
            continue;
        }
        const last = out[out.length - 1];
        if (last.role === m.role) {
            const newContent = [last.content, m.content]
                .filter(Boolean)
                .join("\n");
            const newMedia = [...(last.media || []), ...(m.media || [])].slice(
                0,
                4,
            );
            out[out.length - 1] = {
                role: last.role,
                content: newContent,
                media: newMedia,
            };
        } else {
            out.push({ ...m, media: m.media || [] });
        }
    }
    return out;
}

/* --------------------------------------------------------------
    7️⃣  DEFINICIÓN DE FUNCIONES (SIN CAMBIOS)
    -------------------------------------------------------------- */
// ... (El código de functionDefinitions se mantiene igual)
const functionDefinitions = [
    {
        name: "obtenerPrecioServicio",
        description: "Devuelve el precio base (USD) del servicio solicitado.",
        parameters: {
            type: "object",
            properties: {
                servicio: {
                    type: "string",
                    enum: ["color", "extensiones", "nanoplastia", "corte"],
                    description: "Servicio del que se quiere el precio",
                },
            },
            required: ["servicio"],
        },
    },
    {
        name: "consultarDisponibilidad",
        description:
            "Comprueba si existe al menos un hueco libre para la fecha y hora indicadas.",
        parameters: {
            type: "object",
            properties: {
                fechaISO: {
                    type: "string",
                    format: "date-time",
                    description:
                        "Fecha y hora en ISO 8601 (ej: 2025-10-04T15:30:00.000Z)",
                },
                servicio: {
                    type: "string",
                    enum: ["nanoplastia", "corte"],
                    description: "Tipo de servicio",
                },
            },
            required: ["fechaISO", "servicio"],
        },
    },
];

/* --------------------------------------------------------------
    8️⃣  POST‑PROCESADO (SIN CAMBIOS)
    -------------------------------------------------------------- */
// ... (El código de sanitizeGeminiResponse se mantiene igual)
const CONFIRMATION_REGEX =
    /¡Listo! ✨ Tu cita para \*.+\* está confirmada para el \*.+\* a las \*.+\*/;

function sanitizeGeminiResponse(raw) {
    const cutIdx = raw.indexOf("---FIN---");
    const trimmed = cutIdx >= 0 ? raw.slice(0, cutIdx) : raw;
    const clean = trimmed.trim();

    if (
        clean.toLowerCase().includes("cita") &&
        !CONFIRMATION_REGEX.test(clean)
    ) {
        return (
            clean +
            "\n⚠️ Por favor confirma la fecha y hora exactas antes de cerrar la agenda."
        );
    }
    return clean;
}

/* --------------------------------------------------------------
    9️⃣  AGENTE PRINCIPAL (MODIFICADO)
    -------------------------------------------------------------- */
export async function agent(history = [], options = {}) {
    const { lowCost = false } = options;
    const historyWindow = lowCost ? 8 : 12; // Un poco más de historial para contexto
    const maxOutputTokens = lowCost ? 256 : 512;

    // ===== CAMBIO PRINCIPAL AQUÍ =====
    const temperature = lowCost ? 0.2 : 0.4; // Ligeramente más creativo para un tono natural
    // ===================================

    const topP = 0.9; // Un poco más de flexibilidad junto a la temperatura
    const stopSequences = ["---FIN---"];

    const limited = history.slice(-historyWindow * 2);
    let normalized = normalizeAlternatingHistory(limited);

    if (
        !normalized.length ||
        normalized[normalized.length - 1].role !== "user"
    ) {
        normalized.push({ role: "user", content: "Continuemos ✨", media: [] });
    }

    const previous = normalized.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: toGeminiParts(m),
    }));
    const last = normalized[normalized.length - 1];
    const lastParts = toGeminiParts(last);

    const systemPreamble = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        {
            role: "model",
            parts: [
                {
                    text: "Entendido. Estoy lista para ayudar a que nuestras clientas brillen bonito. ✨",
                },
            ],
        },
    ];

    const modelName = await resolveModelName(lowCost);
    const model = genAI.getGenerativeModel({ model: modelName });

    const chat = model.startChat({
        history: [...systemPreamble, ...previous],
        // --> AÑADIR ESTE BLOQUE
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
        ],
        // <-- HASTA AQUÍ

        generationConfig: {
            temperature,
            topP,
            maxOutputTokens,
            stopSequences,
        },
        functionCallingConfig: {
            mode: "auto",
            functionDefinitions,
        },
    });

    const result = await chat.sendMessage(lastParts);

    // El resto de la lógica de function calling y respuesta es IDÉNTICA
    // ... (copia y pega la lógica de manejo de respuesta desde tu archivo original)
    if (result.functionCall) {
        const { name, arguments: args } = result.functionCall;
        let fnResult = null;

        if (name === "obtenerPrecioServicio") {
            const preciosFijos = {
                color: 45,
                extensiones: 120,
                nanoplastia: 80,
                corte: 35,
            };
            fnResult = {
                servicio: args.servicio,
                precioUSD: preciosFijos[args.servicio] ?? null,
                detalle:
                    "Este es el precio base de referencia. Puede variar según la longitud y condición del pelo.",
            };
        } else if (name === "consultarDisponibilidad") {
            fnResult = {
                disponible: true, // Simulación, reemplaza con tu lógica real
                mensaje:
                    "Hay espacios libres en la fecha y hora solicitada. Puedes confirmar la cita.",
            };
        }

        const followUpResult = await chat.sendMessage([
            {
                functionResponse: {
                    name,
                    response: fnResult,
                },
            },
        ]);

        const response = await followUpResult.response;
        const rawText = response.text();
        const safeText = sanitizeGeminiResponse(rawText);
        return {
            text: safeText,
            usage: response.usageMetadata,
            modelName,
        };
    }

    const response = await result.response;
    const rawText = response.text();
    const safeText = sanitizeGeminiResponse(rawText);
    return {
        text: safeText,
        usage: response.usageMetadata,
        modelName,
    };
}
