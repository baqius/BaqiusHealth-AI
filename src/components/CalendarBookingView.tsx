import React, { useState, useMemo } from 'react';
import { Doctor, MedicalSpecialty } from '../types';
import { INITIAL_DOCTORS, getAvailableSlotsForDate, SPECIALTY_OPTIONS } from '../data/doctors';
import { getMonthDays, formatLocalDate } from '../utils/calendar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Video,
  Building2,
  Clock,
  Star,
  CheckCircle2,
  Languages,
  GraduationCap,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CalendarBookingViewProps {
  onBookDoctor: (doctor: Doctor, reason?: string, preselectedDate?: string) => void;
}

export const CalendarBookingView: React.FC<CalendarBookingViewProps> = ({ onBookDoctor }) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(10); // 10 = November (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-04');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'in-clinic' | 'telehealth'>('all');

  // Month days for calendar
  const calendarDays = useMemo(() => {
    return getMonthDays(currentYear, currentMonthIndex, '2026-11-04');
  }, [currentYear, currentMonthIndex]);

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonthIndex, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonthIndex]);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return INITIAL_DOCTORS.filter((doctor) => {
      // Specialty filter
      if (selectedSpecialty !== 'all' && doctor.specialtyCode !== selectedSpecialty) {
        return false;
      }
      // Format filter
      if (formatFilter === 'in-clinic' && !doctor.acceptsInClinic) return false;
      if (formatFilter === 'telehealth' && !doctor.acceptsTelehealth) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = doctor.name.toLowerCase().includes(query);
        const matchesSpecialty = doctor.specialty.toLowerCase().includes(query);
        const matchesBio = doctor.bio.toLowerCase().includes(query);
        const matchesConditions = doctor.keyConditions.some((c) => c.toLowerCase().includes(query));
        if (!matchesName && !matchesSpecialty && !matchesBio && !matchesConditions) {
          return false;
        }
      }
      return true;
    });
  }, [selectedSpecialty, formatFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Integrated Clinical Scheduling & Calendar
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Select a date to view real-time physician availability across in-clinic and telehealth
            video consultations.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, doctors, or specialties..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Calendar on left (or top), Doctors on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar & Filters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Interactive Monthly Calendar Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">{monthLabel}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(2026);
                    setCurrentMonthIndex(10);
                    setSelectedDateStr('2026-11-04');
                  }}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = day.dateStr === selectedDateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`relative h-10 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : day.isToday
                        ? 'border border-teal-500 text-teal-800 bg-teal-50/50 font-semibold'
                        : !day.isCurrentMonth
                        ? 'text-slate-300 hover:text-slate-500'
                        : day.isPast
                        ? 'text-slate-400 hover:bg-slate-50'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="tabular-nums">{day.dayNumber}</span>
                    {/* Tiny availability indicator for current month days */}
                    {day.isCurrentMonth && !day.isPast && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-teal-500 mt-0.5"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Summary */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Selected Schedule Date:</span>
              <strong className="text-teal-900 font-semibold tabular-nums">
                {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          {/* Specialty Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Filter by Clinical Specialty
              </h4>
              {selectedSpecialty !== 'all' && (
                <button
                  onClick={() => setSelectedSpecialty('all')}
                  className="text-xs text-teal-700 hover:underline font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSpecialty('all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  selectedSpecialty === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Specialists ({INITIAL_DOCTORS.length})
              </button>
              {SPECIALTY_OPTIONS.map((spec) => {
                const count = INITIAL_DOCTORS.filter((d) => d.specialtyCode === spec.code).length;
                return (
                  <button
                    key={spec.code}
                    onClick={() => setSelectedSpecialty(spec.code)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      selectedSpecialty === spec.code
                        ? 'bg-teal-700 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {spec.label} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Visit format filter */}
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-xs font-medium text-slate-500 mb-2">
                Consultation Delivery Mode:
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  onClick={() => setFormatFilter('all')}
                  className={`py-1.5 rounded-md font-medium transition-colors ${
                    formatFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All Modes
                </button>
                <button
                  onClick={() => setFormatFilter('in-clinic')}
                  className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                    formatFilter === 'in-clinic'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Clinic</span>
                </button>
                <button
                  onClick={() => setFormatFilter('telehealth')}
                  className={`py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                    formatFilter === 'telehealth'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Available Doctors and Slots for Selected Date (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-900">{filteredDoctors.length}</strong> available
              physicians for <strong className="text-slate-900 tabular-nums">{selectedDateStr}</strong>
            </span>
            <span className="hidden sm:inline">Instant confirmation · Reschedule anytime</span>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
              <Filter className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No physicians match your filter</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting "All Specialists" or clearing your search keywords to view the
                complete clinical directory.
              </p>
              <button
                onClick={() => {
                  setSelectedSpecialty('all');
                  setSearchQuery('');
                  setFormatFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredDoctors.map((doctor) => {
              const availableSlots = getAvailableSlotsForDate(doctor.id, selectedDateStr).filter(
                (s) => s.available
              );

              return (
                <div
                  key={doctor.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
                >
                  {/* Doctor Info Row */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {doctor.avatar ? (
                        <img
                          src={doctor.avatar}
                          alt={doctor.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                          {doctor.name.replace('Dr. ', '').charAt(0)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">{doctor.name}</h4>
                          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                            {doctor.specialty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{doctor.title}</p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-800 font-semibold tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {doctor.rating} ({doctor.reviewCount} reviews)
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">{doctor.experienceYears} yrs exp</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Languages className="w-3 h-3 text-slate-400" />
                            {doctor.languages.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block">Consultation</span>
                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                          ${doctor.consultationFee}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        {doctor.acceptsInClinic && (
                          <span title="In-Clinic Consultations Available">
                            <Building2 className="w-3.5 h-3.5 text-teal-700 inline" /> Clinic
                          </span>
                        )}
                        {doctor.acceptsTelehealth && (
                          <span title="Telehealth Video Room Available">
                            <Video className="w-3.5 h-3.5 text-teal-700 inline" /> Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio & Education Snippet */}
                  <div className="text-xs text-slate-600 line-clamp-2">
                    {doctor.bio}
                  </div>

                  {/* Conditions tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Specializes in:</span>
                    {doctor.keyConditions.slice(0, 3).map((cond, i) => (
                      <span key={i} className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {cond}
                      </span>
                    ))}
                    {doctor.keyConditions.length > 3 && (
                      <span className="text-slate-400">+{doctor.keyConditions.length - 3} more</span>
                    )}
                  </div>

                  {/* Available Time Slots for this Doctor on Selected Date */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        Available Slots on {selectedDateStr}:
                      </span>
                      <span className="text-xs text-teal-700 font-medium tabular-nums">
                        {availableSlots.length} openings
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableSlots.slice(0, 6).map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() =>
                            onBookDoctor(doctor, 'Consultation scheduled via calendar', selectedDateStr)
                          }
                          className="px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-200 text-slate-800 rounded-lg hover:border-teal-600 hover:bg-teal-50 hover:text-teal-900 transition-colors"
                        >
                          {slot.time}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          onBookDoctor(doctor, 'Clinical consultation', selectedDateStr)
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors ml-auto"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
