import { Utensils } from 'lucide-react'
import { ecommerceIntegrationAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/ecommerceIntegrationRoutes.js +
 * ecommerceIntegrationController.js + services/legacy/ecommerceIntegrationService.js
 * (1128 real lines combined, no stubs, verified 2026-08-28). Action-oriented
 * lookups against existing products/carts/recipes rather than a CRUD
 * resource of its own, so ActionCard fits better than a list+form page -
 * same reasoning as WaterManagementPage.jsx/VillageRegistryPage.jsx.
 */
function EcommerceIntegrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Utensils className="w-6 h-6 mr-2 text-rose-600" />
          Nutrition &amp; Recipe Integration
        </h1>
        <p className="text-gray-600">Nutrition scoring, recipe matching, cart health analysis, and dietitian recommendations for marketplace products.</p>
      </div>

      <ActionCard
        title="Calculate Nutrition Score"
        description="Score a product's nutritional value and its health-based price premium."
        fields={[{ name: 'productId', label: 'Product ID' }]}
        onRun={(v) => ecommerceIntegrationAPI.calculateNutritionScore(v.productId)}
      />
      <ActionCard
        title="Nutrition Price Premium"
        description="Get the health-based price premium for a product over a given base price."
        fields={[{ name: 'productId', label: 'Product ID' }, { name: 'basePrice', label: 'Base Price' }]}
        onRun={(v) => ecommerceIntegrationAPI.getNutritionPricePremium(v.productId, v.basePrice)}
      />
      <ActionCard
        title="Recipe Suggestions"
        description="Get recipe suggestions that use a given product as an ingredient."
        fields={[{ name: 'productId', label: 'Product ID' }, { name: 'limit', label: 'Limit (optional)' }]}
        onRun={(v) => ecommerceIntegrationAPI.getRecipeSuggestions(v.productId, v.limit || undefined)}
      />
      <ActionCard
        title="Products for a Recipe"
        description="Find marketplace products matching a recipe's ingredients."
        fields={[{ name: 'recipeId', label: 'Recipe ID' }]}
        onRun={(v) => ecommerceIntegrationAPI.getRecipeProducts(v.recipeId)}
      />
      <ActionCard
        title="Health-Based Recommendations"
        description="Get product recommendations based on your health profile. Requires sign-in."
        fields={[{ name: 'limit', label: 'Limit (optional)' }]}
        onRun={(v) => ecommerceIntegrationAPI.getHealthRecommendations(v.limit || undefined)}
      />
      <ActionCard
        title="Check Dietary Compatibility"
        description="Check whether a product is compatible with your dietary profile. Requires sign-in."
        fields={[{ name: 'productId', label: 'Product ID' }]}
        onRun={(v) => ecommerceIntegrationAPI.checkCompatibility(v.productId)}
      />
      <ActionCard
        title="Cart Nutrition Analysis"
        description="Calculate the combined nutrition profile of your cart. Requires sign-in."
        hasJsonPayload
        jsonLabel="Cart items (JSON array)"
        jsonPlaceholder='[{"productId": 12, "quantity": 2}]'
        onRun={(_, payload) => ecommerceIntegrationAPI.calculateCartNutrition(Array.isArray(payload) ? payload : [])}
      />
      <ActionCard
        title="Dietitian Collections"
        description="Browse curated product collections from a specific dietitian."
        fields={[{ name: 'dietitianId', label: 'Dietitian ID' }]}
        onRun={(v) => ecommerceIntegrationAPI.getDietitianCollections(v.dietitianId)}
      />
      <ActionCard
        title="My Dietitian Recommendation"
        description="Get your personalized dietitian product recommendation. Requires sign-in."
        onRun={() => ecommerceIntegrationAPI.getDietitianRecommendation()}
      />
    </div>
  )
}

export default EcommerceIntegrationPage
