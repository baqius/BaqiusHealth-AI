// Calendar utility functions for November 2026 and dynamic months

export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getMonthDays(year: number, monthIndex: number, todayStr: string = '2026-11-04'): CalendarDay[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
  const totalDays = lastDayOfMonth.getDate();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, monthIndex - 1, dayNum);
    const dStr = formatLocalDate(d);
    days.push({
      date: d,
      dateStr: dStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isPast: dStr < todayStr
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const d = new Date(year, monthIndex, dayNum);
    const dStr = formatLocalDate(d);
    days.push({
      date: d,
      dateStr: dStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dStr === todayStr,
      isPast: dStr < todayStr
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const d = new Date(year, monthIndex + 1, dayNum);
    const dStr = formatLocalDate(d);
    days.push({
      date: d,
      dateStr: dStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dStr === todayStr,
      isPast: dStr < todayStr
    });
  }

  return days;
}

export function generateICS(appointment: {
  doctorName: string;
  specialty: string;
  date: string;
  timeSlot: string;
  type: string;
  clinicAddress: string;
}): string {
  const startDateTime = `${appointment.date.replace(/-/g, '')}T100000Z`;
  const endDateTime = `${appointment.date.replace(/-/g, '')}T104500Z`;
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BaqiusHealth AI//Appointment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:Medical Consultation with ${appointment.doctorName} (${appointment.specialty})`,
    `DESCRIPTION:Type: ${appointment.type}\\nLocation: ${appointment.clinicAddress}\\nTime: ${appointment.timeSlot}`,
    `LOCATION:${appointment.type === 'telehealth' ? 'BaqiusHealth Telehealth Video Room' : appointment.clinicAddress}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}
