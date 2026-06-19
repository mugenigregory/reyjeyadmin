import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';




// 🎯 PURE DISPLAY FORMATTER (NO CONVERSION)
// We keep values exactly as stored, only change how they look
const formatUGX = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};


interface Product {
  id: number;
  image: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  category?: string;
}

interface AdminPanelProps {
  products: Product[];
  onBack: () => void;
  onUpdateProducts: (products: Product[]) => void;
}

export function AdminPanel({ products, onBack, onUpdateProducts }: AdminPanelProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm(product);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setForm({
      title: '',
      price: 0,
      image: '',
      rating: 5,
      reviewCount: 0,
      category: 'Electronics'
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result as string;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-fdb4ad6b/upload-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ image: base64Image })
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        setForm({ ...form, image: data.url });
        toast.success('Image uploaded successfully!');
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.price || !form.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      let updatedProducts;

      if (isAdding) {
        const newProduct = {
          ...form,
          id: Math.max(...products.map(p => p.id)) + 1,
        } as Product;
        updatedProducts = [...products, newProduct];
      } else if (editingProduct) {
        updatedProducts = products.map(p =>
          p.id === editingProduct.id ? { ...p, ...form } : p
        );
      }

      // Save to backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-fdb4ad6b/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ products: updatedProducts })
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save product');
      }

      onUpdateProducts(updatedProducts);
      toast.success(isAdding ? 'Product added successfully!' : 'Product updated successfully!');

      setEditingProduct(null);
      setIsAdding(false);
      setForm({});
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsAdding(false);
    setForm({});
  };

  if (editingProduct || isAdding) {
    return (
      <div className="size-full bg-gray-50 overflow-auto">
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-50 shadow-md">
          <div className="p-4 flex items-center gap-3">
            <button onClick={handleCancel} className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white text-lg flex-1">
              {isAdding ? 'Add Product' : 'Edit Product'}
            </h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Product Title *</label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter product title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product Image *</label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Image</span>
                    </>
                  )}
                </button>
                <div className="text-xs text-gray-500 text-center">
                  Or paste image URL below (max 5MB)
                </div>
                <input
                  type="text"
                  value={form.image || ''}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {form.image && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (UGX) *</label>
                <input
                  type="number"
                  step="1"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Original Price(UGX)</label>
                <input
                  type="number"
                  step="1"
                  value={form.originalPrice || ''}
                  onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating || 5}
                  onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Review Count</label>
                <input
                  type="number"
                  value={form.reviewCount || 0}
                  onChange={(e) => setForm({ ...form, reviewCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Badge (Optional)</label>
              <input
                type="text"
                value={form.badge || ''}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="Best Seller, New, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
       <select
  value={form.category || 'Electronics'}
  onChange={(e) => setForm({ ...form, category: e.target.value })}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
>
  <option value="Electronics">Electronics</option>
  <option value="Fashion">Fashion</option>
  <option value="Home">Home</option>
  <option value="Books">Books</option>
  <option value="Beauty">Beauty</option>
  <option value="Sports">Sports</option>
  <option value="Toys">Toys</option>
</select>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white p-4 shadow-lg border-t border-gray-200 rounded-lg flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Product'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-gray-50 overflow-auto">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-50 shadow-md">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-lg flex-1">Admin Panel</h1>
          <button
            onClick={handleAdd}
            className="bg-white text-indigo-600 p-2 rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
            <h2 className="text-lg font-medium">Manage Products</h2>
            <p className="text-sm text-gray-600">Total: {products.length} products</p>
          </div>

          <div className="divide-y divide-gray-200">
            {products.map((product) => (
              <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-1 mb-1">{product.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium text-indigo-600">{formatUGX(product.price)}</span>
                      {product.originalPrice && (
                        <span className="line-through">{formatUGX(product.originalPrice)}</span>
                      )}   
                      <span>★ {product.rating}</span>
                    </div>
                    {product.badge && (
                      <span className="inline-block mt-1 text-xs bg-gradient-to-r from-pink-500 to-orange-500 text-white px-2 py-1 rounded-full">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
