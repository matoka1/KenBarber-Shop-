// main.js - FULLY CORRECTED VERSION
// ============================================

// GLOBAL STATE
let isDataLoading = false;
let isDataLoaded = false;
let allServices = [];
let allBarbers = [];

// ============================================
// MAIN INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 KenBarber Website Initializing...');
    
    // Initialize UI immediately
    initializeUI();
    
    // Start data loading
    startDataLoading();
    
    // Mark as initialized
    window.kenbarberInitialized = true;
    console.log('✅ Main.js initialization complete');
});

// ============================================
// 1. INITIALIZE UI
// ============================================
function initializeUI() {
    console.log('🖼️ Initializing UI components...');
    
    // Setup UI interactions
    initializeNavigation();
    initializeHeaderScroll();
    initializeAnimations();
    initializeCurrentYear();
    setupEventListeners();
    
    // Enable booking form with default values
    setupBookingForm();
    
    // Show loading state
    showLoadingSkeletons();
}

// ============================================
// 2. DATA LOADING
// ============================================
async function startDataLoading() {
    if (isDataLoading || isDataLoaded) return;
    
    isDataLoading = true;
    console.log('📡 Starting data loading...');
    
    try {
        // Try Supabase first
        let data;
        if (window.supabase) {
            console.log('🔍 Attempting Supabase connection...');
            data = await fetchFromDatabase();
        }
        
        // If no data from Supabase, use fallback
        if (!data || !data.services || data.services.length === 0) {
            console.log('⚠️ Using fallback data');
            data = getFallbackData();
        }
        
        // Update UI with data
        updateUIWithData(data);
        isDataLoaded = true;
        
        console.log('🎉 Data loading complete!');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Use fallback data on error
        const fallbackData = getFallbackData();
        updateUIWithData(fallbackData);
        isDataLoaded = true;
    } finally {
        isDataLoading = false;
    }
}

// ============================================
// 3. DATABASE FUNCTIONS
// ============================================
async function fetchFromDatabase() {
    try {
        console.log('🔍 Querying database...');
        
        const [servicesResult, barbersResult, testimonialsResult] = await Promise.all([
            fetchServices(),
            fetchBarbers(),
            fetchTestimonials()
        ]);
        
        return {
            services: servicesResult || [],
            barbers: barbersResult || [],
            testimonials: testimonialsResult || []
        };
    } catch (error) {
        console.error('Database fetch error:', error);
        return null;
    }
}

async function fetchServices() {
    try {
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

async function fetchBarbers() {
    try {
        const { data, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching barbers:', error);
        return [];
    }
}

async function fetchTestimonials() {
    try {
        const { data, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return [];
    }
}

// ============================================
// 4. FALLBACK DATA
// ============================================
function getFallbackData() {
    return {
        services: [
            { id: 1, name: "Classic Haircut", description: "Professional haircut with styling", price: 30, duration: 30, is_active: true },
            { id: 2, name: "Beard Trim & Shape", description: "Precision beard trimming and shaping", price: 20, duration: 20, is_active: true },
            { id: 3, name: "Haircut & Beard Combo", description: "Complete grooming package", price: 45, duration: 45, is_active: true },
            { id: 4, name: "Hot Towel Shave", description: "Traditional hot towel shave", price: 25, duration: 25, is_active: true },
            { id: 5, name: "Hair Coloring", description: "Professional hair coloring service", price: 50, duration: 60, is_active: true },
            { id: 6, name: "Kids Haircut", description: "Special haircut for children", price: 25, duration: 25, is_active: true }
        ],
        barbers: [
            { id: 1, name: "John Maina", specialization: "Traditional Cuts", experience_years: 8, image_url: "", is_active: true },
            { id: 2, name: "David Omondi", specialization: "Modern Styles", experience_years: 5, image_url: "", is_active: true },
            { id: 3, name: "Peter Kamau", specialization: "Beard Specialist", experience_years: 10, image_url: "", is_active: true }
        ],
        testimonials: [
            { id: 1, customer_name: "James Mwangi", comment: "Best barbershop in Nairobi! Always leave looking fresh.", rating: 5, is_approved: true },
            { id: 2, customer_name: "Brian Ochieng", comment: "Professional service and great atmosphere. Highly recommended!", rating: 5, is_approved: true },
            { id: 3, customer_name: "Michael Otieno", comment: "Perfect haircut every time. These guys know what they're doing.", rating: 5, is_approved: true }
        ]
    };
}

// ============================================
// 5. UI UPDATE FUNCTIONS
// ============================================
function updateUIWithData(data) {
    console.log('🎨 Updating UI with data...');
    
    allServices = data.services || [];
    allBarbers = data.barbers || [];
    
    // Update services
    if (allServices.length > 0) {
        updateServicesGrid(allServices);
        updateServiceDropdown(allServices);
    }
    
    // Update barbers
    if (allBarbers.length > 0) {
        updateBarbersGrid(allBarbers);
        updateBarberDropdown(allBarbers);
    }
    
    // Update testimonials
    if (data.testimonials && data.testimonials.length > 0) {
        updateTestimonialsGrid(data.testimonials);
    }
    
    // Enable booking form
    enableBookingForm();
    
    // Remove loading skeletons
    removeLoadingSkeletons();
    
    console.log('✅ UI updated successfully');
}

function updateServicesGrid(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card animate-ready">
            <div class="service-icon">✂️</div>
            <h3>${service.name}</h3>
            <p>${service.description || 'Professional grooming service'}</p>
            <div class="service-details">
                <span class="price">KES ${service.price}</span>
                <span class="duration">${service.duration} min</span>
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

function updateServiceDropdown(services) {
    const serviceSelect = document.getElementById('serviceType');
    if (!serviceSelect) return;
    
    serviceSelect.innerHTML = '<option value="">Select a service...</option>';
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - KES ${service.price}`;
        option.setAttribute('data-price', service.price);
        option.setAttribute('data-duration', service.duration);
        serviceSelect.appendChild(option);
    });
}

function updateBarbersGrid(barbers) {
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid) return;
    
    barbersGrid.innerHTML = barbers.map(barber => `
        <div class="barber-card animate-ready">
            <div class="barber-image">
                <img src="${barber.image_url || 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=400'}" alt="${barber.name}">
            </div>
            <h3>${barber.name}</h3>
            <p class="specialization">${barber.specialization || 'Professional Barber'}</p>
            <p class="experience">${barber.experience_years || 5}+ years experience</p>
        </div>
    `).join('');
    
    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 200);
}

function updateBarberDropdown(barbers) {
    const barberSelect = document.getElementById('barberName');
    if (!barberSelect) return;
    
    barberSelect.innerHTML = '<option value="">Select a barber...</option>';
    
    barbers.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = `${barber.name} - ${barber.specialization || 'Barber'}`;
        barberSelect.appendChild(option);
    });
}

function updateTestimonialsGrid(testimonials) {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid) return;
    
    testimonialsGrid.innerHTML = testimonials.map(testimonial => `
        <div class="testimonial-card animate-ready">
            <div class="stars">${'⭐'.repeat(testimonial.rating || 5)}</div>
            <p class="testimonial-text">"${testimonial.comment}"</p>
            <p class="customer-name">- ${testimonial.customer_name}</p>
        </div>
    `).join('');
    
    // Trigger animations
    setTimeout(() => {
        document.querySelectorAll('.animate-ready').forEach(card => {
            card.classList.add('animate-in');
        });
    }, 300);
}

// ============================================
// 6. LOADING STATES
// ============================================
function showLoadingSkeletons() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid && servicesGrid.children.length === 0) {
        servicesGrid.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-button"></div>
            </div>
            <div class="loading-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-button"></div>
            </div>
            <div class="loading-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-button"></div>
            </div>
        `;
    }
    
    // Add skeleton styles if not present
    addSkeletonStyles();
}

function removeLoadingSkeletons() {
    const skeletons = document.querySelectorAll('.loading-skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
}

function addSkeletonStyles() {
    if (!document.querySelector('#skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .loading-skeleton {
                background: #fff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                animation: pulse 1.5s ease-in-out infinite;
            }
            .skeleton-image {
                width: 100%;
                height: 200px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                border-radius: 4px;
                margin-bottom: 15px;
            }
            .skeleton-text {
                height: 20px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                border-radius: 4px;
                margin-bottom: 10px;
            }
            .skeleton-button {
                height: 40px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                border-radius: 4px;
                margin-top: 10px;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================
// 7. FORM SETUP & EVENT LISTENERS
// ============================================
function setupBookingForm() {
    // Set date restrictions
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
    
    // Initially disable submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Services...';
    }
}

function enableBookingForm() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
    
    console.log('✅ Booking form enabled');
}

function setupEventListeners() {
    // Service dropdown change
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                const price = selectedOption.getAttribute('data-price');
                const totalPrice = document.getElementById('totalPrice');
                if (totalPrice) {
                    totalPrice.textContent = `KES ${price}`;
                    totalPrice.style.display = 'inline-block';
                }
            }
        });
    }
    
    // Booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processBooking();
        });
    }
    
    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            subscribeNewsletter();
        });
    }
}

// ============================================
// 8. GLOBAL FUNCTIONS (for HTML onclick)
// ============================================
window.bookService = function(serviceId, price) {
    console.log(`📝 Booking service ${serviceId} for KES ${price}`);
    
    // Find and select the service
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceId;
        const event = new Event('change');
        serviceSelect.dispatchEvent(event);
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

window.subscribeNewsletter = async function() {
    const emailInput = document.getElementById('newsletterEmail');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    
    // Basic validation
    if (!email || !email.includes('@') || !email.includes('.')) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Show loading
    const button = emailInput.nextElementSibling;
    const originalText = button ? button.innerHTML : 'Subscribe';
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
    }
    
    try {
        // Save to database if available
        if (window.supabase) {
            const { error } = await window.supabase
                .from('newsletter_subscriptions')
                .upsert({ 
                    email: email,
                    subscribed_at: new Date().toISOString()
                });
            
            if (!error) {
                alert('Thank you for subscribing to KenBarber newsletter!');
            }
        }
    } catch (error) {
        console.warn('Could not save to database:', error);
        // Fallback to localStorage
        let subscriptions = JSON.parse(localStorage.getItem('kenbarber_newsletter') || '[]');
        if (!subscriptions.includes(email)) {
            subscriptions.push(email);
            localStorage.setItem('kenbarber_newsletter', JSON.stringify(subscriptions));
        }
        alert('Thank you for subscribing!');
    } finally {
        // Reset button
        if (button) {
            button.innerHTML = originalText;
        }
        emailInput.value = '';
    }
};

window.processBooking = async function() {
    console.log('📅 Processing booking...');
    
    // Get form values
    const serviceId = document.getElementById('serviceType').value;
    const barberId = document.getElementById('barberName').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const email = document.getElementById('customerEmail').value;
    
    // Validation
    if (!serviceId || !date || !time || !name || !phone) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get selected service
    const selectedService = allServices.find(s => s.id == serviceId);
    if (!selectedService) {
        alert('Please select a valid service');
        return;
    }
    
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Create booking object
        const bookingData = {
            service_id: serviceId,
            barber_id: barberId || null,
            service_name: selectedService.name,
            price: selectedService.price,
            customer_name: name,
            customer_phone: phone,
            customer_email: email || null,
            appointment_date: date,
            appointment_time: time,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        console.log('Booking data:', bookingData);
        
        // Try to save to database if Supabase is available
        if (window.supabase) {
            const { data, error } = await window.supabase
                .from('bookings')
                .insert([bookingData])
                .select();
            
            if (error) {
                console.error('Database save error:', error);
                throw error;
            }
            
            console.log('Booking saved to database:', data);
        } else {
            // Save to localStorage as fallback
            let bookings = JSON.parse(localStorage.getItem('kenbarber_bookings') || '[]');
            bookingData.id = Date.now(); // Generate ID
            bookings.push(bookingData);
            localStorage.setItem('kenbarber_bookings', JSON.stringify(bookings));
            console.log('Booking saved to localStorage');
        }
        
        // Show success message
        alert(`✅ Booking confirmed!\n\nService: ${selectedService.name}\nDate: ${date} at ${time}\nPrice: KES ${selectedService.price}\n\nThank you, ${name}! We'll contact you at ${phone} to confirm.`);
        
        // Reset form
        document.getElementById('bookingForm').reset();
        document.getElementById('totalPrice').style.display = 'none';
        
        // Reset date to tomorrow
        const dateInput = document.getElementById('appointmentDate');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('There was an error processing your booking. Please try again.');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// ============================================
// 9. UI INITIALIZATION FUNCTIONS
// ============================================
function initializeNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
                document.body.style.overflow = 'hidden';
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close menu when clicking links
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
                document.body.style.overflow = 'auto';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 80;
                
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initializeHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    function updateHeader() {
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(26, 26, 26, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
            header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.backgroundColor = '';
            header.style.backdropFilter = '';
            header.style.boxShadow = '';
        }
    }
    
    window.addEventListener('scroll', updateHeader);
    updateHeader();
}

function initializeAnimations() {
    // Use Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all cards
    document.querySelectorAll('.service-card, .barber-card, .testimonial-card').forEach(card => {
        card.classList.add('animate-ready');
        observer.observe(card);
    });
    
    // Add CSS for animations
    if (!document.querySelector('#animation-styles')) {
        const style = document.createElement('style');
        style.id = 'animation-styles';
        style.textContent = `
            .animate-ready {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .animate-in {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

function initializeCurrentYear() {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// ============================================
// 10. SAFETY NET
// ============================================
(function() {
    // Force initialization after 5 seconds if stuck
    setTimeout(() => {
        if (!isDataLoaded && !isDataLoading) {
            console.warn('⚠️ Initialization stuck, forcing continue...');
            const fallbackData = getFallbackData();
            updateUIWithData(fallbackData);
            enableBookingForm();
        }
    }, 5000);
})();

console.log('✅ main.js loaded successfully');
