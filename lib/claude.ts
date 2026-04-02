import Groq from "groq-sdk";
import { ClaudeAnalysisResult, MealType } from "./types";

const ANALYZE_PROMPT = `Tu es un nutritionniste expert. Analyse cette photo de repas.
L'utilisateur est en phase de sèche (réduction calorique). Son BMR est de 1716 kcal.

Pour CHAQUE aliment visible, estime sa quantité et calcule ses calories individuelles.
Calcule ensuite les totaux de macronutriments pour l'ensemble du repas.

Réponds UNIQUEMENT avec ce JSON valide (sans markdown, sans texte autour) :
{
  "foods": [
    {"name": "Riz blanc cuit", "quantity": "150g", "calories": 195},
    {"name": "Blanc de poulet grillé", "quantity": "120g", "calories": 132}
  ],
  "totalCalories": 327,
  "protein": 34,
  "carbs": 40,
  "fat": 4,
  "mealType": "déjeuner",
  "description": "Riz avec poulet grillé"
}

Règles importantes :
- Chaque aliment DOIT avoir des calories > 0 (calcule-les vraiment)
- totalCalories doit être la somme des calories de chaque aliment
- Pour mealType, utilise exactement : "petit-déjeuner", "déjeuner", "dîner", ou "collation"
- Tous les nombres sont des entiers (pas de décimales)`;

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

  // Normalise chaque aliment pour garantir des calories numériques
  const foods = (parsed.foods || []).map((f: { name?: string; quantity?: string; calories?: unknown }) => ({
    name: f.name || "Aliment",
    quantity: f.quantity || "",
    calories: Number(f.calories) || 0,
  }));

  return {
    foods,
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
