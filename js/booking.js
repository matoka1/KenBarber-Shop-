// Global variables
let selectedServicePrice = 0;
let selectedServiceName = '';
let selectedServiceId = '';
let availableTimeSlots = [];
let isProcessingBooking = false; // Add flag to prevent multiple submissions

function initializeBooking() {
    console.log('Setting up booking system...');
    
    // Wait for main.js to create form elements and load services
    const checkFormReady = () => {
        const serviceSelect = document.getElementById('serviceType');
        const dateInput = document.getElementById('appointmentDate');
        const timeSelect = document.getElementById('appointmentTime');
        const submitBtn = document.getElementById('submitBtn');
        
        // Check if elements exist AND services are loaded (more than 1 option)
        if (serviceSelect && dateInput && timeSelect && submitBtn && serviceSelect.options.length > 1) {
            console.log('✅ Form elements ready, initializing booking system...');
            
            // Initialize form elements
            initializeFormElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize date picker with delay
            setTimeout(() => {
                initializeDatePicker();
            }, 100);
            
            // Setup payment options
            setupPaymentOptions();
            
            // Enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
            
            console.log('✅ Booking system initialized successfully');
            return true;
        } else {
            console.log('⏳ Waiting for form elements to be ready...');
            setTimeout(checkFormReady, 500);
            return false;
        }
    };
    
    // Start checking for form readiness
    checkFormReady();
}

function initializeFormElements() {
    // Service dropdown change handler
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        // Set initial values if service is pre-selected
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        if (selectedOption.value) {
            selectedServicePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            selectedServiceName = selectedOption.getAttribute('data-name') || '';
            selectedServiceId = selectedOption.value;
            
            // Update price display
            updatePriceDisplay();
        }
        
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.value) {
                selectedServicePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
                selectedServiceName = selectedOption.getAttribute('data-name') || '';
                selectedServiceId = selectedOption.value;
                
                // Update price display
                updatePriceDisplay();
            } else {
                // Hide price if no service selected
                const priceDisplay = document.getElementById('priceDisplay');
                if (priceDisplay) {
                    priceDisplay.style.display = 'none';
                }
            }
        });
    }
    
    // Date picker initialization
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format date as YYYY-MM-DD
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        dateInput.min = formatDate(tomorrow);
        
        // Set max date to 3 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = formatDate(maxDate);
        
        // Set initial date to tomorrow
        dateInput.value = formatDate(tomorrow);
        
        // Disable weekends (Saturday = 6, Sunday = 0)
        dateInput.addEventListener('input', function() {
            const selectedDate = new Date(this.value);
            const dayOfWeek = selectedDate.getDay();
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                this.value = '';
                showBookingError('We are closed on weekends. Please select a weekday (Monday-Friday).', 'warning');
            }
        });
    }
}

function updatePriceDisplay() {
    const priceDisplay = document.getElementById('priceDisplay');
    const totalPrice = document.getElementById('totalPrice');
    if (priceDisplay && totalPrice) {
        totalPrice.textContent = `KES ${selectedServicePrice}`;
        priceDisplay.style.display = 'block';
    }
}

function initializeDatePicker() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    
    if (!dateInput || !timeSelect) {
        console.error('Date or time elements not found');
        return;
    }
    
    // Clear any existing time slots
    timeSelect.innerHTML = '<option value="">Select a date first</option>';
    timeSelect.disabled = true;
    
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        if (!selectedDate) {
            timeSelect.innerHTML = '<option value="">Select a date first</option>';
            timeSelect.disabled = true;
            return;
        }
        
        // Check if it's a weekend
        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            timeSelect.innerHTML = '<option value="">Closed on weekends</option>';
            timeSelect.disabled = true;
            return;
        }
        
        // Disable time select while loading
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
        
        try {
            // Load available time slots for selected date
            await loadAvailableTimeSlots(selectedDate);
            
            // Populate time slots
            populateTimeSlots();
            
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSelect.innerHTML = '<option value="">Error loading slots. Please try again.</option>';
            timeSelect.disabled = true;
        }
    });
}

async function loadAvailableTimeSlots(date) {
    // ADD THIS PROTECTION:
    if (!date || date.trim() === '') {
        console.warn('loadAvailableTimeSlots called with empty date');
        return;
    }
    
    // ADD THIS TO PREVENT MULTIPLE CALLS:
    if (window.loadingTimeSlots) {
        console.log('Time slots already loading, skipping...');
        return;
    }
    
    window.loadingTimeSlots = true;
    try {
        console.log('Loading time slots for:', date);
        
        // Business hours (Monday-Friday)
        const businessHours = {
            start: 8,  // 8 AM
            end: 19    // 7 PM
        };
        
        // Check if it's Sunday (though weekends should be blocked)
        const dateObj = new Date(date);
        const isSunday = dateObj.getDay() === 0;
        
        // Adjust hours for Sunday if somehow selected
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
                // Extract just the time part and normalize format
                existingAppointments = data.map(apt => {
                    if (apt.appointment_time) {
                        // Handle different time formats
                        let timeStr = apt.appointment_time.toString();
                        
                        // Remove seconds if present
                        if (timeStr.includes(':')) {
                            const parts = timeStr.split(':');
                            if (parts.length >= 2) {
                                return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
                            }
                        }
                        return timeStr;
                    }
                    return '';
                }).filter(t => t && t.length > 0);
            }
            
            console.log('Existing appointments:', existingAppointments);
            
        } catch (dbError) {
            console.warn('Database error loading appointments:', dbError);
        }
        
        // Generate time slots
        availableTimeSlots = [];
        
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            // Create slots every 30 minutes
            for (let minute of [0, 30]) {
                // Skip if minute would go past closing time
                if (hour === businessHours.end - 1 && minute === 30) {
                    continue;
                }
                
                const hour24 = hour;
                const hour12 = hour % 12 || 12;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                
                // Create time strings
                const time24 = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const timeDisplay = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
                const timeDB = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                
                // Check if this slot is booked
                const isBooked = existingAppointments.some(aptTime => {
                    // Normalize comparison - remove seconds if present
                    const aptTimeSimple = aptTime.split(':').slice(0, 2).join(':');
                    return aptTimeSimple === time24;
                });
                
                availableTimeSlots.push({
                    time: timeDB,
                    display: timeDisplay,
                    time24: time24,
                    available: !isBooked,
                    hour: hour24,
                    minute: minute
                });
            }
        }
        
        console.log(`Generated ${availableTimeSlots.length} time slots, ${availableTimeSlots.filter(slot => slot.available).length} available`);
        
    } catch (error) {
        console.error('Error generating time slots:', error);
        throw error;
    } finally {
        window.loadingTimeSlots = false;
    }
}

function populateTimeSlots() {
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;
    
    // Clear existing options
    timeSelect.innerHTML = '';
    timeSelect.disabled = false;
    
    if (!availableTimeSlots || availableTimeSlots.length === 0) {
        const noSlotsOption = document.createElement('option');
        noSlotsOption.value = '';
        noSlotsOption.textContent = 'No slots available for this date';
        timeSelect.appendChild(noSlotsOption);
        timeSelect.disabled = true;
        return;
    }
    
    // Filter for available slots
    const availableSlots = availableTimeSlots.filter(slot => slot.available);
    const bookedSlots = availableTimeSlots.filter(slot => !slot.available);
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = availableSlots.length > 0 ? 'Select a time slot' : 'All slots booked';
    timeSelect.appendChild(defaultOption);
    
    if (availableSlots.length === 0) {
        timeSelect.disabled = true;
        
        // Show booked slots for reference
        if (bookedSlots.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '───────── All slots booked ─────────';
            timeSelect.appendChild(separator);
            
            bookedSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = `${slot.display} (Booked)`;
                option.disabled = true;
                option.style.color = '#999';
                option.style.fontStyle = 'italic';
                timeSelect.appendChild(option);
            });
        }
        
        return;
    }
    
    // Group slots by AM/PM
    const morningSlots = availableSlots.filter(slot => slot.hour < 12);
    const afternoonSlots = availableSlots.filter(slot => slot.hour >= 12);
    
    // Add morning slots
    if (morningSlots.length > 0) {
        const morningLabel = document.createElement('option');
        morningLabel.disabled = true;
        morningLabel.textContent = '── Morning ──';
        timeSelect.appendChild(morningLabel);
        
        morningSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.display;
            timeSelect.appendChild(option);
        });
    }
    
    // Add afternoon slots
    if (afternoonSlots.length > 0) {
        const afternoonLabel = document.createElement('option');
        afternoonLabel.disabled = true;
        afternoonLabel.textContent = '── Afternoon ──';
        timeSelect.appendChild(afternoonLabel);
        
        afternoonSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.display;
            timeSelect.appendChild(option);
        });
    }
}

function setupEventListeners() {
    const form = document.getElementById('appointmentForm');
    if (!form) {
        console.error('Appointment form not found');
        return;
    }
    
    // PREVENT DEFAULT FORM SUBMISSION - Fix for the "Processing your booking..." issue
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // The actual submission is handled in the async function below
    });
    
    // Add click handler to submit button instead
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Prevent multiple clicks
            if (isProcessingBooking) {
                console.log('Booking already in progress, ignoring click');
                return;
            }
            
            isProcessingBooking = true;
            
            // Validate form
            if (!validateBookingForm()) {
                isProcessingBooking = false;
                return;
            }
            
            // Process booking
            await processBooking();
            isProcessingBooking = false;
        });
    }
    
    // Phone number validation and formatting
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Get cursor position
            const cursorPos = this.selectionStart;
            const originalLength = this.value.length;
            
            // Remove all non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Format based on starting digits
            let formatted = '';
            
            if (value.startsWith('254') && value.length <= 12) {
                formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3 $4').trim();
            } else if (value.startsWith('0') && value.length <= 10) {
                formatted = value.replace(/(\d{4})(\d{3})(\d{0,3})/, '$1 $2 $3').trim();
            } else if (value.length <= 9) {
                formatted = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim();
            } else {
                if (value.startsWith('254')) {
                    value = value.substring(0, 12);
                    formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3 $4').trim();
                } else if (value.startsWith('0')) {
                    value = value.substring(0, 10);
                    formatted = value.replace(/(\d{4})(\d{3})(\d{0,3})/, '$1 $2 $3').trim();
                }
            }
            
            this.value = formatted;
            
            // Restore cursor position
            const newLength = this.value.length;
            const cursorOffset = newLength - originalLength;
            this.setSelectionRange(cursorPos + cursorOffset, cursorPos + cursorOffset);
        });
        
        phoneInput.addEventListener('blur', function() {
            const value = this.value.replace(/\s/g, '');
            const phoneRegex = /^(0[17]\d{8}|011\d{7}|254[17]\d{8})$/;
            
            if (value && !phoneRegex.test(value)) {
                showBookingError('Please enter a valid Kenyan phone number (e.g., 0712 345 678)', 'warning');
            }
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showBookingError('Please enter a valid email address', 'warning');
            }
        });
    }
    
    // Handle STK Push vs Manual M-Pesa selection
    const mpesaStkRadio = document.getElementById('mpesaStkRadio');
    const mpesaManualRadio = document.getElementById('mpesaManualRadio');
    const stkPaymentInfo = document.getElementById('stkPaymentInfo');
    const manualMpesaPayment = document.getElementById('manualMpesaPayment');
    
    function updateMpesaDisplay() {
        console.log('Updating M-Pesa display...');
        
        if (mpesaStkRadio && mpesaStkRadio.checked) {
            console.log('STK Push selected');
            if (stkPaymentInfo) {
                stkPaymentInfo.style.display = 'block';
                stkPaymentInfo.style.cssText = 'display: block !important;';
            }
            if (manualMpesaPayment) {
                manualMpesaPayment.style.display = 'none';
                manualMpesaPayment.style.cssText = 'display: none !important;';
            }
        } else if (mpesaManualRadio && mpesaManualRadio.checked) {
            console.log('Manual M-Pesa selected');
            if (manualMpesaPayment) {
                manualMpesaPayment.style.display = 'block';
                manualMpesaPayment.style.cssText = 'display: block !important;';
            }
            if (stkPaymentInfo) {
                stkPaymentInfo.style.display = 'none';
                stkPaymentInfo.style.cssText = 'display: none !important;';
            }
            
            // Copy phone number to M-Pesa field if empty
            const phoneInput = document.getElementById('phoneNumber');
            const mpesaInput = document.getElementById('mpesaNumber');
            
            if (phoneInput && mpesaInput && !mpesaInput.value && phoneInput.value) {
                mpesaInput.value = phoneInput.value;
            }
        } else {
            console.log('Other payment method selected');
            if (stkPaymentInfo) {
                stkPaymentInfo.style.display = 'none';
                stkPaymentInfo.style.cssText = 'display: none !important;';
            }
            if (manualMpesaPayment) {
                manualMpesaPayment.style.display = 'none';
                manualMpesaPayment.style.cssText = 'display: none !important;';
            }
        }
    }
    
    if (mpesaStkRadio && stkPaymentInfo) {
        mpesaStkRadio.addEventListener('change', updateMpesaDisplay);
        mpesaStkRadio.addEventListener('click', updateMpesaDisplay);
    }
    
    if (mpesaManualRadio && manualMpesaPayment) {
        mpesaManualRadio.addEventListener('change', updateMpesaDisplay);
        mpesaManualRadio.addEventListener('click', updateMpesaDisplay);
    }
    
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        if (radio.value !== 'mpesa_stk' && radio.value !== 'mpesa_manual') {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    updateMpesaDisplay();
                }
            });
        }
    });
    
    // Copy phone to M-Pesa button
    const copyPhoneBtn = document.getElementById('copyPhoneToMpesa');
    if (copyPhoneBtn) {
        copyPhoneBtn.addEventListener('click', function() {
            const phoneInput = document.getElementById('phoneNumber');
            const mpesaInput = document.getElementById('mpesaNumber');
            
            if (phoneInput && mpesaInput && phoneInput.value) {
                mpesaInput.value = phoneInput.value;
                showBookingError('Phone number copied to M-Pesa field', 'success');
            }
        });
    }
    
    // Initial update of M-Pesa display
    setTimeout(updateMpesaDisplay, 100);
}

function setupPaymentOptions() {
    console.log('Payment options setup complete');
    
    // Initialize STK Push as default if it exists
    const mpesaStkRadio = document.getElementById('mpesaStkRadio');
    const stkPaymentInfo = document.getElementById('stkPaymentInfo');
    const manualMpesaPayment = document.getElementById('manualMpesaPayment');
    
    if (mpesaStkRadio && stkPaymentInfo && manualMpesaPayment) {
        if (mpesaStkRadio.checked) {
            stkPaymentInfo.style.display = 'block';
            manualMpesaPayment.style.display = 'none';
        }
        
        const mpesaManualRadio = document.getElementById('mpesaManualRadio');
        if (mpesaManualRadio && mpesaManualRadio.checked) {
            stkPaymentInfo.style.display = 'none';
            manualMpesaPayment.style.display = 'block';
        }
    }
}

function validateBookingForm() {
    // Get form elements
    const fullName = document.getElementById('fullName');
    const phoneNumber = document.getElementById('phoneNumber');
    const email = document.getElementById('email');
    const serviceType = document.getElementById('serviceType');
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentTime = document.getElementById('appointmentTime');
    const termsAgree = document.getElementById('termsAgree');
    const cancellationPolicy = document.getElementById('cancellationPolicy');
    
    if (!fullName || !phoneNumber || !email || !serviceType || !appointmentDate || !appointmentTime) {
        showBookingError('Form fields not found. Please refresh the page.', 'error');
        return false;
    }
    
    // Get values
    const fullNameValue = fullName.value.trim();
    const phoneNumberValue = phoneNumber.value.trim();
    const emailValue = email.value.trim();
    const serviceTypeValue = serviceType.value;
    const appointmentDateValue = appointmentDate.value;
    const appointmentTimeValue = appointmentTime.value;
    const termsAgreeValue = termsAgree ? termsAgree.checked : false;
    const cancellationPolicyValue = cancellationPolicy ? cancellationPolicy.checked : false;
    
    // Validate required fields
    const errors = [];
    
    if (!fullNameValue) {
        errors.push('Please enter your full name');
        highlightField(fullName, true);
    } else {
        highlightField(fullName, false);
    }
    
    if (!phoneNumberValue) {
        errors.push('Please enter your phone number');
        highlightField(phoneNumber, true);
    } else {
        const phoneDigits = phoneNumberValue.replace(/\s/g, '');
        const phoneRegex = /^(0[17]\d{8}|011\d{7}|254[17]\d{8})$/;
        
        if (!phoneRegex.test(phoneDigits)) {
            errors.push('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
            highlightField(phoneNumber, true);
        } else {
            highlightField(phoneNumber, false);
        }
    }
    
    if (!emailValue) {
        errors.push('Please enter your email address');
        highlightField(email, true);
    } else if (!validateEmail(emailValue)) {
        errors.push('Please enter a valid email address');
        highlightField(email, true);
    } else {
        highlightField(email, false);
    }
    
    if (!serviceTypeValue) {
        errors.push('Please select a service');
        highlightField(serviceType, true);
    } else {
        highlightField(serviceType, false);
    }
    
    if (!appointmentDateValue) {
        errors.push('Please select a date');
        highlightField(appointmentDate, true);
    } else {
        highlightField(appointmentDate, false);
    }
    
    if (!appointmentTimeValue) {
        errors.push('Please select a time slot');
        highlightField(appointmentTime, true);
    } else {
        // Check if selected time slot is still available
        const selectedSlot = availableTimeSlots.find(slot => slot.time === appointmentTimeValue);
        if (!selectedSlot) {
            errors.push('Invalid time slot selected');
            highlightField(appointmentTime, true);
        } else if (!selectedSlot.available) {
            errors.push('The selected time slot is no longer available. Please choose another time.');
            highlightField(appointmentTime, true);
        } else {
            highlightField(appointmentTime, false);
        }
    }
    
    if (termsAgree && !termsAgreeValue) {
        errors.push('Please agree to receive notifications');
        highlightField(termsAgree.parentElement, true);
    } else if (termsAgree) {
        highlightField(termsAgree.parentElement, false);
    }
    
    if (cancellationPolicy && !cancellationPolicyValue) {
        errors.push('Please agree to the cancellation policy');
        highlightField(cancellationPolicy.parentElement, true);
    } else if (cancellationPolicy) {
        highlightField(cancellationPolicy.parentElement, false);
    }
    
    // Validate payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        errors.push('Please select a payment method');
    } else if (paymentMethod.value === 'mpesa_stk' || paymentMethod.value === 'mpesa_manual') {
        if (paymentMethod.value === 'mpesa_manual') {
            const mpesaNumber = document.getElementById('mpesaNumber');
            if (mpesaNumber) {
                const mpesaNumberValue = mpesaNumber.value.trim();
                if (!mpesaNumberValue) {
                    errors.push('Please enter your M-Pesa number for manual payment');
                    highlightField(mpesaNumber, true);
                } else {
                    const mpesaDigits = mpesaNumberValue.replace(/\s/g, '');
                    const phoneRegex = /^(0[17]\d{8}|011\d{7}|254[17]\d{8})$/;
                    
                    if (!phoneRegex.test(mpesaDigits)) {
                        errors.push('Please enter a valid M-Pesa number');
                        highlightField(mpesaNumber, true);
                    } else {
                        highlightField(mpesaNumber, false);
                    }
                }
            }
        }
    }
    
    // Show errors if any
    if (errors.length > 0) {
        showBookingError(errors[0], 'error');
        
        // Scroll to first error field
        const firstErrorField = document.querySelector('.error-highlight');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return false;
    }
    
    return true;
}

function highlightField(element, isError) {
    if (!element) return;
    
    element.classList.remove('error-highlight', 'success-highlight');
    
    if (isError) {
        element.classList.add('error-highlight');
    } else {
        element.classList.add('success-highlight');
        
        // Remove success highlight after 2 seconds
        setTimeout(() => {
            element.classList.remove('success-highlight');
        }, 2000);
    }
}

// STK PUSH PAYMENT FUNCTIONS
async function initiateSTKPushPayment(bookingData) {
    try {
        console.log('Initiating STK Push payment...');
        
        // Get the phone number (remove spaces and ensure format)
        let phoneNumber = bookingData.customer_phone.replace(/\s/g, '');
        
        // Convert to 254 format if needed
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '254' + phoneNumber.substring(1);
        }
        
        // Prepare STK Push request
        const stkRequest = {
            phoneNumber: phoneNumber,
            amount: bookingData.service_price,
            accountReference: bookingData.booking_reference,
            transactionDesc: `Payment for ${bookingData.service_name}`,
            customerName: bookingData.customer_name,
            bookingId: bookingData.booking_reference
        };
        
        console.log('STK Push request:', stkRequest);
        
        const response = await fetch('/api/mpesa/stk-push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stkRequest)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to initiate STK Push');
        }
        
        const result = await response.json();
        
        if (result.success) {
            return {
                success: true,
                transaction_id: result.CheckoutRequestID || result.TransactionID,
                message: 'STK Push sent to your phone. Please enter your M-Pesa PIN.',
                rawResponse: result
            };
        } else {
            throw new Error(result.message || 'STK Push failed');
        }
        
    } catch (error) {
        console.error('STK Push initiation error:', error);
        return {
            success: false,
            message: error.message || 'Failed to initiate payment',
            error: error
        };
    }
}

async function processBooking() {
    console.log('processBooking called');
    
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
        
        // Get payment method
        const paymentMethod = bookingData.payment_method;
        
        if (paymentMethod === 'mpesa_stk') {
            // STK PUSH PAYMENT FLOW
            console.log('Starting STK Push payment flow...');
            
            // 1. First, save booking with pending payment status
            bookingData.payment_status = 'pending';
            const bookingResult = await saveBookingToSupabase(bookingData);
            
            // 2. Save locally as backup
            saveBookingLocally(bookingData);
            
            // 3. Initiate STK Push payment
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Payment Request...';
            
            const paymentResult = await initiateSTKPushPayment(bookingData);
            
            if (paymentResult.success) {
                // 4. Show payment pending modal
                showPaymentPendingModal(bookingData, paymentResult);
                
                // 5. Start polling for payment confirmation
                pollForPaymentConfirmation(bookingData.booking_reference, paymentResult.transaction_id);
                
                // 6. Update booking with transaction ID
                await updateBookingPaymentStatus(bookingData.booking_reference, 'pending', paymentResult.transaction_id);
                
                // 7. Update submit button text
                submitBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Awaiting Payment...';
                
            } else {
                // STK Push failed
                throw new Error(`STK Push failed: ${paymentResult.message}`);
            }
            
        } else {
            // REGULAR BOOKING FLOW
            const bookingResult = await saveBookingToSupabase(bookingData);
            
            // Save locally as backup
            saveBookingLocally(bookingData);
            
            // Show success modal
            showSuccessModal(bookingData, bookingResult);
            
            // Reset form
            resetBookingForm();
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
            }
        }
        
    } catch (error) {
        console.error('Booking processing error:', error);
        
        // Try to save locally as fallback
        try {
            const bookingData = collectFormData();
            saveBookingLocally(bookingData);
            
            showBookingError(
                '⚠️ Booking saved locally. Could not connect to server, but your appointment is saved in your browser.',
                'warning'
            );
            
            // Still show success modal with offline warning
            showSuccessModal(bookingData, {
                success: true,
                offline: true,
                message: 'Saved locally (offline mode)',
                booking_ref: bookingData.booking_reference
            });
            
        } catch (fallbackError) {
            console.error('Fallback save failed:', fallbackError);
            showBookingError('❌ Booking failed. Please try again or contact us directly.', 'error');
        }
        
        // Re-enable submit button on error
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
        
    } finally {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }
}

function collectFormData() {
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    
    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    
    // Validate required fields are not empty
    if (!fullName || !phoneNumber || !email || !appointmentDate || !appointmentTime) {
        throw new Error('Please fill in all required fields');
    }
    
    // Get service details
    const serviceSelect = document.getElementById('serviceType');
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
    
    // Get barber details
    const barberSelect = document.getElementById('barberSelect');
    const selectedBarber = barberSelect ? barberSelect.options[barberSelect.selectedIndex] : null;
    
    // Get payment method
    const paymentMethodRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'cash';
    
    // Generate booking reference
    const bookingRef = 'KB-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // Prepare booking data
    const bookingData = {
        customer_name: fullName,
        customer_phone: phoneNumber.replace(/\s/g, ''),
        customer_email: email,
        service_id: selectedService.value,
        service_name: selectedService.getAttribute('data-name') || '',
        service_price: selectedServicePrice,
        barber_id: selectedBarber ? selectedBarber.value : '',
        barber_name: selectedBarber ? selectedBarber.textContent : 'Any Available Barber',
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        special_requests: formData.get('specialRequests') || '',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'mpesa_stk' || paymentMethod === 'mpesa_manual' ? 'pending' : 'paid',
        booking_reference: bookingRef,
        status: 'confirmed',
        created_at: new Date().toISOString()
    };
    
    // Add M-Pesa details based on payment method
    if (paymentMethod === 'mpesa_stk') {
        bookingData.mpesa_number = phoneNumber.replace(/\s/g, '');
        bookingData.payment_method = 'mpesa_stk';
    } else if (paymentMethod === 'mpesa_manual') {
        const mpesaNumber = document.getElementById('mpesaNumber');
        bookingData.mpesa_number = mpesaNumber ? mpesaNumber.value.replace(/\s/g, '') : '';
        bookingData.payment_method = 'mpesa_manual';
    }
    
    return bookingData;
}

async function saveBookingToSupabase(bookingData) {
    console.log('Saving booking to Supabase:', bookingData);
    
    if (!window.supabase) {
        throw new Error('Supabase not available');
    }
    
    try {
        // Validate required fields
        const requiredFields = [
            'customer_name', 
            'customer_phone', 
            'customer_email',
            'appointment_date', 
            'appointment_time', 
            'service_name',
            'booking_reference'
        ];
        
        const missingFields = [];
        for (const field of requiredFields) {
            if (!bookingData[field] || bookingData[field].toString().trim() === '') {
                missingFields.push(field);
            }
        }
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Prepare data for Supabase
        const supabaseData = {
            customer_name: bookingData.customer_name || '',
            customer_phone: bookingData.customer_phone || '',
            customer_email: bookingData.customer_email || '',
            service_name: bookingData.service_name || '',
            barber_name: bookingData.barber_name || 'Any Available Barber',
            special_requests: bookingData.special_requests || '',
            payment_method: bookingData.payment_method || 'cash',
            payment_status: bookingData.payment_status || 'pending',
            booking_reference: bookingData.booking_reference || '',
            status: 'confirmed',
            service_price: parseFloat(bookingData.service_price) || 0,
            appointment_date: bookingData.appointment_date || '',
            appointment_time: bookingData.appointment_time || '',
            mpesa_number: bookingData.mpesa_number || null
        };
        
        console.log('Prepared data for Supabase:', supabaseData);
        
        // Save to Supabase
        const { data, error } = await window.supabase
            .from('appointments')
            .insert([supabaseData]);
        
        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Booking failed: ${error.message}`);
        }
        
        console.log('Booking saved to Supabase successfully');
        
        return {
            success: true,
            booking_ref: bookingData.booking_reference,
            message: 'Booking confirmed successfully!'
        };
        
    } catch (error) {
        console.error('Failed to save to Supabase:', error);
        throw error;
    }
}

function saveBookingLocally(bookingData) {
    try {
        let localBookings = JSON.parse(localStorage.getItem('kenbarber_local_bookings') || '[]');
        
        const localBooking = {
            ...bookingData,
            saved_locally: true,
            local_save_time: new Date().toISOString(),
            local_id: 'local_' + Date.now()
        };
        
        localBookings.push(localBooking);
        
        if (localBookings.length > 50) {
            localBookings = localBookings.slice(-50);
        }
        
        localStorage.setItem('kenbarber_local_bookings', JSON.stringify(localBookings));
        
        console.log('Booking saved locally with ID:', localBooking.local_id);
        
    } catch (error) {
        console.error('Error saving booking locally:', error);
    }
}

function showSuccessModal(bookingData, bookingResult) {
    const modal = document.getElementById('successModal');
    if (!modal) {
        alert(`Booking Confirmed!\nReference: ${bookingData.booking_reference}\nDate: ${bookingData.appointment_date}\nTime: ${bookingData.appointment_time}`);
        return;
    }
    
    // Update modal content
    const modalService = document.getElementById('modalService');
    const modalDate = document.getElementById('modalDate');
    const modalTime = document.getElementById('modalTime');
    const modalBarber = document.getElementById('modalBarber');
    const modalPrice = document.getElementById('modalPrice');
    const modalRef = document.getElementById('modalRef');
    const modalPhone = document.getElementById('modalPhone');
    const modalEmail = document.getElementById('modalEmail');
    
    if (modalService) modalService.textContent = bookingData.service_name;
    if (modalDate) modalDate.textContent = formatDate(bookingData.appointment_date);
    if (modalTime) modalTime.textContent = formatTime(bookingData.appointment_time);
    if (modalBarber) modalBarber.textContent = bookingData.barber_name;
    if (modalPrice) modalPrice.textContent = `KES ${bookingData.service_price}`;
    if (modalRef) modalRef.textContent = bookingData.booking_reference;
    if (modalPhone) modalPhone.textContent = formatPhone(bookingData.customer_phone);
    if (modalEmail) modalEmail.textContent = bookingData.customer_email;
    
    // Show offline warning if applicable
    const offlineWarning = document.getElementById('offlineWarning');
    if (offlineWarning) {
        offlineWarning.style.display = bookingResult.offline ? 'block' : 'none';
    }
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Setup close buttons
    setupModalCloseButtons();
}

function setupModalCloseButtons() {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    // Close button (X)
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }
    
    // Done button
    const doneBtn = document.getElementById('closeSuccessModal');
    if (doneBtn) {
        doneBtn.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }
    
    // Close when clicking outside modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

function resetBookingForm() {
    const form = document.getElementById('appointmentForm');
    if (form) {
        // Store some values before reset
        const serviceSelect = document.getElementById('serviceType');
        const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
        
        // Get current payment state
        const stkRadio = document.getElementById('mpesaStkRadio');
        const manualRadio = document.getElementById('mpesaManualRadio');
        const stkInfo = document.getElementById('stkPaymentInfo');
        const manualInfo = document.getElementById('manualMpesaPayment');
        
        // Store current payment selection
        const currentPayment = document.querySelector('input[name="payment"]:checked');
        const currentPaymentValue = currentPayment ? currentPayment.value : 'cash';
        
        // Reset form
        form.reset();
        
        // Restore service selection
        if (selectedService && selectedService.value) {
            serviceSelect.value = selectedService.value;
            serviceSelect.dispatchEvent(new Event('change'));
        }
        
        // Restore payment selection
        if (currentPaymentValue === 'mpesa_stk' && stkRadio) {
            stkRadio.checked = true;
            if (stkInfo) stkInfo.style.display = 'block';
            if (manualInfo) manualInfo.style.display = 'none';
        } else if (currentPaymentValue === 'mpesa_manual' && manualRadio) {
            manualRadio.checked = true;
            if (manualInfo) manualInfo.style.display = 'block';
            if (stkInfo) stkInfo.style.display = 'none';
        } else {
            if (stkInfo) stkInfo.style.display = 'none';
            if (manualInfo) manualInfo.style.display = 'none';
        }
        
        // Reset date to tomorrow
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            
            // Reset time slot
            const timeSelect = document.getElementById('appointmentTime');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="">Select a date first</option>';
                timeSelect.disabled = true;
            }
        }
        
        console.log('Form reset complete');
    }
}

// Utility functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function formatTime(timeString) {
    try {
        if (!timeString) return 'N/A';
        
        const parts = timeString.split(':');
        if (parts.length < 2) return timeString;
        
        const hour = parseInt(parts[0]);
        const minute = parts[1].padStart(2, '0');
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12}:${minute} ${ampm}`;
    } catch (error) {
        return timeString;
    }
}

function formatPhone(phoneNumber) {
    if (!phoneNumber) return '';
    
    const digits = phoneNumber.replace(/\D/g, '');
    
    if (digits.startsWith('254') && digits.length === 12) {
        return `254 ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
    } else if (digits.startsWith('0') && digits.length === 10) {
        return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    }
    
    return phoneNumber;
}

function showBookingError(message, type = 'error') {
    // Use the global showNotification function if available
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `booking-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ff9900' : '#00C851'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        margin: 0;
        line-height: 1;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for global use
window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Add CSS for error/success highlighting
const style = document.createElement('style');
style.textContent = `
    .error-highlight {
        border-color: #ff4444 !important;
        box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2) !important;
        background-color: rgba(255, 68, 68, 0.05) !important;
    }
    
    .success-highlight {
        border-color: #00C851 !important;
        box-shadow: 0 0 0 2px rgba(0, 200, 81, 0.2) !important;
    }
    
    .error-highlight-label {
        color: #ff4444 !important;
        font-weight: bold !important;
    }
    
    select.error-highlight,
    input.error-highlight,
    textarea.error-highlight {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

console.log('Booking system loaded and ready!');

// Initialize the booking system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure all elements are loaded
    setTimeout(() => {
        initializeBooking();
    }, 500);
});
