// booking-supabase.js - Updated Booking System with Supabase
import { SupabaseService } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // 1. INITIALIZE BOOKING SYSTEM WITH SUPABASE
    // ============================================
    console.log('Initializing KenBarber Booking System with Supabase...');
    
    // DOM Elements
    const appointmentForm = document.getElementById('appointmentForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const appointmentTimeSelect = document.getElementById('appointmentTime');
    const barberSelect = document.getElementById('barberSelect');
    const priceDisplay = document.getElementById('priceDisplay');
    const totalPriceSpan = document.getElementById('totalPrice');
    const submitBtn = document.getElementById('submitBtn');
    
    // State
    const bookingState = {
        service: null,
        date: '',
        time: '',
        barber: null,
        price: 0,
        paymentMethod: 'cash',
        mpesaNumber: '',
        customer: null
    };
    
    // ============================================
    // 2. LOAD INITIAL DATA FROM SUPABASE
    // ============================================
    async function initializeData() {
        try {
            // Load services
            const servicesResult = await SupabaseService.getServices();
            if (servicesResult.success) {
                populateServices(servicesResult.data);
            }
            
            // Load barbers
            const barbersResult = await SupabaseService.getBarbers();
            if (barbersResult.success) {
                populateBarbers(barbersResult.data);
            }
            
            // Load working hours
            const hoursResult = await SupabaseService.getTodaysHours();
            if (hoursResult.success) {
                console.log('Today\'s hours:', hoursResult.data);
            }
            
            // Load special offers
            const offersResult = await SupabaseService.getActiveOffers();
            if (offersResult.success && offersResult.data.length > 0) {
                updateSpecialOffer(offersResult.data[0]);
            }
            
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    }
    
    function populateServices(services) {
        if (!serviceTypeSelect) return;
        
        serviceTypeSelect.innerHTML = '<option value="">Select Service</option>';
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} - KES ${service.price}`;
            option.setAttribute('data-price', service.price);
            option.setAttribute('data-duration', service.duration_minutes);
            serviceTypeSelect.appendChild(option);
        });
    }
    
    function populateBarbers(barbers) {
        if (!barberSelect) return;
        
        barberSelect.innerHTML = '<option value="">Any Available Barber</option>';
        
        barbers.forEach(barber => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.textContent = `${barber.name} - ${barber.specialty}`;
            barberSelect.appendChild(option);
        });
    }
    
    function updateSpecialOffer(offer) {
        const banner = document.getElementById('specialOfferBanner');
        if (banner) {
            banner.textContent = `🎉 ${offer.title}: ${offer.description || ''} 🎉`;
        }
    }
    
    // ============================================
    // 3. EVENT LISTENERS
    // ============================================
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', async function() {
            const serviceId = this.value;
            if (serviceId) {
                const result = await SupabaseService.getServiceById(serviceId);
                if (result.success) {
                    bookingState.service = result.data;
                    bookingState.price = result.data.price;
                    updatePriceDisplay();
                }
            }
            await updateTimeSlots();
        });
    }
    
    if (appointmentDateInput) {
        appointmentDateInput.addEventListener('change', async function() {
            bookingState.date = this.value;
            await updateTimeSlots();
            await checkBarberAvailability();
        });
    }
    
    if (appointmentTimeSelect) {
        appointmentTimeSelect.addEventListener('change', function() {
            bookingState.time = this.value;
        });
    }
    
    if (barberSelect) {
        barberSelect.addEventListener('change', function() {
            const barberId = this.value;
            bookingState.barber = barberId || null;
        });
    }
    
    // M-Pesa payment toggle
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            bookingState.paymentMethod = this.value;
            const mpesaPaymentDiv = document.getElementById('mpesaPayment');
            if (mpesaPaymentDiv) {
                mpesaPaymentDiv.style.display = this.value === 'mpesa' ? 'block' : 'none';
            }
        });
    });
    
    // M-Pesa number input
    const mpesaNumberInput = document.getElementById('mpesaNumber');
    if (mpesaNumberInput) {
        mpesaNumberInput.addEventListener('input', function() {
            bookingState.mpesaNumber = this.value;
        });
    }
    
    // ============================================
    // 4. CORE FUNCTIONS WITH SUPABASE
    // ============================================
    async function updateTimeSlots() {
        if (!appointmentTimeSelect || !appointmentDateInput || !bookingState.date) return;
        
        appointmentTimeSelect.innerHTML = '<option value="">Loading time slots...</option>';
        appointmentTimeSelect.disabled = true;
        
        try {
            // Get working hours for the selected day
            const selectedDate = new Date(bookingState.date);
            const dayOfWeek = selectedDate.getDay();
            const hoursResult = await SupabaseService.getWorkingHours();
            
            if (!hoursResult.success) throw new Error('Failed to load working hours');
            
            const dayHours = hoursResult.data.find(h => h.day_of_week === dayOfWeek);
            
            if (!dayHours || !dayHours.is_active) {
                appointmentTimeSelect.innerHTML = '<option value="">Closed on this day</option>';
                return;
            }
            
            // Generate time slots based on working hours
            const timeSlots = generateTimeSlots(dayHours.opening_time, dayHours.closing_time, 30);
            
            // Check availability for each time slot
            const availableSlots = [];
            
            for (const slot of timeSlots) {
                const availability = await SupabaseService.checkAvailability(
                    bookingState.date, 
                    slot.time,
                    bookingState.barber
                );
                
                if (availability.success && availability.data.isAvailable) {
                    availableSlots.push({
                        time: slot.time,
                        display: slot.display
                    });
                }
            }
            
            // Update select with available slots
            appointmentTimeSelect.innerHTML = '<option value="">Select Time</option>';
            
            if (availableSlots.length === 0) {
                appointmentTimeSelect.innerHTML = '<option value="">No available slots</option>';
            } else {
                availableSlots.forEach(slot => {
                    const option = document.createElement('option');
                    option.value = slot.time;
                    option.textContent = slot.display;
                    appointmentTimeSelect.appendChild(option);
                });
                appointmentTimeSelect.disabled = false;
            }
            
        } catch (error) {
            console.error('Error updating time slots:', error);
            appointmentTimeSelect.innerHTML = '<option value="">Error loading slots</option>';
        }
    }
    
    function generateTimeSlots(startTime, endTime, intervalMinutes) {
        const slots = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const time12 = formatTime12Hour(time24);
            
            slots.push({
                time: time24,
                display: time12
            });
            
            // Increment time
            currentMinute += intervalMinutes;
            if (currentMinute >= 60) {
                currentMinute -= 60;
                currentHour++;
            }
        }
        
        return slots;
    }
    
    function formatTime12Hour(time24) {
        const [hour, minute] = time24.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    }
    
    async function checkBarberAvailability() {
        if (!bookingState.date || !bookingState.time) return;
        
        // Implementation for checking specific barber availability
        console.log('Checking barber availability...');
    }
    
    function updatePriceDisplay() {
        if (!priceDisplay || !totalPriceSpan) return;
        
        if (bookingState.price > 0) {
            totalPriceSpan.textContent = `KES ${bookingState.price}`;
            priceDisplay.style.display = 'block';
        } else {
            priceDisplay.style.display = 'none';
        }
    }
    
    // ============================================
    // 5. FORM VALIDATION
    // ============================================
    function validateForm() {
        const name = document.getElementById('fullName')?.value.trim();
        const phone = document.getElementById('phoneNumber')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const termsAgree = document.getElementById('termsAgree')?.checked;
        const cancellationPolicy = document.getElementById('cancellationPolicy')?.checked;
        
        if (!name || name.length < 2) {
            throw new Error('Please enter a valid name');
        }
        
        if (!phone || !validatePhone(phone)) {
            throw new Error('Please enter a valid Kenyan phone number');
        }
        
        if (!email || !validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (!bookingState.service) {
            throw new Error('Please select a service');
        }
        
        if (!bookingState.date) {
            throw new Error('Please select a date');
        }
        
        if (!bookingState.time) {
            throw new Error('Please select a time slot');
        }
        
        if (bookingState.paymentMethod === 'mpesa' && !validatePhone(bookingState.mpesaNumber)) {
            throw new Error('Please enter a valid M-Pesa number');
        }
        
        if (!termsAgree) {
            throw new Error('Please agree to receive notifications');
        }
        
        if (!cancellationPolicy) {
            throw new Error('Please agree to the cancellation policy');
        }
        
        return {
            name,
            phone,
            email,
            specialRequests: document.getElementById('specialRequests')?.value.trim() || ''
        };
    }
    
    function validatePhone(phone) {
        const cleaned = phone.replace(/\s/g, '');
        const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
        return re.test(cleaned);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // ============================================
    // 6. FORM SUBMISSION WITH SUPABASE
    // ============================================
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (submitBtn.disabled) return;
            
            try {
                // Validate form
                const formData = validateForm();
                
                // Show loading
                showLoading();
                
                // Step 1: Find or create customer
                const customerResult = await SupabaseService.findOrCreateCustomer({
                    full_name: formData.name,
                    phone: formData.phone,
                    email: formData.email
                });
                
                if (!customerResult.success) {
                    throw new Error('Failed to save customer information');
                }
                
                bookingState.customer = customerResult.data;
                
                // Step 2: Process payment if M-Pesa
                let paymentStatus = 'pending';
                let transactionId = null;
                
                if (bookingState.paymentMethod === 'mpesa') {
                    const paymentResult = await processMpesaPayment(
                        bookingState.price,
                        bookingState.mpesaNumber || formData.phone
                    );
                    
                    if (paymentResult.success) {
                        paymentStatus = 'paid';
                        transactionId = paymentResult.transactionId;
                    } else {
                        throw new Error('M-Pesa payment failed: ' + paymentResult.error);
                    }
                }
                
                // Step 3: Create appointment
                const appointmentData = {
                    customer_id: bookingState.customer.id,
                    service_id: bookingState.service.id,
                    barber_id: bookingState.barber || null,
                    appointment_date: bookingState.date,
                    appointment_time: bookingState.time,
                    amount_paid: bookingState.price,
                    payment_method: bookingState.paymentMethod,
                    payment_status: paymentStatus,
                    mpesa_transaction_id: transactionId,
                    special_requests: formData.specialRequests
                };
                
                const appointmentResult = await SupabaseService.createAppointment(appointmentData);
                
                if (!appointmentResult.success) {
                    throw new Error('Failed to create appointment: ' + appointmentResult.error);
                }
                
                // Step 4: Create notification
                await SupabaseService.createNotification({
                    appointment_id: appointmentResult.data.id,
                    customer_id: bookingState.customer.id,
                    type: 'booking_confirmation',
                    channel: 'email',
                    content: `Your appointment at KenBarber is confirmed for ${bookingState.date} at ${bookingState.time}`,
                    scheduled_for: new Date().toISOString()
                });
                
                // Step 5: Show success modal
                showConfirmationModal(appointmentResult.data, bookingState.customer);
                
                // Step 6: Send SMS notification (simulated)
                await sendSMSNotification(formData.phone, appointmentResult.data.booking_ref);
                
                // Step 7: Reset form
                resetForm();
                
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    async function processMpesaPayment(amount, phoneNumber) {
        // In production, this would call your backend API
        // For now, simulate successful payment
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: 'MP' + Date.now().toString().slice(-10)
                });
            }, 2000);
        });
    }
    
    async function sendSMSNotification(phone, bookingRef) {
        // In production, integrate with SMS API like Africa's Talking
        console.log(`SMS would be sent to ${phone} for booking ${bookingRef}`);
        
        // Save notification record
        const smsData = {
            phone: phone,
            message: `Your KenBarber appointment is confirmed. Ref: ${bookingRef}. We'll see you soon!`,
            status: 'sent',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(`sms_${bookingRef}`, JSON.stringify(smsData));
    }
    
    function showConfirmationModal(appointment, customer) {
        // Format date and time
        const appointmentDate = new Date(appointment.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Set modal content
        document.getElementById('modalService').textContent = bookingState.service.name;
        document.getElementById('modalDate').textContent = formattedDate;
        document.getElementById('modalTime').textContent = formatTime12Hour(appointment.appointment_time);
        document.getElementById('modalBarber').textContent = bookingState.barber ? 
            (barberSelect.options[barberSelect.selectedIndex]?.text || 'Any Available Barber') : 
            'Any Available Barber';
        document.getElementById('modalPrice').textContent = `KES ${bookingState.price}`;
        document.getElementById('modalRef').textContent = appointment.booking_ref;
        document.getElementById('modalPhone').textContent = customer.phone;
        document.getElementById('modalEmail').textContent = customer.email;
        
        // Show modal
        document.getElementById('successModal').style.display = 'flex';
    }
    
    function resetForm() {
        if (appointmentForm) {
            appointmentForm.reset();
        }
        
        // Reset state
        bookingState.service = null;
        bookingState.date = '';
        bookingState.time = '';
        bookingState.barber = null;
        bookingState.price = 0;
        bookingState.paymentMethod = 'cash';
        bookingState.mpesaNumber = '';
        bookingState.customer = null;
        
        // Reset UI
        if (priceDisplay) {
            priceDisplay.style.display = 'none';
        }
        
        const mpesaPaymentDiv = document.getElementById('mpesaPayment');
        if (mpesaPaymentDiv) {
            mpesaPaymentDiv.style.display = 'none';
        }
        
        // Reset selects
        if (serviceTypeSelect) {
            serviceTypeSelect.selectedIndex = 0;
        }
        
        if (barberSelect) {
            barberSelect.selectedIndex = 0;
        }
        
        if (appointmentTimeSelect) {
            appointmentTimeSelect.innerHTML = '<option value="">Select Time</option>';
            appointmentTimeSelect.disabled = true;
        }
    }
    
    function showLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
        }
    }
    
    function hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
    }
    
    function showNotification(message, type = 'success') {
        // Implementation from main.js
        console.log(`${type}: ${message}`);
        alert(message); // Temporary, replace with proper notification
    }
    
    // ============================================
    // 7. MODAL HANDLERS
    // ============================================
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
        });
    }
    
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
        });
    }
    
    const printBooking = document.getElementById('printBooking');
    if (printBooking) {
        printBooking.addEventListener('click', () => {
            window.print();
        });
    }
    
    const shareBooking = document.getElementById('shareBooking');
    if (shareBooking) {
        shareBooking.addEventListener('click', async () => {
            const service = document.getElementById('modalService').textContent;
            const date = document.getElementById('modalDate').textContent;
            const time = document.getElementById('modalTime').textContent;
            const ref = document.getElementById('modalRef').textContent;
            
            const shareText = `I've booked an appointment at KenBarber!\n\nService: ${service}\nDate: ${date}\nTime: ${time}\nReference: ${ref}\n\nBook your appointment at: ${window.location.href}`;
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'KenBarber Appointment',
                        text: shareText,
                        url: window.location.href
                    });
                } catch (error) {
                    console.log('Share cancelled:', error);
                }
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    showNotification('Booking details copied to clipboard!', 'success');
                });
            }
        });
    }
    
    // ============================================
    // 8. INITIALIZE
    // ============================================
    // Set minimum date to today
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    if (appointmentDateInput) {
        appointmentDateInput.min = todayFormatted;
        appointmentDateInput.value = todayFormatted;
        bookingState.date = todayFormatted;
    }
    
    // Initialize data
    initializeData();
    
    console.log('Supabase Booking System initialized');
});
