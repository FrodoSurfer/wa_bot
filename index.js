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
  const TYPING_WPM = Number(process.env.TYPING_WPM || 180);
  const BASE_MS = Number(process.env.TYPING_BASE_MS || 700);
  const MIN_MS = Number(process.env.TYPING_MIN_MS || 1200);
  const MAX_MS = Number(process.env.TYPING_MAX_MS || 6000);
  const JITTER = Number(process.env.TYPING_JITTER || 0.25);
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
    if (content?.ephemeralMessage) content = content.ephemeralMessage.message;
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
  const isBalayage = /\b(balayage|balaye?ge|balaye?je|balage)\b/i.test(t);
  const isColor =
    isBalayage ||
    /(babylights|iluminaci[oó]n|mechas|efectos?\s+de\s+color|efecto\s+color|tinte|color(aci[oó]n)?)/i.test(
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
function captionSuggestsCurrent(text) {
  const t = (text || "").toLowerCase();
  return /(actual|ahora|mi\s*cabello\s*actual|mi\s*pelo\s*hoy|as[ií]\s*estoy|estado\s*actual)/i.test(
    t,
  );
}
function captionSuggestsReference(text) {
  const t = (text || "").toLowerCase();
  return /(referencia|as[ií]\s*quiero|como\s*quiero|inspiraci[oó]n|ejemplo|referente)/i.test(
    t,
  );
}
function updateStateWithImage(state, images, caption) {
  if (!images?.length) return state;
  for (const media of images) {
    if (!state.photos.current && captionSuggestsCurrent(caption))
      state.photos.current = media;
    else if (!state.photos.reference && captionSuggestsReference(caption))
      state.photos.reference = media;
    else {
      if (!state.photos.current) state.photos.current = media;
      else if (!state.photos.reference) state.photos.reference = media;
    }
  }
  return state;
}
function hasAllPhotos(state) {
  return Boolean(state.photos.current && state.photos.reference);
}
function requiresPhotos(state) {
  return state.service === "color" || state.service === "extensiones";
}

// ====== Parser fecha/hora (ahora incluye “1 de octubre”) ======
const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "miercoles",
  "jueves",
  "viernes",
  "sábado",
  "sabado",
];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function zeroPad(n) {
  return n.toString().padStart(2, "0");
}
function nextWeekday(targetDow, now) {
  const d = new Date(now.getTime());
  const currentDow = d.getDay();
  let add = (targetDow - currentDow + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
function buildDateFuture(day, month, now) {
  const y = now.getFullYear();
  const candidate = new Date(y, month - 1, day, 9, 0, 0, 0);
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (candidate < todayMidnight)
    return new Date(y + 1, month - 1, day, 9, 0, 0, 0);
  return candidate;
}
function parseTime(text) {
  if (!text) return null;
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  let m = t.match(
    /(?:a\s+las\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|horas?)\b/,
  );
  if (m) {
    let hour = parseInt(m[1], 10);
    const minute = m[2] ? parseInt(m[2], 10) : 0;
    const suffix = m[3];
    if (/pm/i.test(suffix) && hour < 12) hour += 12;
    if (/am/i.test(suffix) && hour === 12) hour = 0;
    const dispHour12 = ((hour + 11) % 12) + 1;
    const dispMin = minute === 0 ? "" : `:${zeroPad(minute)}`;
    const timeText = /hrs?/i.test(suffix)
      ? `${zeroPad(hour)}:${zeroPad(minute)}`
      : `${dispHour12}${dispMin}${/pm/i.test(suffix) ? "pm" : "am"}`;
    return { hour24: hour, minute, timeText };
  }
  m = t.match(/(?:a\s+las\s+)?(\d{1,2}):(\d{2})\b/);
  if (m) {
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const timeText = `${zeroPad(hour)}:${zeroPad(minute)}`;
      return { hour24: hour, minute, timeText };
    }
  }
  return null;
}
function parseDate(text, now) {
  if (!text) return null;
  const raw = text;
  const t = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // DD/MM(/YYYY)
  let m = t.match(/(?:^|\b)([0-3]?\d)\/([0-1]?\d)(?:\/(\d{2,4}))?(?:\b|$)/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    let yyyy = m[3] ? parseInt(m[3], 10) : now.getFullYear();
    if (yyyy < 100) yyyy += 2000;
    let date = new Date(yyyy, mm - 1, dd, 9, 0, 0, 0);
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    if (date < todayMidnight) date = new Date(yyyy + 1, mm - 1, dd, 9, 0, 0, 0);
    const dayText = `${zeroPad(dd)}/${zeroPad(mm)}`;
    return { date, dayText };
  }

  // “1 de octubre”, opcional día de semana delante
  m = t.match(
    /\b(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)?\s*([1-3]?\d)\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/,
  );
  if (m) {
    const dd = parseInt(m[1], 10);
    const monthName = m[2];
    let mm = MONTHS.indexOf(monthName) + 1;
    if (monthName === "setiembre") mm = MONTHS.indexOf("septiembre") + 1;
    const candidate = buildDateFuture(dd, mm, now);
    // construye un dayText bonito: “miércoles 1 de octubre”
    const weekday = WEEKDAYS[candidate.getDay()];
    const dayText = `${weekday.replace("miercoles", "miércoles").replace("sabado", "sábado")} ${dd} de ${MONTHS[mm - 1]}`;
    return { date: candidate, dayText };
  }

  // Weekday simple
  m = t.match(
    /\b(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/,
  );
  let weekday = null;
  if (m) {
    const wd = m[1];
    const idx = WEEKDAYS.indexOf(wd);
    weekday = wd === "miércoles" ? 3 : wd === "sábado" ? 6 : idx;
  }

  // Día de mes suelto
  let dm = t.match(/\b([1-9]|[12]\d|3[01])\b/);

  if (weekday !== null && dm) {
    const day = parseInt(dm[1], 10);
    const candidate = buildDateFuture(day, now.getMonth() + 1, now);
    const dayText = `${WEEKDAYS[weekday].replace("miercoles", "miércoles").replace("sabado", "sábado")} ${day}`;
    return { date: candidate, dayText };
  }

  if (weekday !== null) {
    const d = nextWeekday(weekday, now);
    const day = d.getDate();
    const dayText = `${WEEKDAYS[weekday].replace("miercoles", "miércoles").replace("sabado", "sábado")} ${day}`;
    return { date: d, dayText };
  }

  if (dm) {
    const day = parseInt(dm[1], 10);
    const candidate = buildDateFuture(day, now.getMonth() + 1, now);
    const dayText = `${zeroPad(candidate.getDate())}/${zeroPad(candidate.getMonth() + 1)}`;
    return { date: candidate, dayText };
  }

  return null;
}
function parseDateTimeFromText(text, now = new Date()) {
  const datePart = parseDate(text, now);
  const timePart = parseTime(text);
  let iso = null;
  if (datePart?.date && timePart) {
    const d = new Date(datePart.date);
    d.setHours(timePart.hour24, timePart.minute || 0, 0, 0);
    iso = d.toISOString();
  }
  return {
    dayText: datePart?.dayText || null,
    timeText: timePart?.timeText || null,
    iso,
  };
}

// ====== Disponibilidad por periodo (mañana/tarde/noche) ======
function parsePeriod(text) {
  const t = (text || "").toLowerCase();
  if (/(manana|mañana|temprano|am)/.test(t)) return "morning";
  if (/(tarde|pm|tardecita)/.test(t)) return "afternoon";
  if (/(noche|tarde-noche|nocturno)/.test(t)) return "evening";
  return null;
}
function getSlots(period = "afternoon") {
  const envKey =
    period === "morning"
      ? "SLOTS_MORNING"
      : period === "evening"
        ? "SLOTS_EVENING"
        : "SLOTS_AFTERNOON";
  const fallback =
    period === "morning"
      ? "10:00,11:30,12:00"
      : period === "evening"
        ? "18:00,19:00"
        : "15:00,16:00,17:30,18:30";
  const raw = process.env[envKey] || fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
async function sendOfferTimeSlots(sock, jid, dayText, period = "afternoon") {
  const slots = getSlots(period);
  const nicePeriod =
    period === "morning"
      ? "la mañana"
      : period === "evening"
        ? "la noche"
        : "la tarde";
  const text = dayText
    ? `¡Súper! Para el ${dayText}, en ${nicePeriod} tengo estos espacios:\n\n- ${slots.join("\n- ")}\n\n¿Te late alguno?`
    : `¡Súper! En ${nicePeriod} tengo estos espacios:\n\n- ${slots.join("\n- ")}\n\n¿Para qué día te acomoda? (Ej: 01/10)`;
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskPeriod(sock, jid) {
  const text =
    "¿Te viene mejor por la mañana, la tarde o la noche? (Ej.: “por la tarde”)";
  await sendWithTyping(sock, jid, text);
  return text;
}

// ====== Prompts determinísticos (con pausas) ======
async function sendAskService(sock, jid) {
  const text =
    "¡Hola! ✨ ¿En qué servicio te gustaría brillar hoy? Tenemos Efectos de Color, Extensiones, Nanoplastia, Corte y Estilo. 💖";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskPhotos(sock, jid) {
  const text =
    "Perfecto. Para darte una cotización precisa, mándame foto actual y de referencia. Además, cuéntame si has tenido procesos químicos recientes (tinte, decoloración, keratina, etc.) ✨";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskMissingCurrent(sock, jid) {
  const text = "Súper. Me faltaría la foto actual de tu cabello, porfa. 📸";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskMissingReference(sock, jid) {
  const text =
    "Gracias. Ahora mándame la foto de referencia (cómo te gustaría quedar). 📸";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskChemicalHistory(sock, jid) {
  const text =
    "Genial ✨ Para afinar la cotización, cuéntame si has tenido procesos químicos recientes (tinte, decoloración, keratina, alisados, etc.).";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendThanksReady(sock, jid) {
  const text =
    "¡Mil gracias! Con esta info, una estilista experta te contactará para darte la cotización y los siguientes pasos. 💖";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskDayTime(sock, jid) {
  const text =
    'Súper. ¿Qué día y a qué hora te viene bien? Ejemplos: 04/10 a las 5pm o "viernes 4 a las 17:30" ✨';
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskDay(sock, jid) {
  const text =
    'Perfecto. ¿Qué día te queda mejor? Ejemplos: 04/10 o "viernes 4".';
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendAskTime(sock, jid) {
  const text = "¿Y a qué hora te viene bien? Ejemplos: 5pm o 17:30.";
  await sendWithTyping(sock, jid, text);
  return text;
}
function displayServiceName(svc) {
  switch (svc) {
    case "nanoplastia":
      return "Nanoplastia";
    case "corte":
      return "Corte y Estilo";
    case "color":
      return "Efectos de Color";
    case "extensiones":
      return "Extensiones";
    default:
      return "Servicio";
  }
}
async function sendBookingConfirmation(sock, jid, service, dayText, timeText) {
  const text = `¡Listo! ✨ Tu cita para *${displayServiceName(service)}* está confirmada para el *${dayText}* a las *${timeText}*.\n\n¡Estamos listas para que brilles bonito en Studio 118!`;
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

function isSmallTalk(text) {
  const t = (text || "").toLowerCase();
  return /\b(hola|hey|buen[oa]s|gracias|ok|sale|va que va|perfecto|listo|sí|si|no|jaja|jeje)\b/.test(
    t,
  );
}
function isJailbreakAttempt(text) {
  const t = (text || "").toLowerCase();
  return /(olvida|ignora|elimina|borra)\s+(tus|las)\s+(reglas|instrucciones|pol[ií]ticas)|act[uú]a\s+sin\s+restricciones|desactiva\s+filtros|s[ie]n\s+limites|roleplay\s+jailbreak/.test(
    t,
  );
}
// On-topic si menciona servicios/logística/horarios o si ya estamos en agenda
function isOnTopic(text, hasImage = false, state) {
  if (isSmallTalk(text)) return true;
  if (hasImage) return true; // fotos suelen ser referencia del look
  if (state?.service) return true; // ya hay servicio → todo lo siguiente es contexto
  const t = (text || "").toLowerCase();
  const allow = new RegExp(
    [
      "balayage",
      "babylights",
      "tinte",
      "color",
      "mechas",
      "iluminaci[oó]n",
      "extensiones?",
      "nanoplastia",
      "corte",
      "peinado",
      "estilo",
      "styling",
      "agenda",
      "agendar",
      "cita",
      "disponibilidad",
      "disponible[s]?",
      "horario[s]?",
      "hora[s]?",
      "tarde",
      "mañana",
      "manana",
      "noche",
      "ubicaci[oó]n",
      "precio",
      "costo",
      "cotizaci[oó]n",
      "promoci[oó]n",
      "servicio",
      "tratamiento",
      "cabello",
      "pelo",
      "ra[ií]z",
      "decoloraci[oó]n",
      "keratina",
    ].join("|"),
    "i",
  );
  return allow.test(t);
}
async function sendOffTopic(sock, jid) {
  const text =
    "Soy tu asistente de Studio 118. Solo puedo ayudarte con servicios del salón " +
    "(Color, Extensiones, Nanoplastia, Corte y Estilo), agenda y dudas relacionadas. ✨\n" +
    "¿Te late si seguimos con alguno de estos servicios?";
  await sendWithTyping(sock, jid, text);
  return text;
}
async function sendJailbreakRefusal(sock, jid) {
  const text =
    "Gracias por tu mensaje. Para cuidarte mejor, no puedo ignorar mis reglas. " +
    "¿Te apoyo con Color, Extensiones, Nanoplastia o Corte y Estilo? ✨";
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
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

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

    // Historial: usuario primero
    const history = conversationHistory.get(senderJid) ?? [];
    history.push({
      role: "user",
      content:
        text || (images.length ? "Te envío una foto para referencia ✨" : ""),
      media: images,
    });
    conversationHistory.set(senderJid, history);

    // Estado
    const state = sessionState.get(senderJid) ?? initialState();

    // Guardrails primero (pero con on-topic relajado para agenda)
    if (STRICT_DOMAIN) {
      if (isJailbreakAttempt(text)) {
        const t = await sendJailbreakRefusal(sock, senderJid);
        history.push({ role: "assistant", content: t });
        conversationHistory.set(senderJid, history);
        sessionState.set(senderJid, state);
        return;
      }
      if (!isOnTopic(text, images.length > 0, state)) {
        const t = await sendOffTopic(sock, senderJid);
        history.push({ role: "assistant", content: t });
        conversationHistory.set(senderJid, history);
        sessionState.set(senderJid, state);
        return;
      }
    }

    // Log
    console.log(
      `💬 ${senderJid}: "${text || "(sin texto)"}"${images.length ? ` + ${images.length} img` : ""} | state: ${JSON.stringify(
        {
          service: state.service,
          hasCurrent: !!state.photos.current,
          hasReference: !!state.photos.reference,
          chemicalHistory: !!state.chemicalHistory,
          stage: state.stage,
          booking: state.booking,
          budget: state.budget,
        },
      )}`,
    );

    if (images.length) updateStateWithImage(state, images, text);

    // Detecta/actualiza servicio
    const detected = parseServiceFromText(text);
    if (detected && detected !== state.service) {
      state.service = detected;
      state.photos = { current: null, reference: null };
      state.chemicalHistory = null;
      state.booking = { dayText: null, timeText: null, iso: null };
      state.lastPrompted = null;
      state.stage = requiresPhotos(state)
        ? "collecting_photos"
        : detected === "nanoplastia" || detected === "corte"
          ? "awaiting_booking"
          : "init";
    }

    // Intenta actualizar fecha/hora desde el texto (soporta “1 de octubre”)
    if (text) {
      const parsed = parseDateTimeFromText(text, new Date());
      if (parsed.dayText && !state.booking.dayText)
        state.booking.dayText = parsed.dayText;
      if (parsed.timeText && !state.booking.timeText)
        state.booking.timeText = parsed.timeText;
      if (parsed.iso && !state.booking.iso) state.booking.iso = parsed.iso;
    }

    let intercepted = false;
    const wantsAdvice =
      /(recomiendas|recomendaci[oó]n|qu[eé]\s+me\s+hago|qu[eé]\s+me\s+queda|me\s+conviene|estoy\s+entre|no\s+estoy\s+segura|indecis[ao]|ay[uú]dame|ayuda|ideas|sugerenc)/i.test(
        text || "",
      );

    // ====== NUEVO: consulta de disponibilidad por periodo ======
    const period = parsePeriod(text);
    const asksAvailability =
      /\b(disponible|disponibilidad|que\s+hora[s]?\s+tienes|horas\s+disponibles|a\s+que\s+hora)\b/i.test(
        (text || "").toLowerCase(),
      );

    if (
      !intercepted &&
      (state.service === "nanoplastia" || state.service === "corte")
    ) {
      // Si pide periodo/horarios, ofrece slots determinísticamente
      if (period || asksAvailability) {
        if (!state.booking.dayText) {
          // no tenemos día → pedir día o ofrecer periodo + pedir día
          if (period) {
            const t = await sendOfferTimeSlots(sock, senderJid, null, period);
            history.push({ role: "assistant", content: t });
            conversationHistory.set(senderJid, history);
          } else {
            const t = await sendAskDay(sock, senderJid);
            history.push({ role: "assistant", content: t });
            conversationHistory.set(senderJid, history);
          }
          state.lastPrompted = "offer_time_slots_or_day";
          intercepted = true;
        } else {
          const t = await sendOfferTimeSlots(
            sock,
            senderJid,
            state.booking.dayText,
            period || "afternoon",
          );
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "offer_time_slots";
          intercepted = true;
        }
      }
    }

    // ====== Flujos determinísticos (color/extensiones) ======
    if (!intercepted && !wantsAdvice && requiresPhotos(state)) {
      if (!hasAllPhotos(state)) {
        if (!state.photos.current && !state.photos.reference) {
          if (state.lastPrompted !== "ask_photos") {
            const t = await sendAskPhotos(sock, senderJid);
            history.push({ role: "assistant", content: t });
            conversationHistory.set(senderJid, history);
            state.lastPrompted = "ask_photos";
            intercepted = true;
          }
        } else if (!state.photos.current) {
          if (state.lastPrompted !== "ask_missing_current") {
            const t = await sendAskMissingCurrent(sock, senderJid);
            history.push({ role: "assistant", content: t });
            conversationHistory.set(senderJid, history);
            state.lastPrompted = "ask_missing_current";
            intercepted = true;
          }
        } else if (!state.photos.reference) {
          if (state.lastPrompted !== "ask_missing_reference") {
            const t = await sendAskMissingReference(sock, senderJid);
            history.push({ role: "assistant", content: t });
            conversationHistory.set(senderJid, history);
            state.lastPrompted = "ask_missing_reference";
            intercepted = true;
          }
        }
      }
      if (!intercepted && hasAllPhotos(state) && !state.chemicalHistory) {
        if (text && text.length > 6 && state.lastPrompted === "ask_photos") {
          state.chemicalHistory = text;
        } else if (state.lastPrompted !== "ask_chemical_history") {
          const t = await sendAskChemicalHistory(sock, senderJid);
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "ask_chemical_history";
          intercepted = true;
        }
      }
      if (!intercepted && hasAllPhotos(state) && state.chemicalHistory) {
        if (state.stage !== "ready_for_quote") {
          state.stage = "ready_for_quote";
          const t = await sendThanksReady(sock, senderJid);
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "done_quote";
          intercepted = true;
        }
      }
    }

    // ====== Booking nanoplastia/corte con parser clásico ======
    if (
      !intercepted &&
      !wantsAdvice &&
      (state.service === "nanoplastia" || state.service === "corte")
    ) {
      if (state.stage !== "awaiting_booking" && state.stage !== "done")
        state.stage = "awaiting_booking";

      const missingDay = !state.booking.dayText;
      const missingTime = !state.booking.timeText;

      if (missingDay && missingTime) {
        if (state.lastPrompted !== "ask_day_time") {
          const t = await sendAskDayTime(sock, senderJid);
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "ask_day_time";
          intercepted = true;
        }
      } else if (missingDay) {
        if (state.lastPrompted !== "ask_day") {
          const t = await sendAskDay(sock, senderJid);
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "ask_day";
          intercepted = true;
        }
      } else if (missingTime) {
        // si acaba de ofrecer slots y el usuario eligió uno, parseTime lo llenará; si no, pedir hora
        if (
          state.lastPrompted !== "ask_time" &&
          state.lastPrompted !== "offer_time_slots"
        ) {
          const t = await sendAskTime(sock, senderJid);
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.lastPrompted = "ask_time";
          intercepted = true;
        }
      } else {
        if (state.lastPrompted !== "booking_confirmed") {
          const t = await sendBookingConfirmation(
            sock,
            senderJid,
            state.service,
            state.booking.dayText,
            state.booking.timeText,
          );
          history.push({ role: "assistant", content: t });
          conversationHistory.set(senderJid, history);
          state.stage = "done";
          state.lastPrompted = "booking_confirmed";
          intercepted = true;
        }
      }
    }

    // Si aún no hay servicio y no interceptamos (y no pidió consejo), pídelo
    if (!intercepted && !state.service && !wantsAdvice) {
      if (state.lastPrompted !== "ask_service") {
        const t = await sendAskService(sock, senderJid);
        history.push({ role: "assistant", content: t });
        conversationHistory.set(senderJid, history);
        state.lastPrompted = "ask_service";
        intercepted = true;
      }
    }

    sessionState.set(senderJid, state);
    if (intercepted) return;

    // Presupuesto: si agotado, no llamar IA
    if (state.budget.mode === "exhausted") {
      if (state.lastPrompted !== "budget_exhausted_notice") {
        const t = await sendBudgetExhausted(sock, senderJid);
        history.push({ role: "assistant", content: t });
        conversationHistory.set(senderJid, history);
        state.lastPrompted = "budget_exhausted_notice";
        sessionState.set(senderJid, state);
      }
      return;
    }

    // IA
    try {
      const lowCost = state.budget.mode === "low";
      const responseObj = await agent(history, { lowCost });
      const response =
        typeof responseObj === "string" ? responseObj : responseObj.text;
      const usage = responseObj?.usage;
      const modelName = responseObj?.modelName;

      // Actualiza presupuesto
      const pricing = getPricingTable();
      const cost = estimateUSDForCall(modelName, usage, pricing);
      state.budget.calls += 1;
      state.budget.spentTokens +=
        usage?.totalTokenCount ||
        (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0);
      state.budget.spentUSD += cost;
      state.budget.lastModel = modelName;
      if (
        state.budget.spentUSD >= state.budget.limitUSD * 0.7 &&
        state.budget.mode === "normal"
      )
        state.budget.mode = "low";
      if (state.budget.spentUSD >= state.budget.limitUSD)
        state.budget.mode = "exhausted";
      sessionState.set(senderJid, state);

      await sendWithTyping(sock, senderJid, response);
      history.push({ role: "assistant", content: response });
      conversationHistory.set(senderJid, history);
      console.log(`🤖 Respuesta enviada a ${senderJid}: "${response}"`);
      if (modelName || usage) {
        console.log(
          `🧮 Modelo: ${modelName || "n/d"} | Tokens (prompt/out/total): ${usage?.promptTokenCount || 0}/${usage?.candidatesTokenCount || 0}/${usage?.totalTokenCount || 0} | USD call: ${cost.toFixed(4)}`,
        );
        console.log(
          `💰 Conversación → USD acumulado: ${state.budget.spentUSD.toFixed(4)} / Límite: ${state.budget.limitUSD}`,
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
