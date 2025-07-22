// Fixed contact-form.js with proper calendar integration

const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_f7798z4',      
    TEMPLATE_ID: 'template_7nw6qdq',    
    PUBLIC_KEY: 'Xcdu2MrycC8iJ8fkZ'      
};

// Global calendar instance
let calendarInstance = null;

// Initialize EmailJS and Calendar when the page loads
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize EmailJS with your public key
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        }
        
        // Initialize calendar for date input
        initializeDateTimePickers();
        
        // Set up form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Update time options based on language
        updateTimeOptions();
    } catch (error) {
        console.error('Error initializing contact form:', error);
    }
});

// Initialize Date and Time Pickers
function initializeDateTimePickers() {
    try {
        const dateInput = document.getElementById('preferredDate');
        const timeSelect = document.getElementById('preferredTime');
        
        if (dateInput && typeof DualCalendar !== 'undefined') {
            // Get current language from global variable or default to 'dari'
            const currentLanguage = getCurrentLanguage();
            
            // Initialize calendar
            calendarInstance = new DualCalendar(dateInput, currentLanguage);
            
            // Make calendar instance globally available
            window.calendarInstance = calendarInstance;
            
            // Listen for language changes
            document.addEventListener('languageChanged', function(e) {
                if (calendarInstance) {
                    calendarInstance.updateLanguage(e.detail.language);
                }
                updateTimeOptions();
            });
        }
        
        // Add time validation
        if (timeSelect) {
            timeSelect.addEventListener('change', validateTimeSelection);
        }
    } catch (error) {
        console.error('Error initializing date/time pickers:', error);
    }
}

// Update time options based on current language
function updateTimeOptions() {
    try {
        const timeSelect = document.getElementById('preferredTime');
        if (!timeSelect) return;
        
        const currentLanguage = getCurrentLanguage();
        const options = timeSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const value = option.value;
            if (value && option.hasAttribute('data-en') && option.hasAttribute('data-dari')) {
                const text = option.getAttribute(`data-${currentLanguage}`);
                if (text) {
                    option.textContent = text;
                }
            }
        });
    } catch (error) {
        console.error('Error updating time options:', error);
    }
}

// Validate time selection based on selected date
function validateTimeSelection() {
    try {
        const dateInput = document.getElementById('preferredDate');
        const timeSelect = document.getElementById('preferredTime');
        
        if (!dateInput || !timeSelect || !dateInput.value || !timeSelect.value) {
            return true;
        }
        
        const selectedDate = calendarInstance ? calendarInstance.selectedDate : new Date(dateInput.value);
        if (!selectedDate) return true;
        
        const selectedTime = timeSelect.value;
        const now = new Date();
        
        // Create datetime for comparison
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        
        // Check if selected datetime is in the past
        if (selectedDateTime < now) {
            showTimeError(getLocalizedMessage('pastTimeError'));
            timeSelect.value = '';
            return false;
        }
        
        // Check if it's same day and within business hours buffer
        const today = new Date();
        if (selectedDate.toDateString() === today.toDateString()) {
            const currentHour = now.getHours();
            const selectedHour = hours;
            
            // Need at least 2 hours notice for same-day booking
            if (selectedHour <= currentHour + 2) {
                showTimeError(getLocalizedMessage('shortNoticeError'));
                timeSelect.value = '';
                return false;
            }
        }
        
        hideTimeError();
        return true;
    } catch (error) {
        console.error('Error validating time selection:', error);
        return true;
    }
}

// Show time selection error
function showTimeError(message) {
    try {
        const timeSelect = document.getElementById('preferredTime');
        if (!timeSelect) return;
        
        let errorDiv = timeSelect.parentNode.querySelector('.error-message');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            timeSelect.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        timeSelect.classList.add('error');
    } catch (error) {
        console.error('Error showing time error:', error);
    }
}

// Hide time selection error
function hideTimeError() {
    try {
        const timeSelect = document.getElementById('preferredTime');
        if (!timeSelect) return;
        
        const errorDiv = timeSelect.parentNode.querySelector('.error-message');
        
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
        timeSelect.classList.remove('error');
    } catch (error) {
        console.error('Error hiding time error:', error);
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        // Validate form before showing loading state
        if (!validateContactForm(form)) {
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + getLocalizedMessage('sending');

        // Check if EmailJS is available
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS not loaded');
        }

        // Prepare form data
        const formData = {
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim() || getLocalizedMessage('noEmail'),
            preferredDate: form.preferredDate.value.trim(),
            preferredTime: form.preferredTime.value,
            subject: form.subject.options[form.subject.selectedIndex].text,
            message: form.message.value.trim(),
            submissionDate: new Date().toLocaleDateString(getCurrentLanguage() === 'dari' ? 'fa-AF' : 'en-US'),
            submissionTime: new Date().toLocaleTimeString(getCurrentLanguage() === 'dari' ? 'fa-AF' : 'en-US')
        };
        
        // Add Persian date if calendar instance exists and Dari language
        if (calendarInstance && calendarInstance.selectedDate && getCurrentLanguage() === 'dari') {
            try {
                formData.preferredDatePersian = calendarInstance.formatPersianDate(calendarInstance.selectedDate);
            } catch (error) {
                console.warn('Error formatting Persian date:', error);
            }
        }
        
        // Add formatted time in local language
        formData.preferredTimeFormatted = formatTimeForEmail(form.preferredTime.value);
        
        // Send email using EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            formData
        );
        
        // Show success message
        showFormMessage('success', getLocalizedMessage('formSuccess'));
        form.reset();
        
        // Reset calendar selection
        if (calendarInstance) {
            calendarInstance.selectedDate = null;
            if (typeof calendarInstance.updateCalendar === 'function') {
                calendarInstance.updateCalendar();
            }
        }
        
    } catch (error) {
        console.error('EmailJS Error:', error);
        showFormMessage('error', getLocalizedMessage('formError'));
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Show form message
function showFormMessage(type, message) {
    try {
        const formMessage = document.getElementById('form-message');
        if (!formMessage) return;
        
        formMessage.className = `form-message ${type}`;
        formMessage.textContent = message;
        formMessage.classList.remove('hidden');
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
        console.error('Error showing form message:', error);
    }
}

// Get current language safely
function getCurrentLanguage() {
    try {
        return typeof currentLang !== 'undefined' ? currentLang : 'dari';
    } catch (error) {
        console.warn('Error getting current language:', error);
        return 'dari';
    }
}

// Format time for email
function formatTimeForEmail(timeValue) {
    try {
        if (!timeValue) return '';
        
        const [hours, minutes] = timeValue.split(':').map(Number);
        const currentLanguage = getCurrentLanguage();
        
        if (currentLanguage === 'dari') {
            // Convert to Persian digits and format
            const persianHours = toPersianDigits(hours);
            const persianMinutes = toPersianDigits(minutes);
            const period = hours >= 12 ? 'عصر' : 'صبح';
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            return `${toPersianDigits(displayHours)}:${persianMinutes} ${period}`;
        } else {
            // 12-hour format for English
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
    } catch (error) {
        console.error('Error formatting time for email:', error);
        return timeValue;
    }
}

// Convert to Persian digits
function toPersianDigits(num) {
    try {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => persianDigits[parseInt(x)]);
    } catch (error) {
        console.error('Error converting to Persian digits:', error);
        return num.toString();
    }
}

// Get localized messages
function getLocalizedMessage(key) {
    try {
        const messages = {
            en: {
                formSuccess: 'Thank you! Your booking request has been sent successfully. We will contact you soon.',
                formError: 'Sorry, there was an error sending your request. Please try again or contact us directly.',
                sending: 'Sending...',
                noEmail: 'No email provided',
                pastTimeError: 'Please select a future time.',
                shortNoticeError: 'Please allow at least 2 hours notice for same-day bookings.',
                dateRequired: 'Please select a preferred date.',
                timeRequired: 'Please select a preferred time.',
                invalidDate: 'Please select a valid date.',
                invalidTime: 'Please select a valid time.',
                invalidPhone: 'Please enter a valid phone number',
                invalidEmail: 'Please enter a valid email address'
            },
            dari: {
                formSuccess: 'تشکر! درخواست رزرو شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.',
                formError: 'متأسفیم، خطایی در ارسال درخواست شما رخ داد. لطفاً دوباره تلاش کنید یا مستقیماً با ما تماس بگیرید.',
                sending: 'در حال ارسال...',
                noEmail: 'ایمیل ارائه نشده',
                pastTimeError: 'لطفاً زمانی در آینده انتخاب کنید.',
                shortNoticeError: 'لطفاً برای رزرو همان روز حداقل ۲ ساعت زمان در نظر بگیرید.',
                dateRequired: 'لطفاً تاریخ مطلوب را انتخاب کنید.',
                timeRequired: 'لطفاً زمان مطلوب را انتخاب کنید.',
                invalidDate: 'لطفاً تاریخ معتبری انتخاب کنید.',
                invalidTime: 'لطفاً زمان معتبری انتخاب کنید.',
                invalidPhone: 'لطفاً یک شماره تلفن معتبر وارد کنید',
                invalidEmail: 'لطفاً یک آدرس ایمیل معتبر وارد کنید'
            }
        };
        
        const lang = getCurrentLanguage();
        return messages[lang][key] || messages['dari'][key] || 'Message not found';
    } catch (error) {
        console.error('Error getting localized message:', error);
        return 'Error loading message';
    }
}

// Enhanced form validation including date and time
function validateContactForm(form) {
    try {
        if (!form) return false;
        
        const firstName = form.firstName ? form.firstName.value.trim() : '';
        const lastName = form.lastName ? form.lastName.value.trim() : '';
        const phone = form.phone ? form.phone.value.trim() : '';
        const email = form.email ? form.email.value.trim() : '';
        const preferredDate = form.preferredDate ? form.preferredDate.value.trim() : '';
        const preferredTime = form.preferredTime ? form.preferredTime.value : '';
        const subject = form.subject ? form.subject.value : '';
        const message = form.message ? form.message.value.trim() : '';
        
        let isValid = true;
        let errorMessages = [];
        
        // Clear previous error states
        clearFieldErrors(form);
        
        // Validate required fields
        if (!firstName && form.firstName) {
            setFieldError(form.firstName);
            isValid = false;
        }
        
        if (!lastName && form.lastName) {
            setFieldError(form.lastName);
            isValid = false;
        }
        
        if (!phone && form.phone) {
            setFieldError(form.phone);
            isValid = false;
        } else if (phone) {
            // Phone number validation (Afghan phone number format)
            const phoneRegex = /^(\+93|0093|0)?[7-9][0-9]{8}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                setFieldError(form.phone);
                errorMessages.push(getLocalizedMessage('invalidPhone'));
                isValid = false;
            }
        }
        
        // Email validation (only if provided)
        if (email && !isValidEmail(email)) {
            setFieldError(form.email);
            errorMessages.push(getLocalizedMessage('invalidEmail'));
            isValid = false;
        }
        
        // Date validation
        if (!preferredDate && form.preferredDate) {
            setFieldError(form.preferredDate);
            errorMessages.push(getLocalizedMessage('dateRequired'));
            isValid = false;
        } else if (preferredDate && calendarInstance && calendarInstance.selectedDate) {
            // Check if selected date is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(calendarInstance.selectedDate);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                setFieldError(form.preferredDate);
                errorMessages.push(getLocalizedMessage('invalidDate'));
                isValid = false;
            }
        }
        
        // Time validation
        if (!preferredTime && form.preferredTime) {
            setFieldError(form.preferredTime);
            errorMessages.push(getLocalizedMessage('timeRequired'));
            isValid = false;
        } else if (preferredTime && preferredDate) {
            // Validate time with date
            if (!validateTimeSelection()) {
                isValid = false;
            }
        }
        
        if (!subject && form.subject) {
            setFieldError(form.subject);
            isValid = false;
        }
        
        if (!message && form.message) {
            setFieldError(form.message);
            isValid = false;
        }
        
        // Show error messages if any
        if (errorMessages.length > 0) {
            showFormMessage('error', errorMessages[0]);
        }
        
        return isValid;
    } catch (error) {
        console.error('Error validating contact form:', error);
        return false;
    }
}

// Set field error state
function setFieldError(field) {
    try {
        if (field) {
            field.classList.add('error');
            field.style.borderColor = '#e74c3c';
        }
    } catch (error) {
        console.error('Error setting field error:', error);
    }
}

// Clear all field errors
function clearFieldErrors(form) {
    try {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.classList.remove('error');
            field.style.borderColor = '';
        });
        
        // Clear time error
        hideTimeError();
    } catch (error) {
        console.error('Error clearing field errors:', error);
    }
}

// Email validation
function isValidEmail(email) {
    try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    } catch (error) {
        console.error('Error validating email:', error);
        return false;
    }
}

// Enhanced time slot management
function updateAvailableTimeSlots() {
    try {
        const timeSelect = document.getElementById('preferredTime');
        const dateInput = document.getElementById('preferredDate');
        
        if (!timeSelect || !dateInput || !dateInput.value || !calendarInstance) return;
        
        const selectedDate = calendarInstance.selectedDate;
        if (!selectedDate) return;
        
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        
        // Get all time options
        const options = timeSelect.querySelectorAll('option[value]');
        
        options.forEach(option => {
            const timeValue = option.value;
            if (!timeValue) return;
            
            const [hours] = timeValue.split(':').map(Number);
            let disabled = false;
            
            if (isToday) {
                const currentHour = today.getHours();
                // Disable times that don't allow 2-hour notice
                if (hours <= currentHour + 2) {
                    disabled = true;
                }
            }
            
            option.disabled = disabled;
            option.style.color = disabled ? '#999' : '';
        });
    } catch (error) {
        console.error('Error updating available time slots:', error);
    }
}

// Make functions globally available for calendar integration
window.updateAvailableTimeSlots = updateAvailableTimeSlots;