import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Truck, Shield, TrendingUp, Users, Award } from 'lucide-react'

function HomePage() {
  return (
    <div className="font-body">
      {/* Hero Section — NE Harvest design system (afrera_platform_v42.html) */}
      <section className="bg-v42-forestd text-v42-paddy py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="text-v42-turmeric text-sm font-semibold tracking-wide uppercase mb-3">
              Northeast India → National Market
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
              One platform, many storefronts — from hill farm to national market
            </h1>
            <p className="text-xl mb-8 text-v42-paddy/85">
              Not a single shop. A multi-vertical ecosystem: a GI marketplace, farmer insurance,
              cold-chain logistics and audit-ready governance — one login across all of it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/marketplace"
                className="px-8 py-3 bg-v42-turmeric text-v42-forestd rounded-lg font-semibold hover:bg-v42-turmerictint transition inline-flex items-center justify-center"
              >
                Explore Marketplace
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/farmer-entrance"
                className="px-8 py-3 border-2 border-v42-paddy/40 text-v42-paddy rounded-lg font-semibold hover:bg-v42-paddy hover:text-v42-forestd transition inline-flex items-center justify-center"
              >
                Farmer Entrance
              </Link>
              <Link
                to="/modules"
                className="px-8 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forest/80 transition inline-flex items-center justify-center"
              >
                Explore Platform Hub
              </Link>
            </div>
          </div>
        </div>
        {/* Ridge divider, matching the v42 reference's hill-skyline motif */}
        <svg className="absolute bottom-0 left-0 w-full h-16 text-v42-paddy" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 90 L0 60 L160 30 L320 58 L480 20 L680 60 L860 26 L1060 56 L1240 24 L1440 58 L1440 90 Z" fill="currentColor" />
        </svg>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-v42-paddy">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-v42-ink">
            Why Choose AFRERA?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-v42-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-v42-forest" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-v42-ink">GI-Certified Products</h3>
              <p className="text-v42-mut">
                Authentic products with geographical indication tags from Northeast India
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-v42-indigo/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-v42-indigo" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-v42-ink">Cold Chain Logistics</h3>
              <p className="text-v42-mut">
                Temperature-controlled transport ensuring fresh produce delivery
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-v42-turmeric/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-v42-turmericink" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-v42-ink">Fair Trade Pricing</h3>
              <p className="text-v42-mut">
                Transparent pricing with farmer-friendly cooperative models
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-v42-paddy2">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center mb-12 text-v42-ink">
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
                className="bg-v42-paddy border border-v42-line rounded-lg p-6 text-center hover:shadow-lg hover:border-v42-turmeric transition cursor-pointer"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-display font-semibold text-v42-ink">{category.name}</h3>
                <p className="text-sm text-v42-mut mt-1">{category.count} products</p>
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
      <section className="py-16 bg-v42-forest text-v42-paddy">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 text-v42-turmeric" />
              <div className="text-lg font-display font-semibold">Farmers</div>
              <div className="text-v42-paddy/75 text-sm">Direct marketplace access</div>
            </div>
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-2 text-v42-turmeric" />
              <div className="text-lg font-display font-semibold">GI Products</div>
              <div className="text-v42-paddy/75 text-sm">Geographical-indication tagged</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-v42-turmeric" />
              <div className="text-lg font-display font-semibold">Transparent Pricing</div>
              <div className="text-v42-paddy/75 text-sm">GST computed per item at checkout</div>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-2 text-v42-turmeric" />
              <div className="text-lg font-display font-semibold">Northeast India</div>
              <div className="text-v42-paddy/75 text-sm">Focus region</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-v42-paddy">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4 text-v42-ink">
            Ready to Join the AFRERA Community?
          </h2>
          <p className="text-v42-mut mb-8 max-w-2xl mx-auto">
            Whether you're a farmer looking to reach new markets or a consumer seeking authentic products,
            AFRERA connects you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-v42-turmeric text-v42-forestd rounded-lg font-semibold hover:bg-v42-turmerictint transition"
            >
              Register Now
            </Link>
            <Link
              to="/about"
              className="px-8 py-3 border-2 border-v42-forest text-v42-forest rounded-lg font-semibold hover:bg-v42-forest/10 transition"
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
