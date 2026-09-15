import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const FarmerImagePortal = () => {
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/farmer/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setDashboard(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setLoading(false);
    }
  };

  const handleUploadProduct = async (e) => {
    const formData = new FormData(e.target);
    setUploadingProduct(true);

    try {
      const response = await fetch('/api/farmer/portfolio/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          productData: {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            quantity: parseInt(formData.get('quantity')),
            pricePerUnit: parseFloat(formData.get('price')),
          },
        }),
      });

      if (response.ok) {
        alert('Product uploaded successfully!');
        fetchDashboard();
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleGenerateImages = async (productId) => {
    try {
      const response = await fetch(
        `/api/farmer/portfolio/products/${productId}/generate-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            languages: ['en', 'hi'],
            region: 'northeast-india',
          }),
        }
      );

      if (response.ok) {
        alert('Images generated! Review them before publishing.');
        fetchDashboard();
      }
    } catch (error) {
      alert('Generation failed: ' + error.message);
    }
  };

  const handlePublishProduct = async (productId) => {
    try {
      const response = await fetch(
        `/api/farmer/portfolio/products/${productId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            marketplaceConfig: {
              currency: 'INR',
            },
          }),
        }
      );

      if (response.ok) {
        alert('Product published to marketplace!');
        fetchDashboard();
      }
    } catch (error) {
      alert('Publication failed: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending-images': {
        icon: Clock,
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      },
      'pending-review': {
        icon: AlertCircle,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      published: {
        icon: CheckCircle,
        color: 'bg-green-50 text-green-700 border-green-200',
      },
    };

    const config = statusMap[status] || statusMap['pending-images'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${config.color}`}>
        <Icon size={16} />
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">🌾 Farmer Image Portal</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-blue-600">{dashboard?.portfolio?.products?.length || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Images Generated</p>
          <p className="text-2xl font-bold text-green-600">{dashboard?.imageStats?.total || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold text-purple-600">{dashboard?.imageStats?.completionRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['products', 'upload', 'performance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Your Products</h3>
          {dashboard?.products?.map(product => (
            <div key={product.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-bold">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                {getStatusBadge(product.status)}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-bold">{product.quantity} units</p>
                </div>
                <div>
                  <p className="text-gray-600">Price</p>
                  <p className="font-bold">₹{product.price}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Quality</p>
                  <p className="font-bold">{product.avgQuality}%</p>
                </div>
              </div>

              <div className="flex gap-2">
                {product.status === 'pending-images' && (
                  <button
                    onClick={() => handleGenerateImages(product.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Upload size={16} />
                    Generate Images
                  </button>
                )}

                {product.status === 'pending-review' && (
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    <Eye size={16} />
                    Review Images
                  </button>
                )}

                {product.images && product.images.length > 0 && (
                  <button
                    onClick={() => handlePublishProduct(product.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <CheckCircle size={16} />
                    Publish to Marketplace
                  </button>
                )}

                {product.publishedAt && (
                  <a
                    href={product.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <Eye size={16} />
                    View Listing
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="max-w-lg">
          <h3 className="text-lg font-bold mb-4">Add New Product</h3>
          <form onSubmit={handleUploadProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Golden Rice Variety"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="category" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select category</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Spices and Rhizomes">Spices and Rhizomes</option>
                <option value="Specialty Grains and Rice">Specialty Grains and Rice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                rows="3"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Describe your product..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="units"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per Unit (₹)</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="price"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploadingProduct}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {uploadingProduct ? 'Uploading...' : 'Upload Product'}
            </button>
          </form>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Marketplace Performance</h3>
          {dashboard?.products?.filter(p => p.publishedAt)?.map(product => (
            <div key={product.id} className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-bold mb-3">{product.name}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Views</p>
                  <p className="text-lg font-bold">—</p>
                </div>
                <div>
                  <p className="text-gray-600">Conversions</p>
                  <p className="text-lg font-bold">—</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerImagePortal;
