// Add this at the VERY TOP of your main.js
// ============================================
// FALLBACK DATA (in case window.FALLBACK_DATA is not defined)
// ============================================
if (!window.FALLBACK_DATA) {
    window.FALLBACK_DATA = {
        services: [
            { id: 1, name: "Classic Haircut", description: "Professional haircut with styling", price: 30, duration: 30, is_active: true },
            { id: 2, name: "Beard Trim", description: "Precision beard trimming", price: 20, duration: 20, is_active: true },
            { id: 3, name: "Haircut & Beard", description: "Complete grooming package", price: 45, duration: 45, is_active: true },
            { id: 4, name: "Hot Towel Shave", description: "Traditional hot towel shave", price: 25, duration: 25, is_active: true },
            { id: 5, name: "Kids Haircut", description: "Special haircut for children", price: 25, duration: 25, is_active: true }
        ],
        barbers: [
            { id: 1, name: "John Maina", specialization: "Traditional Cuts", experience_years: 8, image_url: "", is_active: true },
            { id: 2, name: "David Omondi", specialization: "Modern Styles", experience_years: 5, image_url: "", is_active: true },
            { id: 3, name: "Peter Kamau", specialization: "Beard Specialist", experience_years: 10, image_url: "", is_active: true }
        ],
        testimonials: [
            { id: 1, customer_name: "James Mwangi", comment: "Best barbershop in Nakuru!", rating: 5, is_approved: true },
            { id: 2, customer_name: "Brian Ochieng", comment: "Great service every time!", rating: 5, is_approved: true },
            { id: 3, customer_name: "Michael Otieno", comment: "Perfect haircut every time.", rating: 5, is_approved: true }
        ]
    };
}

// js/main.js - SIMPLE & WORKING VERSION
console.log('🏁 KenBarber Main.js Initializing...');

// Global state
let allServices = [];
let allBarbers = [];
let allTestimonials = [];
let isInitialized = false;

// Update database status
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

// Load all data
async function loadAllData() {
    if (isInitialized) return;
    
    console.log('📡 Starting data load...');
    updateStatus('Loading data...', 'info');
    
    try {
        // Check if Supabase is available
        if (!window.supabase) {
            console.warn('Supabase not available, using fallback');
            throw new Error('Supabase client not available');
        }
        
        // Load data in parallel
        const [services, barbers, testimonials] = await Promise.all([
            loadFromDatabase('services'),
            loadFromDatabase('barbers'),
            loadFromDatabase('testimonials')
        ]);
        
        allServices = services || [];
        allBarbers = barbers || [];
        allTestimonials = testimonials || [];
        
        // Update UI
        updateServicesUI();
        updateBarbersUI();
        updateTestimonialsUI();
        updateBookingForm();
        
        console.log(`✅ Data loaded: ${allServices.length} services, ${allBarbers.length} barbers`);
        updateStatus('System Ready', 'success');
        isInitialized = true;
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        loadFallbackData();
        updateStatus('Using Local Data', 'warning');
    }
}

// Load from database
async function loadFromDatabase(tableName) {
    try {
        console.log(`  ↳ Loading ${tableName}...`);
        
        let query = window.supabase
            .from(tableName)
            .select('*');
        
        // Add specific filters
        if (tableName === 'services') {
            query = query.eq('is_active', true).order('price', { ascending: true });
        } else if (tableName === 'barbers') {
            query = query.eq('is_active', true).order('experience_years', { ascending: false });
        } else if (tableName === 'testimonials') {
            query = query.eq('is_approved', true).order('created_at', { ascending: false }).limit(6);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error(`  ↳ Error loading ${tableName}:`, error);
        return getFallbackData(tableName);
    }
}

// Fallback data
function loadFallbackData() {
    console.log('🔄 Loading fallback data...');
    
    allServices = getFallbackData('services');
    allBarbers = getFallbackData('barbers');
    allTestimonials = getFallbackData('testimonials');
    
    updateServicesUI();
    updateBarbersUI();
    updateTestimonialsUI();
    updateBookingForm();
}

function getFallbackData(tableName) {
    if (!window.FALLBACK_DATA) return [];
    return window.FALLBACK_DATA[tableName] || [];
}

// Update UI functions
function updateServicesUI() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid || allServices.length === 0) return;
    
    servicesGrid.innerHTML = allServices.map(service => `
        <div class="service-card animate-ready">
            <div class="service-icon">✂️</div>
            <h3>${service.name}</h3>
            <p>${service.description || 'Professional grooming service'}</p>
            <div class="service-details">
                <span class="price">KES ${service.price}</span>
                <span class="duration">${service.duration || 30} min</span>
            </div>
            <button class="btn-primary" onclick="bookService(${service.id}, ${service.price})">
                Book Now
            </button>
        </div>
    `).join('');
    
    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 100);
}

function updateBarbersUI() {
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid || allBarbers.length === 0) return;
    
    barbersGrid.innerHTML = allBarbers.map(barber => `
        <div class="barber-card animate-ready">
            <div class="barber-img">
                <img src="${barber.image_url || 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=400'}" 
                     alt="${barber.name}"
                     onerror="this.src='https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=400'">
            </div>
            <h3>${barber.name}</h3>
            <p class="specialization">${barber.specialization || 'Professional Barber'}</p>
            <p class="experience">${barber.experience_years || 3}+ years experience</p>
        </div>
    `).join('');
    
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 200);
}

function updateTestimonialsUI() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid || allTestimonials.length === 0) return;
    
    testimonialsGrid.innerHTML = allTestimonials.map(testimonial => `
        <div class="testimonial-card animate-ready">
            <div class="stars">${'★'.repeat(testimonial.rating || 5)}${'☆'.repeat(5 - (testimonial.rating || 5))}</div>
            <p class="testimonial-text">"${testimonial.comment}"</p>
            <div class="customer-info">
                <strong>${testimonial.customer_name}</strong>
                <span>Verified Customer</span>
            </div>
        </div>
    `).join('');
    
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
            ${allServices.map(service => `
                <option value="${service.id}" data-price="${service.price}" data-name="${service.name}">
                    ${service.name} - KES ${service.price}
                </option>
            `).join('')}
        `;
    }
    
    // Update barber dropdown
    const barberSelect = document.getElementById('barberSelect');
    if (barberSelect && allBarbers.length > 0) {
        barberSelect.innerHTML = `
            <option value="">Any Available Barber</option>
            ${allBarbers.map(barber => `
                <option value="${barber.id}">
                    ${barber.name} - ${barber.specialization || 'Barber'}
                </option>
            `).join('')}
        `;
    }
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
    
    // Initialize date picker
    setupDatePicker();
    
    // Trigger booking.js initialization
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
window.bookService = function(serviceId, price) {
    console.log(`📝 Booking service ${serviceId} for KES ${price}`);
    
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceId;
        serviceSelect.dispatchEvent(new Event('change'));
    }
    
    // Scroll to booking form
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 80;
        
        window.scrollTo({
            top: bookingSection.offsetTop - headerHeight,
            behavior: 'smooth'
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready, starting main.js...');
    
    // Set current year
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Load data after a short delay to ensure Supabase is ready
    setTimeout(() => {
        loadAllData();
    }, 500);
});

// Add CSS for animations
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        .animate-ready {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ main.js loaded successfully');
