import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Doctor, Medication, PatientProfile, Appointment, AvailableBookingSlots } from '../types';
import { INITIAL_DOCTORS } from '../data/doctors';
import {
  Send,
  Sparkles,
  RefreshCw,
  HeartPulse,
  UserCheck,
  Stethoscope,
  CheckCircle,
  Calendar,
  Clock,
  Video,
  Building2,
} from 'lucide-react';

interface ChatAssistantProps {
  onBookDoctor?: (doctor: Doctor, reason?: string, preselectedDate?: string) => void;
  activeMedications: Medication[];
  onOpenMedicationCabinet: () => void;
  onDirectBookAppointment?: (appointment: Appointment) => void;
  onNavigateToAppointments?: () => void;
}

const SAMPLE_STARTERS = [
  {
    title: 'Book Cardiology',
    text: 'I want to book an appointment with Dr. Maya Lin for cardiology',
  },
  {
    title: 'Headache Medication',
    text: 'What medication can I take for a tension headache?',
  },
  {
    title: 'Blood Pressure Meds',
    text: 'What medications are commonly prescribed for high blood pressure?',
  },
  {
    title: 'Medication Timing',
    text: 'How should I take Amoxicillin 500mg if I missed my morning dose?',
  },
  {
    title: 'Rash Medication',
    text: 'What medication should I use for an itchy allergic skin rash?',
  },
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  onBookDoctor,
  activeMedications,
  onOpenMedicationCabinet,
  onDirectBookAppointment,
  onNavigateToAppointments,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Ask any question regarding symptoms, clinical signs, or medication dosages for an immediate, direct answer. To schedule a visit, let me know you'd like to book an appointment and I will present available times.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);

  const [userProfile] = useState<PatientProfile>({
    name: 'Jordan Miller',
    age: 42,
    gender: 'Non-binary',
    allergies: ['Penicillin (mild cutaneous hives)'],
    chronicConditions: ['Mild Essential Hypertension', 'Occasional Migraine'],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const resolveBookingFromText = (userText: string) => {
    const lower = userText.toLowerCase();
    const isBooking =
      lower.includes('book') ||
      lower.includes('schedule') ||
      (lower.includes('appointment') &&
        (lower.includes('make') ||
          lower.includes('want') ||
          lower.includes('need') ||
          lower.includes('set up') ||
          lower.includes('visit') ||
          lower.includes('reserve')));

    if (!isBooking) return null;

    // Only auto-resolve confirmed booking if user explicitly included a specific time
    const explicitTime = lower.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (!explicitTime) {
      return null;
    }

    let doctor = INITIAL_DOCTORS[1]; // default Dr. Marcus Thompson
    if (lower.includes('maya') || lower.includes('lin') || lower.includes('cardio') || lower.includes('heart') || lower.includes('pressure') || lower.includes('palpitation')) {
      doctor = INITIAL_DOCTORS[0]; // Dr. Maya Lin
    } else if (lower.includes('eliza') || lower.includes('reed') || lower.includes('derma') || lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('eczema')) {
      doctor = INITIAL_DOCTORS[2]; // Dr. Eliza Reed
    } else if (lower.includes('alexander') || lower.includes('chen') || lower.includes('ortho') || lower.includes('knee') || lower.includes('joint') || lower.includes('back') || lower.includes('shoulder') || lower.includes('sprain') || lower.includes('bone')) {
      doctor = INITIAL_DOCTORS[3]; // Dr. Alexander Chen
    } else if (lower.includes('sophia') || lower.includes('vargas') || lower.includes('neuro') || lower.includes('headache') || lower.includes('migraine') || lower.includes('dizz') || lower.includes('vertigo')) {
      doctor = INITIAL_DOCTORS[4]; // Dr. Sophia Vargas
    } else if (lower.includes('rachel') || lower.includes('kramer') || lower.includes('endo') || lower.includes('diabetes') || lower.includes('sugar') || lower.includes('thyroid') || lower.includes('hormone')) {
      doctor = INITIAL_DOCTORS[5]; // Dr. Rachel Kramer
    }

    // Dynamic date parsing
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
    const dayAfterObj = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const dayAfterStr = dayAfterObj.toISOString().split('T')[0];

    let date = tomorrowStr;
    const explicitDate = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
    if (explicitDate) {
      date = explicitDate[1];
    } else if (lower.includes('today')) {
      date = todayStr;
    } else if (lower.includes('day after')) {
      date = dayAfterStr;
    } else if (lower.includes('tomorrow')) {
      date = tomorrowStr;
    }

    let timeSlot = explicitTime[1].toUpperCase();
    if (!timeSlot.includes(':')) {
      timeSlot = timeSlot.replace(/(\d+)\s*(AM|PM)/i, '$1:00 $2');
    }

    const type: 'telehealth' | 'in-clinic' =
      lower.includes('in-clinic') || lower.includes('in person') || lower.includes('clinic')
        ? 'in-clinic'
        : 'telehealth';

    return {
      doctor,
      date,
      timeSlot,
      type,
      reason: `${doctor.specialty} Consultation`,
    };
  };

  const handleSelectTimeSlot = (slotInfo: AvailableBookingSlots, selectedTime: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: `I'd like to book for ${selectedTime}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const doc =
      INITIAL_DOCTORS.find((d) => d.id === slotInfo.doctorId) ||
      INITIAL_DOCTORS.find((d) => d.name.toLowerCase().includes(slotInfo.doctorName.toLowerCase())) ||
      INITIAL_DOCTORS[0];

    const confirmedAppt: Appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      doctorId: doc.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      doctorAvatar: doc.avatar,
      clinicAddress: doc.clinicAddress,
      patientName: userProfile.name,
      patientEmail: 'jordan.miller@example.com',
      patientPhone: '+1 (555) 382-9014',
      date: slotInfo.date,
      timeSlot: selectedTime,
      type: slotInfo.visitType || 'telehealth',
      reasonForVisit: slotInfo.reason || `${doc.specialty} Consultation`,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };

    onDirectBookAppointment?.(confirmedAppt);

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      content: `Your appointment with ${doc.name} (${doc.specialty}) has been confirmed for ${slotInfo.date} at ${selectedTime} via ${slotInfo.visitType === 'telehealth' ? 'Telehealth' : 'In-Clinic visit'}. The appointment has been saved to your account.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bookedAppointment: confirmedAppt,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setErrorNotice(null);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `msg-${Date.now()}-ai`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg, initialAssistantMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Connect to SSE streaming endpoint for instant real-time tokens
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentMedications: activeMedications,
          userProfile,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const data = JSON.parse(trimmed.slice(5).trim());
              if (data.chunk) {
                accumulatedContent += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
              if (data.done) {
                let bookedAppointment: Appointment | undefined;
                const bookingInfo = data.booking;
                const availableBookingSlots = data.availableSlots;
                const isConversationEnded = Boolean(data.isConversationEnded);
                const isNewConversationStart = Boolean(data.isNewConversationStart);

                if (bookingInfo) {
                  const doc =
                    INITIAL_DOCTORS.find((d) => d.id === bookingInfo.doctorId) ||
                    INITIAL_DOCTORS.find((d) =>
                      d.name.toLowerCase().includes(bookingInfo.doctorName?.toLowerCase() || '')
                    ) ||
                    INITIAL_DOCTORS[0];
                  bookedAppointment = {
                    id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    doctorId: doc.id,
                    doctorName: doc.name,
                    doctorSpecialty: doc.specialty,
                    doctorAvatar: doc.avatar,
                    clinicAddress: doc.clinicAddress,
                    patientName: userProfile.name,
                    patientEmail: 'jordan.miller@example.com',
                    patientPhone: '+1 (555) 382-9014',
                    date: bookingInfo.date || '2026-11-10',
                    timeSlot: bookingInfo.timeSlot || '10:00 AM',
                    type: bookingInfo.type || 'telehealth',
                    reasonForVisit: bookingInfo.reason || `${doc.specialty} Consultation`,
                    status: 'confirmed',
                    bookedAt: new Date().toISOString(),
                  };
                } else {
                  const local = resolveBookingFromText(text);
                  if (local) {
                    bookedAppointment = {
                      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      doctorId: local.doctor.id,
                      doctorName: local.doctor.name,
                      doctorSpecialty: local.doctor.specialty,
                      doctorAvatar: local.doctor.avatar,
                      clinicAddress: local.doctor.clinicAddress,
                      patientName: userProfile.name,
                      patientEmail: 'jordan.miller@example.com',
                      patientPhone: '+1 (555) 382-9014',
                      date: local.date,
                      timeSlot: local.timeSlot,
                      type: local.type,
                      reasonForVisit: local.reason,
                      status: 'confirmed',
                      bookedAt: new Date().toISOString(),
                    };
                  }
                }

                if (bookedAppointment) {
                  onDirectBookAppointment?.(bookedAppointment);
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: accumulatedContent || msg.content,
                          bookedAppointment,
                          availableBookingSlots,
                          isConversationEnded,
                          isNewConversationStart,
                        }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (streamErr) {
      console.warn('Streaming connection failed, falling back to instant fast route:', streamErr);

      // Fast non-streaming fallback
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.slice(0, -1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            currentMedications: activeMedications,
            userProfile,
          }),
        });

        if (!fallbackRes.ok) throw new Error('Fallback failed');
        const data = await fallbackRes.json();

        let bookedAppointment: Appointment | undefined;
        if (data.booking) {
          const doc =
            INITIAL_DOCTORS.find((d) => d.id === data.booking.doctorId) ||
            INITIAL_DOCTORS.find((d) =>
              d.name.toLowerCase().includes(data.booking.doctorName?.toLowerCase() || '')
            ) ||
            INITIAL_DOCTORS[0];
          bookedAppointment = {
            id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            doctorId: doc.id,
            doctorName: doc.name,
            doctorSpecialty: doc.specialty,
            doctorAvatar: doc.avatar,
            clinicAddress: doc.clinicAddress,
            patientName: userProfile.name,
            patientEmail: 'jordan.miller@example.com',
            patientPhone: '+1 (555) 382-9014',
            date: data.booking.date || '2026-11-10',
            timeSlot: data.booking.timeSlot || '10:00 AM',
            type: data.booking.type || 'telehealth',
            reasonForVisit: data.booking.reason || `${doc.specialty} Consultation`,
            status: 'confirmed',
            bookedAt: new Date().toISOString(),
          };
        } else {
          const local = resolveBookingFromText(text);
          if (local) {
            bookedAppointment = {
              id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              doctorId: local.doctor.id,
              doctorName: local.doctor.name,
              doctorSpecialty: local.doctor.specialty,
              doctorAvatar: local.doctor.avatar,
              clinicAddress: local.doctor.clinicAddress,
              patientName: userProfile.name,
              patientEmail: 'jordan.miller@example.com',
              patientPhone: '+1 (555) 382-9014',
              date: local.date,
              timeSlot: local.timeSlot,
              type: local.type,
              reasonForVisit: local.reason,
              status: 'confirmed',
              bookedAt: new Date().toISOString(),
            };
          }
        }

        if (bookedAppointment) {
          onDirectBookAppointment?.(bookedAppointment);
        }

        const availableBookingSlots = data.availableSlots;
        const isConversationEnded = Boolean(data.isConversationEnded);
        const isNewConversationStart = Boolean(data.isNewConversationStart);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: data.content,
                  bookedAppointment,
                  availableBookingSlots,
                  isConversationEnded,
                  isNewConversationStart,
                }
              : msg
          )
        );
      } catch (err: any) {
        console.error('Chat error:', err);
        setErrorNotice('Notice: Unable to reach AI server. Please try again.');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    'Temporary network latency. For acute emergency symptoms like crushing chest pain or severe shortness of breath, please immediately call 911.',
                }
              : msg
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `New consultation session started. Ask any question regarding symptoms, clinical signs, or medication dosages for an immediate, direct answer. To schedule a visit, let me know you'd like to book an appointment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNewConversationStart: true,
      },
    ]);
    setErrorNotice(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* Top Clinical Context Bar */}
      <div className="flex items-center justify-between py-2 px-4 mb-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-slate-900">Patient:</span>
          <span>{userProfile.name}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="tabular-nums">Age {userProfile.age}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="hidden sm:inline">
            Active Meds:{' '}
            <strong className="text-teal-700 font-medium">
              {activeMedications.length} registered
            </strong>
          </span>
          <span className="hidden lg:inline text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md font-medium text-[11px] border border-teal-200/60">
            ⚡ Fast Response Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            className="text-teal-700 hover:text-teal-900 font-medium hover:underline flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Profile & Allergies</span>
          </button>
          <span aria-hidden="true" className="text-slate-300">
            |
          </span>
          <button
            onClick={handleResetChat}
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            title="Start new conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Session</span>
          </button>
        </div>
      </div>

      {/* Patient Profile Drawer Collapsible */}
      {showProfileDrawer && (
        <div className="p-4 mb-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-900">Patient Clinical Summary</h4>
            <button
              onClick={() => setShowProfileDrawer(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-500">Known Allergies:</span>
              <p className="font-medium text-red-700">{userProfile.allergies.join(', ')}</p>
            </div>
            <div>
              <span className="text-slate-500">Chronic Diagnoses:</span>
              <p className="font-medium text-slate-900">
                {userProfile.chronicConditions.join(', ')}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Current Cabinet:</span>
              <p className="font-medium text-teal-800">
                {activeMedications.map((m) => m.name).join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <React.Fragment key={message.id}>
              {/* Optional New Conversation Session Divider */}
              {message.isNewConversationStart && (
                <div className="w-full flex items-center justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 py-1 px-3.5 bg-teal-50 border border-teal-200/80 rounded-full text-xs font-semibold text-teal-800 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>New Consultation Session Started</span>
                  </div>
                </div>
              )}

              <div
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-sm ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-br-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {/* Assistant header tag */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-teal-700">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>BaqiusHealth Clinical AI</span>
                      <span className="text-slate-400 font-normal tabular-nums ml-auto">
                        {message.timestamp}
                      </span>
                    </div>
                  )}

                  {/* Message Content formatted */}
                  <div className="prose prose-sm max-w-none space-y-2 leading-relaxed">
                    {!message.content && !isUser ? (
                      <div className="flex items-center gap-2 text-xs text-teal-700 py-1">
                        <Stethoscope className="w-3.5 h-3.5 animate-pulse" />
                        <span className="font-medium">Evaluating symptoms...</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping ml-1"></span>
                      </div>
                    ) : (
                      message.content.split('\n\n').map((paragraph, idx) => {
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h4
                              key={idx}
                              className={`text-base font-bold mt-2 mb-1 ${
                                isUser ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {paragraph.replace('### ', '')}
                            </h4>
                          );
                        }
                        if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                          const items = paragraph.split('\n').filter((l) => l.trim().length > 0);
                          return (
                            <ul key={idx} className="list-disc pl-4 space-y-1">
                            {items.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                {item.replace(/^[*-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="whitespace-pre-line">
                          {paragraph}
                        </p>
                      );
                    })
                  )}
                  </div>

                  {/* Interactive Available Time Slots Offer */}
                  {message.availableBookingSlots && !message.bookedAppointment && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="p-3.5 bg-gradient-to-br from-teal-50/95 to-sky-50/70 border border-teal-200/90 rounded-xl space-y-3 text-slate-800 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-teal-900 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>Available Times • {message.availableBookingSlots.date}</span>
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            {message.availableBookingSlots.doctorSpecialty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          {message.availableBookingSlots.doctorAvatar ? (
                            <img
                              src={message.availableBookingSlots.doctorAvatar}
                              alt={message.availableBookingSlots.doctorName}
                              className="w-7 h-7 rounded-full object-cover border border-teal-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {message.availableBookingSlots.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">
                            Select a time to book with <strong className="text-slate-800 font-semibold">{message.availableBookingSlots.doctorName}</strong>:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {message.availableBookingSlots.slots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => handleSelectTimeSlot(message.availableBookingSlots!, slot)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-teal-300 text-teal-800 hover:bg-teal-700 hover:text-white hover:border-teal-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
                            >
                              <Clock className="w-3.5 h-3.5 text-teal-600 group-hover:text-white" />
                              <span>{slot}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Confirmed Appointment Card */}
                  {message.bookedAppointment && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100">
                      <div className="p-3.5 bg-teal-50/80 border border-teal-200/80 rounded-xl space-y-3 text-slate-800 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800">
                            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>Appointment Booked & Confirmed</span>
                          </div>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 flex items-center gap-1">
                            {message.bookedAppointment.type === 'telehealth' ? (
                              <>
                                <Video className="w-3 h-3" />
                                <span>Telehealth</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-3 h-3" />
                                <span>In-Clinic</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          {message.bookedAppointment.doctorAvatar ? (
                            <img
                              src={message.bookedAppointment.doctorAvatar}
                              alt={message.bookedAppointment.doctorName}
                              className="w-12 h-12 rounded-full object-cover border border-teal-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                              {message.bookedAppointment.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-slate-900 text-sm truncate">
                              {message.bookedAppointment.doctorName}
                            </h5>
                            <p className="text-xs text-teal-700 font-medium">
                              {message.bookedAppointment.doctorSpecialty}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="font-medium text-slate-800">{message.bookedAppointment.date}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <strong className="font-medium text-slate-800">{message.bookedAppointment.timeSlot}</strong>
                              </span>
                            </div>
                            {message.bookedAppointment.clinicAddress && (
                              <p className="text-[11px] text-slate-500 mt-1 truncate">
                                📍 {message.bookedAppointment.clinicAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-teal-200/50">
                          {onNavigateToAppointments && (
                            <button
                              onClick={onNavigateToAppointments}
                              className="flex-1 py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors text-center shadow-2xs cursor-pointer"
                            >
                              View in My Appointments
                            </button>
                          )}
                          {onBookDoctor && (
                            <button
                              onClick={() => {
                                const doc = INITIAL_DOCTORS.find(d => d.id === message.bookedAppointment?.doctorId) || INITIAL_DOCTORS[0];
                                onBookDoctor(doc, message.bookedAppointment?.reasonForVisit, message.bookedAppointment?.date);
                              }}
                              className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors text-center cursor-pointer"
                            >
                              Reschedule / Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Consultation Concluded Card */}
                  {message.isConversationEnded && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="p-3.5 bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-200 rounded-xl space-y-2.5 text-slate-800 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>Consultation Concluded</span>
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            Session Closed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          This session has concluded. Whenever you have more health queries, need medication dosages, or wish to schedule an appointment, click below to start a new chat.
                        </p>
                        <div className="pt-1 flex gap-2">
                          <button
                            onClick={handleResetChat}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Start New Conversation</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Frequent Clinical Inquiries:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SAMPLE_STARTERS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.text)}
                className="px-3 py-1.5 text-xs bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg whitespace-nowrap transition-colors shrink-0 text-left"
              >
                <span className="font-semibold text-teal-700 block">{s.title}</span>
                <span className="truncate max-w-[200px] block text-slate-500">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorNotice && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{errorNotice}</span>
          <button onClick={() => setErrorNotice(null)} className="text-red-500 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-2xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            placeholder="Ask about symptoms (e.g. migraine symptoms, knee sprain signs) or medication dosage..."
            className="flex-1 p-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 min-h-[40px]"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${
              input.trim() && !loading
                ? 'bg-teal-700 text-white hover:bg-teal-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-1.5 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press Enter to send · Shift + Enter for new line</span>
          <span className="hidden sm:inline">
            Non-emergency triage only · In acute danger call 911
          </span>
        </div>
      </div>
    </div>
  );
};
