// js/main.js - WORKING VERSION
console.log('🏁 KenBarber Main.js Initializing - WORKING VERSION');

// Global state - MAKE THEM GLOBAL
window.allServices = [];
window.allBarbers = [];
window.allTestimonials = [];
window.isInitialized = false;

// Shortcut references - DON'T USE const/let here (use var or no declaration)
var allServices = window.allServices;
var allBarbers = window.allBarbers;
var allTestimonials = window.allTestimonials;
var isInitialized = window.isInitialized;

// Update database status
function updateStatus(message, type = 'info') {
    console.log('📊 Status:', message);
    
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

// Load all data - SIMPLIFIED WORKING VERSION
async function loadAllData() {
    console.log('📡 Starting data load from database...');
    
    if (isInitialized) {
        console.log('Already initialized, skipping');
        return;
    }
    
    updateStatus('Loading data...', 'info');
    
    try {
        // Check if Supabase is available
        if (!window.supabase) {
            console.error('❌ Supabase not available');
            updateStatus('Database offline', 'error');
            showEmptyStates();
            return;
        }
        
        console.log('✅ Supabase is available, loading data...');
        
        // Load services
        console.log('Loading services...');
        const { data: services, error: sError } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (sError) {
            console.error('Services error:', sError);
            throw sError;
        }
        
        // Load barbers - FIXED: Include all necessary fields
        console.log('Loading barbers...');
        const { data: barbers, error: bError } = await window.supabase
            .from('barbers')
            .select('*')  // Select all fields instead of specific ones
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (bError) {
            console.error('Barbers error:', bError);
            // Don't throw - just continue without barbers
            console.warn('Continuing without barbers data');
        }
        
        // Load testimonials (optional - skip if error)
        let testimonials = [];
        try {
            const { data: tData, error: tError } = await window.supabase
                .from('testimonials')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(6);
            
            if (!tError) testimonials = tData || [];
        } catch (tErr) {
            console.warn('Testimonials skipped:', tErr.message);
        }
        
        // Store data in global variables
        window.allServices = services || [];
        window.allBarbers = barbers || [];
        window.allTestimonials = testimonials || [];
        
        // Update local references
        allServices.length = 0;
        allBarbers.length = 0;
        allTestimonials.length = 0;
        
        allServices.push(...window.allServices);
        allBarbers.push(...window.allBarbers);
        allTestimonials.push(...window.allTestimonials);
        
        console.log(`✅ SUCCESS: Loaded ${allServices.length} services, ${allBarbers ? allBarbers.length : 0} barbers`);
        
        // Update UI
        updateServicesUI();
        updateBarbersUI();
        updateTestimonialsUI();
        updateBookingForm();
        
        updateStatus(`Loaded ${allServices.length} services`, 'success');
        window.isInitialized = true;
        isInitialized = true;
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        updateStatus('Database error', 'error');
        showEmptyStates();
    }
}

// Show empty states when no data
function showEmptyStates() {
    const servicesGrid = document.getElementById('servicesGrid');
    const barbersGrid = document.getElementById('barbersGrid');
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Services Unavailable</h3>
                <p>Unable to load services at the moment. Please try again later or call us at 0704 325 810.</p>
            </div>
        `;
    }
    
    if (barbersGrid) {
        barbersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>Barbers Unavailable</h3>
                <p>Barber information could not be loaded. Please call us for availability.</p>
            </div>
        `;
    }
}

// Update UI functions
function updateServicesUI() {
    console.log('🎨 Updating services UI...');
    const servicesGrid = document.getElementById('servicesGrid');
    
    if (!servicesGrid) {
        console.error('❌ servicesGrid element not found');
        return;
    }
    
    if (!allServices || allServices.length === 0) {
        console.warn('No services to display');
        showEmptyStates();
        return;
    }
    
    console.log(`Displaying ${allServices.length} services`);
    
    servicesGrid.innerHTML = allServices.map(service => {
        const duration = service.duration_minutes || service.duration || 30;
        const price = parseFloat(service.price).toFixed(2);
        
        return `
        <div class="service-card animate-ready">
            <div class="service-icon">✂️</div>
            <h3>${service.name || 'Service'}</h3>
            <p>${service.description || 'Professional grooming service'}</p>
            <div class="service-details">
                <span class="price">KES ${price}</span>
                <span class="duration">${duration} min</span>
                ${service.category ? `<span class="category">${service.category}</span>` : ''}
            </div>
            <button class="btn-primary" onclick="window.bookService('${service.id}', '${service.name}', ${price})">
                Book Now
            </button>
        </div>
        `;
    }).join('');
    
    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 100);
}

function updateBarbersUI() {
    console.log('🎨 Updating barbers UI...');
    const barbersGrid = document.getElementById('barbersGrid');
    
    if (!barbersGrid) {
        console.error('❌ barbersGrid element not found');
        return;
    }
    
    if (!allBarbers || allBarbers.length === 0) {
        console.warn('No barbers to display');
        // Show a fallback message instead of empty
        barbersGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-user-tie"></i>
                <h3>Our Expert Barbers</h3>
                <p>All our barbers are highly trained professionals. Please call 0704 325 810 to check current availability.</p>
                <p><strong>Walk-ins welcome!</strong></p>
            </div>
        `;
        return;
    }
    
    console.log(`Displaying ${allBarbers.length} barbers`);
    
    barbersGrid.innerHTML = allBarbers.map(barber => {
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

function updateTestimonialsUI() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid || !allTestimonials || allTestimonials.length === 0) {
        return;
    }
    
    testimonialsGrid.innerHTML = allTestimonials.map(testimonial => {
        const rating = testimonial.rating || 5;
        return `
        <div class="testimonial-card animate-ready">
            <div class="stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
            <p class="testimonial-text">"${testimonial.comment || 'Great service!'}"</p>
            <div class="customer-info">
                <strong>${testimonial.customer_name || 'Happy Customer'}</strong>
                <span>Verified Customer</span>
            </div>
        </div>
        `;
    }).join('');
    
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 300);
}

function updateBookingForm() {
    console.log('🎨 Updating booking form...');
    
    // Update service dropdown
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect && allServices.length > 0) {
        serviceSelect.innerHTML = `
            <option value="">Select a service...</option>
            ${allServices.map(service => {
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
    if (barberSelect && allBarbers && allBarbers.length > 0) {
        barberSelect.innerHTML = `
            <option value="">Any Available Barber</option>
            ${allBarbers.map(barber => `
                <option value="${barber.id}">
                    ${barber.name} - ${barber.specialty || 'Professional Barber'}
                </option>
            `).join('')}
        `;
        barberSelect.disabled = false;
    } else {
        barberSelect.innerHTML = `
            <option value="">Any Available Barber</option>
            <option value="any">Any Barber Available</option>
        `;
        barberSelect.disabled = false;
    }
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
    
    // Initialize date picker
    setupDatePicker();
    
    // Initialize booking system
    setTimeout(() => {
        if (typeof window.initializeBooking === 'function') {
            console.log('✅ Initializing booking system...');
            window.initializeBooking();
        }
    }, 500);
}

function setupDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    if (!dateInput) return;
    
    // Set min date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Set max date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Set default to tomorrow
    dateInput.value = tomorrow.toISOString().split('T')[0];
}

// Global booking function
window.bookService = function(serviceId, serviceName, price) {
    console.log(`📝 Booking service: ${serviceName} (KES ${price})`);
    
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceId;
        serviceSelect.dispatchEvent(new Event('change'));
    }
    
    // Scroll to booking form
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
        window.scrollTo({
            top: bookingSection.offsetTop - 100,
            behavior: 'smooth'
        });
    }
};

// Initialize when page loads
function initializeMain() {
    console.log('🚀 Main.js initialization started');
    
    // Set current year
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Check if Supabase is loaded, then load data
    const checkSupabaseInterval = setInterval(() => {
        if (window.supabase) {
            clearInterval(checkSupabaseInterval);
            console.log('✅ Supabase detected, loading data...');
            
            // Wait a bit for everything to settle
            setTimeout(() => {
                loadAllData();
            }, 500);
        } else {
            console.log('⏳ Waiting for Supabase...');
        }
    }, 100);
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMain);
} else {
    initializeMain();
}

console.log('✅ main.js loaded successfully');
