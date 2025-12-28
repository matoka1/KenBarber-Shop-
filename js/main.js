// main.js - Main JavaScript for KenBarber Website with Supabase Integration
// Contains core functionality with database connectivity

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing KenBarber Website with Supabase...');
    
    // ============================================
    // 0. SUPABASE DATA LOADING
    // ============================================
    async function loadDataFromSupabase() {
        try {
            // Check if Supabase is available
            if (!window.supabase) {
                console.warn('Supabase not available, using local data');
                loadLocalData();
                return;
            }
            
            // Load services
            await loadServices();
            
            // Load barbers
            await loadBarbers();
            
            // Load testimonials
            await loadTestimonials();
            
            // Load special offers
            await loadSpecialOffers();
            
            // Enable booking form
            enableBookingForm();
            
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            loadLocalData(); // Fallback to local data
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
            
            // Update services grid
            updateServicesGrid(services);
            
            // Update service dropdown
            updateServiceDropdown(services);
            
            // Update popular services in footer
            updatePopularServices(services);
            
            console.log('Services loaded:', services.length);
            
        } catch (error) {
            console.error('Error loading services:', error);
            throw error;
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
            
            // Update barbers grid
            updateBarbersGrid(barbers);
            
            // Update barber dropdown
            updateBarberDropdown(barbers);
            
            console.log('Barbers loaded:', barbers.length);
            
        } catch (error) {
            console.error('Error loading barbers:', error);
            throw error;
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
            
            // Update testimonials grid
            updateTestimonialsGrid(testimonials);
            
            console.log('Testimonials loaded:', testimonials.length);
            
        } catch (error) {
            console.error('Error loading testimonials:', error);
            // Keep default testimonials
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
            
            if (error) throw error;
            
            // Update special offer banner
            if (offers && offers.length > 0) {
                updateSpecialOfferBanner(offers[0]);
            }
            
            console.log('Special offers loaded:', offers?.length || 0);
            
        } catch (error) {
            console.error('Error loading special offers:', error);
            // Keep default banner
        }
    }
    
    function loadLocalData() {
        // Fallback local data
        const localServices = [
            { id: 'haircut', name: 'Classic Haircut', description: 'Precision cut with clippers and scissors', price: 500, duration_minutes: 30 },
            { id: 'beard', name: 'Beard Trim & Shape', description: 'Expert beard grooming', price: 300, duration_minutes: 20 },
            { id: 'shave', name: 'Hot Towel Shave', description: 'Traditional straight razor shave', price: 700, duration_minutes: 45 },
            { id: 'combo', name: 'Haircut + Beard Combo', description: 'Complete grooming package', price: 800, duration_minutes: 60 }
        ];
        
        const localBarbers = [
            { id: 'james', name: 'James Kariuki', specialty: 'Master Barber', experience_years: 15, bio: 'Specializes in classic cuts and fades' },
            { id: 'david', name: 'David Omondi', specialty: 'Beard Specialist', experience_years: 8, bio: 'Beard grooming expert' },
            { id: 'michael', name: 'Michael Njoroge', specialty: 'Style Expert', experience_years: 10, bio: 'Modern styles specialist' }
        ];
        
        updateServicesGrid(localServices);
        updateServiceDropdown(localServices);
        updateBarbersGrid(localBarbers);
        updateBarberDropdown(localBarbers);
        enableBookingForm();
    }
    
    function updateServicesGrid(services) {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;
        
        servicesGrid.innerHTML = '';
        
        services.forEach(service => {
            const serviceCard = `
                <div class="service-card">
                    <div class="service-img" style="background-image: url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');"></div>
                    <div class="service-content">
                        <h3>${service.name}</h3>
                        <p>${service.description || 'Premium grooming service'}</p>
                        <div class="service-footer">
                            <span class="price">KES ${service.price}</span>
                            <span class="duration"><i class="far fa-clock"></i> ${service.duration_minutes} min</span>
                        </div>
                        <button class="btn-primary" style="width: 100%; margin-top: 1rem;" 
                                onclick="bookService('${service.id}', ${service.price})">
                            Book Now
                        </button>
                    </div>
                </div>
            `;
            servicesGrid.innerHTML += serviceCard;
        });
    }
    
    function updateServiceDropdown(services) {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;
        
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} - KES ${service.price}`;
            option.setAttribute('data-price', service.price);
            option.setAttribute('data-name', service.name);
            serviceSelect.appendChild(option);
        });
    }
    
    function updateBarbersGrid(barbers) {
        const barbersGrid = document.getElementById('barbersGrid');
        if (!barbersGrid) return;
        
        barbersGrid.innerHTML = '';
        
        // Image URLs for barbers
        const barberImages = [
            'https://images.unsplash.com/photo-1562788869-4ed32648eb72?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1593702275682-4b8e9be41d8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ];
        
        barbers.forEach((barber, index) => {
            const barberCard = `
                <div class="barber-card">
                    <div class="barber-img" style="background-image: url('${barberImages[index % barberImages.length]}');"></div>
                    <div class="barber-info">
                        <h3>${barber.name}</h3>
                        <p class="barber-title">${barber.specialty} | ${barber.experience_years} Years Experience</p>
                        <p>${barber.bio || 'Skilled professional barber'}</p>
                        <div class="barber-expertise">
                            <span class="expertise-tag">Expert</span>
                            <span class="expertise-tag">Professional</span>
                        </div>
                        <div class="barber-social">
                            <a href="#"><i class="fab fa-instagram"></i></a>
                            <a href="#"><i class="fab fa-facebook"></i></a>
                            <a href="tel:+254712345678"><i class="fas fa-phone"></i></a>
                        </div>
                    </div>
                </div>
            `;
            barbersGrid.innerHTML += barberCard;
        });
    }
    
    function updateBarberDropdown(barbers) {
        const barberSelect = document.getElementById('barberSelect');
        if (!barberSelect) return;
        
        barberSelect.innerHTML = '<option value="">Any Available Barber</option>';
        
        barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = `${barber.name} (${barber.specialty})`;
            barberSelect.appendChild(option);
        });
    }
    
    function updateTestimonialsGrid(testimonials) {
        const testimonialsGrid = document.getElementById('testimonialsGrid');
        if (!testimonialsGrid || !testimonials) return;
        
        testimonialsGrid.innerHTML = '';
        
        testimonials.forEach(testimonial => {
            const stars = '★'.repeat(testimonial.rating) + '☆'.repeat(5 - testimonial.rating);
            const testimonialCard = `
                <div class="testimonial-card">
                    <div class="rating">
                        ${stars.split('').map(star => 
                            star === '★' ? '<i class="fas fa-star" style="color: gold;"></i>' : 
                            '<i class="far fa-star" style="color: gold;"></i>'
                        ).join('')}
                    </div>
                    <p>"${testimonial.comment}"</p>
                    <div class="customer-info">
                        <strong>${testimonial.customer_name}</strong>
                        <span>${testimonial.customer_location || 'Nakuru'}</span>
                    </div>
                </div>
            `;
            testimonialsGrid.innerHTML += testimonialCard;
        });
    }
    
    function updateSpecialOfferBanner(offer) {
        const banner = document.getElementById('specialOfferBanner');
        if (banner && offer) {
            banner.textContent = `🎉 ${offer.title}: ${offer.description || ''} 🎉`;
        }
    }
    
    function updatePopularServices(services) {
        const popularServicesList = document.getElementById('popularServicesList');
        if (!popularServicesList || !services) return;
        
        popularServicesList.innerHTML = '';
        
        // Take top 6 services
        const popularServices = services.slice(0, 6);
        
        popularServices.forEach(service => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#booking" onclick="bookService('${service.id}', ${service.price})">${service.name} - KES ${service.price}</a>`;
            popularServicesList.appendChild(li);
        });
    }
    
    function enableBookingForm() {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
    }
    
    // Start loading data
    loadDataFromSupabase();
    
    // ============================================
    // 1. MOBILE NAVIGATION TOGGLE
    // ============================================
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            
            // Toggle between hamburger and close icon
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
                document.body.style.overflow = 'auto'; // Re-enable scrolling
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
    // 2. SMOOTH SCROLLING FOR ANCHOR LINKS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Calculate header height for offset
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
    // 3. HEADER SCROLL EFFECT
    // ============================================
    const header = document.querySelector('header');
    
    function handleHeaderScroll() {
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
    handleHeaderScroll(); // Initialize on load
    
    // ============================================
    // 4. ANIMATION ON SCROLL
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
    animateOnScroll(); // Run once on load
    
    // ============================================
    // 5. SPECIAL OFFER BANNER MANAGEMENT
    // ============================================
    const specialOfferBanner = document.getElementById('specialOfferBanner');
    
    // Check for saved special offer
    const savedOffer = localStorage.getItem('kenbarber_special_offer');
    if (savedOffer && specialOfferBanner) {
        specialOfferBanner.textContent = savedOffer;
    }
    
    // Dismiss banner functionality
    if (specialOfferBanner) {
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
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
        
        closeBtn.addEventListener('click', () => {
            specialOfferBanner.style.display = 'none';
            // Store dismissal for 24 hours
            localStorage.setItem('kenbarber_banner_dismissed', Date.now().toString());
        });
        
        specialOfferBanner.style.position = 'relative';
        specialOfferBanner.appendChild(closeBtn);
        
        // Check if banner was recently dismissed
        const lastDismissed = localStorage.getItem('kenbarber_banner_dismissed');
        if (lastDismissed) {
            const timeDiff = Date.now() - parseInt(lastDismissed);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                specialOfferBanner.style.display = 'none';
            }
        }
    }
    
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
    
    // Initialize counters if they exist
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    // ============================================
    // 7. LAZY LOADING IMAGES
    // ============================================
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
    
    // ============================================
    // 8. FORM VALIDATION HELPERS
    // ============================================
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        // Kenyan phone number validation
        const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
        return re.test(phone.replace(/\s/g, ''));
    }
    
    // ============================================
    // 9. NOTIFICATION SYSTEM
    // ============================================
    function showNotification(message, type = 'success') {
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
        
        // Add styles
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
    }
    
    // ============================================
    // 10. WHATSAPP FLOAT BUTTON ENHANCEMENTS
    // ============================================
    const whatsappFloat = document.querySelector('.whatsapp-float');
    
    if (whatsappFloat) {
        // Add hover effect
        whatsappFloat.addEventListener('mouseenter', () => {
            whatsappFloat.style.transform = 'scale(1.1)';
        });
        
        whatsappFloat.addEventListener('mouseleave', () => {
            whatsappFloat.style.transform = 'scale(1)';
        });
        
        // Add click analytics (simulated)
        whatsappFloat.addEventListener('click', () => {
            // Track WhatsApp clicks
            let whatsappClicks = parseInt(localStorage.getItem('kenbarber_whatsapp_clicks') || '0');
            whatsappClicks++;
            localStorage.setItem('kenbarber_whatsapp_clicks', whatsappClicks.toString());
        });
    }
    
    // ============================================
    // 11. CURRENT YEAR IN FOOTER
    // ============================================
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // ============================================
    // 12. SERVICE BOOKING SHORTCUTS
    // ============================================
    // This function is called from service buttons
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
        
        // Update price display
        const priceDisplay = document.getElementById('priceDisplay');
        const totalPrice = document.getElementById('totalPrice');
        if (priceDisplay && totalPrice) {
            totalPrice.textContent = `KES ${price}`;
            priceDisplay.style.display = 'block';
        }
        
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
    // 13. NEWSLETTER SUBSCRIPTION
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
            // Save to Supabase if available
            if (window.supabase) {
                const { error } = await window.supabase
                    .from('customers')
                    .upsert({ 
                        email: email,
                        newsletter_subscribed: true,
                        updated_at: new Date().toISOString()
                    }, { 
                        onConflict: 'email',
                        ignoreDuplicates: false 
                    });
                
                if (error) throw error;
            }
            
            // Also save locally
            let subscriptions = JSON.parse(localStorage.getItem('kenbarber_newsletter') || '[]');
            if (!subscriptions.includes(email)) {
                subscriptions.push(email);
                localStorage.setItem('kenbarber_newsletter', JSON.stringify(subscriptions));
            }
            
            // Show success message
            showNotification('Thank you for subscribing to KenBarber updates!');
            emailInput.value = '';
            
        } catch (error) {
            console.error('Error saving subscription:', error);
            showNotification('Subscription saved locally', 'success');
            emailInput.value = '';
        }
    };
    
    // ============================================
    // 14. PERFORMANCE OPTIMIZATIONS
    // ============================================
    // Debounce scroll events
    let scrollTimer;
    window.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(handleHeaderScroll, 100);
    });
    
    // Preload critical images
    function preloadImages() {
        const images = [
            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        ];
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // Initialize preload on idle
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadImages);
    } else {
        setTimeout(preloadImages, 1000);
    }
    
    // ============================================
    // 15. SERVICE WORKER REGISTRATION (PWA)
    // ============================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }
    
    // ============================================
    // 16. OFFLINE DETECTION
    // ============================================
    window.addEventListener('online', () => {
        showNotification('You are back online!', 'success');
        // Refresh data when back online
        loadDataFromSupabase();
    });
    
    window.addEventListener('offline', () => {
        showNotification('You are currently offline. Some features may not work.', 'error');
    });
    
    // ============================================
    // 17. COOKIE CONSENT (BASIC)
    // ============================================
    if (!localStorage.getItem('kenbarber_cookies_accepted')) {
        const cookieConsent = document.createElement('div');
        cookieConsent.id = 'cookieConsent';
        cookieConsent.innerHTML = `
            <div class="cookie-content">
                <p>We use cookies to enhance your experience. By continuing to visit this site, you agree to our use of cookies.</p>
                <div class="cookie-buttons">
                    <button id="acceptCookies" class="btn-primary">Accept</button>
                    <button id="declineCookies" class="btn-secondary">Decline</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #cookieConsent {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--secondary);
                color: white;
                padding: 20px;
                z-index: 9998;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.2);
            }
            .cookie-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }
            .cookie-content p {
                flex: 1;
                margin: 0;
                color: #aaa;
            }
            .cookie-buttons {
                display: flex;
                gap: 10px;
            }
            @media (max-width: 768px) {
                .cookie-content {
                    flex-direction: column;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(cookieConsent);
        
        // Add event listeners
        document.getElementById('acceptCookies').addEventListener('click', () => {
            localStorage.setItem('kenbarber_cookies_accepted', 'true');
            cookieConsent.style.display = 'none';
        });
        
        document.getElementById('declineCookies').addEventListener('click', () => {
            cookieConsent.style.display = 'none';
        });
    }
    
    // ============================================
    // 18. INITIALIZATION COMPLETE
    // ============================================
    console.log('KenBarber website with Supabase initialized successfully');
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePhone,
        showNotification
    };
}
