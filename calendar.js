// calendar.js - Fixed Dual Calendar Component for Kayhan Studio

class DualCalendar {
    constructor(inputElement, language = 'dari') {
        this.inputElement = inputElement;
        this.language = language;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.calendarContainer = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        this.createCalendarContainer();
        this.attachEventListeners();
    }
    
    createCalendarContainer() {
        // Remove existing calendar if it exists
        const existingCalendar = document.querySelector('.calendar-container');
        if (existingCalendar) {
            existingCalendar.remove();
        }
        
        this.calendarContainer = document.createElement('div');
        this.calendarContainer.className = 'calendar-container hidden';
        this.calendarContainer.innerHTML = this.getCalendarHTML();
        
        // Insert after the input element
        this.inputElement.parentNode.insertBefore(this.calendarContainer, this.inputElement.nextSibling);
        
        // Attach calendar event listeners
        this.attachCalendarEventListeners();
    }
    
    attachEventListeners() {
        // Input field click
        this.inputElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.calendarContainer.contains(e.target) && 
                !this.inputElement.contains(e.target)) {
                this.hide();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                this.inputElement.focus();
            }
        });
    }
    
    attachCalendarEventListeners() {
        // Navigation buttons
        const prevBtn = this.calendarContainer.querySelector('.calendar-prev');
        const nextBtn = this.calendarContainer.querySelector('.calendar-next');
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previousMonth();
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextMonth();
        });
        
        // Date cells
        const dateCells = this.calendarContainer.querySelectorAll('.calendar-date:not(.disabled)');
        dateCells.forEach(cell => {
            cell.addEventListener('click', () => this.selectDate(cell));
            
            // Keyboard navigation
            cell.addEventListener('keydown', (e) => {
                this.handleKeyNavigation(e, cell);
            });
        });
        
        // Today button
        const todayBtn = this.calendarContainer.querySelector('.calendar-today');
        if (todayBtn) {
            todayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectToday();
            });
        }
    }
    
    getCalendarHTML() {
        const monthYear = this.getMonthYearDisplay();
        const weekDays = this.getWeekDaysHTML();
        const datesGrid = this.getDatesGridHTML();
        
        return `
            <div class="calendar-header">
                <button type="button" class="calendar-nav calendar-prev" aria-label="${this.getLocalizedText('prevMonth')}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="calendar-month-year" role="heading" aria-level="2">
                    ${monthYear}
                </div>
                <button type="button" class="calendar-nav calendar-next" aria-label="${this.getLocalizedText('nextMonth')}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-weekdays">
                ${weekDays}
            </div>
            <div class="calendar-dates" role="grid" aria-label="${this.getLocalizedText('calendar')}">
                ${datesGrid}
            </div>
            <div class="calendar-footer">
                <button type="button" class="calendar-today" aria-label="${this.getLocalizedText('today')}">
                    ${this.getLocalizedText('today')}
                </button>
            </div>
        `;
    }
    
    getWeekDaysHTML() {
        const weekDays = this.language === 'dari' ? 
            ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] : // Saturday to Friday for Afghanistan
            ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        return weekDays.map(day => 
            `<div class="calendar-weekday">${day}</div>`
        ).join('');
    }
    
    getDatesGridHTML() {
        if (this.language === 'dari') {
            return this.getPersianDatesGridHTML();
        } else {
            return this.getGregorianDatesGridHTML();
        }
    }
    
    getGregorianDatesGridHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        
        // Adjust first day to match our week (Saturday = 0)
        let startDay = (firstDay.getDay() + 1) % 7; // Convert Sunday=0 to Saturday=0
        
        let html = '';
        let date = 1;
        const totalCells = 42; // 6 rows × 7 days
        
        for (let i = 0; i < totalCells; i++) {
            if (i < startDay || date > lastDay.getDate()) {
                html += '<div class="calendar-date empty"></div>';
            } else {
                const currentDate = new Date(year, month, date);
                const isToday = this.isSameDate(currentDate, today);
                const isPast = currentDate < today && !isToday;
                const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);
                
                const classes = ['calendar-date'];
                if (isToday) classes.push('today');
                if (isPast) classes.push('disabled');
                if (isSelected) classes.push('selected');
                
                html += `
                    <button type="button" 
                            class="${classes.join(' ')}" 
                            data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}"
                            ${isPast ? 'disabled' : ''}
                            tabindex="${isPast ? '-1' : '0'}"
                            role="gridcell"
                            aria-selected="${isSelected}">
                        ${date}
                    </button>
                `;
                date++;
            }
        }
        
        return html;
    }
    
    getPersianDatesGridHTML() {
        const persianDate = PersianCalendar.gregorianToPersian(this.currentDate);
        const firstDayPersian = { year: persianDate.year, month: persianDate.month, day: 1 };
        const firstDayGregorian = PersianCalendar.persianToGregorian(firstDayPersian);
        
        // Get the weekday of the first day (Saturday = 0)
        const startDay = (firstDayGregorian.getDay() + 1) % 7;
        
        const daysInMonth = PersianCalendar.getDaysInPersianMonth(persianDate.year, persianDate.month);
        const today = new Date();
        const todayPersian = PersianCalendar.gregorianToPersian(today);
        
        let html = '';
        let date = 1;
        const totalCells = 42;
        
        for (let i = 0; i < totalCells; i++) {
            if (i < startDay || date > daysInMonth) {
                html += '<div class="calendar-date empty"></div>';
            } else {
                const currentPersianDate = { year: persianDate.year, month: persianDate.month, day: date };
                const currentGregorianDate = PersianCalendar.persianToGregorian(currentPersianDate);
                
                const isToday = this.isSamePersianDate(currentPersianDate, todayPersian);
                const isPast = currentGregorianDate < today && !isToday;
                const isSelected = this.selectedDate && this.isSameDate(currentGregorianDate, this.selectedDate);
                
                const classes = ['calendar-date'];
                if (isToday) classes.push('today');
                if (isPast) classes.push('disabled');
                if (isSelected) classes.push('selected');
                
                const gregorianDateStr = `${currentGregorianDate.getFullYear()}-${String(currentGregorianDate.getMonth() + 1).padStart(2, '0')}-${String(currentGregorianDate.getDate()).padStart(2, '0')}`;
                
                html += `
                    <button type="button" 
                            class="${classes.join(' ')}" 
                            data-date="${gregorianDateStr}"
                            ${isPast ? 'disabled' : ''}
                            tabindex="${isPast ? '-1' : '0'}"
                            role="gridcell"
                            aria-selected="${isSelected}">
                        ${this.toPersianDigits(date)}
                    </button>
                `;
                date++;
            }
        }
        
        return html;
    }
    
    getMonthYearDisplay() {
        if (this.language === 'dari') {
            const persianDate = PersianCalendar.gregorianToPersian(this.currentDate);
            const monthName = PersianCalendar.getMonthName(persianDate.month - 1, 'dari');
            return `${monthName} ${this.toPersianDigits(persianDate.year)}`;
        } else {
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }
    
    selectDate(cell) {
        const dateStr = cell.dataset.date;
        this.selectedDate = new Date(dateStr);
        
        // Update input value
        const displayDate = this.language === 'dari' ? 
            this.formatPersianDate(this.selectedDate) : 
            this.formatGregorianDate(this.selectedDate);
        
        this.inputElement.value = displayDate;
        
        // Update visual selection
        this.calendarContainer.querySelectorAll('.calendar-date.selected').forEach(el => {
            el.classList.remove('selected');
            el.setAttribute('aria-selected', 'false');
        });
        
        cell.classList.add('selected');
        cell.setAttribute('aria-selected', 'true');
        
        // Hide calendar
        this.hide();
        
        // Trigger change event
        this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    selectToday() {
        const today = new Date();
        
        // Update current date to today first
        this.currentDate = new Date(today);
        this.selectedDate = today;
        
        // Update calendar view
        this.updateCalendar();
        
        // Update input value
        const displayDate = this.language === 'dari' ? 
            this.formatPersianDate(today) : 
            this.formatGregorianDate(today);
        
        this.inputElement.value = displayDate;
        
        // Hide calendar
        this.hide();
        
        // Trigger change event
        this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    previousMonth() {
        if (this.language === 'dari') {
            const persianDate = PersianCalendar.gregorianToPersian(this.currentDate);
            let newMonth = persianDate.month - 1;
            let newYear = persianDate.year;
            
            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            
            this.currentDate = PersianCalendar.persianToGregorian({
                year: newYear,
                month: newMonth,
                day: 1
            });
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        }
        this.updateCalendar();
    }
    
    nextMonth() {
        if (this.language === 'dari') {
            const persianDate = PersianCalendar.gregorianToPersian(this.currentDate);
            let newMonth = persianDate.month + 1;
            let newYear = persianDate.year;
            
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
            
            this.currentDate = PersianCalendar.persianToGregorian({
                year: newYear,
                month: newMonth,
                day: 1
            });
        } else {
            this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        }
        this.updateCalendar();
    }
    
    updateCalendar() {
        this.calendarContainer.innerHTML = this.getCalendarHTML();
        this.attachCalendarEventListeners();
    }
    
    show() {
        this.calendarContainer.classList.remove('hidden');
        this.isVisible = true;
        
        // Focus first available date
        const firstAvailableDate = this.calendarContainer.querySelector('.calendar-date:not(.disabled):not(.empty)');
        if (firstAvailableDate) {
            firstAvailableDate.focus();
        }
    }
    
    hide() {
        this.calendarContainer.classList.add('hidden');
        this.isVisible = false;
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    updateLanguage(language) {
        this.language = language;
        this.updateCalendar();
        
        // Update input value if date is selected
        if (this.selectedDate) {
            const displayDate = this.language === 'dari' ? 
                this.formatPersianDate(this.selectedDate) : 
                this.formatGregorianDate(this.selectedDate);
            this.inputElement.value = displayDate;
        }
    }
    
    formatGregorianDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatPersianDate(date) {
        const persianDate = PersianCalendar.gregorianToPersian(date);
        const monthName = PersianCalendar.getMonthName(persianDate.month - 1, 'dari');
        return `${this.toPersianDigits(persianDate.day)} ${monthName} ${this.toPersianDigits(persianDate.year)}`;
    }
    
    toPersianDigits(num) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return num.toString().replace(/\d/g, x => persianDigits[parseInt(x)]);
    }
    
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    isSamePersianDate(pDate1, pDate2) {
        return pDate1.year === pDate2.year &&
               pDate1.month === pDate2.month &&
               pDate1.day === pDate2.day;
    }
    
    getLocalizedText(key) {
        const texts = {
            en: {
                prevMonth: 'Previous month',
                nextMonth: 'Next month',
                calendar: 'Calendar',
                today: 'Today'
            },
            dari: {
                prevMonth: 'ماه قبل',
                nextMonth: 'ماه بعد',
                calendar: 'تقویم',
                today: 'امروز'
            }
        };
        
        return texts[this.language][key] || texts['dari'][key];
    }
    
    handleKeyNavigation(e, currentCell) {
        const cells = Array.from(this.calendarContainer.querySelectorAll('.calendar-date:not(.disabled):not(.empty)'));
        const currentIndex = cells.indexOf(currentCell);
        
        let targetIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                targetIndex = currentIndex > 0 ? currentIndex - 1 : cells.length - 1;
                break;
            case 'ArrowRight':
                targetIndex = currentIndex < cells.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowUp':
                targetIndex = currentIndex - 7;
                if (targetIndex < 0) targetIndex = currentIndex;
                break;
            case 'ArrowDown':
                targetIndex = currentIndex + 7;
                if (targetIndex >= cells.length) targetIndex = currentIndex;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.selectDate(currentCell);
                return;
            default:
                return;
        }
        
        e.preventDefault();
        if (cells[targetIndex]) {
            cells[targetIndex].focus();
        }
    }
}

// Persian Calendar Utilities for Afghanistan
const PersianCalendar = {
    // Persian months for Afghanistan
    monthNames: {
        dari: [
            'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
            'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'
        ],
        en: [
            'Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sunbula',
            'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hut'
        ]
    },
    
    getMonthName(monthIndex, language) {
        return this.monthNames[language][monthIndex];
    },
    
    getDaysInPersianMonth(year, month) {
        if (month <= 6) {
            return 31;
        } else if (month <= 11) {
            return 30;
        } else {
            return this.isPersianLeapYear(year) ? 30 : 29;
        }
    },
    
    isPersianLeapYear(year) {
        const cycle = year % 128;
        const leapYears = [1, 5, 9, 13, 17, 22, 26, 30, 34, 38, 42, 46, 50, 55, 59, 63, 67, 71, 75, 79, 84, 88, 92, 96, 100, 104, 108, 112, 116, 121, 125];
        return leapYears.includes(cycle);
    },
    
    gregorianToPersian(gDate) {
        const gYear = gDate.getFullYear();
        const gMonth = gDate.getMonth() + 1;
        const gDay = gDate.getDate();
        
        // Julian day calculation
        let jd = this.gregorianToJulian(gYear, gMonth, gDay);
        
        // Convert Julian to Persian
        return this.julianToPersian(jd);
    },
    
    persianToGregorian(pDate) {
        // Convert Persian to Julian
        const jd = this.persianToJulian(pDate.year, pDate.month, pDate.day);
        
        // Convert Julian to Gregorian
        return this.julianToGregorian(jd);
    },
    
    gregorianToJulian(year, month, day) {
        if (month <= 2) {
            year--;
            month += 12;
        }
        
        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        
        return Math.floor(365.25 * (year + 4716)) + 
               Math.floor(30.6001 * (month + 1)) + 
               day + b - 1524;
    },
    
    julianToGregorian(jd) {
        const a = jd + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);
        
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        
        return new Date(year, month - 1, day);
    },
    
    persianToJulian(year, month, day) {
        const epochJD = 1948321; // Persian epoch in Julian days
        
        let totalDays = 0;
        
        // Add days for complete years
        for (let y = 1; y < year; y++) {
            totalDays += this.isPersianLeapYear(y) ? 366 : 365;
        }
        
        // Add days for complete months in current year
        for (let m = 1; m < month; m++) {
            totalDays += this.getDaysInPersianMonth(year, m);
        }
        
        // Add remaining days
        totalDays += day - 1;
        
        return epochJD + totalDays;
    },
    
    julianToPersian(jd) {
        const epochJD = 1948321;
        let daysSinceEpoch = jd - epochJD;
        
        let year = 1;
        let month = 1;
        let day = 1;
        
        // Find the year
        while (true) {
            const daysInYear = this.isPersianLeapYear(year) ? 366 : 365;
            if (daysSinceEpoch < daysInYear) {
                break;
            }
            daysSinceEpoch -= daysInYear;
            year++;
        }
        
        // Find the month
        while (true) {
            const daysInMonth = this.getDaysInPersianMonth(year, month);
            if (daysSinceEpoch < daysInMonth) {
                break;
            }
            daysSinceEpoch -= daysInMonth;
            month++;
        }
        
        // Remaining days
        day = daysSinceEpoch + 1;
        
        return { year, month, day };
    }
};

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.DualCalendar = DualCalendar;
    window.PersianCalendar = PersianCalendar;
});