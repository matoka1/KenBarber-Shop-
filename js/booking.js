// booking.js - Booking System for KenBarber with Supabase Integration
// Contains all booking-related functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing KenBarber Booking System...');
    
    // ============================================
    // 1. INITIALIZE BOOKING SYSTEM
    // ============================================
    
    // DOM Elements
    const appointmentForm = document.getElementById('appointmentForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    const appointmentDateInput = document.getElementById('appointmentDate');
    const appointmentTimeSelect = document.getElementById('appointmentTime');
    const barberSelect = document.getElementById('barberSelect');
    const priceDisplay = document.getElementById('priceDisplay');
    const totalPriceSpan = document.getElementById('totalPrice');
    const submitBtn = document.getElementById('submitBtn');
    const mpesaRadio = document.getElementById('mpesaRadio');
    const mpesaPaymentDiv = document.getElementById('mpesaPayment');
    
    // State
    const bookingState = {
        service: null,
        date: '',
        time: '',
        barber: null,
        price: 0,
        paymentMethod: 'cash',
        mpesaNumber: '',
        isProcessing: false
    };
    
    // ============================================
    // 2. INITIAL SETUP
    // ============================================
    
    // Set minimum date to today
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    if (appointmentDateInput) {
        appointmentDateInput.min = todayFormatted;
        appointmentDateInput.value = todayFormatted;
        bookingState.date = todayFormatted;
    }
    
    // Enable booking form
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
    }
    
    // Initialize time slots
    updateTimeSlots();
    
    // ============================================
    // 3. EVENT LISTENERS
    // ============================================
    
    // Service selection
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', function() {
            updateServicePrice();
            updateTimeSlots();
        });
    }
    
    // Date selection
    if (appointmentDateInput) {
        appointmentDateInput.addEventListener('change', function() {
            bookingState.date = this.value;
            updateTimeSlots();
            checkBarberAvailability();
        });
    }
    
    // Time selection
    if (appointmentTimeSelect) {
        appointmentTimeSelect.addEventListener('change', function() {
            bookingState.time = this.value;
            checkBarberAvailability();
        });
    }
    
    // Barber selection
    if (barberSelect) {
        barberSelect.addEventListener('change', function() {
            bookingState.barber = this.value;
            updateTimeSlots();
        });
    }
    
    // M-Pesa payment toggle
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function() {
            bookingState.paymentMethod = this.value;
            
            // Show/hide M-Pesa details
            if (mpesaPaymentDiv) {
                mpesaPaymentDiv.style.display = this.value === 'mpesa' ? 'block' : 'none';
                
                // Pre-fill M-Pesa number from phone number
                if (this.value === 'mpesa') {
                    const phoneInput = document.getElementById('phoneNumber');
                    const mpesaNumberInput = document.getElementById('mpesaNumber');
                    if (phoneInput && phoneInput.value && mpesaNumberInput) {
                        mpesaNumberInput.value = phoneInput.value;
                        bookingState.mpesaNumber = phoneInput.value;
                    }
                }
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
    
    // Phone number auto-fill for M-Pesa
    const phoneNumberInput = document.getElementById('phoneNumber');
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function() {
            // If M-Pesa is selected, update M-Pesa number
            if (mpesaRadio && mpesaRadio.checked && mpesaNumberInput) {
                mpesaNumberInput.value = this.value;
                bookingState.mpesaNumber = this.value;
            }
        });
    }
    
    // ============================================
    // 4. CORE FUNCTIONS
    // ============================================
    
    /**
     * Update service price display
     */
    function updateServicePrice() {
        if (!serviceTypeSelect || !totalPriceSpan || !priceDisplay) return;
        
        const selectedOption = serviceTypeSelect.options[serviceTypeSelect.selectedIndex];
        const price = selectedOption.getAttribute('data-price') || '0';
        const serviceName = selectedOption.getAttribute('data-name') || '';
        
        bookingState.service = {
            id: selectedOption.value,
            name: serviceName,
            price: parseInt(price)
        };
        bookingState.price = parseInt(price);
        
        if (price !== '0') {
            totalPriceSpan.textContent = `KES ${price}`;
            priceDisplay.style.display = 'block';
        } else {
            priceDisplay.style.display = 'none';
        }
    }
    
    /**
     * Generate available time slots based on selected date
     */
    function updateTimeSlots() {
        if (!appointmentTimeSelect || !appointmentDateInput) return;
        
        const selectedDate = new Date(appointmentDateInput.value);
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        const currentHour = today.getHours();
        
        // Clear existing options
        appointmentTimeSelect.innerHTML = '<option value="">Select Time</option>';
        
        if (!appointmentDateInput.value) return;
        
        // Generate time slots (9 AM to 6 PM, 30-minute intervals)
        const startHour = 9;
        const endHour = 18;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const timeDisplay = formatTime12Hour(timeString);
                
                // Skip past times for today
                if (isToday) {
                    const slotHour = hour;
                    const slotMinute = minute;
                    if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= today.getMinutes())) {
                        continue;
                    }
                }
                
                // Check availability
                const isAvailable = isTimeSlotAvailable(selectedDate, timeString);
                
                const option = document.createElement('option');
                option.value = timeString;
                option.textContent = timeDisplay;
                
                if (!isAvailable) {
                    option.textContent += ' (Booked)';
                    option.disabled = true;
                }
                
                appointmentTimeSelect.appendChild(option);
            }
        }
        
        // Enable/disable based on availability
        appointmentTimeSelect.disabled = appointmentTimeSelect.options.length <= 1;
    }
    
    /**
     * Format 24-hour time to 12-hour format
     */
    function formatTime12Hour(time24) {
        const [hour, minute] = time24.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    }
    
    /**
     * Check if a time slot is available
     */
    function isTimeSlotAvailable(date, time) {
        // Check localStorage for existing bookings
        const existingBookings = JSON.parse(localStorage.getItem('kenbarber_bookings') || '[]');
        
        // Check if slot is booked for selected barber
        const conflictingBooking = existingBookings.find(booking => 
            booking.date === date.toISOString().split('T')[0] && 
            booking.time === time &&
            (booking.barber === bookingState.barber || bookingState.barber === 'any' || !bookingState.barber) &&
            booking.status !== 'cancelled'
        );
        
        return !conflictingBooking;
    }
    
    /**
     * Check barber availability for selected date/time
     */
    function checkBarberAvailability() {
        if (!bookingState.date || !bookingState.time || !barberSelect) return;
        
        // For now, we'll just enable all barbers
        // In a full implementation, this would check Supabase
        console.log('Checking barber availability for', bookingState.date, bookingState.time);
    }
    
    /**
     * Validate booking form
     */
    function validateForm() {
        const name = document.getElementById('fullName')?.value.trim();
        const phone = document.getElementById('phoneNumber')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const service = serviceTypeSelect?.value;
        const date = appointmentDateInput?.value;
        const time = appointmentTimeSelect?.value;
        const termsAgree = document.getElementById('termsAgree')?.checked;
        const cancellationPolicy = document.getElementById('cancellationPolicy')?.checked;
        
        // Validation checks
        if (!name || name.length < 2) {
            throw new Error('Please enter a valid name');
        }
        
        if (!phone || !validatePhone(phone)) {
            throw new Error('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
        }
        
        if (!email || !validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (!service) {
            throw new Error('Please select a service');
        }
        
        if (!date) {
            throw new Error('Please select a date');
        }
        
        if (!time) {
            throw new Error('Please select a time slot');
        }
        
        if (bookingState.paymentMethod === 'mpesa' && (!bookingState.mpesaNumber || !validatePhone(bookingState.mpesaNumber))) {
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
            service: bookingState.service,
            date,
            time,
            barber: bookingState.barber || 'any',
            price: bookingState.price,
            paymentMethod: bookingState.paymentMethod,
            mpesaNumber: bookingState.mpesaNumber,
            specialRequests: document.getElementById('specialRequests')?.value.trim() || ''
        };
    }
    
    /**
     * Phone number validation (Kenyan)
     */
    function validatePhone(phone) {
        const cleaned = phone.replace(/\s/g, '');
        const re = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
        return re.test(cleaned);
    }
    
    /**
     * Email validation
     */
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Generate booking reference number
     */
    function generateBookingRef() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let ref = 'KB';
        for (let i = 0; i < 6; i++) {
            ref += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return ref;
    }
    
    // ============================================
    // 5. FORM SUBMISSION HANDLER
    // ============================================
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (bookingState.isProcessing) return;
            
            try {
                // Validate form
                const formData = validateForm();
                
                // Show loading
                showLoading();
                
                // Save booking to Supabase if available
                let supabaseResult = null;
                if (window.supabase) {
                    supabaseResult = await saveBookingToSupabase(formData);
                }
                
                // Save to localStorage (always)
                const localBooking = saveBookingToLocalStorage(formData, supabaseResult);
                
                // Send notifications
                sendNotifications(localBooking);
                
                // Show confirmation
                showConfirmationModal(localBooking);
                
                // Reset form
                resetForm();
                
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    /**
     * Save booking to Supabase
     */
    async function saveBookingToSupabase(formData) {
        try {
            // 1. Find or create customer
            const { data: customer, error: customerError } = await window.supabase
                .from('customers')
                .upsert({
                    full_name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'phone',
                    ignoreDuplicates: false
                })
                .select()
                .single();
            
            if (customerError) throw customerError;
            
            // 2. Create appointment
            const bookingRef = generateBookingRef();
            const appointmentData = {
                customer_id: customer.id,
                service_id: formData.service.id,
                barber_id: formData.barber === 'any' ? null : formData.barber,
                appointment_date: formData.date,
                appointment_time: formData.time,
                amount_paid: formData.price,
                payment_method: formData.paymentMethod,
                payment_status: formData.paymentMethod === 'mpesa' ? 'paid' : 'pending',
                mpesa_transaction_id: formData.paymentMethod === 'mpesa' ? 'MP' + Date.now() : null,
                special_requests: formData.specialRequests,
                booking_reference: bookingRef,
                status: 'confirmed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data: appointment, error: appointmentError } = await window.supabase
                .from('appointments')
                .insert([appointmentData])
                .select()
                .single();
            
            if (appointmentError) throw appointmentError;
            
            return {
                success: true,
                customer,
                appointment,
                bookingRef
            };
            
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Save booking to localStorage
     */
    function saveBookingToLocalStorage(formData, supabaseResult) {
        const bookingRef = supabaseResult?.bookingRef || generateBookingRef();
        
        const booking = {
            id: Date.now(),
            ref: bookingRef,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            service: formData.service,
            barber: formData.barber,
            date: formData.date,
            time: formData.time,
            price: formData.price,
            paymentMethod: formData.paymentMethod,
            mpesaNumber: formData.mpesaNumber,
            specialRequests: formData.specialRequests,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            supabaseId: supabaseResult?.appointment?.id || null
        };
        
        // Save to localStorage
        let bookings = JSON.parse(localStorage.getItem('kenbarber_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('kenbarber_bookings', JSON.stringify(bookings));
        
        return booking;
    }
    
    /**
     * Send notifications (simulated)
     */
    function sendNotifications(booking) {
        // Simulate SMS sending
        console.log(`SMS sent to ${booking.phone}: Your KenBarber appointment is confirmed. Ref: ${booking.ref}`);
        
        // Simulate email sending
        console.log(`Email sent to ${booking.email}: Booking confirmation`);
        
        // Save notification record
        const notifications = JSON.parse(localStorage.getItem('kenbarber_notifications') || '[]');
        notifications.push({
            bookingRef: booking.ref,
            type: 'confirmation',
            sentTo: [booking.phone, booking.email],
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('kenbarber_notifications', JSON.stringify(notifications));
    }
    
    /**
     * Show booking confirmation modal
     */
    function showConfirmationModal(booking) {
        // Format date
        const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Format time
        const formattedTime = formatTime12Hour(booking.time);
        
        // Get barber name
        const barberSelect = document.getElementById('barberSelect');
        const barberName = barberSelect?.options[barberSelect.selectedIndex]?.text || 'Any Available Barber';
        
        // Set modal content
        document.getElementById('modalService').textContent = booking.service.name;
        document.getElementById('modalDate').textContent = formattedDate;
        document.getElementById('modalTime').textContent = formattedTime;
        document.getElementById('modalBarber').textContent = barberName;
        document.getElementById('modalPrice').textContent = `KES ${booking.price}`;
        document.getElementById('modalRef').textContent = booking.ref;
        document.getElementById('modalPhone').textContent = booking.phone;
        document.getElementById('modalEmail').textContent = booking.email;
        
        // Show modal
        document.getElementById('successModal').style.display = 'flex';
    }
    
    /**
     * Reset booking form
     */
    function resetForm() {
        if (appointmentForm) {
            appointmentForm.reset();
        }
        
        // Reset price display
        if (priceDisplay) {
            priceDisplay.style.display = 'none';
        }
        
        // Reset M-Pesa payment section
        if (mpesaPaymentDiv) {
            mpesaPaymentDiv.style.display = 'none';
        }
        
        // Reset booking state
        bookingState.service = null;
        bookingState.date = todayFormatted;
        bookingState.time = '';
        bookingState.barber = null;
        bookingState.price = 0;
        bookingState.paymentMethod = 'cash';
        bookingState.mpesaNumber = '';
        bookingState.isProcessing = false;
        
        // Reset date input
        if (appointmentDateInput) {
            appointmentDateInput.value = todayFormatted;
        }
        
        // Reset time slots
        updateTimeSlots();
    }
    
    /**
     * Show loading spinner
     */
    function showLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'flex';
        }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
        }
        
        bookingState.isProcessing = true;
    }
    
    /**
     * Hide loading spinner
     */
    function hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
        
        bookingState.isProcessing = false;
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `booking-notification ${type}`;
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
        
        // Add animation styles if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
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
    }
    
    // ============================================
    // 6. MODAL HANDLERS
    // ============================================
    
    // Close success modal
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
        });
    }
    
    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('successModal').style.display = 'none';
        });
    }
    
    // Print booking details
    const printBooking = document.getElementById('printBooking');
    if (printBooking) {
        printBooking.addEventListener('click', () => {
            window.print();
        });
    }
    
    // Share booking details
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
                // Fallback: Copy to clipboard
                try {
                    await navigator.clipboard.writeText(shareText);
                    showNotification('Booking details copied to clipboard!', 'success');
                } catch (err) {
                    // Fallback fallback: Show text to copy
                    prompt('Copy this text to share:', shareText);
                }
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('successModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // ============================================
    // 7. BOOKING REMINDERS
    // ============================================
    function setupReminders() {
        // Check for upcoming appointments
        const now = new Date();
        const bookings = JSON.parse(localStorage.getItem('kenbarber_bookings') || '[]');
        
        const upcomingBookings = bookings.filter(booking => {
            if (booking.status !== 'confirmed') return false;
            
            const bookingDate = new Date(booking.date + 'T' + booking.time);
            const timeDiff = bookingDate - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Remind 24 hours before
            return hoursDiff > 0 && hoursDiff <= 24;
        });
        
        // Create reminders if not already created
        upcomingBookings.forEach(booking => {
            const reminderKey = `reminder_${booking.ref}`;
            if (!localStorage.getItem(reminderKey)) {
                // Schedule reminder (in real app, this would be a server-side job)
                console.log(`Reminder scheduled for booking ${booking.ref}`);
                localStorage.setItem(reminderKey, 'scheduled');
                
                // Show notification for demo
                setTimeout(() => {
                    showNotification(`Reminder: You have an appointment tomorrow at ${booking.time}`, 'info');
                }, 1000);
            }
        });
    }
    
    // Run reminders check
    setupReminders();
    
    // ============================================
    // 8. GLOBAL FUNCTIONS
    // ============================================
    // Update service price function for inline use
    window.updateServicePrice = updateServicePrice;
    
    console.log('Booking system initialized successfully');
});

// Utility functions for global use
function formatCurrency(amount) {
    return `KES ${amount.toLocaleString()}`;
}

function formatDateTime(dateString, timeString) {
    const date = new Date(dateString + 'T' + timeString);
    return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
