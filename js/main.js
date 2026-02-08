// js/main.js - MINIMAL VERSION
// Only loads what HTML script doesn't handle
console.log('🏁 KenBarber Main.js - Loading missing data only');

// ============================================
// 1. UPDATE DATABASE STATUS
// ============================================
function updateStatus(message, type = 'info') {
    const dbStatus = document.getElementById('dbStatus');
    if (!dbStatus) return;
    
    const colors = {
        info: 'var(--secondary)',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
    };
    
    dbStatus.style.backgroundColor = colors[type] || colors.info;
    dbStatus.innerHTML = `<i class="fas fa-circle"></i> <span>${message}</span>`;
}

// ============================================
// 2. LOAD BARBERS (HTML doesn't load these)
// ============================================
async function loadBarbers() {
    console.log('✂️ Loading barbers...');
    
    try {
        const { data: barbers, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) {
            console.error('Barbers error:', error);
            return null;
        }
        
        console.log(`✅ Loaded ${barbers?.length || 0} barbers`);
        return barbers || [];
        
    } catch (error) {
        console.error('Error loading barbers:', error);
        return [];
    }
}

// ============================================
// 3. UPDATE BARBERS UI
// ============================================
function updateBarbersUI(barbers) {
    console.log('🎨 Updating barbers UI...');
    const barbersGrid = document.getElementById('barbersGrid');
    
    if (!barbersGrid || !barbers || barbers.length === 0) {
        console.warn('No barbers to display');
        return;
    }
    
    console.log(`Displaying ${barbers.length} barbers`);
    
    barbersGrid.innerHTML = barbers.map(barber => {
        const defaultImage = 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=400';
        
        return `
        <div class="barber-card animate-ready">
            <div class="barber-img">
                <img src="${barber.image_url || defaultImage}" 
                     alt="${barber.name}"
                     onerror="this.src='${defaultImage}'">
            </div>
            <h3>${barber.name}</h3>
            <p class="specialization">${barber.specialty || 'Professional Barber'}</p>
            <p class="experience">${barber.experience_years || 3}+ years experience</p>
            ${barber.bio ? `<p class="bio">${barber.bio}</p>` : ''}
        </div>
        `;
    }).join('');
    
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 200);
}

// ============================================
// 4. UPDATE BOOKING FORM DROPDOWNS
// ============================================
function updateBookingForm(services, barbers) {
    console.log('📋 Updating booking form...');
    
    // Update service dropdown (using HTML's services)
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect && services && services.length > 0) {
        serviceSelect.innerHTML = `
            <option value="">Select a service...</option>
            ${services.map(service => {
                const duration = service.duration_minutes || service.duration || 30;
                const price = parseFloat(service.price).toFixed(2);
                return `
                <option value="${service.id}" 
                        data-price="${price}"
                        data-duration="${duration}"
                        data-name="${service.name}">
                    ${service.name} - KES ${price} (${duration} min)
                </option>
                `;
            }).join('')}
        `;
        serviceSelect.disabled = false;
    }
    
    // Update barber dropdown
    const barberSelect = document.getElementById('barberSelect');
    if (barberSelect && barbers && barbers.length > 0) {
        barberSelect.innerHTML = `
            <option value="">Any Available Barber</option>
            ${barbers.map(barber => `
                <option value="${barber.id}">
                    ${barber.name} - ${barber.specialty || 'Professional Barber'}
                </option>
            `).join('')}
        `;
        barberSelect.disabled = false;
    }
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
}

// ============================================
// 5. SETUP DATE PICKER
// ============================================
function setupDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    if (!dateInput) return;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.value = tomorrow.toISOString().split('T')[0];
}

// ============================================
// 6. MAIN INITIALIZATION
// ============================================
async function initializeMain() {
    console.log('🚀 Main.js initialization started');
    
    // Set current year
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Wait for HTML script to finish loading services
    const waitForServices = setInterval(() => {
        if (window.allServices && window.allServices.length > 0) {
            clearInterval(waitForServices);
            console.log('✅ HTML loaded services, now loading barbers...');
            loadAndUpdate();
        }
    }, 500);
    
    // If no services after 5 seconds, proceed anyway
    setTimeout(() => {
        if (!window.allServices || window.allServices.length === 0) {
            clearInterval(waitForServices);
            console.log('⏳ HTML taking too long, proceeding...');
            loadAndUpdate();
        }
    }, 5000);
}

// ============================================
// 7. LOAD AND UPDATE FUNCTION
// ============================================
async function loadAndUpdate() {
    updateStatus('Loading barbers...', 'info');
    
    try {
        // Get services from HTML script
        const services = window.allServices || [];
        
        // Load barbers (HTML doesn't do this)
        const barbers = await loadBarbers();
        
        // Update UI
        if (barbers && barbers.length > 0) {
            updateBarbersUI(barbers);
        }
        
        // Update booking form with both services and barbers
        updateBookingForm(services, barbers);
        
        // Setup date picker
        setupDatePicker();
        
        // Update status
        updateStatus(`Ready (${services.length} services, ${barbers?.length || 0} barbers)`, 'success');
        
        // Initialize booking system if function exists
        setTimeout(() => {
            if (typeof window.initializeBooking === 'function') {
                console.log('✅ Initializing booking system...');
                window.initializeBooking();
            }
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        updateStatus('System error', 'error');
    }
}

// ============================================
// 8. START EVERYTHING
// ============================================
console.log('⏳ Waiting for HTML script to load first...');

// Wait for DOM and HTML script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeMain, 1000); // Give HTML script time
    });
} else {
    setTimeout(initializeMain, 1000);
}

console.log('✅ main.js loaded (minimal version)');
