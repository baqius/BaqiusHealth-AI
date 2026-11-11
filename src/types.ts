export type UrgencyLevel = 'routine' | 'priority' | 'emergency';

export type MedicalSpecialty =
  | 'General Practice'
  | 'Cardiology'
  | 'Dermatology'
  | 'Orthopedics'
  | 'Neurology'
  | 'Pediatrics'
  | 'Endocrinology'
  | 'ENT (Otolaryngology)'
  | 'Psychiatry & Mental Health';

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: MedicalSpecialty;
  specialtyCode: string; // e.g. 'cardiology', 'general_practice'
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  education: string;
  clinicAddress: string;
  acceptsTelehealth: boolean;
  acceptsInClinic: boolean;
  bio: string;
  keyConditions: string[];
}

export interface TimeSlot {
  id: string;
  time: string; // e.g. '09:00 AM'
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: MedicalSpecialty;
  doctorAvatar: string;
  clinicAddress: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. '10:30 AM'
  type: 'in-clinic' | 'telehealth';
  reasonForVisit: string;
  symptomsSummary?: string;
  urgency?: UrgencyLevel;
  status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  bookedAt: string;
  notes?: string;
}

export interface TriageData {
  urgency: UrgencyLevel;
  emergencyAlert?: string;
  recommendedSpecialty?: string;
  recommendedSpecialtyCode?: string;
  suggestedDoctorIds?: string[];
  possibleCauses?: string[];
  immediateCareAdvice?: string[];
  warningSignals?: string[];
  actionPrompt?: string;
}

export interface MedicationAdvice {
  medicationName?: string;
  dosageNotes?: string;
  timing?: string;
  foodInstructions?: string;
  missedDoseAdvice?: string;
  commonSideEffects?: string[];
  contraindications?: string[];
  warning?: string;
}

export interface AvailableBookingSlots {
  doctorId: string;
  doctorName: string;
  doctorSpecialty: MedicalSpecialty;
  doctorAvatar?: string;
  clinicAddress?: string;
  date: string;
  slots: string[];
  visitType: 'telehealth' | 'in-clinic';
  reason?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  triageData?: TriageData;
  medicationAdvice?: MedicationAdvice;
  bookedAppointment?: Appointment;
  availableBookingSlots?: AvailableBookingSlots;
  isConversationEnded?: boolean;
  isNewConversationStart?: boolean;
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string; // e.g. '10mg'
  frequency: string; // e.g. 'Once daily in the morning'
  instructions: string;
  foodInteraction: 'with_food' | 'empty_stomach' | 'either';
  prescriber: string;
  startDate: string;
  refillCount: number;
  category: 'Cardiovascular' | 'Metabolic' | 'Infection' | 'Pain/Inflammation' | 'Mental Health' | 'Supplement' | 'Other';
  active: boolean;
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: string;
  allergies: string[];
  chronicConditions: string[];
}
