import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPTS: Record<string, string> = {
  flashcards: `You generate study flashcards. Respond with ONLY a valid JSON object, no markdown code fences, no other text:

{
  "title": "Deck title based on the topic",
  "cards": [
    {
      "id": 1,
      "front": "Question or term",
      "back": "Answer or definition",
      "category": "Sub-topic category"
    }
  ]
}

Make the front side a clear question or prompt. Make the back side a concise but complete answer.`,

  quiz: `You generate study quizzes. Respond with ONLY a valid JSON object, no markdown code fences, no other text:

{
  "title": "Quiz title based on the topic",
  "questions": [
    {
      "id": 1,
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Ensure distractors (wrong answers) are plausible but clearly wrong to someone who studied. Randomize the position of the correct answer across questions.`,

  memory: `You create memory tricks and mnemonics. Respond with ONLY a valid JSON object, no markdown code fences, no other text:

{
  "tricks": [
    {
      "term": "The concept to remember",
      "technique": "Acronym",
      "trick": "The actual mnemonic or trick",
      "explanation": "How this trick helps you remember"
    }
  ]
}

Use a variety of techniques: Acronym, Memory Palace, Association, Rhyme, Chunking, Story, Visualization. Make them creative, funny, or vivid -- the more memorable the better.`,

  videos: `You recommend educational YouTube videos and channels. Respond with ONLY a valid JSON object, no markdown code fences, no other text:

{
  "videos": [
    {
      "title": "Descriptive title of what to search for",
      "channel": "Recommended channel name (e.g., Khan Academy, 3Blue1Brown, CrashCourse)",
      "description": "What this video/series covers and why it is helpful",
      "searchQuery": "exact youtube search terms to find this content"
    }
  ]
}

Prioritize well-known educational channels. Focus on content that explains concepts visually and clearly.`,
};

export async function POST(request: Request) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const { mode, topic, material, difficulty = 'medium', count = 8 } = await request.json();

    if (!mode || !SYSTEM_PROMPTS[mode]) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    if (!topic && !material) {
      return NextResponse.json({ error: 'Topic or material is required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[mode];
    const sourceText = material
      ? `Based on this study material:\n\n${material.slice(0, 8000)}`
      : `About the topic: ${topic}`;

    const difficultyGuide = mode === 'flashcards' || mode === 'quiz'
      ? `\nDifficulty: ${difficulty}. ${difficulty === 'easy' ? 'Basic definitions and simple recall.' : difficulty === 'hard' ? 'Analysis, synthesis, and edge cases.' : 'Application and understanding questions.'}`
      : '';

    const userMessage = `${sourceText}\n\nGenerate exactly ${count} items.${difficultyGuide}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate study content' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (parseError) {
      console.error('Failed to parse study content:', parseError);
    }

    return NextResponse.json({ error: 'Failed to parse study content' }, { status: 500 });
  } catch (error) {
    console.error('Error in study API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
