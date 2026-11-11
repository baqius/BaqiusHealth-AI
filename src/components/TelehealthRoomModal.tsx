import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  User,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';

interface TelehealthRoomModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const TelehealthRoomModal: React.FC<TelehealthRoomModalProps> = ({
  appointment,
  onClose,
}) => {
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [roomMinutes, setRoomMinutes] = useState<number>(0);
  const [roomSeconds, setRoomSeconds] = useState<number>(0);
  const [roomChatMessages, setRoomChatMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    {
      sender: appointment.doctorName,
      text: `Hello ${appointment.patientName}, welcome to our encrypted consultation room. I am reviewing your chart regarding: "${appointment.reasonForVisit}".`,
      time: 'Just now',
    },
  ]);
  const [roomInput, setRoomInput] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setRoomSeconds((prev) => {
        if (prev >= 59) {
          setRoomMinutes((m) => m + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    setRoomChatMessages((prev) => [
      ...prev,
      {
        sender: appointment.patientName,
        text: roomInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setRoomInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Top Telehealth Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <h3 className="text-sm font-bold text-white">{appointment.doctorName}</h3>
              <p className="text-xs text-slate-400">
                {appointment.doctorSpecialty} · Telehealth Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Encrypted Call</span>
            </div>
            <div className="font-mono text-emerald-400 tabular-nums bg-slate-800 px-2.5 py-1 rounded-md">
              {String(roomMinutes).padStart(2, '0')}:{String(roomSeconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden bg-slate-950">
          {/* Main Doctor Screen */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="relative w-full h-full max-h-[500px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {appointment.doctorAvatar ? (
                <img
                  src={appointment.doctorAvatar}
                  alt={appointment.doctorName}
                  className="w-full h-full object-cover object-top opacity-90"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-6">
                  <User className="w-16 h-16 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">{appointment.doctorName}</p>
                </div>
              )}

              {/* Doctor Name overlay */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2">
                <span>{appointment.doctorName}</span>
                <span className="text-emerald-400 font-normal">· Speaking</span>
              </div>

              {/* Patient PiP (Picture in Picture) */}
              <div className="absolute top-4 right-4 w-32 sm:w-44 h-24 sm:h-32 rounded-lg bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-lg flex items-center justify-center">
                {cameraEnabled ? (
                  <div className="w-full h-full bg-slate-700/80 flex flex-col items-center justify-center text-slate-300 text-xs p-2 text-center">
                    <User className="w-7 h-7 text-slate-400 mb-1" />
                    <span className="truncate">{appointment.patientName}</span>
                    <span className="text-[10px] text-emerald-400">Camera Active</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <VideoOff className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consultation Notes / Chat Drawer */}
          {chatOpen && (
            <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-64 lg:h-auto">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  Consultation Messages
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {roomChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg ${
                      msg.sender === appointment.patientName
                        ? 'bg-teal-700 text-white ml-4'
                        : 'bg-slate-800 text-slate-200 mr-4 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
                      <span className="font-semibold">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendRoomChat} className="p-2 border-t border-slate-800 flex gap-1">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Type a message to the doctor..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Video Control Bar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`p-3 rounded-full transition-colors ${
              micEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className={`p-3 rounded-full transition-colors ${
              cameraEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          >
            {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-3 rounded-full transition-colors ${
              chatOpen
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title="Toggle Consultation Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-md ml-4"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
