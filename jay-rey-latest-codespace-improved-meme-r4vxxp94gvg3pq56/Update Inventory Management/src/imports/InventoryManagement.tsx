import { useState } from 'react';
import { ArrowLeft, Package, AlertTriangle, TrendingUp, TrendingDown, Edit2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';



// 💰 FXB CURRENCY FORMATTER (UGX)
// - Centralized so ALL pricing across admin feels consistent
// - Uses Intl for real-world formatting (commas, spacing, etc)
const formatUGX = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0 // UGX doesn't typically use cents
  }).format(amount);
};



interface Product {
  id: number;
  title: string;
  image: string;
  price: number;
  stock?: number;
  lowStockThreshold?: number;
}

interface InventoryManagementProps {
  products: Product[];
  onBack: () => void;
  onUpdateProducts: (products: Product[]) => void;
}

export function InventoryManagement({ products, onBack, onUpdateProducts }: InventoryManagementProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [thresholdValue, setThresholdValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const productsWithStock = products.map(p => ({
    ...p,
    stock: p.stock ?? 100,
    lowStockThreshold: p.lowStockThreshold ?? 10
  }));

  const lowStockItems = productsWithStock.filter(p => p.stock <= p.lowStockThreshold);
  const outOfStockItems = productsWithStock.filter(p => p.stock === 0);
  const totalValue = productsWithStock.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const handleEdit = (product: Product & { stock: number; lowStockThreshold: number }) => {
    setEditingId(product.id);
    setStockValue(product.stock.toString());
    setThresholdValue(product.lowStockThreshold.toString());
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);

    try {
      const updatedProducts = products.map(p =>
        p.id === id
          ? {
              ...p,
              stock: parseInt(stockValue) || 0,
              lowStockThreshold: parseInt(thresholdValue) || 10
            }
          : p
      );

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
        throw new Error(data.error || 'Failed to update inventory');
      }

      onUpdateProducts(updatedProducts);
      setEditingId(null);
      toast.success('Inventory updated successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setStockValue('');
    setThresholdValue('');
  };

  return (
    <div className="size-full bg-gray-50 overflow-auto">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-50 shadow-md">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-lg flex-1">Inventory Management</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Products</span>
            </div>
            <p className="text-2xl font-bold">{productsWithStock.length}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Total Value</span>
            </div>
           <p className="text-2xl font-bold">{formatUGX(totalValue)}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Low Stock</span>
            </div>
            <p className="text-2xl font-bold">{lowStockItems.length}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold">{outOfStockItems.length}</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">Low Stock Alert</span>
            </div>
            <p className="text-sm text-orange-700">
              {lowStockItems.length} product(s) are running low on stock
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
            <h2 className="text-lg font-medium">Inventory List</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {productsWithStock.map((product) => {
              const isEditing = editingId === product.id;
              const isLowStock = product.stock <= product.lowStockThreshold;
              const isOutOfStock = product.stock === 0;

              return (
                <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium line-clamp-1 mb-1">{product.title}</h3>
                     <p className="text-sm font-semibold text-indigo-600 tracking-tight">
  {formatUGX(product.price)}
</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium w-20">Stock:</label>
                            <input
                              type="number"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium w-20">Alert at:</label>
                            <input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) => setThresholdValue(e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                          {isLowStock && !isOutOfStock && (
                            <span className="text-xs text-orange-600">• Low Stock Alert</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(product.id)}
                            disabled={isSaving}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
