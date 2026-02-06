// js/main.js - DATABASE ONLY VERSION
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
    
    console.log('📡 Starting data load from database...');
    updateStatus('Loading data from database...', 'info');
    
    try {
        // Check if Supabase is available
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            updateStatus('Database connection failed', 'error');
            showEmptyStates();
            return;
        }
        
        // Load data in parallel
        const [services, barbers, testimonials] = await Promise.all([
            loadServicesFromDatabase(),
            loadBarbersFromDatabase(),
            loadTestimonialsFromDatabase()
        ]);
        
        allServices = services || [];
        allBarbers = barbers || [];
        allTestimonials = testimonials || [];
        
        console.log(`✅ Database data loaded: 
            ${allServices.length} services, 
            ${allBarbers.length} barbers, 
            ${allTestimonials.length} testimonials`);
        
        // Update UI
        updateServicesUI();
        updateBarbersUI();
        updateTestimonialsUI();
        updateBookingForm();
        
        // Show appropriate status
        if (allServices.length === 0) {
            updateStatus('No services found in database', 'warning');
        } else {
            updateStatus('System Ready', 'success');
        }
        
        isInitialized = true;
        
    } catch (error) {
        console.error('❌ Error loading data from database:', error);
        updateStatus('Database error', 'error');
        showEmptyStates();
    }
}

// Load services from database
async function loadServicesFromDatabase() {
    try {
        console.log('  ↳ Loading services from database...');
        
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) {
            console.error('  ↳ Error loading services:', error);
            return [];
        }
        
        console.log(`  ↳ Found ${data?.length || 0} active services`);
        return data || [];
        
    } catch (error) {
        console.error('  ↳ Exception loading services:', error);
        return [];
    }
}

// Load barbers from database
async function loadBarbersFromDatabase() {
    try {
        console.log('  ↳ Loading barbers from database...');
        
        const { data, error } = await window.supabase
            .from('barbers')
            .select('id, name, specialty, experience_years, bio, image_url, is_active')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) {
            console.error('  ↳ Error loading barbers:', error);
            return [];
        }
        
        console.log(`  ↳ Found ${data?.length || 0} active barbers`);
        return data || [];
        
    } catch (error) {
        console.error('  ↳ Exception loading barbers:', error);
        return [];
    }
}

// Load testimonials from database
async function loadTestimonialsFromDatabase() {
    try {
        console.log('  ↳ Loading testimonials from database...');
        
        const { data, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) {
            console.error('  ↳ Error loading testimonials:', error);
            return [];
        }
        
        console.log(`  ↳ Found ${data?.length || 0} approved testimonials`);
        return data || [];
        
    } catch (error) {
        console.error('  ↳ Exception loading testimonials:', error);
        return [];
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
                <h3>No Services Available</h3>
                <p>Services will be added soon. Please check back later.</p>
            </div>
        `;
    }
    
    if (barbersGrid) {
        barbersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No Barbers Available</h3>
                <p>Barber information will be updated soon.</p>
            </div>
        `;
    }
    
    if (testimonialsGrid) {
        testimonialsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <h3>No Testimonials Yet</h3>
                <p>Be the first to leave a review!</p>
            </div>
        `;
    }
}

// Update UI functions
function updateServicesUI() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) {
        console.error('❌ servicesGrid element not found');
        return;
    }
    
    if (allServices.length === 0) {
        servicesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cut"></i>
                <h3>No Services Available</h3>
                <p>All services are currently unavailable. Please check back later.</p>
            </div>
        `;
        return;
    }
    
    servicesGrid.innerHTML = allServices.map(service => {
        const duration = service.duration_minutes || service.duration || 30;
        
        return `
        <div class="service-card animate-ready">
            <div class="service-icon">✂️</div>
            <h3>${service.name || 'Unnamed Service'}</h3>
            <p>${service.description || 'Professional grooming service'}</p>
            <div class="service-details">
                <span class="price">KES ${service.price || '0'}</span>
                <span class="duration">${duration} min</span>
                ${service.category ? `<span class="category">${service.category}</span>` : ''}
            </div>
            <button class="btn-primary" onclick="bookService('${service.id}', '${service.name}', ${service.price})">
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
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid) {
        console.error('❌ barbersGrid element not found');
        return;
    }
    
    if (allBarbers.length === 0) {
        barbersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-tie"></i>
                <h3>No Barbers Available</h3>
                <p>All barbers are currently unavailable. Please check back later.</p>
            </div>
        `;
        return;
    }
    
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
    if (!testimonialsGrid) {
        console.error('❌ testimonialsGrid element not found');
        return;
    }
    
    if (allTestimonials.length === 0) {
        testimonialsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <h3>No Reviews Yet</h3>
                <p>Be the first to share your experience!</p>
            </div>
        `;
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
    console.log('🎨 Updating booking form with database data...');
    
    // Update service dropdown
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        if (allServices.length === 0) {
            serviceSelect.innerHTML = '<option value="">No services available</option>';
            serviceSelect.disabled = true;
        } else {
            serviceSelect.innerHTML = `
                <option value="">Select a service...</option>
                ${allServices.map(service => {
                    const duration = service.duration_minutes || service.duration || 30;
                    return `
                    <option value="${service.id}" 
                            data-price="${service.price}" 
                            data-duration="${duration}"
                            data-name="${service.name}">
                        ${service.name} - KES ${service.price} (${duration} min)
                    </option>
                    `;
                }).join('')}
            `;
            serviceSelect.disabled = false;
        }
    }
    
    // Update barber dropdown
    const barberSelect = document.getElementById('barberSelect');
    if (barberSelect) {
        if (allBarbers.length === 0) {
            barberSelect.innerHTML = '<option value="">No barbers available</option>';
            barberSelect.disabled = true;
        } else {
            barberSelect.innerHTML = `
                <option value="">Any Available Barber</option>
                ${allBarbers.map(barber => `
                    <option value="${barber.id}">
                        ${barber.name} - ${barber.specialty || 'Professional Barber'}
                    </option>
                `).join('')}
            `;
            barberSelect.disabled = false;
        }
    }
    
    // Update submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = (allServices.length === 0);
        submitBtn.innerHTML = submitBtn.disabled 
            ? '<i class="fas fa-calendar-times"></i> No Services Available'
            : '<i class="fas fa-calendar-check"></i> Confirm Booking';
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
window.bookService = function(serviceId, serviceName, price) {
    console.log(`📝 Booking service: ${serviceName} (KES ${price})`);
    
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceId;
        serviceSelect.dispatchEvent(new Event('change'));
    }
    
    // Update summary if it exists
    const serviceNameElement = document.getElementById('selectedServiceName');
    const servicePriceElement = document.getElementById('selectedServicePrice');
    
    if (serviceNameElement) serviceNameElement.textContent = serviceName;
    if (servicePriceElement) servicePriceElement.textContent = `KES ${price}`;
    
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
    }, 1000); // Increased delay to ensure Supabase is initialized
});

// Add CSS for animations and empty states
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
        .empty-state {
            grid-column: 1 / -1;
            text-align: center;
            padding: 3rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin: 1rem;
        }
        .empty-state i {
            font-size: 3rem;
            color: var(--secondary);
            margin-bottom: 1rem;
        }
        .empty-state h3 {
            color: var(--text-light);
            margin-bottom: 0.5rem;
        }
        .empty-state p {
            color: var(--text-muted);
        }
        .service-details .category {
            background: var(--accent);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-left: 0.5rem;
        }
        .barber-card .bio {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ main.js loaded successfully - Database Only Mode');
