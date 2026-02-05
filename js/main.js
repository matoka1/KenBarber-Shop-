// js/main.js - COMPLETE FIXED VERSION
// ============================================

// ============================================
// GLOBAL FUNCTIONS FOR EMERGENCY SCRIPT
// ============================================

// 1. This is what the emergency script is looking for
window.loadServices = async function() {
    console.log('🔄 loadServices() called globally');
    try {
        const services = await loadServicesFromDB();
        if (services && services.length > 0) {
            updateServicesUIWithData(services);
            return services;
        }
        return [];
    } catch (error) {
        console.error('Error in global loadServices:', error);
        const fallbackServices = getFallbackServices();
        updateServicesUIWithData(fallbackServices);
        return fallbackServices;
    }
};

// 2. This function loads services from DB
async function loadServicesFromDB() {
    try {
        if (!window.supabase) return getFallbackServices();
        
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        return data || getFallbackServices();
    } catch (error) {
        console.error('Error loading services:', error);
        return getFallbackServices();
    }
}

// 3. Helper function to update UI with services
function updateServicesUIWithData(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card">
            <div class="service-icon">✂️</div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="service-details">
                <span class="price">KES ${service.price}</span>
                <span class="duration">${service.duration} min</span>
            </div>
            <button class="btn-primary" onclick="bookService(${service.id}, ${service.price})">
                Book Now
            </button>
        </div>
    `).join('');
}

// 4. This is what the emergency script is looking for
window.loadAllData = async function() {
    console.log('📡 loadAllData() called globally');
    return await loadAllDataMain(); // Renamed to avoid conflict
};

// 5. This is what the emergency script is looking for
window.showLoadingStates = function() {
    console.log('🔄 showLoadingStates() called globally');
    
    // Show loading in services grid
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="loading-service">
                <div class="service-img" style="background: #f5f5f5; height: 150px; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
                </div>
                <div style="padding: 20px;">
                    <h3 style="background: #f0f0f0; height: 24px; width: 80%; margin-bottom: 10px; border-radius: 4px;"></h3>
                    <p style="background: #f0f0f0; height: 16px; width: 100%; margin-bottom: 15px; border-radius: 4px;"></p>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="background: #f0f0f0; height: 20px; width: 80px; border-radius: 4px;"></span>
                        <span style="background: #f0f0f0; height: 20px; width: 60px; border-radius: 4px;"></span>
                    </div>
                    <button style="width: 100%; background: #f0f0f0; height: 40px; border-radius: 4px; border: none;"></button>
                </div>
            </div>
        `;
    }
};

// ============================================
// MAIN INITIALIZATION
// ============================================

console.log('🏁 KenBarber Main.js Initializing...');

// Global state
let allServices = [];
let allBarbers = [];
let allTestimonials = [];

// ============================================
// 1. LOAD ALL DATA (RENAMED TO AVOID CONFLICT)
// ============================================
async function loadAllDataMain() {
    console.log('📡 Loading all data...');
    
    try {
        // Load data in parallel
        const [services, barbers, testimonials] = await Promise.all([
            loadServicesMain(),
            loadBarbersMain(),
            loadTestimonialsMain()
        ]);
        
        allServices = services || [];
        allBarbers = barbers || [];
        allTestimonials = testimonials || [];
        
        // Update UI
        updateServicesUI();
        updateBarbersUI();
        updateTestimonialsUI();
        updateBookingFormDropdowns();
        
        console.log('✅ All data loaded!');
        return { services: allServices, barbers: allBarbers, testimonials: allTestimonials };
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        loadFallbackData();
        return { services: allServices, barbers: allBarbers, testimonials: allTestimonials };
    }
}

async function loadServicesMain() {
    try {
        if (!window.supabase) return getFallbackServices();
        
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Error loading services:', error);
        return getFallbackServices();
    }
}

async function loadBarbersMain() {
    try {
        if (!window.supabase) return getFallbackBarbers();
        
        const { data, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Error loading barbers:', error);
        return getFallbackBarbers();
    }
}

async function loadTestimonialsMain() {
    try {
        if (!window.supabase) return getFallbackTestimonials();
        
        const { data, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('Error loading testimonials:', error);
        return getFallbackTestimonials();
    }
}

// ============================================
// 2. FALLBACK DATA
// ============================================
function loadFallbackData() {
    console.log('🔄 Loading fallback data...');
    
    allServices = getFallbackServices();
    allBarbers = getFallbackBarbers();
    allTestimonials = getFallbackTestimonials();
    
    updateServicesUI();
    updateBarbersUI();
    updateTestimonialsUI();
    updateBookingFormDropdowns();
}

function getFallbackServices() {
    return [
        { id: 1, name: "Classic Haircut", description: "Professional haircut with styling", price: 30, duration: 30, is_active: true },
        { id: 2, name: "Beard Trim", description: "Precision beard trimming", price: 20, duration: 20, is_active: true },
        { id: 3, name: "Haircut & Beard", description: "Complete grooming package", price: 45, duration: 45, is_active: true },
        { id: 4, name: "Hot Towel Shave", description: "Traditional hot towel shave", price: 25, duration: 25, is_active: true },
        { id: 5, name: "Kids Haircut", description: "Special haircut for children", price: 25, duration: 25, is_active: true }
    ];
}

function getFallbackBarbers() {
    return [
        { id: 1, name: "John Maina", specialization: "Traditional Cuts", experience_years: 8, image_url: "", is_active: true },
        { id: 2, name: "David Omondi", specialization: "Modern Styles", experience_years: 5, image_url: "", is_active: true },
        { id: 3, name: "Peter Kamau", specialization: "Beard Specialist", experience_years: 10, image_url: "", is_active: true }
    ];
}

function getFallbackTestimonials() {
    return [
        { id: 1, customer_name: "James Mwangi", comment: "Best barbershop in Nakuru!", rating: 5, is_approved: true },
        { id: 2, customer_name: "Brian Ochieng", comment: "Great service every time!", rating: 5, is_approved: true },
        { id: 3, customer_name: "Michael Otieno", comment: "Perfect haircut every time.", rating: 5, is_approved: true }
    ];
}

// ============================================
// 3. UPDATE UI
// ============================================
function updateServicesUI() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid || allServices.length === 0) return;
    
    servicesGrid.innerHTML = allServices.map(service => `
        <div class="service-card">
            <div class="service-icon">✂️</div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="service-details">
                <span class="price">KES ${service.price}</span>
                <span class="duration">${service.duration} min</span>
            </div>
            <button class="btn-primary" onclick="bookService(${service.id}, ${service.price})">
                Book Now
            </button>
        </div>
    `).join('');
}

function updateBarbersUI() {
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid || allBarbers.length === 0) return;
    
    barbersGrid.innerHTML = allBarbers.map(barber => `
        <div class="barber-card">
            <div class="barber-img">
                <img src="${barber.image_url || 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=400'}" alt="${barber.name}">
            </div>
            <h3>${barber.name}</h3>
            <p class="specialization">${barber.specialization}</p>
            <p class="experience">${barber.experience_years}+ years experience</p>
        </div>
    `).join('');
}

function updateTestimonialsUI() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid || allTestimonials.length === 0) return;
    
    testimonialsGrid.innerHTML = allTestimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="stars">${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</div>
            <p>"${testimonial.comment}"</p>
            <div class="customer-info">
                <strong>${testimonial.customer_name}</strong>
                <span>Verified Customer</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// 4. UPDATE BOOKING FORM DROPDOWNS
// ============================================
function updateBookingFormDropdowns() {
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
                    ${barber.name} - ${barber.specialization}
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
    
    // Enable booking system
    setTimeout(() => {
        if (typeof window.initializeBooking === 'function') {
            console.log('✅ Initializing booking system...');
            window.initializeBooking();
        } else {
            console.log('⏳ Waiting for booking.js to load...');
        }
    }, 1000);
}

// ============================================
// 5. GLOBAL FUNCTIONS
// ============================================
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

// ============================================
// 6. INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, starting main.js...');
    loadAllDataMain();
});

// Safety timeout - if data doesn't load in 5 seconds, show fallback
setTimeout(() => {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid && servicesGrid.innerHTML.includes('Loading') || servicesGrid.innerHTML === '') {
        console.log('⚠️ Data loading taking too long, showing fallback...');
        loadFallbackData();
    }
}, 5000);

console.log('✅ main.js loaded successfully');
