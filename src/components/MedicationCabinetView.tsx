import React, { useState } from 'react';
import { Medication } from '../types';
import {
  Pill,
  Plus,
  HelpCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  Info,
  Calendar,
  Sparkles,
  Utensils,
  ShieldCheck,
  X,
} from 'lucide-react';

interface MedicationCabinetViewProps {
  medications: Medication[];
  onAddMedication: (med: Medication) => void;
  onAskAboutMedication: (medName: string, dosage: string) => void;
}

export const MedicationCabinetView: React.FC<MedicationCabinetViewProps> = ({
  medications,
  onAddMedication,
  onAskAboutMedication,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('Once daily in the morning');
  const [instructions, setInstructions] = useState<string>('');
  const [foodInteraction, setFoodInteraction] = useState<'with_food' | 'empty_stomach' | 'either'>(
    'with_food'
  );
  const [prescriber, setPrescriber] = useState<string>('Dr. Marcus Thompson');
  const [category, setCategory] = useState<Medication['category']>('Cardiovascular');

  const handleSubmitNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      instructions: instructions.trim() || 'Take as directed by your physician.',
      foodInteraction,
      prescriber: prescriber.trim() || 'Attending Physician',
      startDate: new Date().toISOString().split('T')[0],
      refillCount: 3,
      category,
      active: true,
    };

    onAddMedication(newMed);
    setShowAddModal(false);
    setName('');
    setDosage('');
    setInstructions('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Prescription Medication Cabinet
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track daily dosages, food instructions, refill counts, and ask the AI Clinical Assistant
            instant dosage or interaction questions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medication</span>
        </button>
      </div>

      {/* Clinical Pharmacotherapy Safety Banner */}
      <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-teal-900">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
          <div>
            <strong className="block text-teal-950 font-bold">
              AI Clinical Pharmacotherapy Assistant Active
            </strong>
            <p className="text-teal-800 mt-0.5">
              Have questions about missed doses, timing, or drug-to-drug interactions? Click "Ask
              AI Assistant" on any medication below.
            </p>
          </div>
        </div>
      </div>

      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((med) => (
          <div
            key={med.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{med.name}</h3>
                    <p className="text-xs text-slate-500">
                      {med.genericName || med.name} · {med.category}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-md tabular-nums">
                  {med.dosage}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    Schedule: <strong className="text-slate-800">{med.frequency}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    Food guidance:{' '}
                    <strong className="text-slate-800 capitalize">
                      {med.foodInteraction === 'with_food'
                        ? 'Take with meals'
                        : med.foodInteraction === 'empty_stomach'
                        ? 'Take on empty stomach'
                        : 'With or without food'}
                    </strong>
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">Instructions:</span>
                  <p>{med.instructions}</p>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-1 text-[11px]">
                  <span>Prescriber: {med.prescriber}</span>
                  <span className="tabular-nums">Refills remaining: {med.refillCount}</span>
                </div>
              </div>
            </div>

            {/* Quick action button: Ask AI Assistant */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Have dosage questions?</span>
              <button
                onClick={() => onAskAboutMedication(med.name, med.dosage)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Ask AI About This Med</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Guidance Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Missed Dose Best Practices</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Never take a double dose to make up for a missed tablet. If it is within 2-3 hours of
            the scheduled time, take it immediately; otherwise, wait for your next regular interval.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Utensils className="w-4 h-4 text-teal-600" />
            <span>Food & Absorption</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Medications like NSAIDs (Ibuprofen) and Metformin are best tolerated with food to
            protect your gastric lining. Thyroid hormones require an empty stomach with a full
            glass of water.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Adverse Reaction Notice</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            If you develop sudden hives, facial or lip swelling, or difficulty breathing after
            taking any medication, seek emergency medical care immediately (911).
          </p>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Prescribed Medication</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewMed} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Omeprazole"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 20 mg"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily 30 minutes before breakfast"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Food Instruction
                  </label>
                  <select
                    value={foodInteraction}
                    onChange={(e) => setFoodInteraction(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="with_food">Take with meals</option>
                    <option value="empty_stomach">Empty stomach (1 hr before / 2 hrs after)</option>
                    <option value="either">With or without food</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Metabolic">Metabolic / Endocrine</option>
                    <option value="Infection">Infection / Antibiotic</option>
                    <option value="Pain/Inflammation">Pain & Musculoskeletal</option>
                    <option value="Mental Health">Neurology & Mental Health</option>
                    <option value="Supplement">Vitamin & Supplement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Physician / Clinic
                </label>
                <input
                  type="text"
                  value={prescriber}
                  onChange={(e) => setPrescriber(e.target.value)}
                  placeholder="e.g. Dr. Marcus Thompson"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Specific Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions from your pharmacist..."
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
                >
                  Save to Cabinet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
