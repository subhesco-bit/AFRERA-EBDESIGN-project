import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Truck, Shield, TrendingUp, Users, Award } from 'lucide-react'

function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Empowering Rural India Through Technology
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Connect directly with farmers, access authentic GI-tagged products, and support sustainable agriculture across Northeast India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/marketplace"
                className="px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center justify-center"
              >
                Explore Marketplace
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-green-600 transition inline-flex items-center justify-center"
              >
                Join as Farmer
              </Link>
              <Link
                to="/modules"
                className="px-8 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-400 transition inline-flex items-center justify-center"
              >
                Explore Platform Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Why Choose AFRERA?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GI-Certified Products</h3>
              <p className="text-gray-600">
                Authentic products with geographical indication tags from Northeast India
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cold Chain Logistics</h3>
              <p className="text-gray-600">
                Temperature-controlled transport ensuring fresh produce delivery
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Trade Pricing</h3>
              <p className="text-gray-600">
                Transparent pricing with farmer-friendly cooperative models
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Explore Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Grains & Millets', icon: '🌾', count: 120 },
              { name: 'Spices', icon: '🌶️', count: 85 },
              { name: 'Fruits', icon: '🍊', count: 65 },
              { name: 'Vegetables', icon: '🥬', count: 95 },
              { name: 'Tea & Beverages', icon: '🍵', count: 45 },
              { name: 'Honey', icon: '🍯', count: 30 },
              { name: 'Bamboo Foods', icon: '🎋', count: 25 },
              { name: 'Mushrooms', icon: '🍄', count: 20 },
            ].map((category) => (
              <Link
                key={category.name}
                to="/marketplace"
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition cursor-pointer"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.count} products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What AFRERA connects — no invented figures. The platform has no
          public, unauthenticated stats endpoint yet (real counts exist only
          behind the admin-only /platform-telemetry route). Rather than ship
          placeholder numbers as if they were real traction, this section
          describes scope honestly until a real public metrics endpoint
          backs it. */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2" />
              <div className="text-lg font-semibold">Farmers</div>
              <div className="text-green-100 text-sm">Direct marketplace access</div>
            </div>
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-2" />
              <div className="text-lg font-semibold">GI Products</div>
              <div className="text-green-100 text-sm">Geographical-indication tagged</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2" />
              <div className="text-lg font-semibold">Transparent Pricing</div>
              <div className="text-green-100 text-sm">GST computed per item at checkout</div>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-2" />
              <div className="text-lg font-semibold">Northeast India</div>
              <div className="text-green-100 text-sm">Focus region</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Ready to Join the AFRERA Community?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're a farmer looking to reach new markets or a consumer seeking authentic products,
            AFRERA connects you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Register Now
            </Link>
            <Link
              to="/about"
              className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
