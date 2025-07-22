// Fixed script.js - Language initialization bug fix
let currentLang = 'dari'; // Default to Dari

function toggleLanguage() {
    const oldLang = currentLang;
    currentLang = currentLang === 'en' ? 'dari' : 'en';
    document.body.classList.toggle('rtl', currentLang === 'dari');
    
    // Update language toggle button
    const langText = document.getElementById('lang-text');
    if (langText) {
        langText.textContent = currentLang === 'en' ? 'دری' : 'English';
    }
    
    // Update HTML lang and dir attributes
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('dir', currentLang === 'dari' ? 'rtl' : 'ltr');
    
    // Update all elements with data-en and data-dari attributes
    updateLanguageContent();
    
    // Update theme button text
    updateThemeButtonText();
    
    // Update calendar language if it exists
    if (typeof window.calendarInstance !== 'undefined' && window.calendarInstance) {
        window.calendarInstance.updateLanguage(currentLang);
    }
    
    // Dispatch custom event for calendar and other components
    document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { 
            language: currentLang, 
            previousLanguage: oldLang 
        }
    }));
    
    // Save preference
    localStorage.setItem('language', currentLang);
}

function updateLanguageContent() {
    document.querySelectorAll('[data-en][data-dari]').forEach(element => {
        const text = element.getAttribute(`data-${currentLang}`);
        if (!text) return; // Skip if attribute doesn't exist
        
        try {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = text;
                }
            } else if (element.tagName === 'OPTION') {
                element.textContent = text;
            } else if (element.tagName === 'SPAN' && element.parentElement && element.parentElement.tagName === 'LI') {
                // For spans inside list items, just update the text content
                element.textContent = text;
            } else {
                element.textContent = text;
            }
        } catch (error) {
            console.warn('Error updating element text:', error, element);
        }
    });
}

function updateThemeButtonText() {
    const isDark = document.body.classList.contains('dark');
    const themeText = document.getElementById('theme-text');
    if (themeText) {
        if (currentLang === 'dari') {
            themeText.textContent = isDark ? 'روشن' : 'تاریک';
        } else {
            themeText.textContent = isDark ? 'Light' : 'Dark';
        }
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark');
    updateThemeButtonText();
    
    const isDark = document.body.classList.contains('dark');
    const themeIcon = document.getElementById('theme-icon');
    
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// FAQ Toggle functionality
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Gallery Filter Functionality
function initGalleryFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterBtns.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Hero Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Change slide every 5 seconds
    setInterval(nextSlide, 5000);
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Form Validation
function validateForm(form) {
    const firstName = form.querySelector('#firstName');
    const lastName = form.querySelector('#lastName');
    const phone = form.querySelector('#phone');
    const email = form.querySelector('#email');
    const preferredDate = form.querySelector('#preferredDate');
    const preferredTime = form.querySelector('#preferredTime');
    const subject = form.querySelector('#subject');
    const message = form.querySelector('#message');
    
    let isValid = true;
    
    // Clear previous error styles
    [firstName, lastName, phone, email, preferredDate, preferredTime, subject, message].forEach(field => {
        if (field) {
            field.style.borderColor = '';
            field.classList.remove('error');
        }
    });
    
    // Validate required fields
    if (firstName && !firstName.value.trim()) {
        firstName.style.borderColor = '#e74c3c';
        firstName.classList.add('error');
        isValid = false;
    }
    
    if (lastName && !lastName.value.trim()) {
        lastName.style.borderColor = '#e74c3c';
        lastName.classList.add('error');
        isValid = false;
    }
    
    if (phone && !phone.value.trim()) {
        phone.style.borderColor = '#e74c3c';
        phone.classList.add('error');
        isValid = false;
    }
    
    // Email is optional - only validate if filled
    if (email && email.value.trim() && !isValidEmail(email.value)) {
        email.style.borderColor = '#e74c3c';
        email.classList.add('error');
        isValid = false;
    }
    
    // Validate date
    if (preferredDate && !preferredDate.value.trim()) {
        preferredDate.style.borderColor = '#e74c3c';
        preferredDate.classList.add('error');
        isValid = false;
    }
    
    // Validate time
    if (preferredTime && !preferredTime.value) {
        preferredTime.style.borderColor = '#e74c3c';
        preferredTime.classList.add('error');
        isValid = false;
    }
    
    if (subject && !subject.value) {
        subject.style.borderColor = '#e74c3c';
        subject.classList.add('error');
        isValid = false;
    }
    
    if (message && !message.value.trim()) {
        message.style.borderColor = '#e74c3c';
        message.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Intersection Observer for fade-in animation
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Close mobile menu when clicking outside
function initMobileMenuClose() {
    document.addEventListener('click', function(event) {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMenu && mobileMenuToggle && 
            !navMenu.contains(event.target) && 
            !mobileMenuToggle.contains(event.target)) {
            navMenu.classList.remove('active');
        }
    });
}

// Initialize page language properly
function initializePageLanguage() {
    // Only set RTL class and attributes, don't update content immediately
    document.body.classList.add('rtl');
    document.documentElement.setAttribute('lang', 'dari');
    document.documentElement.setAttribute('dir', 'rtl');
    
    // Set language toggle button text
    const langText = document.getElementById('lang-text');
    if (langText) {
        langText.textContent = 'English';
    }
    
    // Set theme button text in Dari
    const themeText = document.getElementById('theme-text');
    if (themeText) {
        themeText.textContent = 'تاریک';
    }
    
    // Update content after a small delay to ensure DOM is ready
    setTimeout(() => {
        updateLanguageContent();
    }, 100);
}

// Load saved preferences
function loadPreferences() {
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    // Load saved theme first
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        updateThemeButtonText();
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    }
    
    // Handle language preference
    if (savedLanguage === 'en') {
        // If saved language is English, switch from default Dari
        currentLang = 'dari'; // Set to dari so toggle will switch to en
        toggleLanguage();
    } else {
        // Keep default Dari
        initializePageLanguage();
    }
}

// Calendar Integration Functions
function initCalendarIntegration() {
    // Wait for calendar to be available
    if (typeof DualCalendar !== 'undefined') {
        const dateInput = document.getElementById('preferredDate');
        if (dateInput && !window.calendarInstance) {
            window.calendarInstance = new DualCalendar(dateInput, currentLang);
            
            // Listen for date selection
            dateInput.addEventListener('change', function() {
                // Trigger time slot update if function exists
                if (typeof updateAvailableTimeSlots === 'function') {
                    updateAvailableTimeSlots();
                }
            });
        }
    }
}

// Real-time field validation
function validateFieldRealTime(field) {
    if (!field) return true;
    
    let isValid = true;
    const value = field.value.trim();
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
    }
    
    // Specific validations
    if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
    }
    
    if (field.type === 'tel' && value) {
        const phoneRegex = /^(\+93|0093|0)?[7-9][0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
        }
    }
    
    // Update field appearance
    if (!isValid) {
        field.classList.add('error');
        field.style.borderColor = '#e74c3c';
    } else {
        field.classList.remove('error');
        field.style.borderColor = '';
    }
    
    return isValid;
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load preferences first
    loadPreferences();
    
    // Initialize features
    initHeroSlider();
    initSmoothScroll();
    initScrollAnimations();
    initMobileMenuClose();
    initGalleryFilter();
    
    // Initialize calendar integration if on contact page
    if (document.getElementById('preferredDate')) {
        // Delay calendar initialization to ensure DualCalendar is loaded
        setTimeout(initCalendarIntegration, 100);
    }
    
    // Load More functionality for gallery
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const message = currentLang === 'en' ? 
                'More photos would be loaded here' : 
                'عکس‌های بیشتر در اینجا بارگذاری می‌شوند';
            alert(message);
        });
    }
    
    // Enhanced form validation for contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        // Add real-time validation
        const requiredFields = contactForm.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateFieldRealTime(this);
            });
            
            field.addEventListener('input', function() {
                // Clear error state when user starts typing
                if (this.classList.contains('error')) {
                    this.classList.remove('error');
                    this.style.borderColor = '';
                }
            });
        });
    }
});

// Add visible class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Enhanced error states */
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: #e74c3c !important;
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }
    
    /* Success states */
    .form-group input.success,
    .form-group select.success,
    .form-group textarea.success {
        border-color: #27ae60 !important;
        box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
    }
`;
document.head.appendChild(style);