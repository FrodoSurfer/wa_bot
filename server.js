import express from "express";
import cors from "cors";
import { config as dotenvConfig } from "dotenv";
import { agent } from "./agent.js";
import fs from "fs";
import path from "path";

dotenvConfig();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

// In-memory storage for sessions (en producción usar Redis o similar)
const sessions = new Map();

// Helper function to get or create session
function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {
            history: [],
            state: {
                service: null,
                photos: { current: null, reference: null },
                chemicalHistory: null,
                stage: "init",
                booking: { dayText: null, timeText: null, iso: null }
            },
            createdAt: Date.now(),
            lastActivity: Date.now()
        });
    }
    const session = sessions.get(userId);
    session.lastActivity = Date.now();
    return session;
}

// Clean old sessions (older than 24 hours)
setInterval(() => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    for (const [userId, session] of sessions.entries()) {
        if (now - session.lastActivity > DAY_MS) {
            sessions.delete(userId);
        }
    }
}, 60 * 60 * 1000); // Check every hour

// API Routes

/**
 * POST /api/chat
 * Envía un mensaje al agente y recibe una respuesta
 * Body: { userId, message, media? }
 */
app.post("/api/chat", async (req, res) => {
    try {
        const { userId, message, media } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                error: "userId y message son requeridos"
            });
        }

        const session = getSession(userId);
        
        // Add user message to history
        session.history.push({
            role: "user",
            content: message,
            media: media || []
        });

        // Get response from agent
        const response = await agent(session.history, { lowCost: true });

        // Add assistant response to history
        session.history.push({
            role: "assistant",
            content: response.text
        });

        // Keep history manageable (last 20 messages)
        if (session.history.length > 20) {
            session.history = session.history.slice(-20);
        }

        res.json({
            success: true,
            message: response.text,
            usage: response.usage,
            model: response.modelName
        });

    } catch (error) {
        console.error("Error in /api/chat:", error);
        res.status(500).json({
            error: "Error al procesar el mensaje",
            details: error.message
        });
    }
});

/**
 * GET /api/session/:userId
 * Obtiene el estado de la sesión del usuario
 */
app.get("/api/session/:userId", (req, res) => {
    try {
        const { userId } = req.params;
        const session = getSession(userId);
        
        res.json({
            success: true,
            state: session.state,
            historyLength: session.history.length
        });
    } catch (error) {
        console.error("Error in /api/session:", error);
        res.status(500).json({
            error: "Error al obtener la sesión",
            details: error.message
        });
    }
});

/**
 * DELETE /api/session/:userId
 * Limpia la sesión del usuario
 */
app.delete("/api/session/:userId", (req, res) => {
    try {
        const { userId } = req.params;
        sessions.delete(userId);
        
        res.json({
            success: true,
            message: "Sesión eliminada correctamente"
        });
    } catch (error) {
        console.error("Error in DELETE /api/session:", error);
        res.status(500).json({
            error: "Error al eliminar la sesión",
            details: error.message
        });
    }
});

/**
 * GET /api/precios
 * Obtiene la lista de precios
 */
app.get("/api/precios", (req, res) => {
    try {
        const preciosPath = path.resolve("./precios.json");
        const precios = JSON.parse(fs.readFileSync(preciosPath, "utf-8"));
        
        res.json({
            success: true,
            precios
        });
    } catch (error) {
        console.error("Error in /api/precios:", error);
        res.status(500).json({
            error: "Error al obtener los precios",
            details: error.message
        });
    }
});

/**
 * POST /api/booking
 * Crea una reserva (placeholder para futura integración con sistema de citas)
 */
app.post("/api/booking", async (req, res) => {
    try {
        const { userId, service, date, time } = req.body;

        if (!userId || !service || !date || !time) {
            return res.status(400).json({
                error: "userId, service, date y time son requeridos"
            });
        }

        const session = getSession(userId);
        session.state.service = service;
        session.state.booking = {
            dayText: date,
            timeText: time,
            iso: new Date(`${date} ${time}`).toISOString()
        };

        // Aquí se integraría con el sistema de citas real
        res.json({
            success: true,
            message: "Cita registrada correctamente",
            booking: session.state.booking
        });

    } catch (error) {
        console.error("Error in /api/booking:", error);
        res.status(500).json({
            error: "Error al crear la reserva",
            details: error.message
        });
    }
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size
    });
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}/api`);
});
