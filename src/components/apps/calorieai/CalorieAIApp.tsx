'use client';

import { useState, useRef } from 'react';

interface NutritionData {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: string;
  healthTips: string[];
}

export default function CalorieAIApp() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setNutrition(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setNutrition(data);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImage(null);
    setNutrition(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getNutrientColor = (nutrient: string, value: number) => {
    if (nutrient === 'protein') return value > 20 ? 'text-emerald-500' : 'text-primary-600';
    if (nutrient === 'fiber') return value > 5 ? 'text-emerald-500' : 'text-primary-600';
    if (nutrient === 'sugar') return value > 15 ? 'text-red-500' : 'text-primary-600';
    if (nutrient === 'sodium') return value > 500 ? 'text-amber-500' : 'text-primary-600';
    return 'text-primary-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-2">
            Calorie AI
          </h1>
          <p className="text-primary-500">
            Upload a food photo to get instant nutritional analysis
          </p>
        </div>

        {/* Upload Area */}
        {!image ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-primary-200 p-8 text-center hover:border-emerald-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
              id="food-image"
            />
            <label htmlFor="food-image" className="cursor-pointer block">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Take or Upload a Food Photo
              </h3>
              <p className="text-primary-500 text-sm mb-6">
                Tap to take a photo or select from your gallery
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Choose Photo
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="bg-white rounded-2xl border border-primary-100 p-4 shadow-sm">
              <img
                src={image}
                alt="Food preview"
                className="w-full h-64 object-cover rounded-xl mb-4"
              />

              {!nutrition && !isAnalyzing && (
                <div className="flex gap-3">
                  <button
                    onClick={analyzeImage}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all"
                  >
                    Analyze Food
                  </button>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-3 bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold rounded-xl transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-primary-600">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>AI is analyzing your food...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
                {error}
              </div>
            )}

            {/* Nutrition Results */}
            {nutrition && (
              <div className="space-y-4">
                {/* Food Name & Calories */}
                <div className="bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-primary-900">{nutrition.foodName}</h2>
                      <p className="text-primary-500 text-sm">{nutrition.servingSize}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600">{nutrition.calories}</div>
                      <div className="text-sm text-primary-500">calories</div>
                    </div>
                  </div>

                  <div className="text-xs text-primary-400 bg-primary-50 rounded-lg px-3 py-1.5 inline-block">
                    Confidence: {nutrition.confidence}
                  </div>
                </div>

                {/* Macros */}
                <div className="bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Macronutrients</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{nutrition.protein}g</div>
                      <div className="text-sm text-blue-600/70">Protein</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <div className="text-2xl font-bold text-amber-600">{nutrition.carbs}g</div>
                      <div className="text-sm text-amber-600/70">Carbs</div>
                    </div>
                    <div className="text-center p-4 bg-rose-50 rounded-xl">
                      <div className="text-2xl font-bold text-rose-600">{nutrition.fat}g</div>
                      <div className="text-sm text-rose-600/70">Fat</div>
                    </div>
                  </div>
                </div>

                {/* Other Nutrients */}
                <div className="bg-white rounded-2xl border border-primary-100 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Other Nutrients</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                      <span className="text-primary-600">Fiber</span>
                      <span className={`font-semibold ${getNutrientColor('fiber', nutrition.fiber)}`}>
                        {nutrition.fiber}g
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg">
                      <span className="text-primary-600">Sugar</span>
                      <span className={`font-semibold ${getNutrientColor('sugar', nutrition.sugar)}`}>
                        {nutrition.sugar}g
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary-50 rounded-lg col-span-2">
                      <span className="text-primary-600">Sodium</span>
                      <span className={`font-semibold ${getNutrientColor('sodium', nutrition.sodium)}`}>
                        {nutrition.sodium}mg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Tips */}
                {nutrition.healthTips.length > 0 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
                    <h3 className="text-lg font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <span>💡</span> Health Tips
                    </h3>
                    <ul className="space-y-2">
                      {nutrition.healthTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-emerald-800 text-sm">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Analyze Another */}
                <button
                  onClick={resetAnalysis}
                  className="w-full py-4 bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold rounded-xl transition-colors"
                >
                  Analyze Another Food
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-primary-400 mt-8">
          Nutritional estimates are AI-generated and may not be 100% accurate.
          Consult a nutritionist for precise dietary advice.
        </p>
      </div>
    </div>
  );
}
