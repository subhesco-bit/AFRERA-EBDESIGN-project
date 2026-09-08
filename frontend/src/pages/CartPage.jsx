import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../services/api';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // v5 react-query object syntax (see LoginPage.jsx) — was the tuple form,
  // which throws in the installed v5. .then(r => r.data) unwraps the axios
  // response once here, so cartData below is the real payload directly.
  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => ordersAPI.getCart().then((r) => r.data),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => ordersAPI.updateCartItem(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update cart');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => ordersAPI.removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to remove item');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-v42-paddy2 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-v42-paddy2 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-v42-mut mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-v42-ink mb-2">Couldn't load your cart</h2>
        <p className="text-v42-mut mb-6">{error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}
          className="px-6 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition"
        >
          Try again
        </button>
      </div>
    );
  }

  const { items = [], total_amount = 0 } = cartData || {};

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-24 h-24 text-v42-mut mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-v42-ink mb-2">Your cart is empty</h2>
        <p className="text-v42-mut mb-6">Add some products to get started</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-6 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition inline-flex items-center gap-2"
        >
          Browse Marketplace
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-v42-ink mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-v42-paddy border border-v42-line rounded-lg shadow p-4 flex gap-4"
            >
              <div className="w-24 h-24 bg-v42-paddy2 rounded-lg flex-shrink-0 overflow-hidden">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.product_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-v42-mut text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-v42-ink mb-1">{item.product_name}</h3>
                <p className="text-sm text-v42-mut mb-2">{item.unit_symbol}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          id: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      disabled={updateQuantityMutation.isPending}
                      className="w-8 h-8 border border-v42-line rounded hover:bg-v42-paddy2 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4 mx-auto" />
                    </button>
                    <span className="w-8 text-center text-v42-ink">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          id: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                      disabled={updateQuantityMutation.isPending}
                      className="w-8 h-8 border border-v42-line rounded hover:bg-v42-paddy2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-v42-ink text-lg">
                      ₹{item.total_price.toFixed(2)}
                    </div>
                    <div className="text-sm text-v42-mut">
                      ₹{item.base_price} each
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                className="self-start p-2 text-v42-chilli hover:bg-v42-chilli/10 rounded-lg disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-v42-paddy border border-v42-line rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-v42-ink mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-v42-ink2">
                <span>Subtotal</span>
                <span>₹{total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-v42-ink2">
                <span>Shipping</span>
                <span>{total_amount > 1500 ? 'FREE' : '₹60.00'}</span>
              </div>
              <p className="text-xs text-v42-mut">
                GST is calculated per item at checkout (varies by product) — not included in this subtotal.
              </p>
            </div>

            <div className="border-t border-v42-line pt-4 mb-6">
              <div className="flex justify-between text-lg font-semibold text-v42-ink">
                <span>Subtotal + shipping</span>
                <span>
                  ₹{(total_amount + (total_amount > 1500 ? 0 : 60)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full px-6 py-3 bg-v42-forest text-v42-paddy rounded-lg font-semibold hover:bg-v42-forestd transition mb-3 inline-flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/marketplace')}
              className="w-full px-6 py-3 border-2 border-v42-forest text-v42-forestd rounded-lg font-semibold hover:bg-v42-forest/10 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
