// main.js - Main JavaScript for KenBarber Website with Supabase Integration
// REAL SUPABASE VERSION - FIXED LOADING STATES

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing KenBarber Website with Real Supabase...');
    
    // ============================================
    // 0. INITIAL LOADING STATES
    // ============================================
    function showLoadingStates() {
        // Services loading state
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
        
        // Barbers loading state
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
        
        // Testimonials loading state
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
        
        // Service dropdown loading state
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Loading Services...</option>';
            serviceSelect.disabled = true;
        }
        
        // Barber dropdown loading state
        const barberSelect = document.getElementById('barberSelect');
        if (barberSelect) {
            barberSelect.innerHTML = '<option value="">Loading Barbers...</option>';
            barberSelect.disabled = true;
        }
        
        // Submit button loading state
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Booking System...';
        }
    }
    
    // Show initial loading states
    showLoadingStates();
    
    // ============================================
    // 1. SUPABASE DATA LOADING - REAL DATABASE
    // ============================================
    async function loadDataFromSupabase() {
        try {
            // Check if Supabase is available
            if (!window.supabase) {
                console.error('Supabase not available');
                showErrorMessage('Database connection failed. Please refresh the page.');
                return false;
            }
            
            console.log('Loading data from Supabase...');
            
            // Test connection first
            const { data: testData, error: testError } = await window.supabase
                .from('services')
                .select('id')
                .limit(1);
            
            if (testError) {
                console.error('Supabase connection test failed:', testError);
                throw testError;
            }
            
            console.log('Supabase connection successful, loading data...');
            
            // Load all data in parallel
            const [services, barbers, testimonials] = await Promise.all([
                loadServices(),
                loadBarbers(),
                loadTestimonials()
            ]);
            
            console.log(`Loaded ${services.length} services, ${barbers.length} barbers, ${testimonials.length} testimonials`);
            
            // Enable booking form
            enableBookingForm();
            
            // Load special offers (non-critical)
            try {
                await loadSpecialOffers();
            } catch (offerError) {
                console.warn('Could not load special offers:', offerError);
            }
            
            return true;
            
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            
            // Check if it's a CORS error
            if (error.message && (error.message.includes('CORS') || error.message.includes('NetworkError'))) {
                showErrorMessage(
                    'CORS Configuration Needed. Please configure Supabase to allow GitHub Pages. ' +
                    'Go to Supabase Dashboard → Authentication → URL Configuration → Add: https://matoka1.github.io'
                );
            } else {
                showErrorMessage('Failed to load data from database. Please try again later.');
            }
            
            return false;
        }
    }
    
    async function loadServices() {
        try {
            console.log('Loading services from Supabase...');
            const { data: services, error } = await window.supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });
            
            if (error) {
                console.error('Error loading services:', error);
                // Return empty array but don't crash
                return [];
            }
            
            if (!services || services.length === 0) {
                console.warn('No services found in database');
                showNoServicesMessage();
                return [];
            }
            
            // Update services grid
            updateServicesGrid(services);
            
            // Update service dropdown
            updateServiceDropdown(services);
            
            // Update popular services in footer
            updatePopularServices(services);
            
            console.log(`Loaded ${services.length} services`);
            return services;
            
        } catch (error) {
            console.error('Unexpected error loading services:', error);
            return [];
        }
    }
    
    async function loadBarbers() {
        try {
            console.log('Loading barbers from Supabase...');
            const { data: barbers, error } = await window.supabase
                .from('barbers')
                .select('*')
                .eq('is_active', true)
                .order('experience_years', { ascending: false });
            
            if (error) {
                console.error('Error loading barbers:', error);
                return [];
            }
            
            if (!barbers || barbers.length === 0) {
                console.warn('No barbers found in database');
                showNoBarbersMessage();
                return [];
            }
            
            // Update barbers grid
            updateBarbersGrid(barbers);
            
            // Update barber dropdown
            updateBarberDropdown(barbers);
            
            console.log(`Loaded ${barbers.length} barbers`);
            return barbers;
            
        } catch (error) {
            console.error('Unexpected error loading barbers:', error);
            return [];
        }
    }
    
    async function loadTestimonials() {
        try {
            console.log('Loading testimonials from Supabase...');
            const { data: testimonials, error } = await window.supabase
                .from('testimonials')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(6);
            
            if (error) {
                console.error('Error loading testimonials:', error);
                return [];
            }
            
            if (!testimonials || testimonials.length === 0) {
                console.log('No testimonials found in database');
                loadDefaultTestimonials();
                return [];
            }
            
            // Update testimonials grid
            updateTestimonialsGrid(testimonials);
            
            console.log(`Loaded ${testimonials.length} testimonials`);
            return testimonials;
            
        } catch (error) {
            console.error('Unexpected error loading testimonials:', error);
            return [];
        }
    }
    
    async function loadSpecialOffers() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data: offers, error } = await window.supabase
                .from('special_offers')
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', today)
                .gte('valid_until', today)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) {
                console.error('Error loading special offers:', error);
                return null;
            }
            
            // Update special offer banner
            if (offers && offers.length > 0) {
                updateSpecialOfferBanner(offers[0]);
                console.log('Loaded special offer:', offers[0].title);
                return offers[0];
            }
            
            return null;
            
        } catch (error) {
            console.error('Unexpected error loading special offers:', error);
            return null;
        }
    }
    
    function showNoServicesMessage() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (servicesGrid) {
            servicesGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-cut fa-3x" style="color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No Services Available</h3>
                    <p>Please check back later or contact us directly.</p>
                </div>
            `;
        }
    }
    
    function showNoBarbersMessage() {
        const barbersGrid = document.getElementById('barbersGrid');
        if (barbersGrid) {
            barbersGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-user-tie fa-3x" style="color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No Barbers Available</h3>
                    <p>Our barbers schedule is being updated. Please check back soon.</p>
                </div>
            `;
        }
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
            },
            {
                customer_name: 'Peter Omondi',
                comment: 'Great haircuts at reasonable prices. My go-to barber shop.',
                rating: 4,
                customer_location: 'Nakuru Town'
            }
        ];
        
        updateTestimonialsGrid(defaultTestimonials);
    }
    
    function updateServicesGrid(services) {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) {
            console.error('servicesGrid element not found');
            return;
        }
        
        servicesGrid.innerHTML = '';
        
        // Default image URLs
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
                            onclick="window.bookService('${service.id}', ${service.price}, '${service.name.replace(/'/g, "\\'")}')">
                        Book Now
                    </button>
                </div>
            `;
            servicesGrid.appendChild(serviceCard);
        });
    }
    
    function updateServiceDropdown(services) {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) {
            console.error('serviceType element not found');
            return;
        }
        
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
        
        // Add change event listener
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
        if (!barbersGrid) {
            console.error('barbersGrid element not found');
            return;
        }
        
        barbersGrid.innerHTML = '';
        
        // Image URLs for barbers
        const barberImages = [
            'https://images.unsplash.com/photo-1562788869-4ed32648eb72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1593702275682-4b8e9be41d8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
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
        if (!barberSelect) {
            console.error('barberSelect element not found');
            return;
        }
        
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
        if (!testimonialsGrid) {
            console.error('testimonialsGrid element not found');
            return;
        }
        
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
    
    function updateSpecialOfferBanner(offer) {
        const banner = document.getElementById('specialOfferBanner');
        if (banner && offer) {
            banner.textContent = `🎉 ${offer.title}: ${offer.description || ''} 🎉`;
            
            // Add dismiss button if not already present
            if (!banner.querySelector('.offer-dismiss')) {
                const dismissBtn = document.createElement('button');
                dismissBtn.className = 'offer-dismiss';
                dismissBtn.innerHTML = '&times;';
                dismissBtn.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0 5px;
                `;
                dismissBtn.addEventListener('click', () => {
                    banner.style.display = 'none';
                    localStorage.setItem('kenbarber_offer_dismissed', Date.now().toString());
                });
                banner.style.position = 'relative';
                banner.appendChild(dismissBtn);
            }
        }
    }
    
    function updatePopularServices(services) {
        const popularServicesList = document.getElementById('popularServicesList');
        if (!popularServicesList) {
            console.warn('popularServicesList element not found');
            return;
        }
        
        popularServicesList.innerHTML = '';
        
        // Take top 6 services or all if less than 6
        const popularServices = services.slice(0, 6);
        
        popularServices.forEach(service => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#booking" onclick="window.bookService('${service.id}', ${service.price}, '${service.name.replace(/'/g, "\\'")}')">${service.name} - KES ${service.price}</a>`;
            popularServicesList.appendChild(li);
        });
    }
    
    function enableBookingForm() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
            submitBtn.style.opacity = '1';
        }
        
        // Enable date picker
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];
            
            // Set max date to 3 months from now
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            dateInput.max = maxDate.toISOString().split('T')[0];
            
            // Set initial date to tomorrow
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }
    }
    
    // Start loading data
    console.log('Starting data load from Supabase...');
    await loadDataFromSupabase();
    
    // ============================================
    // 2. MOBILE NAVIGATION TOGGLE
    // ============================================
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
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.add('fa-bars');
                mobileToggle.querySelector('i').classList.remove('fa-times');
                document.body.style.overflow = 'auto';
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileToggle.querySelector('i').classList.add('fa-bars');
                mobileToggle.querySelector('i').classList.remove('fa-times');
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // ============================================
    // 3. SMOOTH SCROLLING FOR ANCHOR LINKS
    // ============================================
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
                
                // Update URL hash without scrolling
                history.pushState(null, null, targetId);
            }
        });
    });
    
    // ============================================
    // 4. HEADER SCROLL EFFECT
    // ============================================
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
    
    // ============================================
    // 5. ANIMATION ON SCROLL
    // ============================================
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
    
    // Set initial state for animation
    document.querySelectorAll('.service-card, .barber-card, .testimonial-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
    
    // ============================================
    // 6. COUNTER ANIMATIONS
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }
    
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target') || '0');
                    animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    // ============================================
    // 7. FORM VALIDATION HELPERS
    // ============================================
    window.validateEmail = function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    window.validatePhone = function(phone) {
        // Kenyan phone number validation
        const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
        return re.test(phone.replace(/\s/g, ''));
    };
    
    // ============================================
    // 8. NOTIFICATION SYSTEM
    // ============================================
    window.showNotification = function(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.global-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `global-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${message}
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    };
    
    // ============================================
    // 9. SERVICE BOOKING SHORTCUTS
    // ============================================
    window.bookService = function(serviceId, price, serviceName) {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;
        
        // Find and select the service
        for (let option of serviceSelect.options) {
            if (option.value === serviceId) {
                serviceSelect.value = serviceId;
                break;
            }
        }
        
        // Trigger change event to update price
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
    
    // ============================================
    // 10. NEWSLETTER SUBSCRIPTION
    // ============================================
    window.subscribeNewsletter = async function() {
        const emailInput = document.getElementById('newsletterEmail');
        if (!emailInput) return;
        
        const email = emailInput.value.trim();
        
        if (!email || !validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            // Save to Supabase
            if (window.supabase) {
                const { error } = await window.supabase
                    .from('newsletter_subscriptions')
                    .upsert({ 
                        email: email,
                        subscribed_at: new Date().toISOString()
                    }, { 
                        onConflict: 'email'
                    });
                
                if (error) throw error;
                
                showNotification('Thank you for subscribing to KenBarber updates!');
                emailInput.value = '';
                return;
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
        }
        
        // Fallback to localStorage if Supabase fails
        let subscriptions = JSON.parse(localStorage.getItem('kenbarber_newsletter') || '[]');
        if (!subscriptions.includes(email)) {
            subscriptions.push(email);
            localStorage.setItem('kenbarber_newsletter', JSON.stringify(subscriptions));
        }
        
        showNotification('Thank you for subscribing! (Saved locally)');
        emailInput.value = '';
    };
    
    // ============================================
    // 11. ERROR MESSAGE FUNCTION
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
    // 12. PERFORMANCE OPTIMIZATIONS
    // ============================================
    // Debounce scroll events
    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(handleHeaderScroll, 100);
    });
    
    // ============================================
    // 13. INITIALIZE OTHER COMPONENTS
    // ============================================
    function initializeNavigation() {
        console.log('Navigation initialized');
    }
    
    function initializeTestimonials() {
        console.log('Testimonials initialized');
    }
    
    function initializeContactForm() {
        console.log('Contact form initialized');
        
        // Initialize contact form validation
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                showNotification('Contact form submitted successfully!', 'success');
                this.reset();
            });
        }
    }
    
    // Initialize components
    initializeNavigation();
    initializeTestimonials();
    initializeContactForm();
    
    // ============================================
    // 14. FINAL INITIALIZATION
    // ============================================
    console.log('KenBarber website with Real Supabase initialized successfully');
});
