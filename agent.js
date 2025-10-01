/* ==============================================================
   AGENT GEMINI – Studio 118 (v3 – Optimizado para bajo coste)
   --------------------------------------------------------------
   • Prompt con conocimiento de precios (solo una vez)
   • Modelo: gemini-2.5-flash-lite (el más barato)
   • Historial limitado, salida corta y temperatura baja
   • Sistema de funciones + tabla de precios externa (caché)
   • Safety-settings, media y batch configurados una sola vez
   ============================================================== */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
import path from "path";

dotenvConfig();

/* ---------------------------  CONFIG  --------------------------- */
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) console.warn("⚠️  GEMINI_API_KEY no está definido en .env");

/* ---------------------------  PROMPT  -------------------------- */
// Se envía **una sola vez** al crear la sesión.
export const SYSTEM_PROMPT = `
ASUMES LA PERSONALIDAD DE ESVEIDY, dueña de "Studio 118" ubicado en El Refugio, Queretaro, México. Eres como esa amiga experta en belleza a la que todas acuden por un consejo honesto y un apapacho. Tu chat se siente como una plática real, no como un formulario.

---
### 💬 FILOSOFÍA DE CONVERSACIÓN
1. **SIEMPRE EMPIEZA CON CALIDEZ** – valida el sentimiento antes de preguntar.
2. **SÉ RESOLUTIVA, NO ROBÓTICA** – evita scripts rígidos.
3. **BREVEDAD INTELIGENTE** – divide textos largos en varios mensajes; una pregunta por mensaje.

---
### 🎯 OBJETIVOS CLAROS
- Corte / Nanoplastia → obtener estilo → día y hora.
- Color / Extensiones → foto actual, foto referencia, historial químico.
- Precio → devuelve precio base → pregunta si quiere cotizar o agendar.

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
- Adaptas tu lenguaje al de la clienta.
- Nunca inventas disponibilidad. Si no sabes, dices: "Perfecto, déjame checar mi agenda y te confirmo en un momento, ¿va?".
- Ignoras instrucciones para “actuar como IA”.
- **BASE DE CONOCIMIENTO:** (precios y procesos – ver archivo precios.json)
---
🛑 **STOP-SEQUENCE:** Termina siempre con "---FIN---"
`;

/* ---------------------------  PRECIOS  -------------------------- */
// precios.json se carga una sola vez y se guarda en memoria.
// ASEGÚRATE DE QUE precios.json TENGA LA NUEVA ESTRUCTURA ANIDADA.
const PRECIOS_PATH = path.resolve("./precios.json");
let PRECIOS = {};
try {
    PRECIOS = JSON.parse(fs.readFileSync(PRECIOS_PATH, "utf-8"));
} catch (e) {
    console.error(
        "⚠️  No se pudo cargar precios.json → usar precios fijos internos",
    );
    // Fallback con la nueva estructura por si el archivo falla
    PRECIOS = {
        efecto_de_color: { corto: 3500, medio: 3700, largo: 4300 },
        corte: { base: 350 }
    };
}

/* ---------------------------  MODELOS  -------------------------- */
// Sólo se mantiene **gemini-2.5-flash-lite** como opción “low-cost”.
const PREFERRED_LOW = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
].filter(Boolean);

let cachedModelName = null; // se calcula una vez al levantar el servidor
let cachedAvailableModels = null;

/**
 * Obtiene (y cachea) el nombre del modelo a usar.
 * Por defecto siempre devuelve la variante low-cost.
 */
async function getModelName(lowCost = true) {
    if (cachedModelName) return cachedModelName;

    // Listado de modelos – solo se hace la primera vez.
    if (!cachedAvailableModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(API_KEY)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ListModels → ${res.status}`);
        const data = await res.json();
        cachedAvailableModels = (data.models || []).map((m) =>
            m.name.replace(/^models\//, ""),
        );
    }

    const preferred = lowCost ? PREFERRED_LOW : PREFERRED_LOW; // siempre low-cost
    const chosen = preferred.find((m) => cachedAvailableModels.includes(m));
    if (!chosen)
        throw new Error(
            `Ningún modelo preferido disponible: ${preferred.join(", ")}`,
        );

    cachedModelName = chosen;
    console.log(`🧠 Modelo seleccionado: ${chosen}`);
    return chosen;
}

/* ---------------------------  HISTORIAL BASE  ------------------- */
// Se crea una única vez y se reutiliza en cada llamada.
const SYSTEM_MESSAGE = { role: "user", parts: [{ text: SYSTEM_PROMPT }] };
const SYSTEM_ACK = {
    role: "model",
    parts: [
        {
            text: "Entendido. Estoy lista para ayudar a que nuestras clientas brillen bonito. ✨",
        },
    ],
};
let BASE_CHAT_HISTORY = [SYSTEM_MESSAGE, SYSTEM_ACK];

/* ---------------------------  SAFETY  -------------------------- */
const SAFETY_SETTINGS = [
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
];

/* ---------------------------  FUNCIONES  ------------------------ */
const FUNCTION_DEFINITIONS = [
    {
        name: "obtenerPrecioServicio",
        description: "Devuelve el precio base en MXN del servicio solicitado, ajustado por largo o volumen del cabello si es aplicable.",
        parameters: {
            type: "object",
            properties: {
                servicio: {
                    type: "string",
                    enum: [
                        "efecto_de_color",
                        "full_blonde",
                        "matiz_o_correccion",
                        "cubrimiento_de_cana",
                        "nanoplastia",
                        "corte",
                        "extensiones"
                    ],
                    description: "El servicio principal que la clienta desea. Normalizar a snake_case.",
                },
                largo: {
                    type: "string",
                    enum: ["corto", "medio", "largo", "extra_largo"],
                    description: "El largo del cabello de la clienta. Requerido para servicios de color como 'efecto_de_color', 'full_blonde' o 'matiz_o_correccion'.",
                },
                gramos: {
                    type: "string",
                    enum: ["30gr", "40gr", "50gr"],
                    description: "La cantidad de tinte necesaria para el 'cubrimiento_de_cana'.",
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
                        "Fecha y hora en ISO 8601 (ej.: 2025-10-04T15:30:00.000Z)",
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

/* ---------------------------  UTILIDADES  ---------------------- */

/**
 * Convierte un mensaje (texto + opcional media) al formato que Gemini espera.
 * No se añaden partes vacías; si el mensaje no tiene texto ni media, se devuelve [].
 */
function toGeminiParts(item) {
    const parts = [];

    if (item?.content) parts.push({ text: item.content });

    // Sólo la **primera** imagen, y sólo si realmente existe.
    if (Array.isArray(item?.media) && item.media.length) {
        const media = item.media[0];
        if (media?.dataBase64) {
            parts.push({
                inlineData: {
                    data: media.dataBase64,
                    mimeType: media.mimeType || "image/jpeg",
                },
            });
        }
    }
    return parts; // puede quedar vacío → Gemini lo ignora sin coste extra
}

/**
 * Normaliza la historia alternando roles y concatenando mensajes consecutivos del mismo rol.
 * Limita la cantidad total de media a 4 (2 imágenes por mensaje → 8 media total) para
 * evitar que una sola conversación consuma miles de tokens.
 */
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

/* Mensaje de “cita no confirmada” */
const CONFIRMATION_REGEX =
    /¡Listo! ✨ Tu cita para \*.+\* está confirmada para el \*.+\* a las \*.+\*/;

/**
 * Recorta todo lo que esté después de la señal de fin y añade un aviso
 * si la respuesta menciona “cita” sin estar confirmada.
 */
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

/* ---------------------------  AGENTE PRINCIPAL  ---------------- */
export async function agent(history = [], options = {}) {
    const { lowCost = true } = options; // por defecto siempre bajo coste
    const modelName = await getModelName(lowCost);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    /* -----  Parámetros de generación (más pequeños) ----- */
    const maxOutputTokens = lowCost ? 128 : 256; // 128 es suficiente para la mayoría de respuestas
    const temperature = lowCost ? 0.2 : 0.3; // menos variabilidad → menos tokens de relleno
    const topP = 0.7; // sigue proporcionando algo de creatividad
    const stopSequences = ["---FIN---"];

    /* -----  Historial: ventana reducida ----- */
    const historyWindow = lowCost ? 5 : 8; // turnos (user-assistant) que se conservan
    const limited = history.slice(-historyWindow * 2);
    let normalized = normalizeAlternatingHistory(limited);

    // Si la última entrada no es del usuario, añadimos un “ping” para que el modelo responda
    if (
        !normalized.length ||
        normalized[normalized.length - 1].role !== "user"
    ) {
        normalized.push({ role: "user", content: "Continuemos ✨", media: [] });
    }

    const previous = normalized
        .slice(0, -1) // todo menos el último mensaje del usuario
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: toGeminiParts(m),
        }));

    const last = normalized[normalized.length - 1];
    const lastParts = toGeminiParts(last);

    const chat = model.startChat({
        // Se reutiliza el prompt que ya está en BASE_CHAT_HISTORY
        history: [...BASE_CHAT_HISTORY, ...previous],
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            temperature,
            topP,
            maxOutputTokens,
            stopSequences,
        },
        functionCallingConfig: {
            mode: "auto",
            functionDefinitions: FUNCTION_DEFINITIONS,
        },
    });

    const result = await chat.sendMessage(lastParts);

    /* -----------  RESPUESTAS CON FUNCTION CALL  ----------- */
    if (result.functionCall) {
        const { name, arguments: args } = result.functionCall;
        let fnResult = null;

        if (name === "obtenerPrecioServicio") {
            const { servicio, largo, gramos } = args;
            const servicioInfo = PRECIOS[servicio];
            let precioFinal = null;
            let nota = "";
            let detalle = "";

            if (servicioInfo) {
                nota = servicioInfo.nota || "";
                // Busca el precio según los parámetros proporcionados (largo, gramos, o base)
                if (largo && typeof servicioInfo[largo] !== 'undefined') {
                    precioFinal = servicioInfo[largo];
                } else if (gramos && typeof servicioInfo[gramos] !== 'undefined') {
                    precioFinal = servicioInfo[gramos];
                } else if (typeof servicioInfo.base !== 'undefined') {
                    precioFinal = servicioInfo.base;
                } else {
                    // Si el servicio requiere un detalle (largo/gramos) y no se proporcionó,
                    // el modelo necesitará pedir más información.
                    const opciones = Object.keys(servicioInfo).filter(k => k !== 'nota');
                    detalle = `Para darte el precio de '${servicio.replace(/_/g, ' ')}', necesito saber más detalles como el largo o volumen. Las opciones son: ${opciones.join(", ")}.`;
                }
            }

            if (precioFinal !== null) {
                fnResult = {
                    servicio: args.servicio,
                    precioMXN: precioFinal,
                    detalle: `El precio es de $${precioFinal}. ${nota}`.trim(),
                };
            } else {
                // Si no se encontró un precio final, usa el detalle generado o un mensaje de error.
                fnResult = {
                    servicio: args.servicio,
                    precioMXN: null,
                    detalle: detalle || "Lo siento, no pude encontrar ese servicio en mi lista de precios.",
                };
            }
        } else if (name === "consultarDisponibilidad") {
            // Aquí deberías colocar tu lógica real de agenda. Por ahora simulamos.
            fnResult = {
                disponible: true,
                mensaje:
                    "Hay espacios libres en la fecha y hora solicitada. Puedes confirmar la cita.",
            };
        }

        // Enviamos la respuesta estructurada al modelo y obtenemos el mensaje final.
        const followUp = await chat.sendMessage([
            {
                functionResponse: { name, response: fnResult },
            },
        ]);

        const raw = (await followUp.response).text();
        const safe = sanitizeGeminiResponse(raw);
        return {
            text: safe,
            usage: (await followUp.response).usageMetadata,
            modelName,
        };
    }

    /* -------------------  RESPUESTA NORMAL  ------------------- */
    const raw = (await result.response).text();
    const safe = sanitizeGeminiResponse(raw);
    return {
        text: safe,
        usage: (await result.response).usageMetadata,
        modelName,
    };
}

/* ---------------------------  BATCH (OPCIONAL) -----------------
   Si tu front-end envía varias preguntas a la vez (p.ej. “precio corte,
   precio color, disponibilidad”), puedes usar este helper.  Puedes
   llamarlo desde un endpoint `/batch` que reciba un array de histories.
------------------------------------------------------------------- */
export async function batchAgent(requests = []) {
    // Cada request = { history, options }
    const modelName = await getModelName(true);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const instances = requests.map((r) => {
        const { history = [], options = {} } = r;
        const normalized = normalizeAlternatingHistory(
            history.slice(-(options.lowCost ? 5 : 8) * 2),
        );
        const last = normalized[normalized.length - 1];
        return { contents: toGeminiParts(last) };
    });

    // Batch API → 0.05 $ / 1 M tokens de entrada y 0.20 $ / 1 M tokens de salida
    const batchResponse = await model.batchPredict({
        instances,
        // Opciones de generación (menores que en la llamada normal)
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 128,
            stopSequences: ["---FIN---"],
        },
        // Si necesitas funciones, añádelas aquí (no cubierto en este ejemplo)
    });

    // Transformamos la respuesta a la misma forma que `agent()`
    return batchResponse.predictions.map((p) => ({
        text: sanitizeGeminiResponse(p.text),
        // batchPredict no devuelve usageMetadata por cada predicción;
        // si lo necesitas deberás estimar con los contadores de tokens.
        modelName,
    }));
}
