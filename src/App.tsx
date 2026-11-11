/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { ChatAssistant } from './components/ChatAssistant';
import { CalendarBookingView } from './components/CalendarBookingView';
import { MyAppointmentsView } from './components/MyAppointmentsView';
import { MedicationCabinetView } from './components/MedicationCabinetView';
import { BookingModal } from './components/BookingModal';
import { Doctor, Appointment, Medication } from './types';
import { INITIAL_DOCTORS } from './data/doctors';
import { INITIAL_MEDICATIONS } from './data/medications';
import { ShieldAlert, Phone } from 'lucide-react';

const STORAGE_KEYS = {
  APPOINTMENTS: 'curahealth_appointments_v1',
  MEDICATIONS: 'curahealth_medications_v1',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('assistant');

  // Appointments state with realistic initial seed
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load appointments from localStorage', e);
    }
    // Default seed appointment
    return [
      {
        id: 'apt-seed-1',
        doctorId: 'doc-maya-lin',
        doctorName: 'Dr. Maya Lin, MD, FACC',
        doctorSpecialty: 'Cardiology',
        doctorAvatar: '/src/assets/images/doctor_cardiology_avatar_1793801625327.jpg',
        clinicAddress: "St. Mary's Heart & Vascular Pavilion, Suite 402, Metro Medical Center",
        patientName: 'Jordan Miller',
        patientEmail: 'jordan.miller@example.com',
        patientPhone: '+1 (555) 382-9014',
        date: '2026-11-06',
        timeSlot: '10:00 AM',
        type: 'telehealth',
        reasonForVisit: 'Hypertension follow-up & ambulatory blood pressure titration',
        symptomsSummary: 'Occasional morning headache and borderline systolic elevation',
        status: 'confirmed',
        bookedAt: '2026-11-03T14:30:00Z',
      },
    ];
  });

  // Medications state
  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load medications from localStorage', e);
    }
    return INITIAL_MEDICATIONS;
  });

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('2026-11-04');
  const [bookingReason, setBookingReason] = useState<string>('');

  // Persist appointments
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.warn('Failed to save appointments to localStorage', e);
    }
  }, [appointments]);

  // Persist medications
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    } catch (e) {
      console.warn('Failed to save medications to localStorage', e);
    }
  }, [medications]);

  const handleBookDoctor = (doctor: Doctor, reason?: string, preselectedDate?: string) => {
    setBookingDoctor(doctor);
    if (reason) setBookingReason(reason);
    if (preselectedDate) setBookingDate(preselectedDate);
  };

  const handleQuickBook = () => {
    // Default quick book opens with Dr. Marcus Thompson or navigates to calendar
    setBookingDoctor(INITIAL_DOCTORS[1]); // Dr. Marcus Thompson
    setBookingDate('2026-11-04');
    setBookingReason('General Clinical Consultation');
  };

  const handleConfirmBooking = (newAppointment: Appointment) => {
    setAppointments((prev) => [newAppointment, ...prev]);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddMedication = (newMed: Medication) => {
    setMedications((prev) => [newMed, ...prev]);
  };

  const handleAskAboutMedication = (medName: string, dosage: string) => {
    setActiveTab('assistant');
    // Scroll or set focus in chat assistant
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appointmentCount={appointments.length}
        onQuickBook={handleQuickBook}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'assistant' && (
          <ChatAssistant
            onBookDoctor={handleBookDoctor}
            activeMedications={medications}
            onOpenMedicationCabinet={() => setActiveTab('medications')}
            onDirectBookAppointment={handleConfirmBooking}
            onNavigateToAppointments={() => setActiveTab('appointments')}
          />
        )}

        {activeTab === 'doctors' && (
          <CalendarBookingView onBookDoctor={handleBookDoctor} />
        )}

        {activeTab === 'appointments' && (
          <MyAppointmentsView
            appointments={appointments}
            onCancelAppointment={handleCancelAppointment}
            onNavigateToCalendar={() => setActiveTab('doctors')}
            onNavigateToAssistant={() => setActiveTab('assistant')}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationCabinetView
            medications={medications}
            onAddMedication={handleAddMedication}
            onAskAboutMedication={handleAskAboutMedication}
          />
        )}
      </main>

      {/* Persistent Clinical Emergency & Compliance Footer Banner */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Emergency Medical Notice:</strong> If you are experiencing crushing chest pain,
              acute shortness of breath, or stroke signs, immediately dial{' '}
              <strong className="text-red-700">911</strong> or visit the nearest emergency room.
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>HIPAA-Aligned Architecture</span>
            <span aria-hidden="true">·</span>
            <span>BaqiusHealth AI Clinical Protocol</span>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          initialDate={bookingDate}
          initialReason={bookingReason}
          onClose={() => setBookingDoctor(null)}
          onConfirmBooking={handleConfirmBooking}
          onViewAppointments={() => setActiveTab('appointments')}
        />
      )}
    </div>
  );
}
