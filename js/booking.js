// booking.js - Booking System for KenBarber with Real Supabase
// REAL DATABASE VERSION

// Global booking variables
let selectedServicePrice = 0;
let selectedServiceName = '';
let selectedServiceId = '';
let availableTimeSlots = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Real Supabase Booking System...');
    
    // Check if Supabase is available
    if (!window.supabase) {
        console.error('Supabase not available for booking system');
        showBookingError('Booking system is not available. Please refresh the page.');
        return;
    }
    
    // Initialize booking system
    initializeBooking();
});

function initializeBooking() {
    console.log('Setting up booking system...');
    
    // 1. Initialize form elements
    initializeFormElements();
    
    // 2. Set up event listeners
    setupEventListeners();
    
    // 3. Initialize date picker
    initializeDatePicker();
    
    // 4. Setup payment options
    setupPaymentOptions();
    
    console.log('Booking system initialized');
}

function initializeFormElements() {
    // Service dropdown change handler
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.value) {
                selectedServicePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
                selectedServiceName = selectedOption.getAttribute('data-name') || '';
                selectedServiceId = selectedOption.value;
                
                // Update price display
                const priceDisplay = document.getElementById('priceDisplay');
                const totalPrice = document.getElementById('totalPrice');
                if (priceDisplay && totalPrice) {
                    totalPrice.textContent = `KES ${selectedServicePrice}`;
                    priceDisplay.style.display = 'block';
                }
            }
        });
    }
    
    // Date picker initialization
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

function initializeDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    
    if (!dateInput || !timeSelect) return;
    
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        if (!selectedDate) return;
        
        // Disable time select while loading
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
        
        try {
            // Load available time slots for selected date
            await loadAvailableTimeSlots(selectedDate);
            
            // Populate time slots
            populateTimeSlots();
            
            timeSelect.disabled = false;
            
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSelect.innerHTML = '<option value="">Error loading slots. Please try again.</option>';
            timeSelect.disabled = false;
        }
    });
    
    // Trigger initial load for tomorrow
    if (dateInput.value) {
        const event = new Event('change');
        dateInput.dispatchEvent(event);
    }
}

async function loadAvailableTimeSlots(date) {
    try {
        console.log('Loading time slots for:', date);
        
        // Business hours
        const businessHours = {
            start: 8,  // 8 AM
            end: 19    // 7 PM
        };
        
        // Check if it's Sunday
        const dateObj = new Date(date);
        const isSunday = dateObj.getDay() === 0;
        
        // Adjust hours for Sunday
        if (isSunday) {
            businessHours.start = 10;  // 10 AM
            businessHours.end = 16;    // 4 PM
        }
        
        // Get existing appointments for this date from Supabase
        let existingAppointments = [];
        
        try {
            const { data, error } = await window.supabase
                .from('appointments')
                .select('appointment_time')
                .eq('appointment_date', date)
                .eq('status', 'confirmed');
            
            if (error) {
                console.warn('Could not load appointments from Supabase:', error);
                // Continue with empty appointments array
            } else if (data) {
                existingAppointments = data.map(apt => apt.appointment_time);
            }
        } catch (dbError) {
            console.warn('Database error loading appointments:', dbError);
        }
        
        // Generate time slots
        availableTimeSlots = [];
        
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                
                // Check if this slot is booked
                const isBooked = existingAppointments.includes(timeString);
                
                availableTimeSlots.push({
                    time: timeString,
                    display: `${hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
                    available: !isBooked
                });
            }
        }
        
        console.log(`Generated ${availableTimeSlots.length} time slots, ${availableTimeSlots.filter(slot => slot.available).length} available`);
        
    } catch (error) {
        console.error('Error generating time slots:', error);
        throw error;
    }
}

function populateTimeSlots() {
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '';
    
    if (availableTimeSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No slots available</option>';
        return;
    }
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Time Slot';
    timeSelect.appendChild(defaultOption);
    
    // Add available time slots
    availableTimeSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = `${slot.display} ${slot.available ? '' : '(Booked)'}`;
        option.disabled = !slot.available;
        
        if (!slot.available) {
            option.style.color = '#999';
            option.style.fontStyle = 'italic';
        }
        
        timeSelect.appendChild(option);
    });
}

function setupEventListeners() {
    const form = document.getElementById('appointmentForm');
    if (!form) {
        console.error('Appointment form not found');
        return;
    }
    
    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateBookingForm()) {
            return;
        }
        
        // Process booking
        await processBooking();
    });
    
    // Phone number validation
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Format phone number
            let value = this.value.replace(/\D/g, '');
            
            if (value.startsWith('0')) {
                value = value.substring(0, 10);
            } else if (value.startsWith('254')) {
                value = value.substring(0, 12);
            } else if (value.startsWith('+254')) {
                value = value.substring(0, 13);
            } else {
                value = value.substring(0, 9);
            }
            
            // Format with spaces
            if (value.length > 0) {
                if (value.startsWith('0')) {
                    value = value.match(/.{1,3}/g).join(' ');
                } else if (value.startsWith('254')) {
                    value = '254 ' + value.substring(3).match(/.{1,3}/g).join(' ');
                }
            }
            
            this.value = value;
        });
    }
    
    // M-Pesa radio button handler
    const mpesaRadio = document.getElementById('mpesaRadio');
    const mpesaPaymentDiv = document.getElementById('mpesaPayment');
    
    if (mpesaRadio && mpesaPaymentDiv) {
        mpesaRadio.addEventListener('change', function() {
            if (this.checked) {
                mpesaPaymentDiv.style.display = 'block';
                
                // Copy phone number to M-Pesa number if empty
                const phoneInput = document.getElementById('phoneNumber');
                const mpesaInput = document.getElementById('mpesaNumber');
                
                if (phoneInput && mpesaInput && !mpesaInput.value) {
                    mpesaInput.value = phoneInput.value;
                }
            }
        });
    }
    
    // Other payment methods hide M-Pesa details
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        if (radio.value !== 'mpesa') {
            radio.addEventListener('change', function() {
                if (this.checked && mpesaPaymentDiv) {
                    mpesaPaymentDiv.style.display = 'none';
                }
            });
        }
    });
}

function setupPaymentOptions() {
    console.log('Payment options setup complete');
}

function validateBookingForm() {
    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const serviceType = document.getElementById('serviceType').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const termsAgree = document.getElementById('termsAgree').checked;
    const cancellationPolicy = document.getElementById('cancellationPolicy').checked;
    
    // Validate required fields
    if (!fullName) {
        showBookingError('Please enter your full name');
        return false;
    }
    
    if (!phoneNumber) {
        showBookingError('Please enter your phone number');
        return false;
    }
    
    // Validate phone number
    const phoneRegex = /^(07\d{8}|011\d{7}|\+2547\d{8}|\+25411\d{7})$/;
    const phoneDigits = phoneNumber.replace(/\s/g, '');
    
    if (!phoneRegex.test(phoneDigits)) {
        showBookingError('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
        return false;
    }
    
    if (!email) {
        showBookingError('Please enter your email address');
        return false;
    }
    
    if (!validateEmail(email)) {
        showBookingError('Please enter a valid email address');
        return false;
    }
    
    if (!serviceType) {
        showBookingError('Please select a service');
        return false;
    }
    
    if (!appointmentDate) {
        showBookingError('Please select a date');
        return false;
    }
    
    if (!appointmentTime) {
        showBookingError('Please select a time slot');
        return false;
    }
    
    if (!termsAgree) {
        showBookingError('Please agree to receive notifications');
        return false;
    }
    
    if (!cancellationPolicy) {
        showBookingError('Please agree to the cancellation policy');
        return false;
    }
    
    // Check if selected time slot is still available
    const selectedSlot = availableTimeSlots.find(slot => slot.time === appointmentTime);
    if (!selectedSlot || !selectedSlot.available) {
        showBookingError('The selected time slot is no longer available. Please choose another time.');
        return false;
    }
    
    // Validate M-Pesa number if M-Pesa is selected
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    if (paymentMethod === 'mpesa') {
        const mpesaNumber = document.getElementById('mpesaNumber').value.trim();
        if (!mpesaNumber) {
            showBookingError('Please enter your M-Pesa number');
            return false;
        }
        
        const mpesaDigits = mpesaNumber.replace(/\s/g, '');
        if (!phoneRegex.test(mpesaDigits)) {
            showBookingError('Please enter a valid M-Pesa number');
            return false;
        }
    }
    
    return true;
}

async function processBooking() {
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        // Collect form data
        const bookingData = collectFormData();
        
        console.log('Processing booking with data:', bookingData);
        
        // Save to Supabase
        const bookingResult = await saveBookingToSupabase(bookingData);
        
        // Save locally as backup
        saveBookingLocally(bookingData);
        
        // Show success modal
        showSuccessModal(bookingData, bookingResult);
        
        // Reset form
        resetBookingForm();
        
    } catch (error) {
        console.error('Booking processing error:', error);
        
        // Try to save locally as fallback
        try {
            const bookingData = collectFormData();
            saveBookingLocally(bookingData);
            
            showBookingError(
                'Booking saved locally. Database connection failed, but your appointment has been saved to your browser.',
                'warning'
            );
            
        } catch (fallbackError) {
            showBookingError('Booking failed. Please try again or contact us directly.', 'error');
        }
        
    } finally {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
    }
}

function collectFormData() {
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    
    // Get additional data
    const serviceSelect = document.getElementById('serviceType');
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
    const barberSelect = document.getElementById('barberSelect');
    const selectedBarber = barberSelect.options[barberSelect.selectedIndex];
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // Generate booking reference
    const bookingRef = 'KB-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return {
        customer_name: formData.get('fullName') || '',
        customer_phone: formData.get('phoneNumber') || '',
        customer_email: formData.get('email') || '',
        service_id: selectedService.value,
        service_name: selectedService.getAttribute('data-name') || '',
        service_price: selectedServicePrice,
        barber_id: selectedBarber.value || '',
        barber_name: selectedBarber.textContent || 'Any Available Barber',
        appointment_date: formData.get('appointmentDate') || '',
        appointment_time: formData.get('appointmentTime') || '',
        special_requests: formData.get('specialRequests') || '',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'mpesa' ? 'pending' : 'to_pay_at_shop',
        booking_reference: bookingRef,
        status: 'confirmed',
        created_at: new Date().toISOString()
    };
}

async function saveBookingToSupabase(bookingData) {
    console.log('Saving booking to Supabase:', bookingData);
    
    if (!window.supabase) {
        throw new Error('Supabase not available');
    }
    
    try {
        // First check if the slot is still available
        const { data: existingAppointments, error: checkError } = await window.supabase
            .from('appointments')
            .select('id')
            .eq('appointment_date', bookingData.appointment_date)
            .eq('appointment_time', bookingData.appointment_time)
            .eq('status', 'confirmed');
        
        if (checkError) {
            console.warn('Could not check slot availability:', checkError);
        } else if (existingAppointments && existingAppointments.length > 0) {
            throw new Error('Time slot is no longer available');
        }
        
        // Save to Supabase
        const { data, error } = await window.supabase
            .from('appointments')
            .insert([{
                customer_name: bookingData.customer_name,
                customer_phone: bookingData.customer_phone.replace(/\s/g, ''),
                customer_email: bookingData.customer_email,
                service_name: bookingData.service_name,
                appointment_date: bookingData.appointment_date,
                appointment_time: bookingData.appointment_time,
                notes: bookingData.special_requests,
                payment_method: bookingData.payment_method,
                status: 'confirmed',
                booking_reference: bookingData.booking_reference
            }])
            .select();
        
        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }
        
        console.log('Booking saved to Supabase:', data);
        
        // Try to save to customers table as well
        try {
            await window.supabase
                .from('customers')
                .upsert({
                    phone: bookingData.customer_phone.replace(/\s/g, ''),
                    email: bookingData.customer_email,
                    name: bookingData.customer_name,
                    last_visit: bookingData.appointment_date,
                    total_visits: 1
                }, {
                    onConflict: 'phone'
                });
        } catch (customerError) {
            console.warn('Could not update customers table:', customerError);
            // Non-critical error, continue
        }
        
        return {
            success: true,
            data: data,
            booking_ref: bookingData.booking_reference,
            message: 'Booking saved successfully to database'
        };
        
    } catch (error) {
        console.error('Failed to save to Supabase:', error);
        throw error;
    }
}

function saveBookingLocally(bookingData) {
    try {
        // Get existing bookings from localStorage
        let localBookings = JSON.parse(localStorage.getItem('kenbarber_local_bookings') || '[]');
        
        // Add new booking
        localBookings.push({
            ...bookingData,
            saved_locally: true,
            local_save_time: new Date().toISOString()
        });
        
        // Keep only last 50 bookings
        if (localBookings.length > 50) {
            localBookings = localBookings.slice(-50);
        }
        
        // Save back to localStorage
        localStorage.setItem('kenbarber_local_bookings', JSON.stringify(localBookings));
        
        console.log('Booking saved locally');
        
    } catch (error) {
        console.error('Error saving booking locally:', error);
    }
}

function showSuccessModal(bookingData, bookingResult) {
    const modal = document.getElementById('successModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createSuccessModal();
    }
    
    // Update modal content
    document.getElementById('modalService').textContent = bookingData.service_name;
    document.getElementById('modalDate').textContent = formatDate(bookingData.appointment_date);
    document.getElementById('modalTime').textContent = formatTime(bookingData.appointment_time);
    document.getElementById('modalBarber').textContent = bookingData.barber_name;
    document.getElementById('modalPrice').textContent = `KES ${bookingData.service_price}`;
    document.getElementById('modalRef').textContent = bookingData.booking_reference;
    document.getElementById('modalPhone').textContent = bookingData.customer_phone;
    document.getElementById('modalEmail').textContent = bookingData.customer_email;
    
    // Show modal
    modal.style.display = 'block';
    
    // Setup close buttons
    setupModalCloseButtons();
    
    // Setup print button
    const printBtn = document.getElementById('printBooking');
    if (printBtn) {
        printBtn.onclick = function() {
            printBookingDetails(bookingData);
        };
    }
    
    // Setup share button
    const shareBtn = document.getElementById('shareBooking');
    if (shareBtn) {
        shareBtn.onclick = function() {
            shareBookingDetails(bookingData);
        };
    }
}

function createSuccessModal() {
    // Modal already exists in HTML, just make sure it's accessible
    console.log('Success modal should exist in HTML');
}

function setupModalCloseButtons() {
    const modal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.modal-close');
    const doneBtn = document.getElementById('closeSuccessModal');
    
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    if (doneBtn) {
        doneBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Close when clicking outside modal
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function resetBookingForm() {
    const form = document.getElementById('appointmentForm');
    if (form) {
        form.reset();
        
        // Reset price display
        const priceDisplay = document.getElementById('priceDisplay');
        if (priceDisplay) {
            priceDisplay.style.display = 'none';
        }
        
        // Reset M-Pesa payment section
        const mpesaPayment = document.getElementById('mpesaPayment');
        if (mpesaPayment) {
            mpesaPayment.style.display = 'none';
        }
        
        // Reset date to tomorrow
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            
            // Trigger date change to load new time slots
            const event = new Event('change');
            dateInput.dispatchEvent(event);
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function showBookingError(message, type = 'error') {
    // Use the global showNotification function if available
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback alert
    alert(message);
}

function printBookingDetails(bookingData) {
    const printContent = `
        <html>
        <head>
            <title>KenBarber Booking Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #333; }
                .details { margin: 20px 0; }
                .detail-row { margin: 10px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">KenBarber Shop</div>
                <h2>Booking Confirmation</h2>
            </div>
            <div class="details">
                <div class="detail-row"><span class="label">Booking Reference:</span> ${bookingData.booking_reference}</div>
                <div class="detail-row"><span class="label">Customer Name:</span> ${bookingData.customer_name}</div>
                <div class="detail-row"><span class="label">Phone:</span> ${bookingData.customer_phone}</div>
                <div class="detail-row"><span class="label">Email:</span> ${bookingData.customer_email}</div>
                <div class="detail-row"><span class="label">Service:</span> ${bookingData.service_name}</div>
                <div class="detail-row"><span class="label">Date:</span> ${formatDate(bookingData.appointment_date)}</div>
                <div class="detail-row"><span class="label">Time:</span> ${formatTime(bookingData.appointment_time)}</div>
                <div class="detail-row"><span class="label">Barber:</span> ${bookingData.barber_name}</div>
                <div class="detail-row"><span class="label">Amount:</span> KES ${bookingData.service_price}</div>
                <div class="detail-row"><span class="label">Payment Method:</span> ${bookingData.payment_method}</div>
                ${bookingData.special_requests ? `<div class="detail-row"><span class="label">Special Requests:</span> ${bookingData.special_requests}</div>` : ''}
            </div>
            <div class="footer">
                <p>KenBarber Shop - London Ward, Nakuru</p>
                <p>Phone: 0790 969 743 | Email: info@kenbarber.co.ke</p>
                <p>Please arrive 5 minutes before your appointment time.</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function shareBookingDetails(bookingData) {
    const shareText = `My KenBarber Appointment:
📅 Date: ${formatDate(bookingData.appointment_date)}
⏰ Time: ${formatTime(bookingData.appointment_time)}
💈 Service: ${bookingData.service_name}
💰 Price: KES ${bookingData.service_price}
📱 Reference: ${bookingData.booking_reference}

Book your appointment at KenBarber Shop!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'KenBarber Booking Confirmation',
            text: shareText,
            url: window.location.href
        });
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(shareText)
            .then(() => {
                if (window.showNotification) {
                    window.showNotification('Booking details copied to clipboard!', 'success');
                } else {
                    alert('Booking details copied to clipboard!');
                }
            })
            .catch(err => {
                console.error('Failed to copy:', err);
            });
    }
}

// Export functions for global use
window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

console.log('Booking system loaded successfully');
