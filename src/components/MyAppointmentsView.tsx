import React, { useState } from 'react';
import { Appointment, Doctor } from '../types';
import { generateICS } from '../utils/calendar';
import { TelehealthRoomModal } from './TelehealthRoomModal';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  Download,
  AlertCircle,
  FileText,
  Trash2,
  CalendarDays,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface MyAppointmentsViewProps {
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onNavigateToCalendar: () => void;
  onNavigateToAssistant: () => void;
}

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  appointments,
  onCancelAppointment,
  onNavigateToCalendar,
  onNavigateToAssistant,
}) => {
  const [activeTelehealthApt, setActiveTelehealthApt] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleDownloadICS = (apt: Appointment) => {
    const icsContent = generateICS({
      doctorName: apt.doctorName,
      specialty: apt.doctorSpecialty,
      date: apt.date,
      timeSlot: apt.timeSlot,
      type: apt.type,
      clinicAddress: apt.clinicAddress,
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointment-${apt.date}-${apt.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            My Scheduled Appointments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your upcoming clinical visits, download calendar reminders, or enter telehealth
            video rooms.
          </p>
        </div>

        <button
          onClick={onNavigateToCalendar}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors self-start sm:self-auto shadow-xs"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Book Another Appointment</span>
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No scheduled appointments found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't scheduled any doctor appointments yet. You can use our AI Assistant to
            triage symptoms or browse available physicians directly on our integrated calendar.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToAssistant}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Analyze Symptoms with AI
            </button>
            <button
              onClick={onNavigateToCalendar}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-xs"
            >
              Explore Calendar & Doctors
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Doctor info */}
                <div className="flex items-start gap-4">
                  {apt.doctorAvatar ? (
                    <img
                      src={apt.doctorAvatar}
                      alt={apt.doctorName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base shrink-0">
                      {apt.doctorName.replace('Dr. ', '').charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">{apt.doctorName}</h4>
                      <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {apt.doctorSpecialty}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {apt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {apt.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 tabular-nums font-mono text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {apt.timeSlot}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        {apt.type === 'telehealth' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-teal-600" />
                            <span>Telehealth Video</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>In-Clinic</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
                  {apt.type === 'telehealth' && (
                    <button
                      onClick={() => setActiveTelehealthApt(apt)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Video Room</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadICS(apt)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Export .ics calendar file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.ics Calendar</span>
                  </button>

                  <button
                    onClick={() => setCancellingId(apt.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Cancel consultation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Consultation Details Strip */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Reason for Visit:</span>
                  <p className="mt-0.5 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {apt.reasonForVisit || 'General Medical Consultation'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-800">Location / Connection:</span>
                  <p className="mt-0.5 text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                    {apt.type === 'telehealth'
                      ? 'Secure BaqiusHealth Telehealth Portal (Encrypted Video)'
                      : apt.clinicAddress}
                  </p>
                </div>
              </div>

              {/* Cancellation Confirmation Bar */}
              {cancellingId === apt.id && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
                  <span>Are you sure you want to cancel this appointment?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCancellingId(null)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-white rounded-md transition-colors"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => {
                        onCancelAppointment(apt.id);
                        setCancellingId(null);
                      }}
                      className="px-3 py-1 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Telehealth video room modal */}
      {activeTelehealthApt && (
        <TelehealthRoomModal
          appointment={activeTelehealthApt}
          onClose={() => setActiveTelehealthApt(null)}
        />
      )}
    </div>
  );
};
