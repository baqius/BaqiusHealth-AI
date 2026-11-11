import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, TimeSlot } from '../types';
import { getAvailableSlotsForDate } from '../data/doctors';
import { generateICS } from '../utils/calendar';
import { X, Calendar, Clock, Video, Building2, CheckCircle2, Download, AlertCircle, User, Mail, Phone, FileText } from 'lucide-react';

interface BookingModalProps {
  doctor: Doctor | null;
  initialDate?: string;
  initialReason?: string;
  onClose: () => void;
  onConfirmBooking: (appointment: Appointment) => void;
  onViewAppointments: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  initialDate = '2026-11-04',
  initialReason = '',
  onClose,
  onConfirmBooking,
  onViewAppointments,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [visitType, setVisitType] = useState<'in-clinic' | 'telehealth'>('in-clinic');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [patientName, setPatientName] = useState<string>('Jordan Miller');
  const [patientEmail, setPatientEmail] = useState<string>('jordan.miller@example.com');
  const [patientPhone, setPatientPhone] = useState<string>('+1 (555) 382-9014');
  const [reason, setReason] = useState<string>(initialReason);
  const [notes, setNotes] = useState<string>('');
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (doctor) {
      const generated = getAvailableSlotsForDate(doctor.id, selectedDate);
      setSlots(generated);
      const firstAvailable = generated.find((s) => s.available);
      if (firstAvailable) {
        setSelectedTimeSlot(firstAvailable.time);
      } else {
        setSelectedTimeSlot('');
      }
    }
  }, [doctor, selectedDate]);

  useEffect(() => {
    if (initialReason) {
      setReason(initialReason);
    }
  }, [initialReason]);

  if (!doctor) return null;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeSlot) {
      setFormError('Please select an available appointment time slot.');
      return;
    }
    if (!patientName.trim()) {
      setFormError('Please provide your name.');
      return;
    }

    const appointment: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorAvatar: doctor.avatar,
      clinicAddress: doctor.clinicAddress,
      patientName,
      patientEmail,
      patientPhone,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      type: visitType,
      reasonForVisit: reason || 'General clinical consultation',
      symptomsSummary: reason,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      notes,
    };

    onConfirmBooking(appointment);
    setBookedAppointment(appointment);
  };

  const handleDownloadICS = () => {
    if (!bookedAppointment) return;
    const icsContent = generateICS({
      doctorName: bookedAppointment.doctorName,
      specialty: bookedAppointment.doctorSpecialty,
      date: bookedAppointment.date,
      timeSlot: bookedAppointment.timeSlot,
      type: bookedAppointment.type,
      clinicAddress: bookedAppointment.clinicAddress,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `consultation-${bookedAppointment.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Next 7 available upcoming dates for quick picker
  const upcomingDateOptions: { label: string; value: string }[] = [];
  const base = new Date(2026, 10, 4); // Nov 4, 2026
  for (let i = 0; i < 10; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const val = `${y}-${m}-${day}`;
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    upcomingDateOptions.push({
      label: i === 0 ? `Today (${monthName} ${day})` : `${weekday}, ${monthName} ${day}`,
      value: val,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {bookedAppointment ? 'Consultation Confirmed' : 'Schedule Medical Appointment'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated real-time calendar booking with direct clinic confirmation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookedAppointment ? (
          /* Booking Confirmation State */
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-teal-50/80 border border-teal-200">
              <CheckCircle2 className="w-7 h-7 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-semibold text-teal-900">
                  Appointment Successfully Scheduled
                </h4>
                <p className="text-xs text-teal-700 mt-1">
                  Confirmation reference:{' '}
                  <span className="font-mono font-medium">{bookedAppointment.id}</span>
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-white">
              <div className="flex items-center gap-3">
                {doctor.avatar ? (
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    {doctor.name.replace('Dr. ', '').charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{doctor.name}</h4>
                  <p className="text-xs text-slate-500">{doctor.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>
                    Date:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {bookedAppointment.date}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>
                    Time:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {bookedAppointment.timeSlot}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bookedAppointment.type === 'telehealth' ? (
                    <Video className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Building2 className="w-4 h-4 text-teal-600" />
                  )}
                  <span>
                    Format:{' '}
                    <strong className="text-slate-900 capitalize">
                      {bookedAppointment.type === 'telehealth'
                        ? 'Telehealth Video Room'
                        : 'In-Clinic Visit'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="truncate">
                    Reason: <strong className="text-slate-900">{bookedAppointment.reasonForVisit}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleDownloadICS}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Add to Calendar (.ics)</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewAppointments();
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
              >
                <span>View in My Appointments</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
            {/* Doctor mini banner */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                  {doctor.name.replace('Dr. ', '').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{doctor.name}</h4>
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">
                    ${doctor.consultationFee}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>{doctor.specialty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{doctor.experienceYears} yrs experience</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">★ {doctor.rating}</span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Visit Type Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Consultation Format
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setVisitType('in-clinic')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                    visitType === 'in-clinic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>In-Clinic Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType('telehealth')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-colors ${
                    visitType === 'telehealth'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-4 h-4 text-teal-600" />
                  <span>Telehealth Video Call</span>
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Select Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {upcomingDateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(opt.value);
                      setFormError('');
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                      selectedDate === opt.value
                        ? 'bg-teal-700 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Available Slots for {selectedDate}
                </label>
                <span className="text-xs text-slate-400">45-min consultation</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => {
                      setSelectedTimeSlot(slot.time);
                      setFormError('');
                    }}
                    className={`py-2 px-2.5 text-xs rounded-lg text-center font-mono tabular-nums transition-colors ${
                      !slot.available
                        ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                        : selectedTimeSlot === slot.time
                        ? 'bg-teal-700 text-white font-semibold ring-2 ring-teal-600 ring-offset-1'
                        : 'bg-white border border-slate-200 text-slate-800 hover:border-teal-500 hover:text-teal-700'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Information & Reason */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Patient Information
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Reason for Visit / Symptoms Summary
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your current symptoms or reason for consulting the doctor..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-xs"
              >
                Confirm Appointment (${doctor.consultationFee})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
