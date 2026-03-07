import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BibleSearchRequest {
  query: string;
  language?: string;
  searchType?: "verse" | "topic";
}

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, language = "en", searchType = "verse" }: BibleSearchRequest = await req.json();

    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please use standard search." }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const languageMap: Record<string, string> = {
      en: "English",
      fr: "French",
      es: "Spanish",
      ht: "Haitian Creole"
    };

    const targetLanguage = languageMap[language] || "English";

    let prompt = "";

    if (searchType === "verse") {
      prompt = `You are a Bible assistant. The user is searching for: "${query}"

Parse this query and return Bible verses in ${targetLanguage}.

If the query is a specific reference (like "John 3:16" or "Matthew 5:1-10"), return those exact verses.
If the query is a topic (like "verses about faith" or "love in the Bible"), return 5-8 relevant verses about that topic.

Return ONLY a JSON array of verses in this exact format:
[
  {
    "book": "John",
    "chapter": 3,
    "verse": 16,
    "text": "For God so loved the world..."
  }
]

Important rules:
- Return valid JSON only
- Include verse numbers
- Text should be in ${targetLanguage}
- If you cannot find verses, return an empty array []
- Do not include any explanatory text, only the JSON array`;
    } else {
      prompt = `You are a Bible topic assistant. The user is searching for: "${query}"

Return 5-8 Bible verses about this topic in ${targetLanguage}.

Return ONLY a JSON array of verses in this exact format:
[
  {
    "book": "John",
    "chapter": 3,
    "verse": 16,
    "text": "For God so loved the world..."
  }
]

Return valid JSON only, no explanatory text.`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "AI search temporarily unavailable. Please use standard Bible search.",
          fallback: true
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();

    let verses: BibleVerse[] = [];

    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      const responseText = geminiData.candidates[0].content.parts[0].text;

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          verses = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError);
          return new Response(
            JSON.stringify({
              error: "Failed to parse AI response. Please try standard search.",
              fallback: true
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verses,
        query,
        language: targetLanguage,
        searchType
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in ai-bible-search:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please use standard Bible search.",
        fallback: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
