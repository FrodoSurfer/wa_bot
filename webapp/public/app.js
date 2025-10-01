// Telegram WebApp initialization
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// API Base URL
const API_BASE = window.location.origin + '/api';

// State
let clients = [];
let services = [];
let appointments = [];
let scheduleBlocks = [];

// ==================== TAB MANAGEMENT ====================

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active state from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-b-2', 'border-blue-500', 'text-blue-500');
        btn.classList.add('text-gray-500');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activate selected button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.classList.add('border-b-2', 'border-blue-500', 'text-blue-500');
    activeBtn.classList.remove('text-gray-500');
    
    // Load data for the tab
    if (tabName === 'appointments') loadAppointments();
    if (tabName === 'clients') loadClients();
    if (tabName === 'services') loadServices();
    if (tabName === 'schedule') loadScheduleBlocks();
}

// ==================== APPOINTMENTS ====================

async function loadAppointments() {
    try {
        const dateFilter = document.getElementById('appointment-date-filter').value;
        let url = `${API_BASE}/appointments`;
        if (dateFilter) {
            url += `?date=${dateFilter}`;
        }
        
        const response = await fetch(url);
        appointments = await response.json();
        renderAppointments();
    } catch (error) {
        console.error('Error loading appointments:', error);
        showNotification('Error al cargar citas', 'error');
    }
}

function renderAppointments() {
    const container = document.getElementById('appointments-list');
    
    if (appointments.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay citas programadas</p>';
        return;
    }
    
    container.innerHTML = appointments.map(apt => {
        const date = new Date(apt.appointment_date);
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        const statusLabels = {
            pending: 'Pendiente',
            confirmed: 'Confirmada',
            completed: 'Completada',
            cancelled: 'Cancelada'
        };
        
        return `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-bold text-lg">${apt.client_name}</h3>
                        <p class="text-sm text-gray-600">${apt.service_name}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs ${statusColors[apt.status]}">${statusLabels[apt.status]}</span>
                </div>
                <div class="text-sm text-gray-600 mb-2">
                    📅 ${date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <br>
                    🕐 ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </div>
                ${apt.price ? `<div class="text-sm font-semibold mb-2">💰 $${apt.price}</div>` : ''}
                ${apt.notes ? `<div class="text-sm text-gray-600 mb-2">${apt.notes}</div>` : ''}
                <div class="flex gap-2 mt-3">
                    <button onclick="editAppointment(${apt.id})" class="text-blue-600 text-sm hover:underline">
                        ✏️ Editar
                    </button>
                    <button onclick="deleteAppointment(${apt.id})" class="text-red-600 text-sm hover:underline">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterAppointments() {
    loadAppointments();
}

function showAppointmentForm(appointmentId = null) {
    document.getElementById('appointment-modal').classList.remove('hidden');
    document.getElementById('appointment-form').reset();
    document.getElementById('appointment-id').value = '';
    document.getElementById('appointment-modal-title').textContent = 'Nueva Cita';
    
    // Load clients and services for dropdowns
    loadClientsForDropdown();
    loadServicesForDropdown();
    
    if (appointmentId) {
        const apt = appointments.find(a => a.id === appointmentId);
        if (apt) {
            document.getElementById('appointment-id').value = apt.id;
            document.getElementById('appointment-client').value = apt.client_id;
            document.getElementById('appointment-service').value = apt.service_id;
            document.getElementById('appointment-datetime').value = apt.appointment_date.slice(0, 16);
            document.getElementById('appointment-status').value = apt.status;
            document.getElementById('appointment-price').value = apt.price || '';
            document.getElementById('appointment-notes').value = apt.notes || '';
            document.getElementById('appointment-modal-title').textContent = 'Editar Cita';
        }
    }
}

async function loadClientsForDropdown() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        const clientsList = await response.json();
        const select = document.getElementById('appointment-client');
        select.innerHTML = '<option value="">Seleccionar cliente...</option>' + 
            clientsList.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('');
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function loadServicesForDropdown() {
    try {
        const response = await fetch(`${API_BASE}/services?active=true`);
        const servicesList = await response.json();
        const select = document.getElementById('appointment-service');
        select.innerHTML = '<option value="">Seleccionar servicio...</option>' + 
            servicesList.map(s => `<option value="${s.id}">${s.name} - $${s.base_price} (${s.duration_minutes}min)</option>`).join('');
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function saveAppointment(event) {
    event.preventDefault();
    
    const id = document.getElementById('appointment-id').value;
    const data = {
        client_id: parseInt(document.getElementById('appointment-client').value),
        service_id: parseInt(document.getElementById('appointment-service').value),
        appointment_date: new Date(document.getElementById('appointment-datetime').value).toISOString(),
        status: document.getElementById('appointment-status').value,
        price: parseFloat(document.getElementById('appointment-price').value) || null,
        notes: document.getElementById('appointment-notes').value
    };
    
    try {
        const url = id ? `${API_BASE}/appointments/${id}` : `${API_BASE}/appointments`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification(id ? 'Cita actualizada' : 'Cita creada', 'success');
            closeAppointmentModal();
            loadAppointments();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al guardar cita', 'error');
        }
    } catch (error) {
        console.error('Error saving appointment:', error);
        showNotification('Error al guardar cita', 'error');
    }
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').classList.add('hidden');
}

function editAppointment(id) {
    showAppointmentForm(id);
}

async function deleteAppointment(id) {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Cita eliminada', 'success');
            loadAppointments();
        } else {
            showNotification('Error al eliminar cita', 'error');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showNotification('Error al eliminar cita', 'error');
    }
}

// ==================== CLIENTS ====================

async function loadClients() {
    try {
        const response = await fetch(`${API_BASE}/clients`);
        clients = await response.json();
        renderClients();
    } catch (error) {
        console.error('Error loading clients:', error);
        showNotification('Error al cargar clientes', 'error');
    }
}

async function searchClients() {
    const search = document.getElementById('client-search').value;
    try {
        const url = search ? `${API_BASE}/clients?search=${encodeURIComponent(search)}` : `${API_BASE}/clients`;
        const response = await fetch(url);
        clients = await response.json();
        renderClients();
    } catch (error) {
        console.error('Error searching clients:', error);
        showNotification('Error al buscar clientes', 'error');
    }
}

function renderClients() {
    const container = document.getElementById('clients-list');
    
    if (clients.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay clientes registrados</p>';
        return;
    }
    
    container.innerHTML = clients.map(client => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-lg">${client.name}</h3>
                    <p class="text-sm text-gray-600">📞 ${client.phone}</p>
                    ${client.email ? `<p class="text-sm text-gray-600">📧 ${client.email}</p>` : ''}
                    ${client.last_visit ? `<p class="text-sm text-gray-600">🗓️ Última visita: ${new Date(client.last_visit).toLocaleDateString('es-MX')}</p>` : ''}
                    ${client.notes ? `<p class="text-sm text-gray-600 mt-2">${client.notes}</p>` : ''}
                </div>
            </div>
            <div class="flex gap-2 mt-3">
                <button onclick="editClient(${client.id})" class="text-blue-600 text-sm hover:underline">
                    ✏️ Editar
                </button>
                <button onclick="deleteClient(${client.id})" class="text-red-600 text-sm hover:underline">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function showClientForm(clientId = null) {
    document.getElementById('client-modal').classList.remove('hidden');
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';
    document.getElementById('client-modal-title').textContent = 'Nuevo Cliente';
    
    if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-notes').value = client.notes || '';
            document.getElementById('client-modal-title').textContent = 'Editar Cliente';
        }
    }
}

async function saveClient(event) {
    event.preventDefault();
    
    const id = document.getElementById('client-id').value;
    const data = {
        name: document.getElementById('client-name').value,
        phone: document.getElementById('client-phone').value,
        email: document.getElementById('client-email').value || null,
        notes: document.getElementById('client-notes').value || null
    };
    
    try {
        const url = id ? `${API_BASE}/clients/${id}` : `${API_BASE}/clients`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification(id ? 'Cliente actualizado' : 'Cliente creado', 'success');
            closeClientModal();
            loadClients();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al guardar cliente', 'error');
        }
    } catch (error) {
        console.error('Error saving client:', error);
        showNotification('Error al guardar cliente', 'error');
    }
}

function closeClientModal() {
    document.getElementById('client-modal').classList.add('hidden');
}

function editClient(id) {
    showClientForm(id);
}

async function deleteClient(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esto eliminará también todas sus citas.')) return;
    
    try {
        const response = await fetch(`${API_BASE}/clients/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Cliente eliminado', 'success');
            loadClients();
        } else {
            showNotification('Error al eliminar cliente', 'error');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('Error al eliminar cliente', 'error');
    }
}

// ==================== SERVICES ====================

async function loadServices() {
    try {
        const response = await fetch(`${API_BASE}/services`);
        services = await response.json();
        renderServices();
    } catch (error) {
        console.error('Error loading services:', error);
        showNotification('Error al cargar servicios', 'error');
    }
}

function renderServices() {
    const container = document.getElementById('services-list');
    
    if (services.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay servicios registrados</p>';
        return;
    }
    
    container.innerHTML = services.map(service => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow ${service.active ? '' : 'opacity-50'}">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-bold text-lg">${service.name} ${service.active ? '' : '(Inactivo)'}</h3>
                    ${service.description ? `<p class="text-sm text-gray-600 mb-2">${service.description}</p>` : ''}
                    <div class="flex gap-4 text-sm">
                        <span class="font-semibold">💰 $${service.base_price}</span>
                        <span class="text-gray-600">⏱️ ${service.duration_minutes} min</span>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 mt-3">
                <button onclick="editService(${service.id})" class="text-blue-600 text-sm hover:underline">
                    ✏️ Editar
                </button>
                <button onclick="deleteService(${service.id})" class="text-red-600 text-sm hover:underline">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function showServiceForm(serviceId = null) {
    document.getElementById('service-modal').classList.remove('hidden');
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-modal-title').textContent = 'Nuevo Servicio';
    document.getElementById('service-active').checked = true;
    
    if (serviceId) {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-description').value = service.description || '';
            document.getElementById('service-price').value = service.base_price;
            document.getElementById('service-duration').value = service.duration_minutes;
            document.getElementById('service-active').checked = service.active === 1;
            document.getElementById('service-modal-title').textContent = 'Editar Servicio';
        }
    }
}

async function saveService(event) {
    event.preventDefault();
    
    const id = document.getElementById('service-id').value;
    const data = {
        name: document.getElementById('service-name').value,
        description: document.getElementById('service-description').value || null,
        base_price: parseFloat(document.getElementById('service-price').value),
        duration_minutes: parseInt(document.getElementById('service-duration').value),
        active: document.getElementById('service-active').checked ? 1 : 0
    };
    
    try {
        const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification(id ? 'Servicio actualizado' : 'Servicio creado', 'success');
            closeServiceModal();
            loadServices();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al guardar servicio', 'error');
        }
    } catch (error) {
        console.error('Error saving service:', error);
        showNotification('Error al guardar servicio', 'error');
    }
}

function closeServiceModal() {
    document.getElementById('service-modal').classList.add('hidden');
}

function editService(id) {
    showServiceForm(id);
}

async function deleteService(id) {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Servicio eliminado', 'success');
            loadServices();
        } else {
            showNotification('Error al eliminar servicio', 'error');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        showNotification('Error al eliminar servicio', 'error');
    }
}

// ==================== SCHEDULE BLOCKS ====================

async function loadScheduleBlocks() {
    try {
        const response = await fetch(`${API_BASE}/schedule`);
        scheduleBlocks = await response.json();
        renderScheduleBlocks();
    } catch (error) {
        console.error('Error loading schedule blocks:', error);
        showNotification('Error al cargar bloques', 'error');
    }
}

function renderScheduleBlocks() {
    const container = document.getElementById('schedule-list');
    
    if (scheduleBlocks.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay bloques de horario</p>';
        return;
    }
    
    container.innerHTML = scheduleBlocks.map(block => {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        
        return `
            <div class="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg">${block.reason || 'Bloque de horario'}</h3>
                        <div class="text-sm text-gray-600 mt-1">
                            📅 ${start.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            <br>
                            🕐 ${start.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button onclick="deleteScheduleBlock(${block.id})" class="text-red-600 text-sm hover:underline">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showScheduleForm() {
    document.getElementById('schedule-modal').classList.remove('hidden');
    document.getElementById('schedule-form').reset();
}

async function saveScheduleBlock(event) {
    event.preventDefault();
    
    const data = {
        start_time: new Date(document.getElementById('schedule-start').value).toISOString(),
        end_time: new Date(document.getElementById('schedule-end').value).toISOString(),
        reason: document.getElementById('schedule-reason').value || null
    };
    
    try {
        const response = await fetch(`${API_BASE}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Bloque creado', 'success');
            closeScheduleModal();
            loadScheduleBlocks();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al crear bloque', 'error');
        }
    } catch (error) {
        console.error('Error saving schedule block:', error);
        showNotification('Error al crear bloque', 'error');
    }
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
}

async function deleteScheduleBlock(id) {
    if (!confirm('¿Estás seguro de eliminar este bloque?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/schedule/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Bloque eliminado', 'success');
            loadScheduleBlocks();
        } else {
            showNotification('Error al eliminar bloque', 'error');
        }
    } catch (error) {
        console.error('Error deleting schedule block:', error);
        showNotification('Error al eliminar bloque', 'error');
    }
}

// ==================== UTILITIES ====================

function showNotification(message, type = 'info') {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// ==================== INITIALIZATION ====================

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    
    // Set today's date as default filter
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date-filter').value = today;
});
