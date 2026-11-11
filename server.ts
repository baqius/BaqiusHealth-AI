import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'undefined') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Circuit breaker to gracefully handle rate limit / quota exhaustion (HTTP 429)
let geminiQuotaExceededUntil = 0;
function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const str = typeof err === 'string' ? err : JSON.stringify(err?.message || err?.error || err || '');
  return str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('Quota exceeded') || str.includes('rate-limit');
}

// Available doctors reference for the AI model
const DOCTORS_CATALOG = [
  { id: 'doc-maya-lin', name: 'Dr. Maya Lin, MD, FACC', specialty: 'Cardiology', specialtyCode: 'cardiology', keywords: ['chest pain', 'heart', 'palpitations', 'blood pressure', 'hypertension', 'shortness of breath', 'cholesterol', 'arrhythmia'] },
  { id: 'doc-marcus-thompson', name: 'Dr. Marcus Thompson, MD', specialty: 'General Practice', specialtyCode: 'general_practice', keywords: ['fatigue', 'fever', 'cough', 'cold', 'flu', 'stomach', 'abdominal', 'nausea', 'checkup', 'wellness', 'general', 'infection'] },
  { id: 'doc-eliza-reed', name: 'Dr. Eliza Reed, MD, FAAD', specialty: 'Dermatology', specialtyCode: 'dermatology', keywords: ['rash', 'skin', 'mole', 'acne', 'itching', 'eczema', 'lesion', 'hives', 'psoriasis', 'burn'] },
  { id: 'doc-alexander-chen', name: 'Dr. Alexander Chen, MD', specialty: 'Orthopedics', specialtyCode: 'orthopedics', keywords: ['joint', 'knee', 'back pain', 'spine', 'shoulder', 'bone', 'fracture', 'sprain', 'ankle', 'sports injury', 'swelling'] },
  { id: 'doc-sophia-vargas', name: 'Dr. Sophia Vargas, MD, PhD', specialty: 'Neurology', specialtyCode: 'neurology', keywords: ['headache', 'migraine', 'dizziness', 'vertigo', 'numbness', 'tingling', 'weakness', 'memory', 'tremor'] },
  { id: 'doc-rachel-kramer', name: 'Dr. Rachel Kramer, MD', specialty: 'Endocrinology', specialtyCode: 'endocrinology', keywords: ['diabetes', 'sugar', 'glucose', 'thyroid', 'hormone', 'weight loss', 'weight gain', 'adrenal', 'metabolism'] },
];

const CLINICAL_SYSTEM_INSTRUCTION = `You are BaqiusHealth AI, a direct, high-precision clinical and healthcare assistant.

PRIMARY DIRECTIVE:
You must ALWAYS do EXACTLY what the user asks you to do while maintaining conversational context and lifecycle awareness:
1. Context & History Awareness:
   - Check the recent conversation history to maintain context: resolve pronouns ("that", "it", "this condition", "my appointment", "take it") to whatever condition, medication, or doctor was discussed earlier in the conversation.
2. Ending a Conversation:
   - If the user indicates that the conversation is concluding (e.g. 'thank you', 'thanks', 'that is all', 'that's all', 'bye', 'goodbye', 'have a great day', 'all good', 'all set', 'done'):
     Acknowledge the conclusion warmly, professionally, and concisely (e.g. "You're very welcome! Stay well and take care. Feel free to start a new chat anytime if you have more questions."). End your message with a newline and "CONVERSATION: {"status": "ended"}".
3. Beginning a New Conversation:
   - If the user indicates they want to begin a new conversation, change topics, or reset (e.g. 'new question', 'new topic', 'different question', 'start over', 'let's talk about something else', or if the previous conversation was ended):
     Treat this as a fresh consultation, discard the previous topic/context, and answer the new inquiry directly. If they simply asked to start over, greet them and invite their new question. End your message with a newline and "CONVERSATION: {"status": "started"}".
4. Appointments Booking:
   - If the user asks to book an appointment (e.g. 'I want to book an appointment', 'Can I book an appointment with Dr. Maya Lin?', 'I want an appointment for cardiology'):
     a. If they have NOT specified a specific time slot:
        List the available time slots for the relevant doctor and date (e.g. 09:15 AM, 10:00 AM, 11:30 AM, 02:15 PM, 03:45 PM), and ask which one they want to go for. End your response with a newline and "SLOTS:" followed by valid JSON: {"doctorId":"doc-id", "doctorName":"Doctor Name", "doctorSpecialty":"Specialty", "date":"YYYY-MM-DD", "slots":["09:15 AM", "10:00 AM", "11:30 AM", "02:15 PM", "03:45 PM"], "visitType":"telehealth", "reason":"Consultation"}.
     b. If they have chosen or specified a time slot (e.g. '10:00 AM', 'I'll go for 10:00 AM', or 'Book an appointment with Dr. Lin tomorrow at 10:00 AM'):
        Directly confirm the appointment with the doctor name, specialty, date, and chosen time slot. End your message with a newline and "BOOKING:" followed by valid JSON: {"doctorId":"doc-id", "doctorName":"Doctor Name", "doctorSpecialty":"Specialty", "date":"YYYY-MM-DD", "timeSlot":"10:00 AM", "type":"telehealth", "reason":"Consultation"}.
5. Clinical Questions:
   - Symptoms: list characteristic clinical symptoms only (no cures or unprompted appointments).
   - Medications: name specific first-line medications with standard adult dosages and dosing intervals directly.
   - Causes: explain the medical and physiological causes directly.
   - Missed doses, interactions, or side effects: provide the exact clinical instructions.

STRICT CONSTRAINTS:
1. Go directly to the answer with zero unnecessary filler.
2. Never repeat, quote, or summarize the user's question.
3. Never suggest booking an appointment unless the user explicitly requested to book or schedule one.
4. Do not include arbitrary section headings or category labels like "Clinical Considerations", "Immediate Measures", "Urgency", "Recommendations", or "Next Steps".
5. Keep answers concise, factual, and medically accurate in 2-4 sentences or clean bullet points when a list is requested.`;

// Helper: timeout wrapper with 4000ms window for snappy fast replies
function timeoutPromise<T>(promise: Promise<T>, ms: number = 4000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Endpoint: Streaming Chat (SSE) for ultra-fast, real-time typing response
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const { messages, currentMedications } = req.body;
  const lastMessage = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1] : null;
  const userPrompt = lastMessage?.content || '';

  // Generate fallback data ready in <1ms
  const fallback = generateClinicalFallback(userPrompt, currentMedications, messages);

  if (ai && Date.now() > geminiQuotaExceededUntil) {
    try {
      const medsContext = Array.isArray(currentMedications) && currentMedications.length > 0
        ? `Patient active medications: ${currentMedications.map((m: any) => `${m.name} (${m.dosage})`).join('; ')}`
        : '';
      const promptHistory = Array.isArray(messages) && messages.length > 1
        ? `Recent conversation context:\n${messages.slice(-5, -1).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`
        : '';

      const promptParts = [
        medsContext,
        promptHistory,
        `Current user prompt: "${userPrompt}"`,
        `Instruction: Answer the user's prompt directly and accurately. Do exactly what was asked.`,
      ].filter(Boolean);

      const prompt = promptParts.join('\n\n');

      const streamResponse = await timeoutPromise(
        ai.models.generateContentStream({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
          },
        }),
        4000
      );

      let hasWrittenChunk = false;
      let accumulated = '';
      let isConvEnded = fallback.isConversationEnded;
      let isConvStarted = fallback.isNewConversationStart;

      for await (const chunk of streamResponse) {
        if (res.writableEnded) break;
        const text = chunk.text || '';
        if (text) {
          accumulated += text;

          // Check if streaming text includes structured commands
          if (accumulated.includes('CONVERSATION:')) {
            const [displayText, jsonPart] = accumulated.split('CONVERSATION:');
            res.write(`data: ${JSON.stringify({ chunk: text.replace(/CONVERSATION:[\s\S]*/, '') })}\n\n`);
            try {
              const convData = JSON.parse(jsonPart.trim());
              if (convData.status === 'ended') isConvEnded = true;
              if (convData.status === 'started') isConvStarted = true;
            } catch {
              // Wait for full JSON
            }
          } else if (accumulated.includes('BOOKING:')) {
            const [displayText, jsonPart] = accumulated.split('BOOKING:');
            res.write(`data: ${JSON.stringify({ chunk: text.replace(/BOOKING:[\s\S]*/, '') })}\n\n`);
            try {
              const bookingData = JSON.parse(jsonPart.trim());
              res.write(
                `data: ${JSON.stringify({
                  done: true,
                  booking: bookingData,
                  isConversationEnded: isConvEnded,
                  isNewConversationStart: isConvStarted,
                })}\n\n`
              );
              res.end();
              return;
            } catch {
              // Wait for full JSON
            }
          } else if (accumulated.includes('SLOTS:')) {
            const [displayText, jsonPart] = accumulated.split('SLOTS:');
            res.write(`data: ${JSON.stringify({ chunk: text.replace(/SLOTS:[\s\S]*/, '') })}\n\n`);
            try {
              const slotsData = JSON.parse(jsonPart.trim());
              res.write(
                `data: ${JSON.stringify({
                  done: true,
                  availableSlots: slotsData,
                  isConversationEnded: isConvEnded,
                  isNewConversationStart: isConvStarted,
                })}\n\n`
              );
              res.end();
              return;
            } catch {
              // Wait for full JSON
            }
          } else {
            hasWrittenChunk = true;
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }
      }

      if (hasWrittenChunk && !res.writableEnded) {
        let bookingData = fallback.booking;
        let availableSlotsData = fallback.availableSlots;
        if (accumulated.includes('CONVERSATION:')) {
          try {
            const convData = JSON.parse(accumulated.split('CONVERSATION:')[1].trim());
            if (convData.status === 'ended') isConvEnded = true;
            if (convData.status === 'started') isConvStarted = true;
          } catch {}
        }
        if (accumulated.includes('BOOKING:')) {
          try {
            bookingData = JSON.parse(accumulated.split('BOOKING:')[1].trim());
          } catch {}
        } else if (accumulated.includes('SLOTS:')) {
          try {
            availableSlotsData = JSON.parse(accumulated.split('SLOTS:')[1].trim());
          } catch {}
        }
        res.write(
          `data: ${JSON.stringify({
            done: true,
            booking: bookingData,
            availableSlots: availableSlotsData,
            isConversationEnded: isConvEnded || fallback.isConversationEnded,
            isNewConversationStart: isConvStarted || fallback.isNewConversationStart,
          })}\n\n`
        );
        res.end();
        return;
      }
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        geminiQuotaExceededUntil = Date.now() + 65 * 60 * 1000;
      }
    }
  }

  // Fast-path token streaming from high-speed clinical engine if Gemini was not available or stream had no chunks
  if (!res.writableEnded) {
    const fullText = fallback.content;
    const words = fullText.split(' ');
    const chunkSize = 3;

    for (let i = 0; i < words.length; i += chunkSize) {
      if (res.writableEnded) break;
      const chunkWords = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
      res.write(`data: ${JSON.stringify({ chunk: chunkWords })}\n\n`);
      await new Promise((r) => setTimeout(r, 16));
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          done: true,
          booking: fallback.booking,
          availableSlots: fallback.availableSlots,
          isConversationEnded: fallback.isConversationEnded,
          isNewConversationStart: fallback.isNewConversationStart,
        })}\n\n`
      );
      res.end();
    }
  }
});

// Endpoint: AI Chat (non-streaming, optimized with ThinkingLevel.LOW)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, currentMedications } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content || '';

    const fallbackResponse = generateClinicalFallback(userPrompt, currentMedications, messages);

    if (ai && Date.now() > geminiQuotaExceededUntil) {
      try {
        const medsSummary = Array.isArray(currentMedications) && currentMedications.length > 0
          ? `Patient active medications: ${currentMedications.map((m: any) => `${m.name} (${m.dosage})`).join('; ')}`
          : '';
        const promptHistory = Array.isArray(messages) && messages.length > 1
          ? `Recent conversation context:\n${messages.slice(-5, -1).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}`
          : '';

        const prompt = [
          medsSummary,
          promptHistory,
          `Current user prompt: "${userPrompt}"`,
          `Instruction: Answer the user's prompt directly and accurately. Do exactly what was asked.`,
        ].filter(Boolean).join('\n\n');

        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                content: {
                  type: Type.STRING,
                  description: 'Direct answer that answers the exact question asked without repeating it or suggesting appointments unless asked to book.',
                },
              },
              required: ['content'],
            },
          },
        });

        const response = await timeoutPromise(geminiCall, 4000);
        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          let booking = fallbackResponse.booking;
          let availableSlots = fallbackResponse.availableSlots;
          let isConversationEnded = fallbackResponse.isConversationEnded;
          let isNewConversationStart = fallbackResponse.isNewConversationStart;

          if (parsed.content?.includes('CONVERSATION:')) {
            try {
              const convData = JSON.parse(parsed.content.split('CONVERSATION:')[1].trim());
              if (convData.status === 'ended') isConversationEnded = true;
              if (convData.status === 'started') isNewConversationStart = true;
              parsed.content = parsed.content.split('CONVERSATION:')[0].trim();
            } catch {}
          }
          if (parsed.content?.includes('BOOKING:')) {
            try {
              booking = JSON.parse(parsed.content.split('BOOKING:')[1].trim());
              parsed.content = parsed.content.split('BOOKING:')[0].trim();
            } catch {}
          } else if (parsed.content?.includes('SLOTS:')) {
            try {
              availableSlots = JSON.parse(parsed.content.split('SLOTS:')[1].trim());
              parsed.content = parsed.content.split('SLOTS:')[0].trim();
            } catch {}
          }
          res.json({
            content: parsed.content || fallbackResponse.content,
            booking,
            availableSlots,
            isConversationEnded,
            isNewConversationStart,
          });
          return;
        }
      } catch (geminiError: any) {
        if (isQuotaExceededError(geminiError)) {
          geminiQuotaExceededUntil = Date.now() + 65 * 60 * 1000;
        }
      }
    }

    res.json(fallbackResponse);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: 'An error occurred while evaluating health queries.',
      details: error.message,
    });
  }
});

// Comprehensive, intelligent clinical engine that answers exactly what was requested
function generateClinicalFallback(
  prompt: string,
  userMeds: any[] = [],
  messages: any[] = []
): {
  content: string;
  booking?: any;
  availableSlots?: any;
  isConversationEnded?: boolean;
  isNewConversationStart?: boolean;
} {
  const result = evaluateClinicalQuery(prompt, userMeds, messages);
  const lastAssistantMsg = messages.filter((m) => m.role === 'assistant').pop();
  const wasPrevEnded = Boolean(lastAssistantMsg?.isConversationEnded);
  const isExplicitNew =
    /^(new\s+(question|topic|conversation)|start\s+over|different\s+question|reset|clear\s+chat|begin\s+new)[.!]?$/i.test(prompt.trim()) ||
    /\b(let'?s\s+start\s+(over|a\s+new)|ask\s+(a\s+)?new\s+question|change\s+the\s+topic|start\s+a\s+new\s+conversation)\b/i.test(prompt.toLowerCase());

  if (!result.isConversationEnded && (wasPrevEnded || isExplicitNew)) {
    result.isNewConversationStart = true;
  }
  return result;
}

function evaluateClinicalQuery(
  prompt: string,
  userMeds: any[] = [],
  messages: any[] = []
): {
  content: string;
  booking?: any;
  availableSlots?: any;
  isConversationEnded?: boolean;
  isNewConversationStart?: boolean;
} {
  const trimmed = prompt.trim();
  let lower = trimmed.toLowerCase();

  // 1. Check if user is concluding / ending the conversation
  const isEnding =
    /^(thank(s|\s+you)?|that'?s\s+all|that\s+is\s+all|bye|goodbye|all\s+set|all\s+good|no\s+more\s+questions|i('?m|\s+am)\s+done|nothing\s+else|have\s+a\s+good\s+(day|night)|cya|see\s+ya|exit|quit|ok\s+thanks|okay\s+thanks)[.!]?$/i.test(trimmed) ||
    /\b(thank\s+you(\s+so\s+much)?|thanks\s+a\s+lot|thanks\s+for\s+(your\s+)?help|that('?s|\s+is)\s+all\s+(for\s+now|i\s+need)|no\s+other\s+questions|that\s+answers\s+my\s+question|no\s+more\s+questions|i\s+am\s+good\s+now|i'm\s+good\s+now)\b/i.test(lower);

  if (isEnding) {
    return {
      content: "You're very welcome! Stay well and take care. Feel free to start a new chat anytime whenever you have more health questions.",
      isConversationEnded: true,
    };
  }

  // 2. Check if user is starting a new conversation
  const lastAssistantMsg = messages.filter((m) => m.role === 'assistant').pop();
  const wasPrevEnded = Boolean(lastAssistantMsg?.isConversationEnded);

  const isExplicitNew =
    /^(new\s+(question|topic|conversation)|start\s+over|different\s+question|reset|clear\s+chat|begin\s+new)[.!]?$/i.test(trimmed) ||
    /\b(let'?s\s+start\s+(over|a\s+new)|ask\s+(a\s+)?new\s+question|change\s+the\s+topic|start\s+a\s+new\s+conversation)\b/i.test(lower);

  if (
    isExplicitNew &&
    !lower.includes('symptom') &&
    !lower.includes('medication') &&
    !lower.includes('medicine') &&
    !lower.includes('cause') &&
    !lower.includes('appointment') &&
    !lower.includes('book')
  ) {
    return {
      content: "Certainly! I've started a new consultation session for you. What symptoms, medications, or health questions would you like to discuss?",
      isNewConversationStart: true,
    };
  }

  const isFreshSession = isExplicitNew || wasPrevEnded;

  // 3. Multi-turn context resolution: if NOT a fresh new session, extract recent context
  let priorCondition = '';
  let priorMedication = '';
  let priorDoctor = '';

  if (!isFreshSession && messages.length > 1) {
    // Scan backward through previous turns to find active clinical entities
    // First check user messages to capture the explicit condition the user inquired about
    const userMessages = messages.filter((m) => m.role === 'user');
    for (let i = userMessages.length - 2; i >= 0; i--) {
      const text = (userMessages[i].content || '').toLowerCase();
      if (!priorCondition) {
        if (text.includes('migraine') || text.includes('headache')) priorCondition = 'migraine headache';
        else if (text.includes('blood pressure') || text.includes('hypertension') || text.includes('high bp')) priorCondition = 'hypertension blood pressure';
        else if (text.includes('reflux') || text.includes('gerd') || text.includes('heartburn')) priorCondition = 'acid reflux gerd';
        else if (text.includes('knee') || text.includes('joint') || text.includes('sprain') || text.includes('back') || text.includes('shoulder')) priorCondition = 'knee joint sprain';
        else if (text.includes('rash') || text.includes('skin') || text.includes('eczema') || text.includes('itch') || text.includes('hive')) priorCondition = 'skin rash eczema';
        else if (text.includes('diabetes') || text.includes('glucose') || text.includes('sugar')) priorCondition = 'diabetes blood sugar';
        else if (text.includes('dehydration') || text.includes('thirsty')) priorCondition = 'dehydration';
        else if (text.includes('asthma') || text.includes('wheez')) priorCondition = 'asthma';
        else if (text.includes('fever') || text.includes('flu') || text.includes('cold') || text.includes('cough')) priorCondition = 'fever flu cold';
        else if (text.includes('sore throat') || text.includes('throat')) priorCondition = 'sore throat';
        else if (text.includes('cholesterol')) priorCondition = 'cholesterol';
      }
    }

    // Next scan recent turns backwards for medication, doctor, or condition if not yet found
    for (let i = messages.length - 2; i >= 0; i--) {
      const text = (messages[i].content || '').toLowerCase();
      // Stop scanning if we hit an earlier ended session marker
      if (messages[i].isConversationEnded) break;

      if (!priorCondition) {
        if (text.includes('migraine') || text.includes('headache')) priorCondition = 'migraine headache';
        else if (text.includes('blood pressure') || text.includes('hypertension') || text.includes('high bp')) priorCondition = 'hypertension blood pressure';
        else if (text.includes('reflux') || text.includes('gerd') || text.includes('heartburn')) priorCondition = 'acid reflux gerd';
        else if (text.includes('knee') || text.includes('joint') || text.includes('sprain') || text.includes('back') || text.includes('shoulder')) priorCondition = 'knee joint sprain';
        else if (text.includes('rash') || text.includes('skin') || text.includes('eczema') || text.includes('itch') || text.includes('hive')) priorCondition = 'skin rash eczema';
        else if (text.includes('diabetes') || text.includes('glucose') || text.includes('sugar')) priorCondition = 'diabetes blood sugar';
        else if (text.includes('dehydration') || text.includes('thirsty')) priorCondition = 'dehydration';
        else if (text.includes('asthma') || text.includes('wheez')) priorCondition = 'asthma';
        else if (text.includes('fever') || text.includes('flu') || text.includes('cold') || text.includes('cough')) priorCondition = 'fever flu cold';
        else if (text.includes('sore throat') || text.includes('throat')) priorCondition = 'sore throat';
        else if (text.includes('cholesterol')) priorCondition = 'cholesterol';
      }

      if (!priorMedication) {
        if (text.includes('sumatriptan')) priorMedication = 'sumatriptan';
        else if (text.includes('lisinopril')) priorMedication = 'lisinopril';
        else if (text.includes('amoxicillin')) priorMedication = 'amoxicillin';
        else if (text.includes('metformin')) priorMedication = 'metformin';
        else if (text.includes('ibuprofen')) priorMedication = 'ibuprofen';
        else if (text.includes('acetaminophen') || text.includes('tylenol')) priorMedication = 'acetaminophen';
        else if (text.includes('omeprazole')) priorMedication = 'omeprazole';
        else if (text.includes('hydrocortisone')) priorMedication = 'hydrocortisone';
        else if (text.includes('albuterol')) priorMedication = 'albuterol';
      }

      if (!priorDoctor) {
        if (text.includes('maya') || text.includes('lin')) priorDoctor = 'maya lin';
        else if (text.includes('alexander') || text.includes('chen')) priorDoctor = 'alexander chen';
        else if (text.includes('eliza') || text.includes('reed')) priorDoctor = 'eliza reed';
        else if (text.includes('marcus') || text.includes('thompson')) priorDoctor = 'marcus thompson';
        else if (text.includes('sophia') || text.includes('vargas')) priorDoctor = 'sophia vargas';
        else if (text.includes('rachel') || text.includes('kramer')) priorDoctor = 'rachel kramer';
      }
    }

    // Resolve anaphoric references: "that", "it", "take it", "for that", "causes", "dosage", "side effects"
    const hasAnaphora =
      lower.includes('that') ||
      lower.includes(' it') ||
      lower.startsWith('it ') ||
      lower.includes('this') ||
      lower.includes('for it') ||
      lower.includes('for that') ||
      lower.includes('with her') ||
      lower.includes('with him') ||
      lower.includes('the medication') ||
      lower.includes('the medicine') ||
      lower.includes('the condition') ||
      lower.includes('how often') ||
      lower.includes('how do i take') ||
      lower.includes('how to take') ||
      lower.includes('missed dose') ||
      lower.includes('side effect') ||
      lower.includes('what causes') ||
      lower.includes('what are the symptoms') ||
      lower.includes('book an appointment for');

    if (hasAnaphora) {
      if (priorCondition) lower += ` ${priorCondition}`;
      if (priorMedication) lower += ` ${priorMedication}`;
      if (priorDoctor) lower += ` ${priorDoctor}`;
    }
  }

  // Dynamic date references
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
  const dayAfterObj = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const dayAfterStr = dayAfterObj.toISOString().split('T')[0];

  // Check if user is replying to a previous slot offer
  const wasOfferedSlots = lastAssistantMsg && (
    lastAssistantMsg.availableBookingSlots ||
    lastAssistantMsg.content?.includes('Available times with') ||
    lastAssistantMsg.content?.includes('Which time slot') ||
    lastAssistantMsg.content?.includes('Which one would you like to go for')
  );

  const explicitTimeMatch = lower.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i) || lower.match(/\b(\d{1,2}:\d{2})\b/);
  const isTimeSelection = Boolean(explicitTimeMatch) || lower.includes('morning') || lower.includes('afternoon') || lower.includes('evening') || lower.includes('first') || lower.includes('second');
  const isReplyingToSlotOffer = Boolean(wasOfferedSlots && isTimeSelection);

  // Intent classification
  const wantsBooking = isReplyingToSlotOffer || lower.includes('book') || lower.includes('schedule') || (lower.includes('appointment') && (lower.includes('make') || lower.includes('want') || lower.includes('need') || lower.includes('set up') || lower.includes('visit') || lower.includes('reserve')));
  const wantsCancelOrReschedule = lower.includes('cancel') || lower.includes('reschedule') || lower.includes('change appointment');
  const wantsMissedDose = lower.includes('missed') || lower.includes('forgot') || lower.includes('skip') || lower.includes('late dose');
  const wantsInteraction = lower.includes('interaction') || (lower.includes('with') && (lower.includes('take') || lower.includes('can i'))) || lower.includes('together') || lower.includes('combine');
  const wantsSideEffects = lower.includes('side effect') || lower.includes('adverse') || lower.includes('reaction');
  const wantsCauses = lower.includes('cause') || lower.includes('why do') || lower.includes('why does') || lower.includes('reason for') || lower.includes('how come');
  const wantsWhatIs = lower.includes('what is') || lower.includes('what are') || lower.includes('how does') || lower.includes('meaning of') || lower.includes('define');
  const wantsDietOrLifestyle = lower.includes('diet') || lower.includes('eat') || lower.includes('food') || lower.includes('naturally') || lower.includes('lifestyle') || lower.includes('exercise') || lower.includes('prevent');
  const wantsDosingOrUsage = lower.includes('how do i take') || lower.includes('how to take') || lower.includes('how often') || lower.includes('when should i take') || lower.includes('what time') || lower.includes('frequency') || lower.includes('with food') || lower.includes('empty stomach') || lower.includes('how much should i take') || lower.includes('instructions for taking') || lower.includes('dosing instructions');
  const wantsMedication = wantsDosingOrUsage || lower.includes('medication') || lower.includes('medicine') || lower.includes('drug') || lower.includes('pill') || lower.includes('tablet') || lower.includes('painkiller') || lower.includes('antibiotic') || lower.includes('antihistamine') || lower.includes('otc') || lower.includes('cream') || lower.includes('what to take') || lower.includes('what should i take') || lower.includes('prescribe') || lower.includes('prescription') || lower.includes('dosage') || lower.includes('dose');
  const wantsSymptoms = lower.includes('symptom') || lower.includes('sign') || lower.includes('feel like') || lower.includes('how do i know') || lower.includes('manifest') || lower.includes('indication');

    // 1. Appointment Booking Execution
    if (wantsBooking) {
      let docId = 'doc-marcus-thompson';
      let docName = 'Dr. Marcus Thompson, MD';
      let specialty = 'General Practice';
      let avatar = '/src/assets/images/doctor_general_avatar_1793801626208.jpg';
      let clinicAddress = 'Downtown Ambulatory Clinic, Floor 2, 742 Pine Grove Blvd';
      let dateStr = tomorrowStr;
      let visitType: 'telehealth' | 'in-clinic' = 'telehealth';

      // If user is choosing a time from previous offered slots
      if (isReplyingToSlotOffer && lastAssistantMsg?.availableBookingSlots) {
        const prev = lastAssistantMsg.availableBookingSlots;
        docId = prev.doctorId;
        docName = prev.doctorName;
        specialty = prev.doctorSpecialty;
        avatar = prev.doctorAvatar || '';
        clinicAddress = prev.clinicAddress || '';
        dateStr = prev.date;
        visitType = prev.visitType;
      } else {
        if (lower.includes('maya') || lower.includes('lin') || lower.includes('cardio') || lower.includes('heart') || lower.includes('blood pressure') || lower.includes('palpitation')) {
          docId = 'doc-maya-lin';
          docName = 'Dr. Maya Lin, MD, FACC';
          specialty = 'Cardiology';
          avatar = '/src/assets/images/doctor_cardiology_avatar_1793801625327.jpg';
          clinicAddress = "St. Mary's Heart & Vascular Pavilion, Suite 402, Metro Medical Center";
        } else if (lower.includes('eliza') || lower.includes('reed') || lower.includes('derma') || lower.includes('skin') || lower.includes('rash') || lower.includes('acne') || lower.includes('eczema')) {
          docId = 'doc-eliza-reed';
          docName = 'Dr. Eliza Reed, MD, FAAD';
          specialty = 'Dermatology';
          avatar = '/src/assets/images/doctor_dermatology_avatar_1793801627310.jpg';
          clinicAddress = 'Aura Dermatology & Laser Center, Suite 310, Medical Plaza';
        } else if (lower.includes('alexander') || lower.includes('chen') || lower.includes('ortho') || lower.includes('knee') || lower.includes('joint') || lower.includes('back') || lower.includes('shoulder') || lower.includes('sprain') || lower.includes('bone')) {
          docId = 'doc-alexander-chen';
          docName = 'Dr. Alexander Chen, MD';
          specialty = 'Orthopedics';
          avatar = '/src/assets/images/doctor_orthopedics_avatar_1793801626657.jpg';
          clinicAddress = 'Orthopedic & Joint Restoration Institute, 120 Olympic Way';
        } else if (lower.includes('sophia') || lower.includes('vargas') || lower.includes('neuro') || lower.includes('headache') || lower.includes('migraine') || lower.includes('dizz') || lower.includes('vertigo')) {
          docId = 'doc-sophia-vargas';
          docName = 'Dr. Sophia Vargas, MD, PhD';
          specialty = 'Neurology';
          avatar = '';
          clinicAddress = 'Neuroscience Center of Excellence, Wing B, 880 Health Science Pkwy';
        } else if (lower.includes('rachel') || lower.includes('kramer') || lower.includes('endo') || lower.includes('diabetes') || lower.includes('sugar') || lower.includes('thyroid') || lower.includes('hormone')) {
          docId = 'doc-rachel-kramer';
          docName = 'Dr. Rachel Kramer, MD';
          specialty = 'Endocrinology';
          avatar = '';
          clinicAddress = 'Endocrine & Metabolic Health Clinic, 450 University Ave';
        }

        const explicitDate = lower.match(/\b(202\d-\d{2}-\d{2})\b/);
        if (explicitDate) {
          dateStr = explicitDate[1];
        } else if (lower.includes('today')) {
          dateStr = todayStr;
        } else if (lower.includes('day after')) {
          dateStr = dayAfterStr;
        } else if (lower.includes('tomorrow')) {
          dateStr = tomorrowStr;
        }

        visitType = lower.includes('in-clinic') || lower.includes('in person') || lower.includes('clinic') ? 'in-clinic' : 'telehealth';
      }

      // If user already specified an explicit time or is selecting a time slot:
      if (explicitTimeMatch || isReplyingToSlotOffer) {
        let chosenTime = '10:00 AM';
        if (explicitTimeMatch) {
          chosenTime = explicitTimeMatch[1].toUpperCase();
          if (!chosenTime.includes(':')) {
            chosenTime = chosenTime.replace(/(\d+)\s*(AM|PM)/i, '$1:00 $2');
          }
        } else if (lower.includes('afternoon') || lower.includes('2 pm')) {
          chosenTime = '02:15 PM';
        } else if (lower.includes('morning') || lower.includes('9 am')) {
          chosenTime = '09:15 AM';
        } else if (lower.includes('evening') || lower.includes('5 pm')) {
          chosenTime = '05:30 PM';
        }

        return {
          content: `Your appointment with ${docName} (${specialty}) has been confirmed for ${dateStr} at ${chosenTime} via ${visitType === 'telehealth' ? 'Telehealth' : 'In-Clinic visit'}. The appointment has been saved to your account.`,
          booking: {
            doctorId: docId,
            doctorName: docName,
            doctorSpecialty: specialty,
            doctorAvatar: avatar,
            clinicAddress,
            date: dateStr,
            timeSlot: chosenTime,
            type: visitType,
            reason: `${specialty} Consultation`,
          },
        };
      }

      // User wants to book an appointment, but has NOT chosen a time yet:
      // Give them available times and ask which one they want to go for!
      const candidateSlots = ['09:15 AM', '10:00 AM', '11:30 AM', '02:15 PM', '03:45 PM'];
      const formattedDate = dateStr === tomorrowStr ? `tomorrow (${dateStr})` : dateStr;

      return {
        content: `Available times with ${docName} (${specialty}) for ${formattedDate}:\n• 09:15 AM\n• 10:00 AM\n• 11:30 AM\n• 02:15 PM\n• 03:45 PM\n\nWhich one would you like to go for?`,
        availableSlots: {
          doctorId: docId,
          doctorName: docName,
          doctorSpecialty: specialty,
          doctorAvatar: avatar,
          clinicAddress,
          date: dateStr,
          slots: candidateSlots,
          visitType,
          reason: `${specialty} Consultation`,
        },
      };
    }

  // 2. Reschedule or Cancel request
  if (wantsCancelOrReschedule) {
    return {
      content: 'You can reschedule or cancel any confirmed booking at any time under the My Appointments tab using the Reschedule or Cancel buttons, or click Reschedule on the confirmation card in this chat.',
    };
  }

  // 3. Emergency detection
  const emergencyKeywords = ['crushing chest pain', 'cant breathe', 'cannot breathe', 'shortness of breath at rest', 'facial droop', 'slurred speech', 'arm numbness left side', 'anaphylaxis', 'coughing blood'];
  if (emergencyKeywords.some(kw => lower.includes(kw))) {
    if (wantsSymptoms) {
      return {
        content: 'Critical cardiac and ischemic symptoms include severe retrosternal chest tightness, pain radiating down the left arm or into the jaw, acute shortness of breath (dyspnea), cold diaphoresis, lightheadedness, and unilateral facial or limb weakness.',
      };
    }
    return {
      content: 'Call 911 or emergency medical services immediately. Sit down, do not exert yourself or attempt to drive, unlock your front door for emergency personnel, and if suspected cardiac chest pain without aspirin allergy, chew one non-coated adult aspirin (325mg) while waiting.',
    };
  }

  // 4. Drug Interactions
  if (wantsInteraction) {
    if (lower.includes('ibuprofen') && lower.includes('lisinopril')) {
      return {
        content: 'Taking Ibuprofen while on Lisinopril is generally not recommended. NSAIDs like Ibuprofen reduce the blood-pressure-lowering efficacy of ACE inhibitors and increase the risk of acute kidney impairment and elevated potassium levels. Acetaminophen is the safer first-line alternative for pain while taking Lisinopril.',
      };
    }
    if (lower.includes('aspirin') && lower.includes('ibuprofen')) {
      return {
        content: 'Ibuprofen can block the cardioprotective antiplatelet effects of low-dose Aspirin. If both are necessary, take immediate-release Aspirin at least 30 minutes before or 8 hours after taking Ibuprofen.',
      };
    }
    if (lower.includes('alcohol') && lower.includes('metformin')) {
      return {
        content: 'Avoid heavy or binge alcohol intake while on Metformin. Alcohol significantly increases the risk of lactic acidosis, a rare but life-threatening metabolic complication, and enhances the likelihood of severe hypoglycemia.',
      };
    }
    return {
      content: 'Always consult your pharmacist or prescribing clinician before combining over-the-counter medications with active prescriptions to prevent altered drug metabolism, reduced therapeutic efficacy, or additive toxicities.',
    };
  }

  // 5. Missed Dose Protocol
  if (wantsMissedDose) {
    if (lower.includes('amoxicillin')) {
      return {
        content: 'Take the missed dose as soon as you remember, then space out subsequent doses evenly. If it is already close to your next scheduled dose, skip it and continue your normal schedule; never take a double dose. Amoxicillin can be taken with or without food, though taking it with a meal reduces stomach upset.',
      };
    }
    if (lower.includes('lisinopril')) {
      return {
        content: 'Take Lisinopril once daily at approximately the same time each morning with water. If you miss a dose, take it on the same day, but if it is already the next morning, skip the missed dose and resume your regular single tablet. Never take two doses at once.',
      };
    }
    if (lower.includes('metformin')) {
      return {
        content: 'Always take Metformin with meals (breakfast or dinner) to minimize stomach upset. Swallow extended-release tablets whole without chewing or crushing. If you miss a dose, take it with your next scheduled meal; never take extra tablets to compensate.',
      };
    }
    return {
      content: 'Take your missed dose as soon as remembered unless it is almost time for your next scheduled dose. Never take a double dose to make up for a missed pill, and continue your regular dosing calendar.',
    };
  }

  // 6. Side Effects
  if (wantsSideEffects) {
    if (lower.includes('amoxicillin')) {
      return {
        content: 'Common side effects of Amoxicillin include mild diarrhea, nausea, stomach cramps, and headache. Seek immediate emergency evaluation if you develop signs of an allergic reaction such as widespread hives, facial swelling, or breathing difficulty.',
      };
    }
    if (lower.includes('lisinopril')) {
      return {
        content: 'The most common side effect of Lisinopril is a persistent dry, non-productive cough occurring in up to 10% of patients, along with mild dizziness when standing. Rare but severe adverse effects include angioedema (swelling of lips, tongue, or throat) and hyperkalemia.',
      };
    }
    if (lower.includes('metformin')) {
      return {
        content: 'Common side effects of Metformin are gastrointestinal, including nausea, bloating, abdominal cramping, and loose stools, which usually subside after a few weeks. Taking it with meals or using extended-release formulations significantly improves tolerance.',
      };
    }
    if (lower.includes('ibuprofen')) {
      return {
        content: 'Common side effects of Ibuprofen include gastric irritation, dyspepsia (heartburn), nausea, and mild fluid retention. Prolonged use at high doses increases risks of gastrointestinal ulceration, elevated blood pressure, and renal strain.',
      };
    }
    return {
      content: 'Common medication side effects typically include mild nausea, drowsiness, headache, or digestive changes. Review your prescription documentation and seek medical advice if adverse reactions become severe or persistent.',
    };
  }

  // 7. Causes
  if (wantsCauses) {
    if (lower.includes('acid') || lower.includes('reflux') || lower.includes('gerd') || lower.includes('heartburn')) {
      return {
        content: 'Acid reflux is caused by transient relaxation or weakening of the lower esophageal sphincter (LES), allowing gastric acid to flow back into the esophagus. Contributing factors include hiatal hernia, delayed stomach emptying, obesity, large fatty meals, caffeine, alcohol, and lying down soon after eating.',
      };
    }
    if (lower.includes('dehydration')) {
      return {
        content: 'Dehydration is caused by inadequate water intake relative to fluid loss from prolonged heat exposure, intense physical exertion, gastrointestinal fluid losses (vomiting or diarrhea), high fever, or excess diuretic use.',
      };
    }
    if (lower.includes('headache') || lower.includes('migraine')) {
      return {
        content: 'Headaches are commonly caused by cervical and scalp muscle tension, digital eyestrain, dehydration, sleep deprivation, sinus congestion, and stress. Migraines involve neurovascular activation and neurochemical fluctuations often triggered by dietary or environmental factors.',
      };
    }
    if (lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('high bp')) {
      return {
        content: 'Primary hypertension typically develops over years due to genetic predisposition, high sodium intake, physical inactivity, obesity, and arterial stiffening. Secondary causes include chronic kidney disease, obstructive sleep apnea, and endocrine disorders.',
      };
    }
    if (lower.includes('heart') || lower.includes('palpitation')) {
      return {
        content: 'Heart palpitations are most frequently caused by acute emotional stress, excess caffeine or stimulant intake, dehydration, electrolyte shifts (potassium or magnesium), lack of sleep, or hormonal fluctuations.',
      };
    }
    if (lower.includes('rash') || lower.includes('skin') || lower.includes('itch')) {
      return {
        content: 'Skin rashes are primarily caused by contact dermatitis (exposure to allergens, harsh soaps, or nickel), systemic viral or bacterial infections, allergic drug reactions, or chronic inflammatory skin conditions like eczema and psoriasis.',
      };
    }
    if (lower.includes('knee') || lower.includes('joint') || lower.includes('sprain')) {
      return {
        content: 'Knee and joint pain is typically caused by acute ligament sprains, meniscus tears, patellar tendonitis, bursitis, or degenerative cartilage wear (osteoarthritis) triggered by sudden twisting or high-impact load.',
      };
    }
    if (lower.includes('fatigue') || lower.includes('tired')) {
      return {
        content: 'Chronic fatigue is most frequently caused by sleep apnea or chronic sleep deficit, iron deficiency anemia, thyroid hypofunction (hypothyroidism), vitamin D or B12 deficiency, sustained psychological burnout, or metabolic disorders.',
      };
    }
    if (lower.includes('cholesterol')) {
      return {
        content: 'High cholesterol is caused by dietary saturated and trans fats, hepatic overproduction of LDL particles, familial hypercholesterolemia gene mutations, sedentary lifestyle, and metabolic sluggishness.',
      };
    }
    return {
      content: 'Medical conditions typically result from a combination of genetic predispositions, environmental stressors, lifestyle factors, infectious agents, or metabolic imbalances.',
    };
  }

  // 8. Medication Queries (Direct medications and standard adult dosages)
  if (wantsMedication && !wantsSymptoms) {
    // Specific medication dosing and administration instructions
    if (wantsDosingOrUsage) {
      if (lower.includes('sumatriptan')) {
        return {
          content: 'Take one Sumatriptan 50mg to 100mg tablet with water at the first sign of a migraine headache. If symptoms partially improve or return, a second dose may be taken at least 2 hours later. Do not exceed 200mg in a 24-hour period.',
        };
      }
      if (lower.includes('lisinopril')) {
        return {
          content: 'Take Lisinopril once daily at approximately the same time each morning with water, with or without food. Maintain consistent daily timing for optimal blood pressure control.',
        };
      }
      if (lower.includes('amoxicillin')) {
        return {
          content: 'Take Amoxicillin 500mg every 8 hours (or 875mg every 12 hours) with water. Taking it with a meal reduces gastrointestinal upset. Complete the entire prescribed duration.',
        };
      }
      if (lower.includes('metformin')) {
        return {
          content: 'Take Metformin with meals (breakfast or dinner) to minimize gastrointestinal discomfort. Swallow extended-release tablets whole without chewing or crushing.',
        };
      }
      if (lower.includes('ibuprofen')) {
        return {
          content: 'Take Ibuprofen 200mg to 400mg every 4 to 6 hours (or 600mg every 8 hours for acute joint pain) with food or milk to protect your stomach. Maximum adult OTC daily dose is 1200mg.',
        };
      }
      if (lower.includes('acetaminophen') || lower.includes('tylenol')) {
        return {
          content: 'Take Acetaminophen 500mg to 650mg every 4 to 6 hours as needed (or 1000mg every 6 hours). Do not exceed 3000mg to 4000mg in 24 hours to prevent acute liver toxicity.',
        };
      }
      if (lower.includes('omeprazole')) {
        return {
          content: 'Take Omeprazole 20mg once daily in the morning, 30 to 60 minutes before breakfast. Swallow the capsule whole with water.',
        };
      }
      if (lower.includes('hydrocortisone')) {
        return {
          content: 'Apply a thin layer of Hydrocortisone 1% cream to the affected skin area 2 to 3 times daily. Gently rub it in until absorbed. Avoid using near eyes or for more than 7 days without clinical advice.',
        };
      }
      if (lower.includes('albuterol')) {
        return {
          content: 'Inhale 2 puffs every 4 to 6 hours as needed for sudden bronchospasm, shortness of breath, or wheezing. Wait 1 minute between puffs and rinse your mouth with water afterward.',
        };
      }
    }

    if (lower.includes('headache') || lower.includes('migraine')) {
      return {
        content: 'First-line medications for headache relief include Acetaminophen (500mg to 1000mg orally every 4 to 6 hours as needed) or NSAIDs such as Ibuprofen (200mg to 400mg every 6 to 8 hours with food). For acute migraines, prescription triptans such as Sumatriptan (50mg to 100mg orally at onset) or combination analgesics like Excedrin (Acetaminophen/Aspirin/Caffeine) are standard.',
      };
    }
    if (lower.includes('knee') || lower.includes('joint') || lower.includes('back') || lower.includes('sprain') || lower.includes('pain') || lower.includes('muscle') || lower.includes('arthritis')) {
      return {
        content: 'First-line medications for joint and musculoskeletal pain include oral NSAIDs such as Ibuprofen (400mg to 600mg every 8 hours with food) or Naproxen (220mg to 500mg twice daily with meals). Topical NSAIDs like Diclofenac sodium 1% gel applied to the affected joint 4 times daily provide effective localized relief.',
      };
    }
    if (lower.includes('sore throat') || lower.includes('throat')) {
      return {
        content: 'First-line medications for sore throat pain include systemic analgesics such as Ibuprofen (400mg every 6 to 8 hours with food) or Acetaminophen (500mg every 4 to 6 hours), paired with topical Benzocaine or phenol throat lozenges every 2 hours as needed.',
      };
    }
    if (lower.includes('nausea') || lower.includes('vomit')) {
      return {
        content: 'First-line over-the-counter medications for nausea include Bismuth subsalicylate (Pepto-Bismol, 30mL orally every 30 to 60 minutes as needed) or Meclizine (25mg orally for motion-related nausea). For severe clinical nausea, prescription Ondansetron (4mg to 8mg orally dissolving tablet) is standard.',
      };
    }
    if (lower.includes('diarrhea')) {
      return {
        content: 'First-line medication for acute non-bloody diarrhea is Loperamide (Imodium, 4mg orally after the first loose stool, then 2mg after each subsequent stool, maximum 8mg daily OTC), paired with oral rehydration electrolyte solutions.',
      };
    }
    if (lower.includes('asthma') || lower.includes('wheez')) {
      return {
        content: 'First-line rescue medication for acute asthma bronchospasm is an inhaled short-acting beta-agonist like Albuterol (2 puffs every 4 to 6 hours as needed via metered-dose inhaler). For persistent maintenance, inhaled corticosteroids such as Fluticasone propionate (100mcg to 250mcg twice daily) are prescribed.',
      };
    }
    if (lower.includes('rash') || lower.includes('skin') || lower.includes('itch') || lower.includes('allergy') || lower.includes('eczema') || lower.includes('hive')) {
      return {
        content: 'First-line topical medication for an itchy rash or localized dermatitis is Hydrocortisone 1% cream applied 2 to 3 times daily. For allergic itching or hives, oral antihistamines such as Cetirizine (10mg once daily) or Diphenhydramine (25mg to 50mg every 6 hours) are standard.',
      };
    }
    if (lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('high bp') || lower.includes('palpitation')) {
      return {
        content: 'Standard first-line antihypertensive medications include ACE inhibitors like Lisinopril (10mg to 20mg once daily), ARBs like Losartan (50mg once daily), calcium channel blockers like Amlodipine (5mg once daily), and thiazide diuretics like Hydrochlorothiazide (12.5mg to 25mg once daily).',
      };
    }
    if (lower.includes('acid') || lower.includes('reflux') || lower.includes('gerd') || lower.includes('heartburn') || lower.includes('stomach')) {
      return {
        content: 'First-line medications for acid reflux include H2-blockers like Famotidine (20mg to 40mg twice daily) and proton pump inhibitors (PPIs) like Omeprazole (20mg once daily taken 30 to 60 minutes before breakfast). For rapid temporary relief, antacids like calcium carbonate (Tums) neutralize existing gastric acid.',
      };
    }
    if (lower.includes('infection') || lower.includes('antibiotic') || lower.includes('bacteria')) {
      return {
        content: 'Common oral antibiotics for bacterial infections include Amoxicillin (500mg every 8 hours or 875mg every 12 hours), Amoxicillin-Clavulanate (Augmentin 875/125mg twice daily), or Azithromycin (500mg on day 1 followed by 250mg once daily for 4 days).',
      };
    }
    if (lower.includes('fever') || lower.includes('cold') || lower.includes('flu') || lower.includes('cough')) {
      return {
        content: 'First-line medications to lower fever and relieve body aches are Acetaminophen (500mg to 650mg every 4 to 6 hours) or Ibuprofen (400mg every 6 hours with food). For productive cough, Guaifenesin (200mg to 400mg every 4 hours with water) helps thin mucus, while oral Pseudoephedrine (30mg to 60mg every 4 to 6 hours) relieves congestion.',
      };
    }
    if (lower.includes('sleep') || lower.includes('insomnia')) {
      return {
        content: 'First-line over-the-counter sleep aids include Melatonin (1mg to 3mg taken 30 to 60 minutes before bedtime) or short-term antihistamines like Doxylamine succinate (25mg at bedtime). For chronic sleep disruption, non-benzodiazepine hypnotics or dual orexin receptor antagonists are prescribed clinically.',
      };
    }
    if (lower.includes('cholesterol')) {
      return {
        content: 'First-line medications for hypercholesterolemia are HMG-CoA reductase inhibitors (statins), including Atorvastatin (10mg to 40mg once daily in the evening) or Rosuvastatin (5mg to 20mg once daily). Cholesterol absorption inhibitors like Ezetimibe (10mg once daily) are added if LDL goals require further reduction.',
      };
    }
    if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('sugar')) {
      return {
        content: 'First-line oral medication for type 2 diabetes is Metformin (initial 500mg once or twice daily with meals, titrating to 1000mg twice daily). SGLT2 inhibitors like Empagliflozin (10mg to 25mg daily) or GLP-1 receptor agonists are standard second-line therapies.',
      };
    }
    return {
      content: 'Standard over-the-counter medications include Acetaminophen (500mg every 4 to 6 hours) for pain and fever, Ibuprofen (400mg every 6 to 8 hours with food) for inflammation, and topical Hydrocortisone 1% for localized skin irritation. Always follow package dosage limits and verify compatibility with your existing prescription regimen.',
    };
  }

  // 9. Symptom Queries (Characteristic signs and physical manifestations only - no cures)
  if (wantsSymptoms) {
    if (lower.includes('dehydration')) {
      return {
        content: 'Primary symptoms of dehydration include intense thirst, dark-amber urine with significantly decreased volume (oliguria), dry mouth and cracked tongue, lightheadedness or postural dizziness upon standing, fatigue, and loss of skin turgor.',
      };
    }
    if (lower.includes('heart') || lower.includes('palpitation') || lower.includes('flutter') || lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('pulse')) {
      return {
        content: 'Cardiovascular symptoms typically include a fluttering or racing heartbeat (tachycardia), skipped pulses, throbbing sensations in the neck, dizziness or lightheadedness, and a sensation of chest awareness or constriction.',
      };
    }
    if (lower.includes('rash') || lower.includes('skin') || lower.includes('itch') || lower.includes('mole') || lower.includes('acne') || lower.includes('eczema') || lower.includes('hive')) {
      return {
        content: 'Cutaneous and dermatological symptoms typically present as localized erythema (redness), intense pruritus (itching), raised papules or urticarial wheals, localized skin warmth, surface scaling, and small fluid-filled vesicles.',
      };
    }
    if (lower.includes('knee') || lower.includes('joint') || lower.includes('back') || lower.includes('shoulder') || lower.includes('sprain') || lower.includes('ankle') || lower.includes('bone') || lower.includes('muscle')) {
      return {
        content: 'Musculoskeletal and joint sprain symptoms include localized joint swelling (effusion), joint line tenderness, stiffness with restricted range of motion, visible ecchymosis (bruising), and sharp or throbbing pain aggravated by weight-bearing.',
      };
    }
    if (lower.includes('headache') || lower.includes('migraine') || lower.includes('dizzy') || lower.includes('vertigo') || lower.includes('numbness') || lower.includes('vision')) {
      return {
        content: 'Typical cephalic and neurological symptoms include dull or throbbing band-like head pressure, retro-orbital eye strain, photophobia (sensitivity to light), visual aura or blurred vision, dizziness, and occipital neck stiffness.',
      };
    }
    if (lower.includes('acid') || lower.includes('reflux') || lower.includes('gerd') || lower.includes('heartburn') || lower.includes('stomach')) {
      return {
        content: 'Acid reflux symptoms include a burning retrosternal sensation (heartburn) usually worse after eating or lying down, sour or acidic regurgitation in the back of the throat, difficulty swallowing (dysphagia), and a persistent dry throat tickle.',
      };
    }
    if (lower.includes('asthma') || lower.includes('wheez')) {
      return {
        content: 'Characteristic symptoms of asthma include audible high-pitched expiratory wheezing, recurrent shortness of breath (dyspnea), tightness in the chest, and a persistent dry cough that frequently worsens at night or during cold air exposure.',
      };
    }
    if (lower.includes('pneumonia') || lower.includes('respiratory') || lower.includes('lung') || lower.includes('bronchitis')) {
      return {
        content: 'Lower respiratory symptoms include a persistent cough producing yellow or green sputum, pleuritic chest discomfort aggravated by deep inhalation, shortness of breath on exertion, elevated fever, rigors, and fatigue.',
      };
    }
    if (lower.includes('sore throat') || lower.includes('throat') || lower.includes('tonsil')) {
      return {
        content: 'Pharyngeal symptoms include sharp pain or scratchiness aggravated by swallowing (odynophagia), visible mucosal erythema, enlarged tonsils occasionally with white exudates, and tender anterior cervical lymphadenopathy.',
      };
    }
    if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('sugar')) {
      return {
        content: 'Typical symptoms of blood glucose elevation include polydipsia (excessive thirst), polyuria (frequent urination), unexpected fatigue, blurred vision, slow-healing skin abrasions, and unintentional weight loss.',
      };
    }
    if (lower.includes('flu') || lower.includes('influenza') || lower.includes('covid') || lower.includes('cold')) {
      return {
        content: 'Viral upper respiratory symptoms include sudden onset fever with chills, body-wide muscle aches (myalgia), dry cough, sore throat, nasal congestion, headache, and severe fatigue.',
      };
    }
    if (lower.includes('food poisoning') || lower.includes('gastroenteritis') || lower.includes('stomach flu')) {
      return {
        content: 'Gastroenteritis symptoms include watery diarrhea, nausea, forceful vomiting, abdominal cramping, low-grade fever, and dehydration.',
      };
    }
    return {
      content: 'Common clinical symptoms include localized pain or tenderness, altered organ function, swelling, visible inflammation or erythema, altered sensory perceptions, and generalized fatigue.',
    };
  }

  // 10. Diet, Lifestyle, and Natural Health queries
  if (wantsDietOrLifestyle) {
    if (lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('high bp')) {
      return {
        content: 'The DASH dietary pattern is the gold standard for reducing blood pressure: restrict sodium to under 1,500mg to 2,300mg daily, increase potassium-rich whole foods (spinach, bananas, avocados), engage in 150 minutes of weekly aerobic exercise, and limit alcohol consumption.',
      };
    }
    if (lower.includes('cholesterol')) {
      return {
        content: 'To lower LDL cholesterol naturally, eliminate dietary trans fats, reduce saturated fats to under 6% of daily calories, consume 10 to 25 grams of soluble fiber daily (oats, legumes, psyllium husk), and add plant sterols/stanols.',
      };
    }
    if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('sugar')) {
      return {
        content: 'Optimal nutritional management for glycemic control emphasizes low-glycemic-index complex carbohydrates, generous dietary fiber (minimum 30g daily), lean proteins, healthy unsaturated fats, and regular post-prandial 15-minute walks to enhance insulin sensitivity.',
      };
    }
    if (lower.includes('reflux') || lower.includes('gerd')) {
      return {
        content: 'Dietary management for acid reflux involves avoiding chocolate, peppermint, citrus, tomatoes, garlic, and high-fat fried foods. Eat smaller meals, remain upright for at least 3 hours after dining, and elevate the head of your bed by 6 inches.',
      };
    }
  }

  // 11. "What is" / Explanatory Queries
  if (wantsWhatIs) {
    if (lower.includes('blood pressure')) {
      return {
        content: 'Blood pressure measures the hydrostatic pressure exerted by circulating blood against arterial walls, recorded as systolic pressure (during cardiac contraction) over diastolic pressure (during cardiac rest). A normal resting adult reading is below 120/80 mmHg.',
      };
    }
    if (lower.includes('cholesterol')) {
      return {
        content: 'Cholesterol is a waxy lipid molecule essential for building cell membranes, synthesizing vitamin D, and producing steroid hormones. Low-density lipoprotein (LDL) transports cholesterol to tissues and can deposit plaque in arteries, while high-density lipoprotein (HDL) clears excess cholesterol to the liver.',
      };
    }
    if (lower.includes('ibuprofen')) {
      return {
        content: 'Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) that inhibits cyclooxygenase (COX-1 and COX-2) enzymes to reduce prostaglandin synthesis, decreasing inflammatory pain, fever, and swelling. It is widely used for headaches, musculoskeletal pain, and arthritis.',
      };
    }
    if (lower.includes('acetaminophen') || lower.includes('tylenol')) {
      return {
        content: 'Acetaminophen (paracetamol) is a centrally acting analgesic and antipyretic agent that elevates the pain threshold and inhibits hypothalamic heat-regulating centers. Unlike NSAIDs, it provides pain and fever reduction without significant peripheral anti-inflammatory action or gastric mucosal irritation.',
      };
    }
    if (lower.includes('sumatriptan')) {
      return {
        content: 'Sumatriptan is a selective serotonin 5-HT1B/1D receptor agonist (triptan) that causes vasoconstriction of distended cranial arteries and inhibits the release of pro-inflammatory neuropeptides from the trigeminal nerve to abort acute migraine attacks.',
      };
    }
    if (lower.includes('omeprazole')) {
      return {
        content: 'Omeprazole is a proton pump inhibitor (PPI) that suppresses gastric acid secretion by specifically inhibiting the H+/K+ ATPase enzyme system in gastric parietal cells. It is prescribed for GERD, peptic ulcers, and erosive esophagitis.',
      };
    }
    if (lower.includes('migraine')) {
      return {
        content: 'A migraine is a primary neurovascular headache disorder characterized by recurrent moderate-to-severe throbbing unilateral head pain, frequently accompanied by nausea, vomiting, photophobia (light sensitivity), and phonophobia (sound sensitivity), with or without a preceding sensory aura.',
      };
    }
    if (lower.includes('asthma')) {
      return {
        content: 'Asthma is a chronic inflammatory disorder of the airways characterized by bronchial hyperresponsiveness, airway edema, and reversible airflow obstruction leading to recurrent episodes of wheezing, dyspnea, chest tightness, and cough.',
      };
    }
    if (lower.includes('hypertension')) {
      return {
        content: 'Hypertension is a chronic cardiovascular condition in which the systemic arterial blood pressure is persistently elevated (resting systolic pressure ≥ 130 mmHg or diastolic pressure ≥ 80 mmHg), placing increased mechanical workload on the heart and arterial vasculature.',
      };
    }
    if (lower.includes('amoxicillin')) {
      return {
        content: 'Amoxicillin is a broad-spectrum penicillin-class antibiotic that kills bacteria by inhibiting cell wall synthesis. It is prescribed for susceptible bacterial infections of the ear, nose, throat, respiratory tract, and skin, but has no activity against viruses.',
      };
    }
    if (lower.includes('lisinopril')) {
      return {
        content: 'Lisinopril is an angiotensin-converting enzyme (ACE) inhibitor that relaxes blood vessels to lower arterial pressure and reduce cardiac workload. It is widely prescribed for hypertension and heart failure management.',
      };
    }
    if (lower.includes('metformin')) {
      return {
        content: 'Metformin is an oral biguanide medication that reduces hepatic glucose production and increases peripheral insulin sensitivity in muscle tissue. It is the international first-line therapy for type 2 diabetes mellitus.',
      };
    }
  }

  // Default: Direct, clean factual answer
  return {
    content: 'Clinical health maintenance involves maintaining resting blood pressure below 120/80 mmHg, staying adequately hydrated with 2 to 2.5 liters of fluid daily, obtaining 7 to 9 hours of quality sleep, and adhering strictly to prescribed medications and dosing intervals.',
  };
}

// In development, hook up Vite middleware; in production, serve built files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BaqiusHealth AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
