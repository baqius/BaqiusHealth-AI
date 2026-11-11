import { Medication } from '../types';

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-lisinopril',
    name: 'Lisinopril',
    genericName: 'Lisinopril ACE Inhibitor',
    dosage: '10 mg',
    frequency: 'Once daily in the morning',
    instructions: 'Take around 8:00 AM with or without food. Maintain consistent daily timing. Stay adequately hydrated.',
    foodInteraction: 'either',
    prescriber: 'Dr. Maya Lin (Cardiology)',
    startDate: '2026-08-15',
    refillCount: 2,
    category: 'Cardiovascular',
    active: true
  },
  {
    id: 'med-metformin',
    name: 'Metformin XR',
    genericName: 'Metformin Extended Release',
    dosage: '500 mg',
    frequency: 'Twice daily with meals',
    instructions: 'Take 1 tablet with breakfast and 1 tablet with dinner to reduce stomach upset. Swallow whole; do not crush or chew.',
    foodInteraction: 'with_food',
    prescriber: 'Dr. Marcus Thompson (Internal Medicine)',
    startDate: '2026-05-10',
    refillCount: 4,
    category: 'Metabolic',
    active: true
  },
  {
    id: 'med-amoxicillin',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    dosage: '500 mg',
    frequency: 'Three times daily for 7 days',
    instructions: 'Take every 8 hours. Complete full course of antibiotics even if feeling completely recovered.',
    foodInteraction: 'either',
    prescriber: 'Downtown Urgent Care',
    startDate: '2026-11-01',
    refillCount: 0,
    category: 'Infection',
    active: true
  },
  {
    id: 'med-vitamind',
    name: 'Cholecalciferol (Vitamin D3)',
    genericName: 'Vitamin D3',
    dosage: '2,000 IU',
    frequency: 'Once daily with main meal',
    instructions: 'Take with a meal containing dietary healthy fats for optimal absorption.',
    foodInteraction: 'with_food',
    prescriber: 'Dr. Marcus Thompson (Internal Medicine)',
    startDate: '2026-01-20',
    refillCount: 5,
    category: 'Supplement',
    active: true
  }
];
