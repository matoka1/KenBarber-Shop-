// main.js - Main JavaScript for KenBarber Website
// Contains core functionality for the main website

document.addEventListener('DOMContentLoaded', function() {
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
    // 12. GOOGLE MAPS INTEGRATION
    // ============================================
    function initMap() {
        // This function will be called by booking.js
        console.log('Map initialization ready');
    }
    
    // ============================================
    // 13. SERVICE BOOKING SHORTCUTS
    // ============================================
    // This function is called from service buttons
    window.bookService = function(serviceName, price) {
        const serviceSelect = document.getElementById('serviceType');
        if (!serviceSelect) return;
        
        // Find and select the service
        for (let option of serviceSelect.options) {
            if (option.text.includes(serviceName)) {
                serviceSelect.value = option.value;
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
    // 14. NEWSLETTER SUBSCRIPTION
    // ============================================
    window.subscribeNewsletter = function() {
        const emailInput = document.getElementById('newsletterEmail');
        if (!emailInput) return;
        
        const email = emailInput.value.trim();
        
        if (!email || !validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Save subscription
        let subscriptions = JSON.parse(localStorage.getItem('kenbarber_newsletter') || '[]');
        if (!subscriptions.includes(email)) {
            subscriptions.push(email);
            localStorage.setItem('kenbarber_newsletter', JSON.stringify(subscriptions));
        }
        
        // Show success message
        showNotification('Thank you for subscribing to KenBarber updates!');
        emailInput.value = '';
    };
    
    // ============================================
    // 15. UTILITY FUNCTIONS
    // ============================================
    window.scrollToBooking = function() {
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
    
    window.openGoogleMaps = function() {
        window.open('https://maps.google.com/?q=-0.3031,36.0800', '_blank');
    };
    
    // ============================================
    // 16. PERFORMANCE OPTIMIZATIONS
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
    // 17. SERVICE WORKER REGISTRATION (PWA)
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
    // 18. OFFLINE DETECTION
    // ============================================
    window.addEventListener('online', () => {
        showNotification('You are back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('You are currently offline. Some features may not work.', 'error');
    });
    
    // ============================================
    // 19. COOKIE CONSENT (BASIC)
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
    // 20. INITIALIZATION COMPLETE
    // ============================================
    console.log('KenBarber website initialized successfully');
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePhone,
        showNotification
    };
}
