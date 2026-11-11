import { Doctor, MedicalSpecialty, TimeSlot } from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-maya-lin',
    name: 'Dr. Maya Lin, MD, FACC',
    title: 'Senior Attending Cardiologist',
    specialty: 'Cardiology',
    specialtyCode: 'cardiology',
    avatar: '/src/assets/images/doctor_cardiology_avatar_1793801625327.jpg',
    rating: 4.96,
    reviewCount: 312,
    experienceYears: 16,
    consultationFee: 190,
    languages: ['English', 'Mandarin'],
    education: 'Johns Hopkins School of Medicine · Harvard Fellowship',
    clinicAddress: 'St. Mary\'s Heart & Vascular Pavilion, Suite 402, Metro Medical Center',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Board-certified cardiologist specializing in preventative cardiovascular risk, hypertension, arrhythmia management, coronary artery disease, and lipid optimization.',
    keyConditions: [
      'Chest pain evaluation',
      'Palpitations & Arrhythmia',
      'Hypertension & Blood pressure control',
      'Elevated Cholesterol',
      'Shortness of breath with exertion'
    ]
  },
  {
    id: 'doc-marcus-thompson',
    name: 'Dr. Marcus Thompson, MD',
    title: 'Principal Physician, Internal Medicine',
    specialty: 'General Practice',
    specialtyCode: 'general_practice',
    avatar: '/src/assets/images/doctor_general_avatar_1793801626208.jpg',
    rating: 4.92,
    reviewCount: 489,
    experienceYears: 14,
    consultationFee: 140,
    languages: ['English', 'Spanish'],
    education: 'UCSF School of Medicine · Stanford Internal Medicine Residency',
    clinicAddress: 'Downtown Ambulatory Clinic, Floor 2, 742 Pine Grove Blvd',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Comprehensive primary care physician dedicated to diagnostic mystery solving, preventative health screenings, chronic disease coordination, and acute medical illnesses.',
    keyConditions: [
      'Persistent fever, fatigue & malaise',
      'Abdominal pain & Digestive complaints',
      'Respiratory infections & cough',
      'Annual wellness & comprehensive labs',
      'Polypharmacy & medication reviews'
    ]
  },
  {
    id: 'doc-eliza-reed',
    name: 'Dr. Eliza Reed, MD, FAAD',
    title: 'Dermatologist & Cutaneous Specialist',
    specialty: 'Dermatology',
    specialtyCode: 'dermatology',
    avatar: '/src/assets/images/doctor_dermatology_avatar_1793801627310.jpg',
    rating: 4.95,
    reviewCount: 374,
    experienceYears: 18,
    consultationFee: 175,
    languages: ['English', 'French'],
    education: 'Columbia University Vagelos College of Physicians and Surgeons',
    clinicAddress: 'Aura Dermatology & Laser Center, Suite 310, Medical Plaza',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Expert in clinical dermatology, suspicious lesion dermoscopy, inflammatory dermatoses (eczema, psoriasis), adult acne, and allergic drug eruptions.',
    keyConditions: [
      'Unexplained rashes & hives',
      'Changing moles or skin lesions',
      'Severe acne, rosacea & eczema',
      'Scalp and hair loss issues',
      'Suspected skin allergy or medication reaction'
    ]
  },
  {
    id: 'doc-alexander-chen',
    name: 'Dr. Alexander Chen, MD',
    title: 'Orthopedic Surgeon & Sports Medicine',
    specialty: 'Orthopedics',
    specialtyCode: 'orthopedics',
    avatar: '/src/assets/images/doctor_orthopedics_avatar_1793801626657.jpg',
    rating: 4.91,
    reviewCount: 260,
    experienceYears: 15,
    consultationFee: 185,
    languages: ['English', 'Cantonese'],
    education: 'University of Michigan Medical School · Hospital for Special Surgery Fellowship',
    clinicAddress: 'Orthopedic & Joint Restoration Institute, 120 Olympic Way',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Specialist in musculoskeletal biomechanics, acute sports injuries, knee and shoulder arthroscopy, spine/back strain, and joint degenerative pain management.',
    keyConditions: [
      'Acute knee, ankle, or shoulder injuries',
      'Chronic lower back & neck pain',
      'Joint swelling & osteoarthritis',
      'Tendonitis and repetitive strain',
      'Post-fall musculoskeletal trauma'
    ]
  },
  {
    id: 'doc-sophia-vargas',
    name: 'Dr. Sophia Vargas, MD, PhD',
    title: 'Neurologist & Headache Specialist',
    specialty: 'Neurology',
    specialtyCode: 'neurology',
    avatar: '', // Styled fallback avatar
    rating: 4.94,
    reviewCount: 215,
    experienceYears: 12,
    consultationFee: 210,
    languages: ['English', 'Spanish'],
    education: 'Yale School of Medicine · Mayo Clinic Neurology Residency',
    clinicAddress: 'Neuroscience Center of Excellence, Wing B, 880 Health Science Pkwy',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Focused on refractory migraine syndromes, neuropathic pain, dizziness/vertigo, sleep disorders, and cognitive symptoms.',
    keyConditions: [
      'Severe or intractable migraines',
      'Numbness, tingling, or limb weakness',
      'Unexplained dizziness or vertigo',
      'Tremors or involuntary movements',
      'Memory changes and brain fog'
    ]
  },
  {
    id: 'doc-rachel-kramer',
    name: 'Dr. Rachel Kramer, MD',
    title: 'Clinical Endocrinologist',
    specialty: 'Endocrinology',
    specialtyCode: 'endocrinology',
    avatar: '', // Styled fallback avatar
    rating: 4.89,
    reviewCount: 198,
    experienceYears: 13,
    consultationFee: 170,
    languages: ['English', 'German'],
    education: 'Northwestern University Feinberg School of Medicine',
    clinicAddress: 'Endocrine & Metabolic Health Clinic, 450 University Ave',
    acceptsTelehealth: true,
    acceptsInClinic: true,
    bio: 'Specializing in glycemic control (Type 1 and 2 diabetes), thyroid nodules and Hashimoto\'s, adrenal and pituitary disorders, and metabolic wellness.',
    keyConditions: [
      'Diabetes management & insulin titration',
      'Hypothyroidism & hyperthyroidism',
      'Unexplained rapid weight changes',
      'Osteoporosis and bone density',
      'Hormonal imbalances'
    ]
  }
];

// Helper to generate dynamic time slots for any chosen date
export function getAvailableSlotsForDate(doctorId: string, dateStr: string): TimeSlot[] {
  // Deterministic generator based on doctorId + date string hash
  const hash = (doctorId + dateStr).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const allSlots: { time: string; period: 'morning' | 'afternoon' | 'evening' }[] = [
    { time: '08:30 AM', period: 'morning' },
    { time: '09:15 AM', period: 'morning' },
    { time: '10:00 AM', period: 'morning' },
    { time: '10:45 AM', period: 'morning' },
    { time: '11:30 AM', period: 'morning' },
    { time: '01:30 PM', period: 'afternoon' },
    { time: '02:15 PM', period: 'afternoon' },
    { time: '03:00 PM', period: 'afternoon' },
    { time: '03:45 PM', period: 'afternoon' },
    { time: '04:30 PM', period: 'afternoon' },
    { time: '05:30 PM', period: 'evening' },
    { time: '06:15 PM', period: 'evening' }
  ];

  return allSlots.map((slot, idx) => {
    // Generate deterministic availability
    const isBooked = (hash + idx * 7) % 5 === 0;
    return {
      id: `${dateStr}-${slot.time.replace(/[: ]/g, '')}`,
      time: slot.time,
      period: slot.period,
      available: !isBooked
    };
  });
}

export const SPECIALTY_OPTIONS: { label: string; code: string; specialty: MedicalSpecialty; iconName: string }[] = [
  { label: 'General Practice & Internal', code: 'general_practice', specialty: 'General Practice', iconName: 'Stethoscope' },
  { label: 'Cardiology & Heart Care', code: 'cardiology', specialty: 'Cardiology', iconName: 'HeartPulse' },
  { label: 'Dermatology & Skin Care', code: 'dermatology', specialty: 'Dermatology', iconName: 'Sparkles' },
  { label: 'Orthopedics & Sports Med', code: 'orthopedics', specialty: 'Orthopedics', iconName: 'Activity' },
  { label: 'Neurology & Headaches', code: 'neurology', specialty: 'Neurology', iconName: 'Brain' },
  { label: 'Endocrinology & Diabetes', code: 'endocrinology', specialty: 'Endocrinology', iconName: 'FlaskConical' },
];
