import React, { useState } from 'react';
import styles from './NutritionCalculator.module.css';

export default function NutritionCalculatorPage() {
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [results, setResults] = useState(null);

  const nutritionDatabase = {
    rice: { calories: 206, protein: 4.3, carbs: 45, fat: 0.3, fiber: 0.4 },
    turmeric: { calories: 354, protein: 9.7, carbs: 65, fat: 3.3, fiber: 2.1 },
    honey: { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2 },
    ghee: { calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
    lentils: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 1.8 },
    chickpeas: { calories: 119, protein: 8.9, carbs: 20, fat: 1.7, fiber: 2.4 },
  };

  const calculateNutrition = () => {
    // BMI Calculation
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    // BMR (Basal Metabolic Rate)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };

    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

    // Macronutrient distribution
    const protein = Math.round(tdee * 0.3 / 4); // 30% of calories, 4 cal/g
    const carbs = Math.round(tdee * 0.45 / 4); // 45% of calories, 4 cal/g
    const fats = Math.round(tdee * 0.25 / 9); // 25% of calories, 9 cal/g

    setResults({
      bmi,
      bmr: Math.round(bmr),
      tdee,
      protein,
      carbs,
      fats,
      water: Math.round(weight * 0.035) // liters per day
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🥗 Nutrition Calculator</h1>
        <p>Get personalized nutrition recommendations based on your profile</p>
      </header>

      <div className={styles.content}>
        <section className={styles.calculator}>
          <h2>Your Profile</h2>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Age (years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                min="1"
                max="120"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Activity Level</label>
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                <option value="sedentary">Sedentary (little exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="veryActive">Very Active (2x per day)</option>
              </select>
            </div>
          </div>

          <button className={styles.calculateBtn} onClick={calculateNutrition}>
            Calculate My Nutrition
          </button>
        </section>

        {results && (
          <section className={styles.results}>
            <h2>Your Nutrition Plan</h2>

            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <div className={styles.value}>{results.bmi}</div>
                <div className={styles.label}>BMI</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.value}>{results.bmr}</div>
                <div className={styles.label}>BMR (cal/day)</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.value}>{results.tdee}</div>
                <div className={styles.label}>Daily Calories</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.value}>{results.water}L</div>
                <div className={styles.label}>Water/Day</div>
              </div>
            </div>

            <div className={styles.macroBreakdown}>
              <h3>Macronutrient Breakdown</h3>

              <div className={styles.macroItem}>
                <div className={styles.macroLabel}>
                  <span>🥚 Protein</span>
                  <strong>{results.protein}g</strong>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progress} style={{ width: '30%', background: '#ff6b6b' }}></div>
                </div>
                <small>30% of daily calories</small>
              </div>

              <div className={styles.macroItem}>
                <div className={styles.macroLabel}>
                  <span>🌾 Carbs</span>
                  <strong>{results.carbs}g</strong>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progress} style={{ width: '45%', background: '#4ecdc4' }}></div>
                </div>
                <small>45% of daily calories</small>
              </div>

              <div className={styles.macroItem}>
                <div className={styles.macroLabel}>
                  <span>🥑 Fats</span>
                  <strong>{results.fats}g</strong>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progress} style={{ width: '25%', background: '#ffd93d' }}></div>
                </div>
                <small>25% of daily calories</small>
              </div>
            </div>

            <div className={styles.recommendations}>
              <h3>🥘 Recommended Foods from EBDESIGN Premium Market</h3>
              <ul>
                <li>🌾 <strong>Rice:</strong> 206 cal, 4.3g protein per 100g - Perfect carb source</li>
                <li>🔴 <strong>Red Lentils:</strong> 116 cal, 9g protein - Plant-based protein powerhouse</li>
                <li>🟡 <strong>Turmeric:</strong> 354 cal, 9.7g protein - Anti-inflammatory spice</li>
                <li>🍯 <strong>Honey:</strong> 304 cal - Natural energy source</li>
                <li>🥛 <strong>Ghee:</strong> Healthy fats, aids nutrient absorption</li>
              </ul>
            </div>
          </section>
        )}

        <section className={styles.guidelines}>
          <h2>📋 Nutrition Guidelines</h2>
          <div className={styles.guidelineCards}>
            <div className={styles.card}>
              <h3>Breakfast</h3>
              <p>Include whole grains, protein, and healthy fats. Example: Rice with lentils and ghee</p>
            </div>
            <div className={styles.card}>
              <h3>Lunch</h3>
              <p>Maximum nutrients from agricultural products. Include turmeric for anti-inflammatory benefits</p>
            </div>
            <div className={styles.card}>
              <h3>Dinner</h3>
              <p>Light meals with sufficient carbs and protein. Use honey for natural sweetness</p>
            </div>
            <div className={styles.card}>
              <h3>Hydration</h3>
              <p>Drink adequate water as calculated. Stay hydrated throughout the day</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
