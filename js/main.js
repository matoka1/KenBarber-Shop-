// main.js - FIXED VERSION
// All functions are now properly accessible

// ============================================
// GLOBAL VARIABLES
// ============================================
let allServices = [];
let allBarbers = [];

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing KenBarber Website...');
    
    // Show loading states
    showLoadingStates();
    
    // Load data
    await loadAllData();
    
    // Initialize other features
    initializeNavigation();
    initializeHeaderScroll();
    initializeAnimations();
    initializeCurrentYear();
    
    console.log('Website initialized successfully');
});

// ============================================
// 1. LOADING STATES
// ============================================
function showLoadingStates() {
    // Services grid loading
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="loading-service">
                <div class="service-img" style="background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
                </div>
                <div class="service-content">
                    <h3>Loading Services...</h3>
                    <p>Please wait while we load our service menu</p>
                    <div class="service-footer">
                        <span class="price">KES 0</span>
                        <span class="duration"><i class="far fa-clock"></i> 0 min</span>
                    </div>
                    <button class="btn-primary" style="width: 100%; margin-top: 1rem;" disabled>
                        <i class="fas fa-spinner fa-spin"></i> Loading...
                    </button>
                </div>
            </div>
        `;
    }
    
    // Barbers grid loading
    const barbersGrid = document.getElementById('barbersGrid');
    if (barbersGrid) {
        barbersGrid.innerHTML = `
            <div class="loading-barber">
                <div class="barber-img" style="background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
                </div>
                <div class="barber-info">
                    <h3>Loading Barbers...</h3>
                    <p class="barber-title">Please wait</p>
                    <p>Our barber information is loading</p>
                    <div class="barber-social">
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="tel:+254712345678"><i class="fas fa-phone"></i></a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Testimonials loading
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (testimonialsGrid) {
        testimonialsGrid.innerHTML = `
            <div class="testimonial-card">
                <div class="rating">
                    <i class="fas fa-spinner fa-spin" style="color: gold;"></i>
                    <i class="fas fa-spinner fa-spin" style="color: gold;"></i>
                    <i class="fas fa-spinner fa-spin" style="color: gold;"></i>
                    <i class="fas fa-spinner fa-spin" style="color: gold;"></i>
                    <i class="fas fa-spinner fa-spin" style="color: gold;"></i>
                </div>
                <p>Loading customer reviews from our database...</p>
                <div class="customer-info">
                    <strong>Loading...</strong>
                    <span>Please wait</span>
                </div>
            </div>
        `;
    }
    
    // Dropdowns loading
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Loading Services...</option>';
        serviceSelect.disabled = true;
    }
    
    const barberSelect = document.getElementById('barberSelect');
    if (barberSelect) {
        barberSelect.innerHTML = '<option value="">Loading Barbers...</option>';
        barberSelect.disabled = true;
    }
    
    // Submit button loading
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
}

// ============================================
// 2. DATA LOADING FUNCTIONS
// ============================================
async function loadAllData() {
    try {
        if (!window.supabase) {
            console.error('Supabase not available');
            showErrorMessage('Database connection failed');
            return;
        }
        
        // Load services
        const services = await loadServices();
        allServices = services;
        
        // Load barbers
        const barbers = await loadBarbers();
        allBarbers = barbers;
        
        // Load testimonials
        await loadTestimonials();
        
        // Enable booking form
        enableBookingForm();
        
        console.log(`Loaded ${services.length} services, ${barbers.length} barbers`);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showErrorMessage('Failed to load data. Please refresh.');
    }
}

async function loadServices() {
    try {
        const { data: services, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        
        if (!services || services.length === 0) {
            console.warn('No services found');
            return [];
        }
        
        // Update UI
        updateServicesGrid(services);
        updateServiceDropdown(services);
        updatePopularServices(services);
        
        return services;
        
    } catch (error) {
        console.error('Error loading services:', error);
        return [];
    }
}

async function loadBarbers() {
    try {
        const { data: barbers, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) throw error;
        
        if (!barbers || barbers.length === 0) {
            console.warn('No barbers found');
            return [];
        }
        
        // Update UI
        updateBarbersGrid(barbers);
        updateBarberDropdown(barbers);
        
        return barbers;
        
    } catch (error) {
        console.error('Error loading barbers:', error);
        return [];
    }
}

async function loadTestimonials() {
    try {
        const { data: testimonials, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        
        if (!testimonials || testimonials.length === 0) {
            console.log('No testimonials, using defaults');
            loadDefaultTestimonials();
            return [];
        }
        
        updateTestimonialsGrid(testimonials);
        return testimonials;
        
    } catch (error) {
        console.error('Error loading testimonials:', error);
        loadDefaultTestimonials();
        return [];
    }
}

// ============================================
// 3. UI UPDATE FUNCTIONS
// ============================================
function updateServicesGrid(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = '';
    
    const serviceImages = [
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1562788869-4ed32648eb72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ];
    
    services.forEach((service, index) => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <div class="service-img" style="background-image: url('${serviceImages[index % serviceImages.length]}');"></div>
            <div class="service-content">
                <h3>${service.name}</h3>
                <p>${service.description || 'Premium grooming service'}</p>
                <div class="service-footer">
                    <span class="price">KES ${service.price}</span>
                    <span class="duration"><i class="far fa-clock"></i> ${service.duration_minutes || 30} min</span>
                </div>
                <button class="btn-primary" style="width: 100%; margin-top: 1rem;" 
                        onclick="bookService('${service.id}', ${service.price})">
                    Book Now
                </button>
            </div>
        `;
        servicesGrid.appendChild(serviceCard);
    });
}

function updateServiceDropdown(services) {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    serviceSelect.disabled = false;
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - KES ${service.price}`;
        option.setAttribute('data-price', service.price);
        option.setAttribute('data-name', service.name);
        serviceSelect.appendChild(option);
    });
    
    // Add change event
    serviceSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            const price = selectedOption.getAttribute('data-price');
            const priceDisplay = document.getElementById('priceDisplay');
            const totalPrice = document.getElementById('totalPrice');
            if (priceDisplay && totalPrice) {
                totalPrice.textContent = `KES ${price}`;
                priceDisplay.style.display = 'block';
            }
        }
    });
}

function updateBarbersGrid(barbers) {
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid) return;
    
    barbersGrid.innerHTML = '';
    
    const barberImages = [
        'https://images.unsplash.com/photo-1562788869-4ed32648eb72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        'https://images.unsplash.com/photo-1593702275682-4b8e9be41d8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
    ];
    
    barbers.forEach((barber, index) => {
        const barberCard = document.createElement('div');
        barberCard.className = 'barber-card';
        barberCard.innerHTML = `
            <div class="barber-img" style="background-image: url('${barber.image_url || barberImages[index % barberImages.length]}');"></div>
            <div class="barber-info">
                <h3>${barber.name}</h3>
                <p class="barber-title">${barber.specialty} | ${barber.experience_years || 5} Years Experience</p>
                <p>${barber.bio || 'Skilled professional barber'}</p>
                <div class="barber-expertise">
                    <span class="expertise-tag">Expert</span>
                    <span class="expertise-tag">Professional</span>
                </div>
                <div class="barber-social">
                    ${barber.instagram ? `<a href="${barber.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                    ${barber.facebook ? `<a href="${barber.facebook}" target="_blank"><i class="fab fa-facebook"></i></a>` : ''}
                    <a href="tel:+254712345678"><i class="fas fa-phone"></i></a>
                </div>
            </div>
        `;
        barbersGrid.appendChild(barberCard);
    });
}

function updateBarberDropdown(barbers) {
    const barberSelect = document.getElementById('barberSelect');
    if (!barberSelect) return;
    
    barberSelect.innerHTML = '<option value="">Any Available Barber</option>';
    barberSelect.disabled = false;
    
    barbers.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = `${barber.name} (${barber.specialty})`;
        barberSelect.appendChild(option);
    });
}

function updateTestimonialsGrid(testimonials) {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid) return;
    
    testimonialsGrid.innerHTML = '';
    
    testimonials.forEach(testimonial => {
        const rating = testimonial.rating || 5;
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        const testimonialCard = document.createElement('div');
        testimonialCard.className = 'testimonial-card';
        testimonialCard.innerHTML = `
            <div class="rating">
                ${stars.split('').map(star => 
                    star === '★' ? '<i class="fas fa-star" style="color: gold;"></i>' : 
                    '<i class="far fa-star" style="color: gold;"></i>'
                ).join('')}
            </div>
            <p>"${testimonial.comment || 'Great service!'}"</p>
            <div class="customer-info">
                <strong>${testimonial.customer_name || 'Happy Customer'}</strong>
                <span>${testimonial.customer_location || 'Nakuru'}</span>
            </div>
        `;
        testimonialsGrid.appendChild(testimonialCard);
    });
}

function updatePopularServices(services) {
    const popularServicesList = document.getElementById('popularServicesList');
    if (!popularServicesList) return;
    
    popularServicesList.innerHTML = '';
    
    const popularServices = services.slice(0, 6);
    
    popularServices.forEach(service => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#booking" onclick="bookService('${service.id}', ${service.price})">${service.name} - KES ${service.price}</a>`;
        popularServicesList.appendChild(li);
    });
}

function loadDefaultTestimonials() {
    const defaultTestimonials = [
        {
            customer_name: 'John Mwangi',
            comment: 'Best barber in Nakuru! Always leave looking fresh.',
            rating: 5,
            customer_location: 'Nakuru'
        },
        {
            customer_name: 'David Kimani',
            comment: 'Professional service and friendly staff. Highly recommended!',
            rating: 5,
            customer_location: 'London Ward'
        }
    ];
    
    updateTestimonialsGrid(defaultTestimonials);
}

function enableBookingForm() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        submitBtn.style.opacity = '1';
    }
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

// ============================================
// 4. GLOBAL FUNCTIONS (accessible from HTML)
// ============================================
window.bookService = function(serviceId, price) {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    // Find and select the service
    for (let option of serviceSelect.options) {
        if (option.value === serviceId) {
            serviceSelect.value = serviceId;
            break;
        }
    }
    
    // Trigger change event
    const event = new Event('change');
    serviceSelect.dispatchEvent(event);
    
    // Scroll to booking form
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = bookingSection.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
};

window.subscribeNewsletter = async function() {
    const emailInput = document.getElementById('newsletterEmail');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email address');
        return;
    }
    
    try {
        if (window.supabase) {
            const { error } = await window.supabase
                .from('newsletter_subscriptions')
                .upsert({ 
                    email: email,
                    subscribed_at: new Date().toISOString()
                }, { 
                    onConflict: 'email'
                });
            
            if (!error) {
                alert('Thank you for subscribing!');
                emailInput.value = '';
                return;
            }
        }
    } catch (error) {
        console.warn('Could not save to Supabase:', error);
    }
    
    // Fallback to localStorage
    let subscriptions = JSON.parse(localStorage.getItem('kenbarber_newsletter') || '[]');
    if (!subscriptions.includes(email)) {
        subscriptions.push(email);
        localStorage.setItem('kenbarber_newsletter', JSON.stringify(subscriptions));
    }
    
    alert('Thank you for subscribing!');
    emailInput.value = '';
};

// ============================================
// 5. ERROR HANDLING
// ============================================
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            margin: 20px auto;
            max-width: 600px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            </div>
            <button onclick="location.reload()" 
                style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
    
    const main = document.querySelector('main');
    if (main) {
        main.prepend(errorDiv);
    } else {
        document.body.prepend(errorDiv);
    }
}

// ============================================
// 6. UTILITY FUNCTIONS
// ============================================
function initializeNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                document.body.style.overflow = 'hidden';
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                document.body.style.overflow = 'auto';
            }
        });
        
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.add('fa-bars');
                mobileToggle.querySelector('i').classList.remove('fa-times');
                document.body.style.overflow = 'auto';
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.add('fa-bars');
                mobileToggle.querySelector('i').classList.remove('fa-times');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initializeHeaderScroll() {
    const header = document.querySelector('header');
    
    function handleHeaderScroll() {
        if (!header) return;
        
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.backgroundColor = 'var(--secondary)';
            header.style.backdropFilter = 'none';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    }
    
    window.addEventListener('scroll', handleHeaderScroll);
    handleHeaderScroll();
}

function initializeAnimations() {
    function animateOnScroll() {
        const elements = document.querySelectorAll('.service-card, .barber-card, .testimonial-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
    
    document.querySelectorAll('.service-card, .barber-card, .testimonial-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
}
// In main.js, after all data is loaded, trigger booking.js initialization
async function loadAllData() {
    try {
        await loadServices();
        await loadBarbers();
        await loadTestimonials();
        
        console.log('Loaded services and barbers, now enabling booking system...');
        
        // Enable booking system after data is loaded
        setTimeout(() => {
            if (window.initializeBooking) {
                window.initializeBooking();
            } else {
                console.log('Waiting for booking.js to load...');
                setTimeout(() => {
                    if (window.initializeBooking) {
                        window.initializeBooking();
                    }
                }, 1000);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}
function initializeCurrentYear() {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// ============================================
// 7. FORM VALIDATION (for booking.js)
// ============================================
window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

window.validatePhone = function(phone) {
    const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
    return re.test(phone.replace(/\s/g, ''));
};
