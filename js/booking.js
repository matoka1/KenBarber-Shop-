// Global variables
let selectedServicePrice = 0;
let selectedServiceName = '';
let selectedServiceId = '';
let availableTimeSlots = [];
let isProcessingBooking = false;
let currentPaymentPollInterval = null;

function initializeBooking() {
    console.log('Setting up booking system...');
    
    const checkFormReady = () => {
        const serviceSelect = document.getElementById('serviceType');
        const dateInput = document.getElementById('appointmentDate');
        const timeSelect = document.getElementById('appointmentTime');
        const submitBtn = document.getElementById('submitBtn');
        
        if (serviceSelect && dateInput && timeSelect && submitBtn && serviceSelect.options.length > 1) {
            console.log('✅ Form elements ready, initializing booking system...');
            
            initializeFormElements();
            setupEventListeners();
            
            setTimeout(() => {
                initializeDatePicker();
            }, 100);
            
            setupPaymentOptions();
            
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
    
    checkFormReady();
}

function initializeFormElements() {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        if (selectedOption.value) {
            selectedServicePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            selectedServiceName = selectedOption.getAttribute('data-name') || '';
            selectedServiceId = selectedOption.value;
            updatePriceDisplay();
        }
        
        serviceSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.value) {
                selectedServicePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
                selectedServiceName = selectedOption.getAttribute('data-name') || '';
                selectedServiceId = selectedOption.value;
                updatePriceDisplay();
            } else {
                const priceDisplay = document.getElementById('priceDisplay');
                if (priceDisplay) priceDisplay.style.display = 'none';
            }
        });
    }
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        dateInput.min = formatDate(tomorrow);
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = formatDate(maxDate);
        dateInput.value = formatDate(tomorrow);
        
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
    
    timeSelect.innerHTML = '<option value="">Select a date first</option>';
    timeSelect.disabled = true;
    
    dateInput.addEventListener('change', async function() {
        const selectedDate = this.value;
        if (!selectedDate) {
            timeSelect.innerHTML = '<option value="">Select a date first</option>';
            timeSelect.disabled = true;
            return;
        }
        
        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            timeSelect.innerHTML = '<option value="">Closed on weekends</option>';
            timeSelect.disabled = true;
            return;
        }
        
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
        
        try {
            await loadAvailableTimeSlots(selectedDate);
            populateTimeSlots();
        } catch (error) {
            console.error('Error loading time slots:', error);
            timeSelect.innerHTML = '<option value="">Error loading slots. Please try again.</option>';
            timeSelect.disabled = true;
        }
    });
}

async function loadAvailableTimeSlots(date) {
    if (!date || date.trim() === '') {
        console.warn('loadAvailableTimeSlots called with empty date');
        return;
    }
    
    if (window.loadingTimeSlots) {
        console.log('Time slots already loading, skipping...');
        return;
    }
    
    window.loadingTimeSlots = true;
    try {
        console.log('Loading time slots for:', date);
        const businessHours = { start: 8, end: 19 };
        const dateObj = new Date(date);
        const isSunday = dateObj.getDay() === 0;
        
        if (isSunday) {
            businessHours.start = 10;
            businessHours.end = 16;
        }
        
        let existingAppointments = [];
        
        try {
            const { data, error } = await window.supabase
                .from('appointments')
                .select('appointment_time')
                .eq('appointment_date', date)
                .eq('status', 'confirmed');
            
            if (!error && data) {
                existingAppointments = data.map(apt => {
                    if (apt.appointment_time) {
                        let timeStr = apt.appointment_time.toString();
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
        } catch (dbError) {
            console.warn('Database error loading appointments:', dbError);
        }
        
        availableTimeSlots = [];
        
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
            for (let minute of [0, 30]) {
                if (hour === businessHours.end - 1 && minute === 30) continue;
                
                const hour24 = hour;
                const hour12 = hour % 12 || 12;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                
                const time24 = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const timeDisplay = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
                const timeDB = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                
                const isBooked = existingAppointments.some(aptTime => {
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
    
    const availableSlots = availableTimeSlots.filter(slot => slot.available);
    const bookedSlots = availableTimeSlots.filter(slot => !slot.available);
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = availableSlots.length > 0 ? 'Select a time slot' : 'All slots booked';
    timeSelect.appendChild(defaultOption);
    
    if (availableSlots.length === 0) {
        timeSelect.disabled = true;
        
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
    
    const morningSlots = availableSlots.filter(slot => slot.hour < 12);
    const afternoonSlots = availableSlots.filter(slot => slot.hour >= 12);
    
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
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
    });
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (isProcessingBooking) {
                console.log('Booking already in progress, ignoring click');
                return;
            }
            
            isProcessingBooking = true;
            
            if (!validateBookingForm()) {
                isProcessingBooking = false;
                return;
            }
            
            await processBooking();
            isProcessingBooking = false;
        });
    }
    
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const cursorPos = this.selectionStart;
            const originalLength = this.value.length;
            
            let value = this.value.replace(/\D/g, '');
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
    
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                showBookingError('Please enter a valid email address', 'warning');
            }
        });
    }
    
    const mpesaStkRadio = document.getElementById('mpesaStkRadio');
    const mpesaManualRadio = document.getElementById('mpesaManualRadio');
    const stkPaymentInfo = document.getElementById('stkPaymentInfo');
    const manualMpesaPayment = document.getElementById('manualMpesaPayment');
    
    function updateMpesaDisplay() {
        if (mpesaStkRadio && mpesaStkRadio.checked) {
            if (stkPaymentInfo) stkPaymentInfo.style.display = 'block';
            if (manualMpesaPayment) manualMpesaPayment.style.display = 'none';
        } else if (mpesaManualRadio && mpesaManualRadio.checked) {
            if (manualMpesaPayment) manualMpesaPayment.style.display = 'block';
            if (stkPaymentInfo) stkPaymentInfo.style.display = 'none';
            
            const phoneInput = document.getElementById('phoneNumber');
            const mpesaInput = document.getElementById('mpesaNumber');
            
            if (phoneInput && mpesaInput && !mpesaInput.value && phoneInput.value) {
                mpesaInput.value = phoneInput.value;
            }
        } else {
            if (stkPaymentInfo) stkPaymentInfo.style.display = 'none';
            if (manualMpesaPayment) manualMpesaPayment.style.display = 'none';
        }
    }
    
    if (mpesaStkRadio && stkPaymentInfo) {
        mpesaStkRadio.addEventListener('change', updateMpesaDisplay);
    }
    
    if (mpesaManualRadio && manualMpesaPayment) {
        mpesaManualRadio.addEventListener('change', updateMpesaDisplay);
    }
    
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', updateMpesaDisplay);
    });
    
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
    
    setTimeout(updateMpesaDisplay, 100);
}

function setupPaymentOptions() {
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
    
    const fullNameValue = fullName.value.trim();
    const phoneNumberValue = phoneNumber.value.trim();
    const emailValue = email.value.trim();
    const serviceTypeValue = serviceType.value;
    const appointmentDateValue = appointmentDate.value;
    const appointmentTimeValue = appointmentTime.value;
    const termsAgreeValue = termsAgree ? termsAgree.checked : false;
    const cancellationPolicyValue = cancellationPolicy ? cancellationPolicy.checked : false;
    
    const errors = [];
    
    if (!fullNameValue) errors.push('Please enter your full name');
    if (!phoneNumberValue) errors.push('Please enter your phone number');
    else {
        const phoneDigits = phoneNumberValue.replace(/\s/g, '');
        const phoneRegex = /^(0[17]\d{8}|011\d{7}|254[17]\d{8})$/;
        if (!phoneRegex.test(phoneDigits)) errors.push('Please enter a valid Kenyan phone number (e.g., 0712 345 678)');
    }
    
    if (!emailValue) errors.push('Please enter your email address');
    else if (!validateEmail(emailValue)) errors.push('Please enter a valid email address');
    
    if (!serviceTypeValue) errors.push('Please select a service');
    if (!appointmentDateValue) errors.push('Please select a date');
    if (!appointmentTimeValue) errors.push('Please select a time slot');
    else {
        const selectedSlot = availableTimeSlots.find(slot => slot.time === appointmentTimeValue);
        if (!selectedSlot) errors.push('Invalid time slot selected');
        else if (!selectedSlot.available) errors.push('The selected time slot is no longer available. Please choose another time.');
    }
    
    if (termsAgree && !termsAgreeValue) errors.push('Please agree to receive notifications');
    if (cancellationPolicy && !cancellationPolicyValue) errors.push('Please agree to the cancellation policy');
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) errors.push('Please select a payment method');
    else if (paymentMethod.value === 'mpesa_manual') {
        const mpesaNumber = document.getElementById('mpesaNumber');
        if (mpesaNumber) {
            const mpesaNumberValue = mpesaNumber.value.trim();
            if (!mpesaNumberValue) errors.push('Please enter your M-Pesa number for manual payment');
            else {
                const mpesaDigits = mpesaNumberValue.replace(/\s/g, '');
                const phoneRegex = /^(0[17]\d{8}|011\d{7}|254[17]\d{8})$/;
                if (!phoneRegex.test(mpesaDigits)) errors.push('Please enter a valid M-Pesa number');
            }
        }
    }
    
    if (errors.length > 0) {
        showBookingError(errors[0], 'error');
        return false;
    }
    
    return true;
}

function highlightField(element, isError) {
    if (!element) return;
    element.classList.remove('error-highlight', 'success-highlight');
    if (isError) element.classList.add('error-highlight');
    else {
        element.classList.add('success-highlight');
        setTimeout(() => element.classList.remove('success-highlight'), 2000);
    }
}

async function initiateSTKPushPayment(bookingData) {
    try {
        console.log('Initiating REAL STK Push payment...');
        
        let phoneNumber = bookingData.customer_phone.replace(/\s/g, '');
        if (phoneNumber.startsWith('0')) phoneNumber = '+254' + phoneNumber.substring(1);
        else if (phoneNumber.startsWith('254')) phoneNumber = '+' + phoneNumber;
        
        const stkRequest = {
            phoneNumber: phoneNumber,
            amount: bookingData.service_price,
            accountReference: bookingData.booking_reference,
            transactionDesc: `Payment for ${bookingData.service_name}`,
            customerName: bookingData.customer_name,
            bookingId: bookingData.booking_reference
        };
        
        console.log('Calling REAL Lipana API:', stkRequest);
        
        // ✅ REAL Lipana API call (not test mode)
        const supabaseFunctionUrl = 'https://eqjdkpanqwjhuyavvdaf.supabase.co/functions/v1/process-mpesa-payment';
        
        const response = await fetch(supabaseFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stkRequest)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to initiate STK Push');
        }
        
        console.log('✅ REAL STK Push initiated:', result);
        
        return {
            success: true,
            transaction_id: result.transactionId,
            checkout_request_id: result.checkoutRequestID,
            message: result.message || 'STK Push sent to your phone. Please enter your M-Pesa PIN.',
            rawResponse: result
        };
        
    } catch (error) {
        console.error('STK Push initiation error:', error);
        return {
            success: false,
            message: error.message || 'Failed to initiate payment',
            error: error
        };
    }
}

async function pollForPaymentConfirmation(bookingReference, checkoutRequestId) {
    console.log('Starting REAL payment polling for:', bookingReference);
    
    if (currentPaymentPollInterval) {
        clearInterval(currentPaymentPollInterval);
    }
    
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes (poll every 5 seconds)
    
    currentPaymentPollInterval = setInterval(async () => {
        pollCount++;
        console.log(`Payment polling attempt ${pollCount} for ${checkoutRequestId}`);
        
        try {
            // ✅ REAL payment status check
            const response = await fetch(`https://eqjdkpanqwjhuyavvdaf.supabase.co/functions/v1/check-payment?checkoutId=${checkoutRequestId}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Payment check result:', result);
                
                if (result.status === 'success' || result.status === 'completed') {
                    // ✅ PAYMENT CONFIRMED AUTOMATICALLY!
                    clearInterval(currentPaymentPollInterval);
                    currentPaymentPollInterval = null;
                    
                    // Update booking to confirmed and paid
                    await updateBookingPaymentStatus(
                        bookingReference,
                        'paid',
                        result.transactionId,
                        result.mpesa_receipt
                    );
                    
                    // Show success message
                    showPaymentSuccessNotification(bookingReference, result);
                    
                    // Reset form
                    resetBookingForm();
                    
                    console.log('✅ Payment automatically confirmed!');
                    
                } else if (result.status === 'failed' || result.status === 'cancelled') {
                    // ❌ PAYMENT FAILED
                    clearInterval(currentPaymentPollInterval);
                    currentPaymentPollInterval = null;
                    
                    await updateBookingStatus(bookingReference, 'payment_failed');
                    showBookingError('Payment failed. Please try again.', 'error');
                }
                // If still pending, continue polling
            }
        } catch (error) {
            console.error('Payment polling error:', error);
        }
        
        // Stop after max polls (5 minutes)
        if (pollCount >= maxPolls) {
            clearInterval(currentPaymentPollInterval);
            currentPaymentPollInterval = null;
            console.log('Payment polling timeout for:', bookingReference);
            showBookingError('Payment timeout. Please check your phone and try again.', 'warning');
        }
    }, 5000); // Poll every 5 seconds
}

async function updateBookingPaymentStatus(bookingReference, paymentStatus, transactionId, receiptNumber = null) {
    try {
        const updateData = {
            payment_status: paymentStatus,
            mpesa_transaction_id: transactionId,
            status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
            updated_at: new Date().toISOString()
        };
        
        if (receiptNumber) updateData.mpesa_receipt = receiptNumber;
        
        const { error } = await window.supabase
            .from('appointments')
            .update(updateData)
            .eq('booking_reference', bookingReference);
        
        if (error) throw error;
        console.log(`✅ Booking ${bookingReference} updated to: ${paymentStatus}`);
        
        // Also update locally saved booking
        updateLocalBookingStatus(bookingReference, paymentStatus);
        
    } catch (error) {
        console.error('Failed to update booking payment status:', error);
        throw error;
    }
}

async function updateBookingStatus(bookingReference, status) {
    try {
        const { error } = await window.supabase
            .from('appointments')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('booking_reference', bookingReference);
        
        if (error) throw error;
        console.log(`Booking ${bookingReference} updated to status: ${status}`);
    } catch (error) {
        console.error('Failed to update booking status:', error);
    }
}

function updateLocalBookingStatus(bookingReference, paymentStatus) {
    try {
        let localBookings = JSON.parse(localStorage.getItem('kenbarber_local_bookings') || '[]');
        const bookingIndex = localBookings.findIndex(b => b.booking_reference === bookingReference);
        
        if (bookingIndex !== -1) {
            localBookings[bookingIndex].payment_status = paymentStatus;
            localBookings[bookingIndex].status = paymentStatus === 'paid' ? 'confirmed' : 'pending';
            localStorage.setItem('kenbarber_local_bookings', JSON.stringify(localBookings));
            console.log('Local booking status updated:', bookingReference);
        }
    } catch (error) {
        console.error('Error updating local booking:', error);
    }
}

function showPaymentPendingModal(bookingData, paymentResult) {
    console.log('Showing REAL payment pending modal for:', bookingData.booking_reference);
    
    const modalHtml = `
        <div id="paymentModal" style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 9999;
        ">
            <div style="
                background: white; padding: 30px; border-radius: 10px;
                max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;
            ">
                <h3 style="margin-top: 0; color: #333;">Complete Payment</h3>
                
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <p><strong>💰 Amount:</strong> KES ${bookingData.service_price}</p>
                    <p><strong>📱 Phone:</strong> ${formatPhone(bookingData.customer_phone)}</p>
                    <p><strong>📋 Reference:</strong> ${bookingData.booking_reference}</p>
                </div>
                
                <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">📱 M-Pesa prompt sent to your phone!</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Enter your PIN to complete payment</p>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                        <strong>⏰ Auto-confirmation:</strong> We'll automatically detect your payment 
                        and confirm your booking within 2 minutes.
                    </p>
                </div>
                
                <button onclick="closePaymentModal()" style="
                    padding: 12px 25px; background: #28a745; color: white;
                    border: none; border-radius: 5px; cursor: pointer;
                    font-size: 16px; width: 100%;
                ">
                    I've Entered My PIN
                </button>
                
                <p style="margin-top: 15px; font-size: 14px; color: #666; text-align: center;">
                    Didn't receive the prompt?<br>
                    Check your phone's network connection.
                </p>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    window.closePaymentModal = function() {
        if (modalContainer.parentNode) {
            document.body.removeChild(modalContainer);
        }
        showBookingError('Thank you! We\'ll verify your payment automatically.', 'info');
    };
    
    // Auto-close modal after 2 minutes
    setTimeout(() => {
        if (modalContainer.parentNode) {
            document.body.removeChild(modalContainer);
        }
    }, 120000);
}

function showPaymentSuccessNotification(bookingReference, paymentResult) {
    const notificationHtml = `
        <div style="
            position: fixed; top: 20px; right: 20px; background: #d4edda;
            border-left: 4px solid #28a745; padding: 20px; border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
            max-width: 400px; animation: slideIn 0.3s ease-out;
        ">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 24px; color: #28a745;">✅</div>
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #155724;">Payment Confirmed!</h4>
                    <p style="margin: 0 0 10px 0; color: #155724;">
                        Booking <strong>${bookingReference}</strong> is now confirmed.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #0c4128;">
                        M-Pesa Receipt: <strong>${paymentResult.mpesa_receipt || 'N/A'}</strong>
                    </p>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                position: absolute; top: 10px; right: 10px; background: none;
                border: none; font-size: 20px; cursor: pointer; color: #155724;
            ">×</button>
        </div>
    `;
    
    const notification = document.createElement('div');
    notification.innerHTML = notificationHtml;
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

async function processBooking() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const submitBtn = document.getElementById('submitBtn');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
    
    try {
        const bookingData = collectFormData();
        const paymentMethod = bookingData.payment_method;
        
        if (paymentMethod === 'mpesa_stk') {
            console.log('🚀 Starting REAL STK Push with auto-validation...');
            
            // Save booking as pending
            bookingData.status = 'pending';
            bookingData.payment_status = 'pending';
            
            const bookingResult = await saveBookingToSupabase(bookingData);
            saveBookingLocally(bookingData);
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending M-Pesa Request...';
            
            const paymentResult = await initiateSTKPushPayment(bookingData);
            
            if (paymentResult.success) {
                // Show payment modal
                showPaymentPendingModal(bookingData, paymentResult);
                
                // Start REAL auto-validation polling
                await pollForPaymentConfirmation(
                    bookingData.booking_reference,
                    paymentResult.checkout_request_id
                );
                
                // Update booking with transaction ID
                await updateBookingPaymentStatus(
                    bookingData.booking_reference,
                    'pending',
                    paymentResult.transaction_id
                );
                
                submitBtn.innerHTML = '<i class="fas fa-mobile-alt"></i> Awaiting Payment...';
                
                // ✅ DO NOT show success modal yet - wait for auto-validation
                // ✅ DO NOT reset form yet
                
            } else {
                await updateBookingStatus(bookingData.booking_reference, 'payment_failed');
                throw new Error(`STK Push failed: ${paymentResult.message}`);
            }
            
        } else {
            // Other payment methods (Cash, Manual M-Pesa)
            bookingData.payment_status = paymentMethod === 'cash' ? 'pending' : 'paid';
            bookingData.status = 'confirmed';
            
            const bookingResult = await saveBookingToSupabase(bookingData);
            saveBookingLocally(bookingData);
            showSuccessModal(bookingData, bookingResult);
            resetBookingForm();
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
            }
        }
        
    } catch (error) {
        console.error('Booking processing error:', error);
        showBookingError(`Booking failed: ${error.message}`, 'error');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Booking';
        }
        
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

function collectFormData() {
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    
    if (!fullName || !phoneNumber || !email || !appointmentDate || !appointmentTime) {
        throw new Error('Please fill in all required fields');
    }
    
    const serviceSelect = document.getElementById('serviceType');
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
    
    const barberSelect = document.getElementById('barberSelect');
    const selectedBarber = barberSelect ? barberSelect.options[barberSelect.selectedIndex] : null;
    
    const paymentMethodRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'cash';
    
    const bookingRef = 'KB-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // ✅ Determine status based on payment method
    const status = paymentMethod === 'mpesa_stk' ? 'pending' : 'confirmed';
    
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
        payment_status: paymentMethod === 'mpesa_stk' ? 'pending' : (paymentMethod === 'cash' ? 'pending' : 'paid'),
        booking_reference: bookingRef,
        status: status,
        created_at: new Date().toISOString()
    };
    
    if (paymentMethod === 'mpesa_stk') {
        bookingData.mpesa_number = phoneNumber.replace(/\s/g, '');
    } else if (paymentMethod === 'mpesa_manual') {
        const mpesaNumber = document.getElementById('mpesaNumber');
        bookingData.mpesa_number = mpesaNumber ? mpesaNumber.value.replace(/\s/g, '') : '';
    }
    
    return bookingData;
}

async function saveBookingToSupabase(bookingData) {
    console.log('Saving booking to Supabase:', bookingData);
    
    if (!window.supabase) {
        throw new Error('Supabase not available');
    }
    
    try {
        const requiredFields = [
            'customer_name', 'customer_phone', 'customer_email',
            'appointment_date', 'appointment_time', 'service_name', 'booking_reference'
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
        
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        
        const status = validStatuses.includes(bookingData.status) ? bookingData.status : 'pending';
        const paymentStatus = validPaymentStatuses.includes(bookingData.payment_status) ? bookingData.payment_status : 'pending';
        
        const supabaseData = {
            customer_name: bookingData.customer_name || '',
            customer_phone: bookingData.customer_phone || '',
            customer_email: bookingData.customer_email || '',
            service_name: bookingData.service_name || '',
            barber_name: bookingData.barber_name || 'Any Available Barber',
            special_requests: bookingData.special_requests || '',
            payment_method: bookingData.payment_method || 'cash',
            payment_status: paymentStatus,
            booking_reference: bookingData.booking_reference || '',
            status: status,
            service_price: parseFloat(bookingData.service_price) || 0,
            appointment_date: bookingData.appointment_date || '',
            appointment_time: bookingData.appointment_time || '',
            mpesa_number: bookingData.mpesa_number || null,
            created_at: new Date().toISOString()
        };
        
        console.log('Validated data for Supabase:', supabaseData);
        
        const { data, error } = await window.supabase
            .from('appointments')
            .insert([supabaseData]);
        
        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error(`Booking failed: ${error.message}`);
        }
        
        console.log('✅ Booking saved to Supabase successfully');
        
        return {
            success: true,
            booking_ref: bookingData.booking_reference,
            message: 'Booking saved successfully!',
            status: status
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
    
    const offlineWarning = document.getElementById('offlineWarning');
    if (offlineWarning) {
        offlineWarning.style.display = bookingResult.offline ? 'block' : 'none';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setupModalCloseButtons();
}

function setupModalCloseButtons() {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }
    
    const doneBtn = document.getElementById('closeSuccessModal');
    if (doneBtn) {
        doneBtn.onclick = function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
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
        const serviceSelect = document.getElementById('serviceType');
        const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
        
        const stkRadio = document.getElementById('mpesaStkRadio');
        const manualRadio = document.getElementById('mpesaManualRadio');
        const stkInfo = document.getElementById('stkPaymentInfo');
        const manualInfo = document.getElementById('manualMpesaPayment');
        
        const currentPayment = document.querySelector('input[name="payment"]:checked');
        const currentPaymentValue = currentPayment ? currentPayment.value : 'cash';
        
        form.reset();
        
        if (selectedService && selectedService.value) {
            serviceSelect.value = selectedService.value;
            serviceSelect.dispatchEvent(new Event('change'));
        }
        
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
        
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            
            const timeSelect = document.getElementById('appointmentTime');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="">Select a date first</option>';
                timeSelect.disabled = true;
            }
        }
        
        console.log('Form reset complete');
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-KE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `booking-notification ${type}`;
    notification.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">×</button>`;
    
    const bgColor = type === 'error' ? '#ff4444' : type === 'warning' ? '#ff9900' : '#00C851';
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${bgColor}; color: white; border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        display: flex; align-items: center; gap: 15px; max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 5000);
}

window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

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
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    select.error-highlight,
    input.error-highlight,
    textarea.error-highlight {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

console.log('✅ REAL STK Push with auto-validation system loaded!');

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeBooking();
    }, 500);
});
