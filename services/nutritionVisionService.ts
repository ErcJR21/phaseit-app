/**
 * AI Vision meal analysis — recognizes Filipino / carinderia dishes from Supabase image URLs.
 */

export type MealNutrition = {
  foodName: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  pricePeso: number;
  confidence: 'low' | 'medium' | 'high';
  ingredients: string[];
};

type RawVisionPayload = {
  food_name?: string;
  description?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fats_g?: number;
  price_peso?: number;
  confidence?: string;
  ingredients?: string[];
};

const VISION_PROMPT = `You are a nutrition expert specializing in Filipino student meals, especially carinderia and campus canteen food (ulam + rice combos).

Analyze the meal photo and identify the dish(es). Prioritize common Filipino options such as:
- Adobo, sinigang, tinola, kare-kare, menudo, afritada, paksiw
- Fried chicken, pork chop, fish (galunggong, tilapia), hotdog, tocino, longganisa
- Sinangag (garlic rice), plain rice, pancit, lugaw, arroz caldo
- Vegetable sides: pinakbet, chopsuey, ginisang monggo, laing
- Combo plates: "2 viands + rice", tapsilog, sisig, barbecue skewers
- Budget meals from carinderia steam trays and bento-style servings

Estimate nutrition for ONE typical student serving (roughly one plate as shown). Use whole numbers only.

Respond with ONLY valid JSON matching this schema (no markdown):
{
  "food_name": "Primary dish name (Filipino or English, e.g. Adobo sa Gata)",
  "description": "Brief 1-sentence description of what you see",
  "calories": 650,
  "protein_g": 28,
  "carbs_g": 72,
  "fat_g": 24,
  "price_peso": 65,
  "confidence": "low" | "medium" | "high",
  "ingredients": ["Adobo chicken", "Steamed rice", "Atchara"]
}

Include price_peso as a realistic campus/carinderia price in Philippine pesos for one student plate (typically 45-120).
List 2-5 visible ingredients or components in the ingredients array.`;

function clampMacro(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function normalizeConfidence(value: unknown): MealNutrition['confidence'] {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'high') return 'high';
  if (raw === 'medium') return 'medium';
  return 'low';
}

function normalizeIngredients(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function parseVisionPayload(raw: string): MealNutrition {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  let parsed: RawVisionPayload;
  try {
    parsed = JSON.parse(jsonText) as RawVisionPayload;
  } catch {
    throw new Error('AI returned invalid JSON.');
  }

  const foodName = String(parsed.food_name ?? '').trim();
  if (!foodName) {
    throw new Error('AI did not identify the meal.');
  }

  return {
    foodName,
    description: String(parsed.description ?? '').trim(),
    calories: clampMacro(parsed.calories),
    protein: clampMacro(parsed.protein_g),
    carbs: clampMacro(parsed.carbs_g),
    fats: clampMacro(parsed.fat_g ?? parsed.fats_g),
    pricePeso: clampMacro(parsed.price_peso) || 65,
    confidence: normalizeConfidence(parsed.confidence),
    ingredients: normalizeIngredients(parsed.ingredients),
  };
}

export async function analyzeMealFromImage(imageUrl: string): Promise<MealNutrition> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    throw new Error(
      'Missing EXPO_PUBLIC_OPENAI_API_KEY. Add your OpenAI key to .env and restart Expo.',
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[PhaseIt] OpenAI Vision error:', response.status, errorBody);
    throw new Error(`Vision API failed (${response.status}). Check your API key and quota.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Vision API returned an empty response.');
  }

  return parseVisionPayload(content);
}
