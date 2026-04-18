import { z } from 'zod'
import { env } from '../config/env.js'

type ParsedVerb =
  | 'stop'
  | 'add'
  | 'cut'
  | 'delay'
  | 'unknown'
  | 'step_up'
  | 'pause'
  | 'lump_sum'
  | 'withdraw'
  | 'redirect'

type ParsedOp = {
  verb: ParsedVerb
  target?: string
  amount?: number
  originalText?: string
  confidence?: number
  durationMonths?: number
  atMonth?: number
  delayMonths?: number
  stepUpRate?: number
  eventAmount?: number
  inheritedVerb?: ParsedVerb | null
  label?: string
}

const parsedOpSchema = z.object({
  verb: z.enum(['stop', 'add', 'cut', 'delay', 'unknown', 'step_up', 'pause', 'lump_sum', 'withdraw', 'redirect']),
  target: z.string().optional(),
  amount: z.number().optional(),
  originalText: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  durationMonths: z.number().int().nonnegative().optional(),
  atMonth: z.number().int().positive().optional(),
  delayMonths: z.number().int().nonnegative().optional(),
  stepUpRate: z.number().nonnegative().optional(),
  eventAmount: z.number().optional(),
  inheritedVerb: z.enum(['stop', 'add', 'cut', 'delay', 'unknown', 'step_up', 'pause', 'lump_sum', 'withdraw', 'redirect']).nullable().optional(),
  label: z.string().optional(),
})

const modelResponseSchema = z.object({
  ops: z.array(parsedOpSchema).default([]),
  primaryVerb: z.enum(['stop', 'add', 'cut', 'delay', 'unknown', 'step_up', 'pause', 'lump_sum', 'withdraw', 'redirect']).nullable().optional(),
  isAmbiguous: z.boolean().optional(),
  alternatives: z.array(z.string()).optional(),
  message: z.string().optional(),
})

export type SimulatorNlpResponse = {
  ops: ParsedOp[]
  primaryVerb: ParsedVerb | null
  isAmbiguous: boolean
  alternatives: string[]
  message: string
  model: string
  provider: 'gemini' | 'fallback'
}

function buildFallbackResponse(command: string): SimulatorNlpResponse {
  return {
    ops: [
      {
        verb: 'unknown',
        originalText: command,
        confidence: 0,
        label: 'Gemini parsing is unavailable. Add GEMINI_API_KEY to enable model-backed detection.',
      },
    ],
    primaryVerb: 'unknown',
    isAmbiguous: false,
    alternatives: [],
    message: 'Gemini parsing unavailable',
    model: env.GEMINI_MODEL,
    provider: 'fallback',
  }
}

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  return text.trim()
}

function formatGeminiError(status: number, errorText: string) {
  const normalized = errorText.toUpperCase()

  if (normalized.includes('API_KEY_INVALID') || normalized.includes('API KEY EXPIRED')) {
    return 'Gemini API key expired or invalid. Update GEMINI_API_KEY in the backend .env file.'
  }

  if (status === 429) {
    return 'Gemini rate limit reached. Please try again in a moment.'
  }

  if (status >= 500) {
    return 'Gemini is temporarily unavailable. Please try again shortly.'
  }

  return `Gemini request failed (${status}).`
}

export async function parseSimulatorCommandWithGemini(command: string): Promise<SimulatorNlpResponse> {
  if (!env.GEMINI_API_KEY) {
    return buildFallbackResponse(command)
  }

  const prompt = [
    'You are a financial simulator NLP parser.',
    'Convert the user command into strict JSON only.',
    'Return an object with keys: ops, primaryVerb, isAmbiguous, alternatives, message.',
    'Allowed verbs: stop, add, cut, delay, unknown, step_up, pause, lump_sum, withdraw, redirect.',
    'Each op may contain: verb, target, amount, originalText, confidence, durationMonths, atMonth, delayMonths, stepUpRate, eventAmount, inheritedVerb, label.',
    'Use amount for recurring monthly adjustments.',
    'Use eventAmount for one-time lump sum or withdrawal amounts.',
    'Use delayMonths for delayed starts.',
    'Use stepUpRate for annual step-up percentages.',
    'Use confidence from 0 to 1.',
    'If the command is unclear, mark isAmbiguous true and provide up to 3 alternatives.',
    'If nothing is safe to parse, return one unknown op.',
    'Do not include markdown unless unavoidable.',
    `Command: ${command}`,
  ].join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(formatGeminiError(response.status, errorText))
  }

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? ''
  const jsonText = extractJsonBlock(text)
  const parsed = modelResponseSchema.parse(JSON.parse(jsonText))

  return {
    ops: parsed.ops,
    primaryVerb: parsed.primaryVerb ?? null,
    isAmbiguous: parsed.isAmbiguous ?? false,
    alternatives: parsed.alternatives ?? [],
    message: parsed.message ?? 'Parsed by Gemini',
    model: env.GEMINI_MODEL,
    provider: 'gemini',
  }
}
