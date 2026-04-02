import { NextRequest, NextResponse } from "next/server";
import { analyzeMealPhoto } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, apiKey } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 et mimeType sont requis" },
        { status: 400 }
      );
    }

    const resolvedApiKey =
      apiKey || process.env.GROQ_API_KEY;

    if (!resolvedApiKey) {
      return NextResponse.json(
        {
          error:
            "Clé API Groq manquante. Configurez-la dans les Paramètres.",
        },
        { status: 401 }
      );
    }

    const result = await analyzeMealPhoto(
      imageBase64,
      mimeType,
      resolvedApiKey
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";

    // Groq auth errors
    if (message.includes("401") || message.includes("authentication")) {
      return NextResponse.json(
        { error: "Clé API invalide. Vérifiez vos paramètres." },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
