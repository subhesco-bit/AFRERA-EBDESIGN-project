import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsAPI, ordersAPI } from '../services/commerceApi';
import { AsyncState, Section, Value } from '../components/common/DataPrimitives';
import Card from '../components/ui/card';
import Badge from '../components/ui/badge';
import Button from '../components/ui/button';
import Input from '../components/ui/input';

const PAGE_SIZE = 20;

/**
 * Real cart integration via ordersAPI.addToCart - not a no-op UI stub.
 */
function AddToCartButton({ productId }) {
  const [added, setAdded] = useState(false);
  const mutation = useMutation({
    mutationFn: () => ordersAPI.addToCart({ productId, quantity: 1 }),
    onSuccess: () => setAdded(true),
  });

  if (added) {
    return <Badge>Added to cart</Badge>;
  }

  return (
    <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Adding…' : 'Add to cart'}
    </Button>
  );
}

/**
 * Real product listing backed by productsAPI.getProducts (GET /products) -
 * was a 2-line placeholder stub with no data, no search, no pagination.
 */
export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['marketplace-products', search, page],
    queryFn: () =>
      productsAPI.getProducts({ search: search || undefined }, { page, limit: PAGE_SIZE }).then(r => r.data),
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Marketplace</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Products listed for sale by farmers and cooperatives across Northeast India.
      </p>

      <Section title="Browse products">
        <Input
          aria-label="Search products"
          placeholder="Search products…"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mb-3"
        />

        <AsyncState
          loading={isLoading}
          error={error?.response?.data?.error || error?.message}
          empty={!isLoading && products.length === 0}
          emptyMessage="No products match this search."
        >
          <div className="space-y-3">
            {products.map(p => (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {p.category_name}
                      {p.state_name ? ` · ${p.state_name}` : ''}
                    </p>
                  </div>
                  <Value value={p.base_price} unit={p.unit_symbol} prefix="₹" decimals={0} />
                </div>
                <div className="mt-2">
                  <AddToCartButton productId={p.id} />
                </div>
              </Card>
            ))}
          </div>
        </AsyncState>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Previous
            </Button>
            <span>
              Page {page} of {pagination.totalPages} · {pagination.total} products
            </span>
            <Button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </Section>
    </main>
  );
}
