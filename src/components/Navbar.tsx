import React from 'react';
import { Stethoscope, Calendar, Clock, Pill, CalendarPlus } from 'lucide-react';

export type NavTab = 'assistant' | 'doctors' | 'appointments' | 'medications';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  appointmentCount: number;
  onQuickBook: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  appointmentCount,
  onQuickBook,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors whitespace-nowrap">
              BaqiusHealth <span className="text-teal-600 font-semibold">AI</span>
            </span>
          </button>

          {/* Zone 2: 4-5 single-line clean navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'assistant'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'doctors'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Find Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'appointments'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-600" />
              <span>My Appointments</span>
              {appointmentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-semibold tabular-nums text-teal-700 bg-teal-100/80 rounded-md">
                  {appointmentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('medications')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'medications'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Medications</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onQuickBook}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 active:bg-teal-900 transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Book Consultation</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap ${
              activeTab === 'assistant' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap ${
              activeTab === 'doctors' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
            }`}
          >
            Find Doctors
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap ${
              activeTab === 'appointments' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
            }`}
          >
            Appointments {appointmentCount > 0 ? `(${appointmentCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap ${
              activeTab === 'medications' ? 'bg-teal-50 text-teal-800' : 'text-slate-600'
            }`}
          >
            Medications
          </button>
        </div>
      </div>
    </header>
  );
};
