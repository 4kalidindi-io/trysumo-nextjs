import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 data and media type from data URL
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mediaType = matches[1];
    const base64Data = matches[2];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `Analyze this food image and provide nutritional information. Respond with ONLY a valid JSON object in this exact format, no other text:

{
  "foodName": "Name of the food/dish",
  "servingSize": "Estimated serving size (e.g., '1 cup', '1 plate', '250g')",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "sugar": <number in grams>,
  "sodium": <number in mg>,
  "confidence": "High/Medium/Low based on how clearly you can identify the food",
  "healthTips": ["tip1", "tip2"]
}

If you cannot identify food in the image, respond with:
{
  "foodName": "Unknown",
  "servingSize": "N/A",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "fiber": 0,
  "sugar": 0,
  "sodium": 0,
  "confidence": "Low",
  "healthTips": ["Please upload a clearer image of food"]
}

Be reasonably accurate with your estimates based on typical serving sizes and nutritional databases.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    // Parse the JSON response from Claude
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const nutritionData = JSON.parse(jsonMatch[0]);
        return NextResponse.json(nutritionData);
      }
    } catch (parseError) {
      console.error('Failed to parse nutrition data:', parseError);
    }

    return NextResponse.json({ error: 'Failed to parse nutrition data' }, { status: 500 });
  } catch (error) {
    console.error('Error in analyze-food API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
