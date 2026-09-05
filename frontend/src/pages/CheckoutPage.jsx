import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../services/api';
import { MapPin, CreditCard, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import JourneyStepper from '../components/common/JourneyStepper';

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // NOTE: this page was calling useQuery/useMutation with the removed v3/v4
  // tuple signature (`useQuery('cart', fn)`) against an installed v5
  // @tanstack/react-query, which only supports the object form — the page
  // threw on render. Also `ordersAPI.getCart()` returns the axios response
  // object, not the cart directly; `.then(r => r.data)` was missing.
  const { data: cartData, isLoading: cartLoading, error: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => ordersAPI.getCart().then((r) => r.data),
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersAPI.createOrder,
    onSuccess: (res) => {
      toast.success('Order created successfully');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/orders/${res.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create order');
    },
  });

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    createOrderMutation.mutate({
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
    });
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-v42-paddy2 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-v42-paddy2 rounded-lg" />
              <div className="h-48 bg-v42-paddy2 rounded-lg" />
            </div>
            <div className="h-64 bg-v42-paddy2 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-v42-ink mb-2">Couldn't load your cart</h2>
        <p className="text-v42-mut mb-6">{cartError.message}</p>
        <button onClick={() => navigate('/cart')} className="px-6 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition">
          Back to Cart
        </button>
      </div>
    );
  }

  const { items, total_amount } = cartData || { items: [], total_amount: 0 };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-v42-ink mb-2">Your cart is empty</h2>
        <p className="text-v42-mut mb-6">Add items to your cart before checkout</p>
        <button onClick={() => navigate('/marketplace')} className="px-6 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition">
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-v42-ink mb-8">Checkout</h1>
      <JourneyStepper
        steps={['Delivery', 'Payment']}
        currentStep={step}
        className="mb-8 max-w-xl"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping Address */}
          <div className={`bg-v42-paddy border border-v42-line rounded-lg shadow p-6 ${step !== 1 ? 'opacity-60' : ''}`}>
            <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-v42-forest text-v42-paddy text-sm flex items-center justify-center mr-2">
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </span>
              <MapPin className="w-5 h-5 mr-2" />
              Shipping Address
            </h2>
            <fieldset disabled={step !== 1} className="space-y-4">
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label htmlFor="address-line-1" className="block text-sm font-medium text-v42-ink2 mb-2">
                    Address Line 1
                  </label>
                  <input id="address-line-1"
                    type="text"
                    required
                    value={shippingAddress.address_line1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                    className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric disabled:bg-v42-paddy2"
                    placeholder="House No, Street, Area"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-v42-ink2 mb-2">
                    City
                  </label>
                  <input id="city"
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric disabled:bg-v42-paddy2"
                    placeholder="City"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-v42-ink2 mb-2">
                      State
                    </label>
                    <input id="state"
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric disabled:bg-v42-paddy2"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-v42-ink2 mb-2">
                      Pincode
                    </label>
                    <input id="pincode"
                      type="text"
                      required
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-v42-line rounded-lg focus:outline-none focus:ring-2 focus:ring-v42-turmeric disabled:bg-v42-paddy2"
                      placeholder="Pincode"
                    />
                  </div>
                </div>
                {step === 1 && (
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition"
                  >
                    Continue to Payment
                  </button>
                )}
              </form>
            </fieldset>
          </div>

          {/* Step 2: Payment Method */}
          <div className={`bg-v42-paddy border border-v42-line rounded-lg shadow p-6 ${step !== 2 ? 'opacity-60' : ''}`}>
            <h2 className="text-lg font-semibold text-v42-ink mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-v42-forest text-v42-paddy text-sm flex items-center justify-center mr-2">2</span>
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Method
            </h2>
            <fieldset disabled={step !== 2}>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-3">
                  {[
                    ['cod', 'Cash on Delivery', 'Pay when you receive your order'],
                    ['upi', 'UPI Payment', 'Pay using any UPI app'],
                    ['card', 'Credit/Debit Card', 'Pay using your card'],
                  ].map(([value, title, desc]) => (
                    <label key={value} className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${paymentMethod === value ? 'border-v42-forest bg-v42-forest/5' : 'border-v42-line hover:bg-v42-paddy2'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={value}
                        checked={paymentMethod === value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-v42-ink">{title}</div>
                        <div className="text-sm text-v42-mut">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {step === 2 && (
                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="w-full px-4 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </form>
            </fieldset>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-v42-ink mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-v42-paddy2 rounded flex-shrink-0 overflow-hidden">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.product_name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-v42-mut text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-v42-ink line-clamp-2">
                      {item.product_name}
                    </div>
                    <div className="text-sm text-v42-mut">Qty: {item.quantity}</div>
                    <div className="text-sm font-semibold text-v42-ink">₹{item.total_price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-v42-line pt-4 space-y-2">
              <div className="flex justify-between text-sm text-v42-ink2">
                <span>Subtotal</span>
                <span>₹{total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-v42-ink2">
                <span>Shipping</span>
                <span>{total_amount > 1500 ? 'FREE' : '₹60.00'}</span>
              </div>
              <p className="text-xs text-v42-mut pt-1">
                GST is calculated per item (varies by product/HSN code) and shown on your order
                confirmation — not included in this subtotal preview.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2 text-sm text-v42-ink2">
              <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Estimated delivery: 3-5 business days</span>
            </div>

            <div className="mt-2 flex items-start gap-2 text-sm text-v42-mut">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Cash on Delivery available — pay only when your order arrives.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
