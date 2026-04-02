import Groq from "groq-sdk";
import { ClaudeAnalysisResult, MealType } from "./types";

const ANALYZE_PROMPT = `Tu es un nutritionniste expert. Analyse cette photo de repas.
L'utilisateur est en phase de sèche (réduction calorique pour perdre la graisse abdominale sans perdre de masse musculaire). Son BMR est de 1716 kcal.

Identifie tous les aliments visibles avec leurs quantités estimées, puis calcule les valeurs nutritionnelles totales.

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte autour) :
{
  "foods": [
    {"name": "nom de l'aliment", "quantity": "quantité estimée (ex: 150g)", "calories": 0}
  ],
  "totalCalories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "mealType": "déjeuner",
  "description": "Description courte du repas en 1 phrase"
}

Pour mealType, utilise exactement l'une de ces valeurs : "petit-déjeuner", "déjeuner", "dîner", "collation"
Tous les nombres doivent être des entiers (pas de décimales).`;

export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<ClaudeAnalysisResult> {
  const client = new Groq({ apiKey });

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
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

  const text =
    response.choices[0].message.content || "";

  // Extract JSON (handle possible markdown fences)
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
