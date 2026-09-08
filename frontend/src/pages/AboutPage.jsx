import { Link } from 'react-router-dom';
import { ArrowRight, Sprout, ShoppingBag, Landmark, Building2, Truck, Wheat } from 'lucide-react';

const stakeholders = [
  {
    icon: Sprout,
    title: 'Farmers',
    body: 'Small and marginal farmers, organic growers, FPO members. List produce, track fields and harvests, and get paid directly.',
    to: '/farmer-entrance',
    cta: 'Enter the farmer portal',
  },
  {
    icon: ShoppingBag,
    title: 'Buyers',
    body: 'Individual consumers and households shopping for GI-certified, traceable produce from Northeast India.',
    to: '/marketplace',
    cta: 'Browse the marketplace',
  },
  {
    icon: Building2,
    title: 'Corporate & institutional buyers',
    body: 'Retail chains, HoReCa, exporters and institutional procurement teams sourcing at volume with audit-ready documentation.',
    to: '/corporate-buyer',
    cta: 'Open the corporate buyer portal',
  },
  {
    icon: Landmark,
    title: 'Banks & financial institutions',
    body: 'Lenders and NBFCs evaluating farmer credit history, cooperative shares and repayment data built up on the platform.',
    to: '/banker-dashboard',
    cta: 'Open the banker dashboard',
  },
  {
    icon: Wheat,
    title: 'Government',
    body: 'State and central agencies tracking scheme eligibility, subsidy disbursal and regional production data.',
    to: '/government-dashboard',
    cta: 'Open the government dashboard',
  },
  {
    icon: Truck,
    title: 'Logistics & service providers',
    body: 'Cold-chain operators, testing labs and transport partners coordinating pickup, storage and delivery.',
    to: '/logistics-provider',
    cta: 'Open the logistics portal',
  },
];

function AboutPage() {
  return (
    <div className="font-body">
      <section className="bg-v42-forestd text-v42-paddy py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-v42-turmeric text-sm font-semibold tracking-wide uppercase mb-3">
            About AFRERA
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-6 leading-tight">
            One platform, six kinds of people who need something different from it
          </h1>
          <p className="text-lg text-v42-paddy/85">
            AFRERA isn't a single storefront — it's an integrated ecosystem connecting farmers,
            buyers, government agencies, financial institutions and service providers across
            Northeast India's agricultural economy. Each of the doors below leads to the part of
            the platform built for that role.
          </p>
        </div>
      </section>

      <section className="py-16 bg-v42-paddy">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {stakeholders.map(({ icon: Icon, title, body, to, cta }) => (
              <Link
                key={title}
                to={to}
                className="group bg-v42-paddy border border-v42-line rounded-lg p-6 hover:shadow-lg hover:border-v42-turmeric transition flex flex-col"
              >
                <div className="w-12 h-12 bg-v42-forest/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-v42-forest" />
                </div>
                <h3 className="font-display font-semibold text-v42-ink mb-2">{title}</h3>
                <p className="text-sm text-v42-mut mb-4 flex-1">{body}</p>
                <span className="text-sm font-semibold text-v42-forest inline-flex items-center group-hover:underline">
                  {cta}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
