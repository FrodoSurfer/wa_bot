import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'studio118.db');

export function initDatabase() {
    const db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create clients table
    db.exec(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            notes TEXT,
            last_visit DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create services table
    db.exec(`
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            base_price REAL NOT NULL,
            duration_minutes INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create appointments table
    db.exec(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            appointment_date DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            price REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )
    `);
    
    // Create schedule_blocks table (for blocking time slots)
    db.exec(`
        CREATE TABLE IF NOT EXISTS schedule_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Insert default services if table is empty
    const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
    if (serviceCount.count === 0) {
        const insertService = db.prepare(`
            INSERT INTO services (name, description, base_price, duration_minutes)
            VALUES (?, ?, ?, ?)
        `);
        
        insertService.run('Corte', 'Corte de cabello básico', 350, 60);
        insertService.run('Efecto de Color (Corto)', 'Efecto de color para cabello corto', 3500, 120);
        insertService.run('Efecto de Color (Medio)', 'Efecto de color para cabello medio', 3700, 150);
        insertService.run('Efecto de Color (Largo)', 'Efecto de color para cabello largo', 4300, 180);
        insertService.run('Nanoplastia', 'Tratamiento de nanoplastia', 2500, 180);
        insertService.run('Extensiones', 'Aplicación de extensiones', 3000, 180);
        
        console.log('✅ Servicios predeterminados insertados');
    }
    
    console.log('✅ Base de datos inicializada correctamente');
    return db;
}

export function getDatabase() {
    return new Database(dbPath);
}
