import React, { useMemo, useState } from 'react';
import nutritionCommerceIntelligenceAPI from '../services/nutritionCommerceIntelligenceAPI';

const initialItem = {
  product: '',
  price: '',
  quantity: 100,
  quantityUnit: 'g',
  units: 1,
  nutrients: { protein: { amount: 0, unit: 'g' }, fibre: { amount: 0, unit: 'g' }, calories: { amount: 0, unit: 'kcal' } },
};

export default function NutritionCommerceWorkbenchPage() {
  const [items, setItems] = useState([initialItem]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const localEstimate = useMemo(() => items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.units) || 0), 0), [items]);

  const update = (index, field, value) => setItems((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const updateNutrient = (index, name, value) => setItems((current) => current.map((item, i) => i === index ? {
    ...item,
    nutrients: { ...item.nutrients, [name]: { ...item.nutrients[name], amount: value } },
  } : item));

  const calculate = async () => {
    setLoading(true); setError('');
    try {
      const response = await nutritionCommerceIntelligenceAPI.householdBasket(items.map((item) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        units: Number(item.units),
        nutrients: Object.fromEntries(Object.entries(item.nutrients).map(([key, value]) => [key, { ...value, amount: Number(value.amount) }])),
      })));
      setResult(response.data?.data || response.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Calculation failed');
    } finally { setLoading(false); }
  };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <header>
        <h1>Household Nutrition & Value Workbench</h1>
        <p>Calculate food-basket cost, ₹/kg normalization and nutrient contribution using the existing commerce APIs.</p>
      </header>

      {items.map((item, index) => (
        <section key={index} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, margin: '16px 0' }}>
          <strong>Food {index + 1}</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
            <input aria-label="Product" placeholder="Product" value={item.product} onChange={(e) => update(index, 'product', e.target.value)} />
            <input aria-label="Price" type="number" min="0" placeholder="Price" value={item.price} onChange={(e) => update(index, 'price', e.target.value)} />
            <input aria-label="Quantity" type="number" min="0.001" value={item.quantity} onChange={(e) => update(index, 'quantity', e.target.value)} />
            <select aria-label="Quantity unit" value={item.quantityUnit} onChange={(e) => update(index, 'quantityUnit', e.target.value)}><option value="g">g</option><option value="kg">kg</option></select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
            <input aria-label="Protein grams" type="number" min="0" placeholder="Protein / pack" value={item.nutrients.protein.amount} onChange={(e) => updateNutrient(index, 'protein', e.target.value)} />
            <input aria-label="Fibre grams" type="number" min="0" placeholder="Fibre / pack" value={item.nutrients.fibre.amount} onChange={(e) => updateNutrient(index, 'fibre', e.target.value)} />
            <input aria-label="Calories" type="number" min="0" placeholder="Calories / pack" value={item.nutrients.calories.amount} onChange={(e) => updateNutrient(index, 'calories', e.target.value)} />
          </div>
        </section>
      ))}

      <button type="button" onClick={() => setItems([...items, { ...initialItem, nutrients: { ...initialItem.nutrients } }])}>Add food</button>
      <button type="button" onClick={calculate} disabled={loading} style={{ marginLeft: 10 }}>{loading ? 'Calculating…' : 'Calculate basket'}</button>
      <p>Current local estimate: ₹{localEstimate.toFixed(2)}</p>
      {error && <p role="alert">{error}</p>}
      {result && <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 16, borderRadius: 12 }}>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
