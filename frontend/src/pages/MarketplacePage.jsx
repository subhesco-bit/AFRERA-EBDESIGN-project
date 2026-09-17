import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

// 2026-09-16: was a 2-line placeholder ("batch: Fill critical skeleton
// files", 2026-09-08) - the live app's core marketplace route rendered
// nothing but a heading. Wired to the real, already-mounted product
// listing endpoint (services/legacy/productService.js's router at
// /api/product, GET / returning `{products, pagination}` off a real
// products/categories/states/units join) via productAPI.getProducts,
// matching this file's own pre-existing test (__tests__/MarketplacePage.test.jsx).
export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['marketplace-products', search, page],
    queryFn: () =>
      productAPI
        .getProducts({ search: search || undefined, page, limit: 24 })
        .then((r) => r.data),
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-600">Browse products directly from farmers and cooperatives</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="pl-9"
          aria-label="Search products"
        />
      </div>

      {isLoading && <p className="text-gray-500">Loading products...</p>}
      {error && <p className="text-red-600">Failed to load products: {error.message}</p>}

      {!isLoading && !error && products.length === 0 && (
        <p className="text-gray-500">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-base">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {product.base_price} / {product.unit_symbol}
              </p>
              <p className="text-sm text-gray-500">
                {product.category_name}
                {product.category_name && product.state_name ? ' · ' : ''}
                {product.state_name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1.5 text-sm rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
