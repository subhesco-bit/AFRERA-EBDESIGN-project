import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../services/api';

function getProducts(response) {
	const payload = response?.data ?? response ?? {};
	return Array.isArray(payload) ? payload : payload.products || payload.data || [];
}

export default function MarketplacePage() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['marketplace-products'],
		queryFn: () => productsAPI.getProducts().then(getProducts),
	});

	const products = Array.isArray(data) ? data : getProducts(data);

	return (
		<main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
					<p className="mt-2 text-gray-600">Browse verified products from agricultural producers.</p>
				</div>

				{isLoading && <p role="status">Loading products</p>}
				{error && <p role="alert">Products could not be loaded.</p>}
				{!isLoading && !error && products.length === 0 && (
					<p className="rounded-lg border bg-white p-8 text-gray-600">No products are available.</p>
				)}
				{!isLoading && !error && products.length > 0 && (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{products.map((product) => (
							<article key={product.id} className="rounded-lg border bg-white p-5 shadow-sm">
								<h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
								<p className="mt-2 text-sm text-gray-500">
									{product.category_name || product.category || 'Agricultural product'}
								</p>
								<p className="mt-4 text-xl font-bold text-gray-900">
									₹{Number(product.base_price ?? product.price ?? 0).toLocaleString('en-IN')}
									{product.unit_symbol ? ` / ${product.unit_symbol}` : ''}
								</p>
								<Link
									className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
									to={`/products/${product.id}`}
								>
									View product
								</Link>
							</article>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
