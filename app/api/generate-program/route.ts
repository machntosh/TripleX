import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, apiKey } = body;

    const resolvedApiKey = apiKey || process.env.OPENROUTER_API_KEY;

    if (!resolvedApiKey) {
      return NextResponse.json(
        { error: "Clé API OpenRouter manquante. Configurez-la dans les Paramètres." },
        { status: 401 }
      );
    }

    const client = new OpenAI({
      apiKey: resolvedApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://triple-x-six.vercel.app",
        "X-Title": "Journal de Sèche",
      },
    });

    const systemPrompt = `Tu es un coach sportif expert en musculation, cardio fonctionnel et préparation Hyrox.
Génère un programme d'entraînement structuré en JSON selon la demande.
Réponds UNIQUEMENT avec ce JSON (sans markdown, sans texte autour) :
{
  "name": "Nom du programme",
  "description": "Description courte (1-2 phrases)",
  "totalDuration": 60,
  "type": "solo",
  "equipment": ["Barre", "Haltères"],
  "blocks": [
    {
      "title": "Échauffement",
      "exercises": [
        {"name": "Footing léger", "duration": "5 min", "notes": "Allure conversationnelle"}
      ]
    },
    {
      "title": "Circuit principal",
      "exercises": [
        {"name": "Squat", "sets": 4, "reps": "12", "rest": "60s", "notes": "Descendre à 90°"},
        {"name": "Ski Erg", "sets": 3, "duration": "1 min", "rest": "45s", "distance": "200m"}
      ]
    },
    {
      "title": "Retour au calme",
      "exercises": [
        {"name": "Étirements", "duration": "5 min"}
      ]
    }
  ]
}
Pour le champ "type" utilise exactement : "solo", "duo", "hyrox-solo" ou "hyrox-duo".
totalDuration est en minutes. Tous les nombres sont des entiers sauf indication.`;

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout",
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0].message.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Réponse IA invalide");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    if (message.includes("401") || message.includes("authentication")) {
      return NextResponse.json(
        { error: "Clé API invalide. Vérifiez vos paramètres." },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
