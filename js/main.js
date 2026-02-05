// js/main.js - COMPLETE VERSION FOR KENBARBER
// ============================================

console.log('🏁 KenBarber Main.js Initializing...');

// Global state
let allServices = [];
let allBarbers = [];
let allTestimonials = [];
let isDataLoaded = false;
let isDataLoading = false;

// ============================================
// 1. LOADING STATES
// ============================================
function showLoadingStates() {
    console.log('🔄 Showing loading states...');
    
    // Update services loading text
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        const loadingCard = servicesGrid.querySelector('.loading-service');
        if (loadingCard) {
            loadingCard.innerHTML = `
                <div class="service-img" style="background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); animation: pulse 1.5s infinite; height: 200px; border-radius: 8px 8px 0 0;"></div>
                <div class="service-content" style="padding: 1rem;">
                    <h3 style="background: #f0f0f0; height: 24px; width: 80%; margin-bottom: 10px; border-radius: 4px;"></h3>
                    <p style="background: #f0f0f0; height: 16px; width: 100%; margin-bottom: 15px; border-radius: 4px;"></p>
                    <div class="service-footer" style="display: flex; justify-content: space-between;">
                        <span style="background: #f0f0f0; height: 20px; width: 80px; border-radius: 4px;"></span>
                        <span style="background: #f0f0f0; height: 20px; width: 60px; border-radius: 4px;"></span>
                    </div>
                    <button class="btn-primary" style="width: 100%; margin-top: 1rem; background: #f0f0f0; color: transparent; border: none; height: 40px; border-radius: 4px;" disabled></button>
                </div>
            `;
        }
    }
}

// ============================================
// 2. LOAD ALL DATA
// ============================================
async function loadAllData() {
    if (isDataLoading) return;
    if (isDataLoaded) {
        console.log('✅ Data already loaded');
        return;
    }
    
    isDataLoading = true;
    console.log('📡 Loading all data from database...');
    
    try {
        // Load services, barbers, and testimonials in parallel
        const [servicesResult, barbersResult, testimonialsResult] = await Promise.all([
            loadServices(),
            loadBarbers(),
            loadTestimonials()
        ]);
        
        allServices = servicesResult || [];
        allBarbers = barbersResult || [];
        allTestimonials = testimonialsResult || [];
        
        // Update UI with loaded data
        updateServicesUI();
        updateBarbersUI();
        updateTestimonialsUI();
        updateBookingForm();
        
        isDataLoaded = true;
        console.log('🎉 All data loaded successfully!');
        
        // Update database status
        updateDatabaseStatus(true);
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Use fallback data
        loadFallbackData();
        updateDatabaseStatus(false);
    } finally {
        isDataLoading = false;
    }
}

// ============================================
// 3. DATABASE FUNCTIONS
// ============================================
async function loadServices() {
    console.log('  ↳ Loading services...');
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        
        if (error) throw error;
        
        console.log(`  ↳ Found ${data.length} services`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error loading services:', error);
        return getFallbackServices();
    }
}

async function loadBarbers() {
    console.log('  ↳ Loading barbers...');
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await window.supabase
            .from('barbers')
            .select('*')
            .eq('is_active', true)
            .order('experience_years', { ascending: false });
        
        if (error) throw error;
        
        console.log(`  ↳ Found ${data.length} barbers`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error loading barbers:', error);
        return getFallbackBarbers();
    }
}

async function loadTestimonials() {
    console.log('  ↳ Loading testimonials...');
    
    try {
        if (!window.supabase) {
            throw new Error('Supabase client not available');
        }
        
        const { data, error } = await window.supabase
            .from('testimonials')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        
        console.log(`  ↳ Found ${data.length} testimonials`);
        return data;
        
    } catch (error) {
        console.error('  ↳ Error loading testimonials:', error);
        return getFallbackTestimonials();
    }
}

// ============================================
// 4. FALLBACK DATA
// ============================================
function loadFallbackData() {
    console.log('🔄 Loading fallback data...');
    
    allServices = getFallbackServices();
    allBarbers = getFallbackBarbers();
    allTestimonials = getFallbackTestimonials();
    
    updateServicesUI();
    updateBarbersUI();
    updateTestimonialsUI();
    updateBookingForm();
}

function getFallbackServices() {
    return [
        {
            id: 1,
            name: "Classic Haircut",
            description: "Professional haircut with styling and finishing",
            price: 30,
            duration: 30,
            is_active: true
        },
        {
            id: 2,
            name: "Beard Trim & Shape",
            description: "Precision beard trimming and shaping with hot towel",
            price: 20,
            duration: 20,
            is_active: true
        },
        {
            id: 3,
            name: "Haircut & Beard Combo",
            description: "Complete grooming package - haircut + beard service",
            price: 45,
            duration: 45,
            is_active: true
        },
        {
            id: 4,
            name: "Hot Towel Shave",
            description: "Traditional straight razor shave with hot towels",
            price: 25,
            duration: 25,
            is_active: true
        },
        {
            id: 5,
            name: "Hair Coloring",
            description: "Professional hair coloring and treatment",
            price: 50,
            duration: 60,
            is_active: true
        },
        {
            id: 6,
            name: "Kids Haircut",
            description: "Special haircut for children under 12",
            price: 25,
            duration: 25,
            is_active: true
        }
    ];
}

function getFallbackBarbers() {
    return [
        {
            id: 1,
            name: "John Maina",
            specialization: "Traditional Cuts & Styling",
            experience_years: 8,
            image_url: "",
            is_active: true
        },
        {
            id: 2,
            name: "David Omondi",
            specialization: "Modern Styles & Fades",
            experience_years: 5,
            image_url: "",
            is_active: true
        },
        {
            id: 3,
            name: "Peter Kamau",
            specialization: "Beard Specialist & Straight Razor",
            experience_years: 10,
            image_url: "",
            is_active: true
        }
    ];
}

function getFallbackTestimonials() {
    return [
        {
            id: 1,
            customer_name: "James Mwangi",
            comment: "Best barbershop in Nakuru! Always leave looking fresh and professional. The attention to detail is amazing.",
            rating: 5,
            is_approved: true
        },
        {
            id: 2,
            customer_name: "Brian Ochieng",
            comment: "Professional service and great atmosphere. Highly recommended! My go-to barber shop for over a year now.",
            rating: 5,
            is_approved: true
        },
        {
            id: 3,
            customer_name: "Michael Otieno",
            comment: "Perfect haircut every time. These guys know what they're doing. The M-Pesa booking system is very convenient.",
            rating: 5,
            is_approved: true
        },
        {
            id: 4,
            customer_name: "Samuel Kariuki",
            comment: "Clean shop, skilled barbers, and great prices. What more could you ask for? Will definitely be coming back.",
            rating: 5,
            is_approved: true
        }
    ];
}

// ============================================
// 5. UI UPDATE FUNCTIONS
// ============================================
function updateServicesUI() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid || allServices.length === 0) return;
    
    console.log('🎨 Updating services UI...');
    
    servicesGrid.innerHTML = allServices.map(service => `
        <div class="service-card" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s;">
            <div class="service-img" style="background: linear-gradient(135deg, var(--primary) 0%, #d4af37 100%); height: 150px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-cut" style="font-size: 48px; color: white;"></i>
            </div>
            <div class="service-content" style="padding: 1.5rem;">
                <h3 style="color: var(--secondary); margin-bottom: 10px;">${service.name}</h3>
                <p style="color: #666; margin-bottom: 15px; line-height: 1.5;">${service.description}</p>
                <div class="service-footer" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span class="price" style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">KES ${service.price}</span>
                    <span class="duration" style="background: #f0f0f0; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">
                        <i class="far fa-clock"></i> ${service.duration} min
                    </span>
                </div>
                <button class="btn-primary" onclick="window.bookService(${service.id}, ${service.price})" 
                        style="width: 100%; padding: 12px; border: none; border-radius: 5px; background: var(--primary); color: white; font-weight: bold; cursor: pointer; transition: background 0.3s;">
                    <i class="fas fa-calendar-alt"></i> Book Now
                </button>
            </div>
        </div>
    `).join('');
    
    // Update popular services in footer
    updatePopularServices();
}

function updateBarbersUI() {
    const barbersGrid = document.getElementById('barbersGrid');
    if (!barbersGrid || allBarbers.length === 0) return;
    
    console.log('🎨 Updating barbers UI...');
    
    barbersGrid.innerHTML = allBarbers.map(barber => `
        <div class="barber-card" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div class="barber-img" style="height: 250px; background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; position: relative;">
                <i class="fas fa-user" style="font-size: 80px; color: #ccc;"></i>
                <div class="experience-badge" style="position: absolute; bottom: 10px; right: 10px; background: var(--primary); color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem;">
                    ${barber.experience_years}+ years
                </div>
            </div>
            <div class="barber-info" style="padding: 1.5rem;">
                <h3 style="color: var(--secondary); margin-bottom: 5px;">${barber.name}</h3>
                <p class="barber-title" style="color: var(--primary); font-weight: 500; margin-bottom: 10px;">${barber.specialization}</p>
                <p style="color: #666; margin-bottom: 15px;">Professional barber with ${barber.experience_years} years of experience in precision cutting and styling.</p>
                <div class="barber-social" style="display: flex; gap: 10px;">
                    <a href="#" style="color: #666;"><i class="fab fa-instagram"></i></a>
                    <a href="#" style="color: #666;"><i class="fab fa-facebook"></i></a>
                    <a href="tel:+254704325810" style="color: #666;"><i class="fas fa-phone"></i></a>
                </div>
            </div>
        </div>
    `).join('');
}

function updateTestimonialsUI() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    if (!testimonialsGrid || allTestimonials.length === 0) return;
    
    console.log('🎨 Updating testimonials UI...');
    
    testimonialsGrid.innerHTML = allTestimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="stars" style="color: gold; margin-bottom: 10px;">
                ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
            </div>
            <p class="testimonial-text" style="font-style: italic; line-height: 1.6; margin-bottom: 15px;">
                "${testimonial.comment}"
            </p>
            <div class="customer-info" style="display: flex; align-items: center; gap: 10px;">
                <div class="customer-avatar" style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${testimonial.customer_name.charAt(0)}
                </div>
                <div>
                    <strong style="display: block;">${testimonial.customer_name}</strong>
                    <span style="font-size: 0.9rem; color: #aaa;">Verified Customer</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updatePopularServices() {
    const popularServicesList = document.getElementById('popularServicesList');
    if (!popularServicesList || allServices.length === 0) return;
    
    // Get top 3 services by price (or you could sort differently)
    const popularServices = [...allServices]
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
    
    popularServicesList.innerHTML = popularServices.map(service => `
        <li><a href="#booking" onclick="window.bookService(${service.id}, ${service.price})">${service.name} - KES ${service.price}</a></li>
    `).join('');
}

// ============================================
// 6. BOOKING FORM FUNCTIONS
// ============================================
function updateBookingForm() {
    console.log('🎨 Updating booking form...');
    
    // Update service dropdown
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect && allServices.length > 0) {
        serviceSelect.innerHTML = `
            <option value="">Select a service...</option>
            ${allServices.map(service => `
                <option value="${service.id}" data-price="${service.price}" data-duration="${service.duration}">
                    ${service.name} - KES ${service.price} (${service.duration} min)
                </option>
            `).join('')}
        `;
        
        // Add change event listener
        serviceSelect.addEventListener('change', updatePriceDisplay);
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
    
    // Setup date picker
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        dateInput.min = tomorrow.toISOString().split('T')[0];
        dateInput.max = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0];
        dateInput.value = tomorrow.toISOString().split('T')[0];
        
        // Add change event for date
        dateInput.addEventListener('change', updateTimeSlots);
    }
    
    // Setup time slots
    updateTimeSlots();
    
    // Setup form submission
    const bookingForm = document.getElementById('appointmentForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);
    }
    
    // Enable submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
    
    // Setup payment method toggles
    setupPaymentToggles();
}

function updatePriceDisplay() {
    const serviceSelect = document.getElementById('serviceType');
    const priceDisplay = document.getElementById('priceDisplay');
    const totalPrice = document.getElementById('totalPrice');
    
    if (!serviceSelect || !priceDisplay || !totalPrice) return;
    
    const selectedOption = serviceSelect.selectedOptions[0];
    if (selectedOption && selectedOption.value) {
        const price = selectedOption.getAttribute('data-price');
        totalPrice.textContent = `KES ${price}`;
        priceDisplay.style.display = 'block';
    } else {
        priceDisplay.style.display = 'none';
    }
}

function updateTimeSlots() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    
    if (!dateInput || !timeSelect) return;
    
    // Enable time select
    timeSelect.disabled = false;
    
    // Generate time slots (9am to 6pm, every 30 minutes)
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 18 && minute > 0) break; // Last slot at 6:00 PM
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }
    
    // Update time select options
    timeSelect.innerHTML = `
        <option value="">Select a time...</option>
        ${slots.map(slot => `<option value="${slot}">${slot}</option>`).join('')}
    `;
}

function setupPaymentToggles() {
    const mpesaStkRadio = document.getElementById('mpesaStkRadio');
    const mpesaManualRadio = document.getElementById('mpesaManualRadio');
    const stkPaymentInfo = document.getElementById('stkPaymentInfo');
    const manualMpesaPayment = document.getElementById('manualMpesaPayment');
    
    if (!mpesaStkRadio || !mpesaManualRadio) return;
    
    function togglePaymentInfo() {
        if (mpesaStkRadio.checked) {
            stkPaymentInfo.style.display = 'block';
            manualMpesaPayment.style.display = 'none';
        } else if (mpesaManualRadio.checked) {
            stkPaymentInfo.style.display = 'none';
            manualMpesaPayment.style.display = 'block';
        } else {
            stkPaymentInfo.style.display = 'none';
            manualMpesaPayment.style.display = 'none';
        }
    }
    
    mpesaStkRadio.addEventListener('change', togglePaymentInfo);
    mpesaManualRadio.addEventListener('change', togglePaymentInfo);
    
    // Initial toggle
    togglePaymentInfo();
}

// ============================================
// 7. BOOKING HANDLING
// ============================================
async function handleBookingSubmission(event) {
    event.preventDefault();
    
    console.log('📝 Processing booking submission...');
    
    // Get form values
    const formData = {
        fullName: document.getElementById('fullName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        email: document.getElementById('email').value,
        serviceId: document.getElementById('serviceType').value,
        barberId: document.getElementById('barberSelect').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        specialRequests: document.getElementById('specialRequests').value,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        termsAgreed: document.getElementById('termsAgree').checked,
        cancellationAgreed: document.getElementById('cancellationPolicy').checked
    };
    
    // Validate form
    if (!validateBookingForm(formData)) {
        return;
    }
    
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Find selected service
        const selectedService = allServices.find(s => s.id == formData.serviceId);
        if (!selectedService) {
            throw new Error('Selected service not found');
        }
        
        // Find selected barber (if any)
        const selectedBarber = formData.barberId ? allBarbers.find(b => b.id == formData.barberId) : null;
        
        // Generate booking reference
        const bookingRef = 'KB' + Date.now().toString().slice(-6);
        
        // Create booking object
        const bookingData = {
            booking_reference: bookingRef,
            customer_name: formData.fullName,
            customer_phone: formData.phoneNumber,
            customer_email: formData.email,
            service_id: formData.serviceId,
            service_name: selectedService.name,
            service_price: selectedService.price,
            barber_id: formData.barberId || null,
            barber_name: selectedBarber ? selectedBarber.name : 'Any Available',
            appointment_date: formData.appointmentDate,
            appointment_time: formData.appointmentTime,
            special_requests: formData.specialRequests,
            payment_method: formData.paymentMethod,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // Save to database if Supabase is available
        if (window.supabase) {
            const { data, error } = await window.supabase
                .from('bookings')
                .insert([bookingData])
                .select();
            
            if (error) throw error;
            console.log('✅ Booking saved to database:', data);
        } else {
            // Save to localStorage as fallback
            let bookings = JSON.parse(localStorage.getItem('kenbarber_bookings') || '[]');
            bookings.push(bookingData);
            localStorage.setItem('kenbarber_bookings', JSON.stringify(bookings));
            console.log('✅ Booking saved to localStorage');
        }
        
        // Show success modal
        showSuccessModal(bookingData);
        
        // Reset form
        document.getElementById('appointmentForm').reset();
        document.getElementById('priceDisplay').style.display = 'none';
        
        // Reset date to tomorrow
        const dateInput = document.getElementById('appointmentDate');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        alert('There was an error processing your booking. Please try again or call us at 0704 325 810.');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

function validateBookingForm(formData) {
    // Required fields
    if (!formData.fullName.trim()) {
        alert('Please enter your full name');
        return false;
    }
    
    if (!formData.phoneNumber.trim()) {
        alert('Please enter your phone number');
        return false;
    }
    
    // Basic phone validation for Kenya
    const phoneRegex = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
    const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        alert('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
        return false;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (!formData.serviceId) {
        alert('Please select a service');
        return false;
    }
    
    if (!formData.appointmentDate) {
        alert('Please select a date');
        return false;
    }
    
    if (!formData.appointmentTime) {
        alert('Please select a time');
        return false;
    }
    
    if (!formData.termsAgreed) {
        alert('Please agree to the terms and conditions');
        return false;
    }
    
    if (!formData.cancellationAgreed) {
        alert('Please agree to the cancellation policy');
        return false;
    }
    
    return true;
}

// ============================================
// 8. SUCCESS MODAL
// ============================================
function showSuccessModal(bookingData) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    // Update modal content
    document.getElementById('modalService').textContent = bookingData.service_name;
    document.getElementById('modalDate').textContent = bookingData.appointment_date;
    document.getElementById('modalTime').textContent = bookingData.appointment_time;
    document.getElementById('modalBarber').textContent = bookingData.barber_name;
    document.getElementById('modalPrice').textContent = `KES ${bookingData.service_price}`;
    document.getElementById('modalRef').textContent = bookingData.booking_reference;
    document.getElementById('modalPhone').textContent = bookingData.customer_phone;
    document.getElementById('modalEmail').textContent = bookingData.customer_email;
    
    // Show modal
    modal.style.display = 'block';
    
    // Setup close button
    const closeBtn = modal.querySelector('.modal-close');
    const doneBtn = document.getElementById('closeSuccessModal');
    
    function closeModal() {
        modal.style.display = 'none';
    }
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (doneBtn) doneBtn.onclick = closeModal;
    
    // Print button
    const printBtn = document.getElementById('printBooking');
    if (printBtn) {
        printBtn.onclick = function() {
            window.print();
        };
    }
    
    // Share button
    const shareBtn = document.getElementById('shareBooking');
    if (shareBtn) {
        shareBtn.onclick = function() {
            const shareText = `I've booked an appointment at KenBarber!\nService: ${bookingData.service_name}\nDate: ${bookingData.appointment_date} at ${bookingData.appointment_time}\nReference: ${bookingData.booking_reference}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'KenBarber Booking',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Booking details copied to clipboard!');
            }
        };
    }
    
    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

// ============================================
// 9. DATABASE STATUS
// ============================================
function updateDatabaseStatus(isConnected) {
    const dbStatus = document.getElementById('dbStatus');
    if (!dbStatus) return;
    
    if (isConnected) {
        dbStatus.className = 'db-status online';
        dbStatus.innerHTML = '<i class="fas fa-circle"></i> <span>Live Database Connected</span>';
    } else {
        dbStatus.className = 'db-status offline';
        dbStatus.innerHTML = '<i class="fas fa-circle"></i> <span>Using Local Data</span>';
    }
}

// ============================================
// 10. GLOBAL FUNCTIONS (for HTML onclick)
// ============================================
window.bookService = function(serviceId, price) {
    console.log(`📝 Booking service ${serviceId} for KES ${price}`);
    
    // Find and select the service
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
// 11. INITIALIZATION
// ============================================
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing...');
    
    // Show loading states immediately
    showLoadingStates();
    
    // Start loading data
    loadAllData().catch(error => {
        console.error('Initialization error:', error);
    });
    
    // Initialize special offer banner
    initializeSpecialOfferBanner();
});

function initializeSpecialOfferBanner() {
    const banner = document.getElementById('specialOfferBanner');
    if (!banner) return;
    
    // Hide banner after 10 seconds
    setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            banner.style.display = 'none';
        }, 500);
    }, 10000);
}

// ============================================
// 12. SAFETY NET
// ============================================
// Auto-initialize after 5 seconds if not already initialized
setTimeout(function() {
    if (!isDataLoaded && !isDataLoading) {
        console.warn('⚠️ Initialization taking too long, forcing continue...');
        loadFallbackData();
    }
}, 5000);

console.log('✅ main.js loaded successfully');
