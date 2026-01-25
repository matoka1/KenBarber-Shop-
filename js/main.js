// main.js - DATABASE ONLY FIXED VERSION
// ============================================

// GLOBAL STATE - To prevent multiple loads
let isDataLoading = false;
let isDataLoaded = false;
let allServices = [];
let allBarbers = [];

// ============================================
// MAIN INITIALIZATION - SIMPLIFIED
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 KenBarber Website Initializing...');
    
    // Initialize UI immediately (no waiting)
    initializeUI();
    
    // Start data loading with timeout protection
    startDataLoading();
});

// ============================================
// 1. INITIALIZE UI (NO DATABASE DEPENDENCY)
// ============================================
function initializeUI() {
    console.log('🖼️ Initializing UI components...');
    
    // Show loading states
    showLoadingSkeletons();
    
    // Setup UI interactions
    initializeNavigation();
    initializeHeaderScroll();
    initializeAnimations();
    initializeCurrentYear();
    setupEventListeners();
    
    // Enable booking form with default values
    setupBookingForm();
}

// ============================================
// 2. START DATA LOADING WITH SAFETY CHECKS
// ============================================
async function startDataLoading() {
    // Prevent multiple simultaneous loads
    if (isDataLoading) {
        console.log('⚠️ Data already loading, skipping...');
        return;
    }
    
    if (isDataLoaded) {
        console.log('✅ Data already loaded');
        return;
    }
    
    isDataLoading = true;
    console.log('📡 Starting data loading from database...');
    
    try {
        // Safety timeout (15 seconds max)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database timeout after 15 seconds')), 15000);
        });
        
        // Race between database fetch and timeout
        const dataPromise = fetchFromDatabase();
        const data = await Promise.race([dataPromise, timeoutPromise]);
        
        // Update UI with real data
        updateUIWithData(data);
        isDataLoaded = true;
        
        console.log('🎉 Data loading complete!');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showDataError(error);
        
        // Try one more time after delay
        setTimeout(() => retryDataLoading(), 3000);
        
    } finally {
        isDataLoading = false;
    }
}

// ============================================
// 3. DATABASE FETCH FUNCTIONS
// ============================================
async function fetchFromDatabase() {
    // Validate Supabase is available
    if (!window.supabase || typeof window.supabase.from !== 'function') {
        throw new Error('Supabase client not available');
    }
    
    console.log('🔍 Querying database...');
    
    // Fetch ALL data in parallel
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
}

async function fetchServices() {
    try {
        console.log('  ↳ Fetching services...');
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        console.log(`  ↳ Found ${data?.length || 0} services`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error fetching services:', error);
        return [];
    }
}

async function fetchBarbers() {
    try {
        console.log('  ↳ Fetching barbers...');
        const { data, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) throw error;
        console.log(`  ↳ Found ${data?.length || 0} barbers`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error fetching barbers:', error);
        return [];
    }
}

async function fetchTestimonials() {
    try {
        console.log('  ↳ Fetching testimonials...');
        const { data, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        console.log(`  ↳ Found ${data?.length || 0} testimonials`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error fetching testimonials:', error);
        return [];
    }
}

// ============================================
// 4. UI UPDATE FUNCTIONS
// ============================================
function updateUIWithData(data) {
    console.log('🎨 Updating UI with database data...');
    
    allServices = data.services;
    allBarbers = data.barbers;
    
    // Update each section
    if (data.services.length > 0) {
        updateServicesGrid(data.services);
        updateServiceDropdown(data.services);
        updatePopularServices(data.services);
    }
    
    if (data.barbers.length > 0) {
        updateBarbersGrid(data.barbers);
        updateBarberDropdown(data.barbers);
    }
    
    if (data.testimonials.length > 0) {
        updateTestimonialsGrid(data.testimonials);
    } else {
        // Try to load default testimonials if none in DB
        loadDefaultTestimonials();
    }
    
    // Enable booking form
    enableBookingForm();
    console.log('✅ UI updated successfully');
}

// ============================================
// 5. LOADING STATES & SKELETONS
// ============================================
function showLoadingSkeletons() {
    // Services loading skeleton
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
    
    // Add CSS for skeletons if not already present
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
// 6. ERROR HANDLING & RETRY
// ============================================
function showDataError(error) {
    console.error('📛 Data loading failed:', error);
    
    // Show user-friendly error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'data-error-message';
    errorDiv.innerHTML = `
        <div style="
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        ">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Database Connection Issue</strong>
            <p>Loading data from server... Will retry in 3 seconds</p>
            <small>Error: ${error.message || 'Unknown error'}</small>
        </div>
    `;
    
    // Insert at top of main content
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(errorDiv, main.firstChild);
    }
}

function retryDataLoading() {
    console.log('🔄 Retrying data loading...');
    startDataLoading();
}

// ============================================
// 7. EVENT LISTENERS & FORM SETUP
// ============================================
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
    
    // Newsletter subscription
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            subscribeNewsletter();
        });
    }
}

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
    
    // Initially disable submit button (will be enabled when data loads)
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Data...';
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

// ============================================
// 8. GLOBAL FUNCTIONS (HTML onClick handlers)
// ============================================
window.bookService = function(serviceId, price) {
    console.log(`📝 Booking service ${serviceId} for KES ${price}`);
    
    // Find and select the service
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        // Find the option
        for (let option of serviceSelect.options) {
            if (option.value === serviceId) {
                serviceSelect.value = serviceId;
                // Trigger change event
                const event = new Event('change');
                serviceSelect.dispatchEvent(event);
                break;
            }
        }
    }
    
    // Smooth scroll to booking form
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
    const originalText = emailInput.nextElementSibling?.innerHTML || 'Subscribe';
    if (emailInput.nextElementSibling) {
        emailInput.nextElementSibling.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
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
                emailInput.value = '';
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
        if (emailInput.nextElementSibling) {
            emailInput.nextElementSibling.innerHTML = originalText;
        }
        emailInput.value = '';
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
    updateHeader(); // Initial check
}

function initializeAnimations() {
    // Use Intersection Observer for better performance
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
// 10. UTILITY FUNCTIONS
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
    return re.test(phone.replace(/\s/g, ''));
}

// ============================================
// INITIALIZATION SAFETY NET
// ============================================
(function() {
    // Track initialization state
    window.kenbarberLoaded = false;
    
    // Set a safety timeout
    const safetyTimeout = setTimeout(() => {
        if (!window.kenbarberLoaded) {
            console.warn('⚠️ Initialization taking too long, forcing continue...');
            window.kenbarberLoaded = true;
            
            // Show any data we have
            if (allServices.length === 0) {
                console.warn('No services loaded, showing empty state');
            }
            
            // Enable form anyway
            enableBookingForm();
        }
    }, 10000); // 10 second timeout
    
    // Mark as loaded when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        clearTimeout(safetyTimeout);
        window.kenbarberLoaded = true;
    });
})();

// ============================================
// KEEP YOUR EXISTING UI UPDATE FUNCTIONS
// (updateServicesGrid, updateBarbersGrid, etc.)
// They should work as-is with this new structure
// ============================================
