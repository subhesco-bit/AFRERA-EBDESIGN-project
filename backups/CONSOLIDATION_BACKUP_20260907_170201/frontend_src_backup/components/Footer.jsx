import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-white">AFRERA</span>
            </div>
            <p className="text-sm mb-4">
              Empowering farmers and connecting rural India through technology and fair trade practices.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace" className="text-sm hover:text-white transition">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/farmer-portal" className="text-sm hover:text-white transition">
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link to="/logistics" className="text-sm hover:text-white transition">
                  Logistics
                </Link>
              </li>
              <li>
                <Link to="/insurance" className="text-sm hover:text-white transition">
                  Insurance
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-white transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services/cold-chain" className="text-sm hover:text-white transition">
                  Cold Chain
                </Link>
              </li>
              <li>
                <Link to="/services/contract-farming" className="text-sm hover:text-white transition">
                  Contract Farming
                </Link>
              </li>
              <li>
                <Link to="/services/financial" className="text-sm hover:text-white transition">
                  Financial Services
                </Link>
              </li>
              <li>
                <Link to="/services/certification" className="text-sm hover:text-white transition">
                  Certification
                </Link>
              </li>
              <li>
                <Link to="/services/training" className="text-sm hover:text-white transition">
                  Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Northeast India Hub<br />
                  Guwahati, Assam 781001
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">+91 1800-123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">support@afrera.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} AFRERA. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm hover:text-white transition">
              Terms of Service
            </Link>
            <Link to="/refund" className="text-sm hover:text-white transition">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
