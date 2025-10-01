import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase } from './database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEBAPP_PORT || 3008;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
const db = initDatabase();

// ==================== CLIENTS API ====================

// Get all clients
app.get('/api/clients', (req, res) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM clients ORDER BY name ASC';
        let params = [];
        
        if (search) {
            query = 'SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC';
            params = [`%${search}%`, `%${search}%`];
        }
        
        const stmt = db.prepare(query);
        const clients = stmt.all(...params);
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Get single client
app.get('/api/clients/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
        const client = stmt.get(req.params.id);
        
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// Create client
app.post('/api/clients', (req, res) => {
    try {
        const { name, phone, email, notes } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'Nombre y teléfono son requeridos' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO clients (name, phone, email, notes)
            VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(name, phone, email || null, notes || null);
        
        res.status(201).json({
            id: result.lastInsertRowid,
            name,
            phone,
            email,
            notes
        });
    } catch (error) {
        console.error('Error creating client:', error);
        if (error.code === 'SQLITE_CONSTRAINT') {
            res.status(409).json({ error: 'El número de teléfono ya existe' });
        } else {
            res.status(500).json({ error: 'Error al crear cliente' });
        }
    }
});

// Update client
app.put('/api/clients/:id', (req, res) => {
    try {
        const { name, phone, email, notes, last_visit } = req.body;
        
        const stmt = db.prepare(`
            UPDATE clients 
            SET name = ?, phone = ?, email = ?, notes = ?, last_visit = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const result = stmt.run(name, phone, email || null, notes || null, last_visit || null, req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
        const result = stmt.run(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// ==================== SERVICES API ====================

// Get all services
app.get('/api/services', (req, res) => {
    try {
        const { active } = req.query;
        let query = 'SELECT * FROM services ORDER BY name ASC';
        let params = [];
        
        if (active !== undefined) {
            query = 'SELECT * FROM services WHERE active = ? ORDER BY name ASC';
            params = [active === 'true' ? 1 : 0];
        }
        
        const stmt = db.prepare(query);
        const services = stmt.all(...params);
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

// Get single service
app.get('/api/services/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
        const service = stmt.get(req.params.id);
        
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Error al obtener servicio' });
    }
});

// Create service
app.post('/api/services', (req, res) => {
    try {
        const { name, description, base_price, duration_minutes, active } = req.body;
        
        if (!name || !base_price || !duration_minutes) {
            return res.status(400).json({ error: 'Nombre, precio y duración son requeridos' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO services (name, description, base_price, duration_minutes, active)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(name, description || null, base_price, duration_minutes, active !== undefined ? active : 1);
        
        res.status(201).json({
            id: result.lastInsertRowid,
            name,
            description,
            base_price,
            duration_minutes,
            active: active !== undefined ? active : 1
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Error al crear servicio' });
    }
});

// Update service
app.put('/api/services/:id', (req, res) => {
    try {
        const { name, description, base_price, duration_minutes, active } = req.body;
        
        const stmt = db.prepare(`
            UPDATE services 
            SET name = ?, description = ?, base_price = ?, duration_minutes = ?, active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const result = stmt.run(name, description || null, base_price, duration_minutes, active !== undefined ? active : 1, req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.json({ message: 'Servicio actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Error al actualizar servicio' });
    }
});

// Delete service
app.delete('/api/services/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM services WHERE id = ?');
        const result = stmt.run(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.json({ message: 'Servicio eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Error al eliminar servicio' });
    }
});

// ==================== APPOINTMENTS API ====================

// Get all appointments
app.get('/api/appointments', (req, res) => {
    try {
        const { date, status, client_id } = req.query;
        let query = `
            SELECT a.*, c.name as client_name, c.phone as client_phone, 
                   s.name as service_name, s.duration_minutes
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            WHERE 1=1
        `;
        let params = [];
        
        if (date) {
            query += ' AND DATE(a.appointment_date) = DATE(?)';
            params.push(date);
        }
        
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        
        if (client_id) {
            query += ' AND a.client_id = ?';
            params.push(client_id);
        }
        
        query += ' ORDER BY a.appointment_date ASC';
        
        const stmt = db.prepare(query);
        const appointments = stmt.all(...params);
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Error al obtener citas' });
    }
});

// Get single appointment
app.get('/api/appointments/:id', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT a.*, c.name as client_name, c.phone as client_phone, 
                   s.name as service_name, s.duration_minutes
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN services s ON a.service_id = s.id
            WHERE a.id = ?
        `);
        const appointment = stmt.get(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        res.json(appointment);
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ error: 'Error al obtener cita' });
    }
});

// Create appointment
app.post('/api/appointments', (req, res) => {
    try {
        const { client_id, service_id, appointment_date, notes, price, status } = req.body;
        
        if (!client_id || !service_id || !appointment_date) {
            return res.status(400).json({ error: 'Cliente, servicio y fecha son requeridos' });
        }
        
        // Get service duration to calculate end_time
        const service = db.prepare('SELECT duration_minutes FROM services WHERE id = ?').get(service_id);
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        // Calculate end_time
        const startDate = new Date(appointment_date);
        const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
        
        const stmt = db.prepare(`
            INSERT INTO appointments (client_id, service_id, appointment_date, end_time, notes, price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            client_id, 
            service_id, 
            appointment_date, 
            endDate.toISOString(),
            notes || null, 
            price || null,
            status || 'pending'
        );
        
        res.status(201).json({
            id: result.lastInsertRowid,
            client_id,
            service_id,
            appointment_date,
            end_time: endDate.toISOString(),
            notes,
            price,
            status: status || 'pending'
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Error al crear cita' });
    }
});

// Update appointment
app.put('/api/appointments/:id', (req, res) => {
    try {
        const { client_id, service_id, appointment_date, notes, price, status } = req.body;
        
        // Get service duration to calculate end_time
        const service = db.prepare('SELECT duration_minutes FROM services WHERE id = ?').get(service_id);
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        // Calculate end_time
        const startDate = new Date(appointment_date);
        const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
        
        const stmt = db.prepare(`
            UPDATE appointments 
            SET client_id = ?, service_id = ?, appointment_date = ?, end_time = ?, 
                notes = ?, price = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        const result = stmt.run(
            client_id, 
            service_id, 
            appointment_date,
            endDate.toISOString(),
            notes || null, 
            price || null,
            status || 'pending',
            req.params.id
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        res.json({ message: 'Cita actualizada exitosamente' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Error al actualizar cita' });
    }
});

// Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
        const result = stmt.run(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        res.json({ message: 'Cita eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Error al eliminar cita' });
    }
});

// ==================== SCHEDULE BLOCKS API ====================

// Get all schedule blocks
app.get('/api/schedule', (req, res) => {
    try {
        const { date } = req.query;
        let query = 'SELECT * FROM schedule_blocks';
        let params = [];
        
        if (date) {
            query += ' WHERE DATE(start_time) = DATE(?)';
            params.push(date);
        }
        
        query += ' ORDER BY start_time ASC';
        
        const stmt = db.prepare(query);
        const blocks = stmt.all(...params);
        res.json(blocks);
    } catch (error) {
        console.error('Error fetching schedule blocks:', error);
        res.status(500).json({ error: 'Error al obtener bloques de horario' });
    }
});

// Create schedule block
app.post('/api/schedule', (req, res) => {
    try {
        const { start_time, end_time, reason } = req.body;
        
        if (!start_time || !end_time) {
            return res.status(400).json({ error: 'Hora de inicio y fin son requeridas' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO schedule_blocks (start_time, end_time, reason)
            VALUES (?, ?, ?)
        `);
        
        const result = stmt.run(start_time, end_time, reason || null);
        
        res.status(201).json({
            id: result.lastInsertRowid,
            start_time,
            end_time,
            reason
        });
    } catch (error) {
        console.error('Error creating schedule block:', error);
        res.status(500).json({ error: 'Error al crear bloque de horario' });
    }
});

// Delete schedule block
app.delete('/api/schedule/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM schedule_blocks WHERE id = ?');
        const result = stmt.run(req.params.id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Bloque de horario no encontrado' });
        }
        
        res.json({ message: 'Bloque de horario eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting schedule block:', error);
        res.status(500).json({ error: 'Error al eliminar bloque de horario' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Studio 118 Web App running on http://localhost:${PORT}`);
    console.log(`📱 Telegram Web App ready for integration`);
});
