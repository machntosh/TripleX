import OpenAI from "openai";
import { ClaudeAnalysisResult, MealType } from "./types";

const ANALYZE_PROMPT = `Tu es un nutritionniste expert. Analyse cette photo de repas.
L'utilisateur est en phase de sèche (réduction calorique pour perdre la graisse abdominale sans perdre de masse musculaire). Son BMR est de 1716 kcal.

Identifie tous les aliments visibles avec leurs quantités estimées, puis calcule les valeurs nutritionnelles totales.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte autour) :
{
  "foods": [
    {"name": "Riz blanc cuit", "quantity": "150g", "calories": 195},
    {"name": "Blanc de poulet grillé", "quantity": "120g", "calories": 132}
  ],
  "totalCalories": 327,
  "protein": 38,
  "carbs": 40,
  "fat": 4,
  "mealType": "déjeuner",
  "description": "Riz blanc avec poulet grillé"
}

Pour mealType, utilise exactement l'une de ces valeurs : "petit-déjeuner", "déjeuner", "dîner", "collation"
Tous les nombres doivent être des entiers (pas de décimales).
IMPORTANT : calcule vraiment les calories de chaque aliment — ne copie pas les valeurs d'exemple.`;

export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<ClaudeAnalysisResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://triple-x-six.vercel.app",
      "X-Title": "Journal de Sèche",
    },
  });

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: ANALYZE_PROMPT,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  const text = response.choices[0].message.content || "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Réponse IA invalide : pas de JSON trouvé");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const validMealTypes: MealType[] = [
    "petit-déjeuner",
    "déjeuner",
    "dîner",
    "collation",
  ];

  return {
    foods: parsed.foods || [],
    totalCalories: Number(parsed.totalCalories) || 0,
    protein: Number(parsed.protein) || 0,
    carbs: Number(parsed.carbs) || 0,
    fat: Number(parsed.fat) || 0,
    mealType: validMealTypes.includes(parsed.mealType)
      ? parsed.mealType
      : "déjeuner",
    description: parsed.description || "Repas analysé",
  };
}
