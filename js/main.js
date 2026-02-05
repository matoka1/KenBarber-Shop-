// js/main.js - ULTRA SIMPLE VERSION
console.log('🏁 KenBarber Main.js Initializing...');

// Global state
let allServices = [];

// Load data when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready, loading data...');
    loadServices();
});

async function loadServices() {
    console.log('📡 Loading services...');
    
    try {
        let services = [];
        
        if (window.supabase) {
            console.log('🔍 Querying Supabase...');
            const { data, error } = await window.supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });
            
            if (!error && data) {
                services = data;
                console.log(`✅ Loaded ${services.length} services from Supabase`);
            } else {
                console.warn('Supabase error, using fallback:', error);
                services = getFallbackServices();
            }
        } else {
            console.warn('Supabase not available, using fallback');
            services = getFallbackServices();
        }
        
        allServices = services;
        updateServicesUI(services);
        updateServiceDropdown(services);
        
    } catch (error) {
        console.error('❌ Error loading services:', error);
        const fallback = getFallbackServices();
        allServices = fallback;
        updateServicesUI(fallback);
        updateServiceDropdown(fallback);
    }
}

function getFallbackServices() {
    return [
        { id: 1, name: "Classic Haircut", description: "Professional haircut with styling", price: 30, duration: 30 },
        { id: 2, name: "Beard Trim", description: "Precision beard trimming", price: 20, duration: 20 },
        { id: 3, name: "Haircut & Beard", description: "Complete grooming package", price: 45, duration: 45 },
        { id: 4, name: "Hot Towel Shave", description: "Traditional hot towel shave", price: 25, duration: 25 },
        { id: 5, name: "Kids Haircut", description: "Special haircut for children", price: 25, duration: 25 }
    ];
}

function updateServicesUI(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    console.log('🎨 Updating services UI...');
    
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
    
    console.log('✅ Services UI updated');
}

function updateServiceDropdown(services) {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = `
        <option value="">Select a service...</option>
        ${services.map(service => `
            <option value="${service.id}" data-price="${service.price}" data-name="${service.name}">
                ${service.name} - KES ${service.price}
            </option>
        `).join('')}
    `;
    
    // Enable the booking form
    setTimeout(() => {
        if (typeof window.initializeBooking === 'function') {
            console.log('✅ Initializing booking system...');
            window.initializeBooking();
        }
        
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
    }, 500);
}

// Global function for booking from service cards
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

console.log('✅ main.js loaded successfully');
