import { useState, useEffect, useRef } from 'react';
import { Menu, Search, ShoppingCart, MapPin, ChevronDown, X } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { CategoryChip } from './components/CategoryChip';
import { ProductDetail } from './components/ProductDetail';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { InventoryManagement } from './components/InventoryManagement';
import { OrderTracking } from './components/OrderTracking';
import { Analytics } from './components/Analytics';
import { TermsOfUse } from './components/TermsOfUse';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Sidebar } from './components/Sidebar';
import { SplashScreen } from './components/SplashScreen';
import { ProductCardSkeleton, PageTransitionLoader } from './components/SkeletonLoader';
import { Toast } from './components/Toast';
import { NotificationSystem } from './components/NotificationSystem';
import type { Notification } from './components/NotificationSystem';
import { Review } from './components/ReviewsSection';
import { toast } from 'sonner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
const categories = [
  'All',
  'Electronics',
  'Fashion',
  'Home',
  'Books',
  'Beauty',
  'Sports',
  'Toys'
];

const initialProducts = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1707485122968-56916bd2c464?w=400',
    title: 'Latest Smartphone - 5G Enabled with Advanced Camera System',
    price: 699.99,
    originalPrice: 899.99,
    rating: 4.5,
    reviewCount: 12847,
    badge: "Today's Deal",
    category: 'Electronics',
    stock: 45,
    lowStockThreshold: 10
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1760712491539-431d07f3279a?w=400',
    title: 'Premium Laptop Bundle with Phone and Wireless Earbuds',
    price: 1299.99,
    originalPrice: 1599.99,
    rating: 4.8,
    reviewCount: 8921,
    badge: 'Best Seller',
    category: 'Electronics',
    stock: 23,
    lowStockThreshold: 10
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1771860886819-1c75b9c0d0cb?w=400',
    title: 'Apple iPad and iPhone Collection - Latest Generation',
    price: 2499.99,
    rating: 5,
    reviewCount: 15234,
    badge: 'Premium',
    category: 'Electronics',
    stock: 8,
    lowStockThreshold: 10
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1600247354058-a55b0f6fb720?w=400',
    title: 'Classic Plaid Dress Shirt - Business Casual Wear',
    price: 34.99,
    originalPrice: 49.99,
    rating: 4.3,
    reviewCount: 2841,
    category: 'Fashion',
    stock: 150,
    lowStockThreshold: 20
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1774691799598-71e688b1bf7f?w=400',
    title: 'Colorful Fashion Collection - Trending Styles',
    price: 89.99,
    rating: 4.6,
    reviewCount: 1923,
    badge: 'New',
    category: 'Fashion',
    stock: 0,
    lowStockThreshold: 15
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1567016526105-22da7c13161a?w=400',
    title: 'Modern Gray Leather Armchair - Premium Home Furniture',
    price: 449.99,
    originalPrice: 599.99,
    rating: 4.7,
    reviewCount: 3421,
    category: 'Home',
    stock: 12,
    lowStockThreshold: 5
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1662059361834-d361807d63e7?w=400',
    title: 'Contemporary Living Room Set with Large Window View',
    price: 1899.99,
    rating: 4.9,
    reviewCount: 892,
    badge: 'Premium',
    category: 'Home',
    stock: 5,
    lowStockThreshold: 3
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1567016530961-54fd42f2d51f?w=400',
    title: 'Artisan Blue Ceramic Mug - Perfect for Coffee Lovers',
    price: 19.99,
    originalPrice: 29.99,
    rating: 4.4,
    reviewCount: 5621,
    category: 'Home',
    stock: 200,
    lowStockThreshold: 30
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1761641466573-f240b6e446de?w=400',
    title: 'Gaming Controller Bundle with Phone and Earbuds',
    price: 149.99,
    rating: 4.6,
    reviewCount: 7234,
    badge: "Today's Deal",
    category: 'Electronics',
    stock: 67,
    lowStockThreshold: 15
  },
  {
    id: 10,
    image: 'https://images.unsplash.com/photo-1509764866569-93cd1fc07dc4?w=400',
    title: 'Luxury Gray Padded Armchair - Modern Home Decor',
    price: 379.99,
    originalPrice: 499.99,
    rating: 4.8,
    reviewCount: 2145,
    category: 'Home',
    stock: 3,
    lowStockThreshold: 5
  },
];

type View = 'home' | 'product' | 'cart' | 'checkout' | 'success' | 'admin-products' | 'admin-inventory' | 'admin-orders' | 'admin-analytics' | 'terms' | 'privacy' | 'deals' | 'offers';

interface CartItem {
  id: number;
  image: string;
  title: string;
  price: number;
  quantity: number;
}

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
  stock?: number;
  lowStockThreshold?: number;
}

interface SavedItem {
  id: number;
  image: string;
  title: string;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  address: string;
  paymentMethod: string;
}

const cities = [
  'Kampala',
  'Entebbe',
  'Wakiso',
  'Mukono',
  'Jinja',
  'Mbarara',
  'Gulu',
  'Lira'
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // 🎯 Controls skeleton loading for products (NOT page navigation)
const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Kampala');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageViews, setPageViews] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Scroll detection for header hide/show
  useEffect(() => {
    if (currentView !== 'home') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);


   // ===============================
// 🔔 PUSH NOTIFICATION REGISTRATION
// ===============================
useEffect(() => {
  const registerPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BNeGpTTHVmpyO7dJMqCMd-1thKIBErmgkYPgu5vxgYgcTuIb1zwrHnXkt0LjuZmqm1qPUK3PucuXbVYWCPwUEtg'
        ),
      });

      console.log('🔔 Push Subscription:', subscription);

      // 👉 send to backend later
await fetch('/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription),
  headers: {
    'Content-Type': 'application/json',
  },
});

    } catch (err) {
      console.log('Push error:', err);
    }
  };

  registerPush();
}, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);

    const views = parseInt(localStorage.getItem('pageViews') || '0');
    setPageViews(views + 1);
    localStorage.setItem('pageViews', (views + 1).toString());

    const handleAdminLoginEvent = () => setShowAdminLogin(true);
    document.addEventListener('show-admin-login', handleAdminLoginEvent);

    // Load saved data from localStorage
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedReviews = localStorage.getItem('reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    const savedCartItems = localStorage.getItem('cart');
    if (savedCartItems) setCart(JSON.parse(savedCartItems));

    const savedForLater = localStorage.getItem('savedItems');
    if (savedForLater) setSavedItems(JSON.parse(savedForLater));

    // Load products from backend
    const loadProducts = async () => {
      setIsProductsLoading(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-fdb4ad6b/products`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );

        const data = await response.json();

        if (data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          // Initialize backend with default products if empty
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-fdb4ad6b/products`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ products: initialProducts })
            }
          );
          setProducts(initialProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products. Using local data.');
        setProducts(initialProducts);
      } finally {
        setIsProductsLoading(false);
      }
    };

    loadProducts();

    return () => {
      clearTimeout(timer);
      document.removeEventListener('show-admin-login', handleAdminLoginEvent);
    };
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Save reviews to localStorage
  useEffect(() => {
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save savedItems to localStorage
  useEffect(() => {
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    document.title = 'Jayrey - Your Trusted Shopping Partner in Uganda';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Shop electronics, fashion, home goods and more at Jayrey. Fast delivery across Uganda. Mobile money payments accepted.');
    }
  }, [currentView]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView('product');
      setIsLoading(false);
      window.scrollTo(0, 0);
    }, 300);
    if (product.stock === 0) {
      toast.error('This product is currently out of stock');
    } else if ((product.stock ?? 100) <= (product.lowStockThreshold ?? 10)) {
      toast.info(`Only ${product.stock} left in stock!`);
    }
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        toast.success(`Added ${quantity} more to cart!`);
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`${product.title.substring(0, 30)}... added to cart!`);
      return [...prevCart, {
        id: product.id,
        image: product.image,
        title: product.title,
        price: product.price,
        quantity
      }];
    });
  };


  const handleBuyNow = (product: Product, quantity: number) => {
  // 🛒 Step 1: Add item to cart (reuses existing logic)
  handleAddToCart(product, quantity);

  // ⚡ Step 2: show loading transition (Dribbble-style feel)
  setIsLoading(true);

  // ⏳ Step 3: delay for smooth UX transition
  setTimeout(() => {
    // 🧾 Step 4: navigate to checkout page
    setCurrentView('checkout');

    // 🧹 Step 5: stop loader
    setIsLoading(false);
  }, 300);
};

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    const item = cart.find(c => c.id === id);
    if (item) {
      toast.success(`${item.title.substring(0, 30)}... removed from cart`);
    }
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleSaveForLater = (id: number) => {
    const item = cart.find(c => c.id === id);
    if (item) {
      setSavedItems(prev => {
        const exists = prev.find(s => s.id === id);
        if (exists) return prev;
        return [...prev, {
          id: item.id,
          image: item.image,
          title: item.title,
          price: item.price
        }];
      });
      setCart(prevCart => prevCart.filter(c => c.id !== id));
      toast.success('Item saved for later!');
    }
  };

  const handleMoveToCart = (id: number) => {
    const item = savedItems.find(s => s.id === id);
    if (item) {
      handleAddToCart(item as Product, 1);
      setSavedItems(prev => prev.filter(s => s.id !== id));
      toast.success('Moved to cart!');
    }
  };

  const handleRemoveSaved = (id: number) => {
    setSavedItems(prev => prev.filter(s => s.id !== id));
    toast.success('Item removed');
  };

  const handlePlaceOrder = (orderData: { customerName: string; phone: string; address: string; paymentMethod: string }) => {
    const newOrder: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
      customerName: orderData.customerName,
      phone: orderData.phone,
      items: cart.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price
      })),
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      date: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      address: orderData.address,
      paymentMethod: orderData.paymentMethod
    };

    setOrders(prev => [newOrder, ...prev]);

    // Add notification for admin
    addNotification({
      type: 'order',
      title: 'New Order Received',
      message: `Order ${newOrder.id} from ${orderData.customerName} - UGX ${newOrder.total.toLocaleString()}`
    });

    setIsLoading(true);
    setTimeout(() => {
      setCurrentView('success');
      setIsLoading(false);
      setTimeout(() => {
        setCart([]);
        setCurrentView('home');
      }, 3000);
    }, 300);
  };

  const handleAdminLogin = (password: string) => {
    if (password === 'admin123') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setCurrentView('admin-products');
      toast.success('Welcome Admin!');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleNavigate = (view: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView(view as View);
      setIsLoading(false);
      window.scrollTo(0, 0);
    }, 300);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setCurrentView('home');
    toast.success('Logged out successfully');
  };

  const handleAddReview = (review: Omit<Review, 'id' | 'date' | 'helpful'>) => {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      date: new Date(),
      helpful: 0
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r)
    );
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    const addedProducts = updatedProducts.filter(
      p => !products.find(existing => existing.id === p.id)
    );

    // 🔔 BROADCAST TO USERS (NEW PRODUCTS)
addedProducts.forEach(product => {
  addNotification({
    type: 'product',
    title: '🆕 New Product Added',
    message: `${product.title} - UGX ${product.price.toLocaleString()}`
  });

  // future: push notification backend trigger
});

    if (addedProducts.length > 0) {
      // Notify users about new products
      addedProducts.forEach(product => {
        addNotification({
          type: 'product',
          title: 'New Product Added!',
          message: `${product.title} - UGX ${product.price.toLocaleString()}`
        });
      });
    }

    setProducts(updatedProducts);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const dealProducts = products.filter(p => p.badge === "Today's Deal" || p.originalPrice);
  const specialOffers = products.filter(p => p.badge === 'Best Seller' || p.badge === 'Premium');

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <>
        <Toast />
        <PageTransitionLoader />
      </>
    );
  }

  if (currentView === 'admin-products' && isAdmin) {
    return (
      <>
        <Toast />
        <AdminPanel
          products={products}
          onBack={() => handleNavigate('home')}
          onUpdateProducts={handleUpdateProducts}
        />
      </>
    );
  }

  if (currentView === 'admin-inventory' && isAdmin) {
    return (
      <>
        <Toast />
        <InventoryManagement
          products={products}
          onBack={() => handleNavigate('home')}
          onUpdateProducts={setProducts}
        />
      </>
    );
  }

  if (currentView === 'admin-orders' && isAdmin) {
    return (
      <>
        <Toast />
        <OrderTracking onBack={() => handleNavigate('home')} orders={orders} onUpdateOrders={setOrders} />
      </>
    );
  }

  if (currentView === 'admin-analytics' && isAdmin) {
    return (
      <>
        <Toast />
        <Analytics
          onBack={() => handleNavigate('home')}
          products={products}
          orders={orders}
          pageViews={pageViews}
        />
      </>
    );
  }

  if (currentView === 'terms') {
    return (
      <>
        <Toast />
        <TermsOfUse onBack={() => handleNavigate('home')} />
      </>
    );
  }

  if (currentView === 'privacy') {
    return (
      <>
        <Toast />
        <PrivacyPolicy onBack={() => handleNavigate('home')} />
      </>
    );
  }

  if (currentView === 'deals') {
    return (
      <>
        <Toast />
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAdmin={isAdmin}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <div className="size-full bg-gray-50 overflow-auto">
          <header className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-40 shadow-md">
            <div className="p-4 flex items-center gap-3">
              <Menu className="w-6 h-6 text-white cursor-pointer" onClick={() => setSidebarOpen(true)} />
              <h1 className="text-white text-lg flex-1">Today's Deals</h1>
            </div>
          </header>
          <div className="p-4">
            <h2 className="text-xl font-medium mb-4">Special Deals Just For You</h2>
            <div className="grid grid-cols-2 gap-3">
              {dealProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'offers') {
    return (
      <>
        <Toast />
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAdmin={isAdmin}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        <div className="size-full bg-gray-50 overflow-auto">
          <header className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-40 shadow-md">
            <div className="p-4 flex items-center gap-3">
              <Menu className="w-6 h-6 text-white cursor-pointer" onClick={() => setSidebarOpen(true)} />
              <h1 className="text-white text-lg flex-1">Special Offers</h1>
            </div>
          </header>
          <div className="p-4">
            <h2 className="text-xl font-medium mb-4">Exclusive Offers</h2>
            <div className="grid grid-cols-2 gap-3">
              {specialOffers.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'success') {
    return (
      <>
        <Toast />
        <div className="size-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-5xl">✓</span>
            </div>
            <h1 className="text-3xl font-medium mb-2 text-gray-900">Order Placed!</h1>
            <p className="text-lg text-gray-600 mb-1">Thank you for your purchase</p>
            <p className="text-sm text-gray-500">Redirecting to home...</p>
          </div>
        </div>
      </>
    );
  }

  if (currentView === 'checkout') {
    return (
      <>
        <Toast />
        <Checkout
          items={cart}
          onBack={() => setCurrentView('cart')}
          onPlaceOrder={handlePlaceOrder}
          selectedCity={selectedCity}
        />
      </>
    );
  }

  if (currentView === 'cart') {
    return (
      <>
        <Toast />
        <Cart
          items={cart}
          savedItems={savedItems}
          allProducts={products}
          onBack={() => setCurrentView('home')}
          onCheckout={() => setCurrentView('checkout')}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onSaveForLater={handleSaveForLater}
          onMoveToCart={handleMoveToCart}
          onRemoveSaved={handleRemoveSaved}
          onAddToCart={handleAddToCart}
        />
      </>
    );
  }

  if (currentView === 'product' && selectedProduct) {
    return (
      <>
        <Toast />
        <ProductDetail
          product={selectedProduct}
          allProducts={products}
          reviews={reviews.filter(r => r.productId === selectedProduct.id)}
          onBack={() => setCurrentView('home')}
          onAddToCart={handleAddToCart}
          onAddReview={handleAddReview}
          onMarkHelpful={handleMarkHelpful}
          selectedCity={selectedCity}
          onBuyNow={handleBuyNow}   // 🔥 ADD THIS LINE

        />
      </>
    );
  }

  return (
    <div className="size-full bg-gray-50 overflow-auto">
      <Toast />
      <PWAInstallBanner />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {showAdminLogin && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onCancel={() => setShowAdminLogin(false)}
        />
      )}

      {showCitySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCitySelector(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium">Select Delivery City</h2>
              <button onClick={() => setShowCitySelector(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setShowCitySelector(false);
                    toast.success(`Delivery location set to ${city}`);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedCity === city
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{city}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0 z-40 shadow-md transition-transform duration-300 ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <Menu className="w-6 h-6 text-white cursor-pointer" onClick={() => setSidebarOpen(true)} />
            <div className="text-white text-xl font-bold flex-1">Jayrey© 2026</div>
            <NotificationSystem
              isAdmin={isAdmin}
              notifications={isAdmin ? notifications : notifications.filter(n => n.type === 'product')}
              onMarkAsRead={handleMarkNotificationRead}
              onClearAll={handleClearAllNotifications}
            />
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-lg flex items-center shadow-sm">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none rounded-l-lg"
              />
              <button className="bg-gradient-to-r from-orange-400 to-pink-500 p-2 rounded-r-lg">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
            <button
              onClick={() => setCurrentView('cart')}
              className="relative"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Location */}
        <button
          onClick={() => setShowCitySelector(true)}
          className="w-full bg-indigo-700 px-3 py-2 flex items-center gap-2 hover:bg-indigo-800 transition-colors"
        >
          <MapPin className="w-4 h-4 text-white" />
          <span className="text-white text-sm flex-1 text-left">Deliver to {selectedCity}</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
      </header>

      {/* Categories */}
      <div className={`bg-white border-b border-gray-200 sticky z-30 shadow-sm transition-all duration-300 ${
        headerVisible ? 'top-[120px]' : 'top-0'
      }`}>
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 p-6 text-white shadow-lg">
        <h2 className="text-xl font-medium mb-1">Special Offers</h2>
        <p className="text-sm opacity-90">Shop exclusive deals and save big today</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleNavigate('deals')}
            className="bg-white text-indigo-600 px-5 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            Explore Deals
          </button>
          <button
            onClick={() => handleNavigate('offers')}
            className="bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            View Offers
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-3">
        <h2 className="text-lg font-medium mb-3">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Featured Products'}
          {filteredProducts.length > 0 && (
            <span className="text-sm text-gray-600 ml-2">({filteredProducts.length})</span>
          )}
        </h2>
{!isProductsLoading && filteredProducts.length === 0 ? (
            <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-shadow"
            >
              Clear filters
            </button>
          </div>
        ) : (
         <div className="grid grid-cols-2 gap-3">

  {/* 🧠 Skeleton loading (shows instantly) */}
  {isProductsLoading &&
    Array.from({ length: 6 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))
  }

  {/* ✅ Real products (after loading) */}
  {!isProductsLoading &&
    filteredProducts.map((product) => (
      <ProductCard
        key={product.id}
        id={product.id}
        image={product.image}
        title={product.title}
        price={product.price}
        originalPrice={product.originalPrice}
        rating={product.rating}
        reviewCount={product.reviewCount}
        badge={product.badge}
        onClick={() => handleProductClick(product)}
      />
    ))
  }

</div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 mt-8">
        <div className="text-center mb-4">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sm underline">Back to top</a>
        </div>
        <div className="text-xs text-center space-y-2 opacity-90">
          <div>Jayrey© 2026 </div>
          <div className="flex justify-center gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('terms'); }}>Conditions of Use</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('privacy'); }}>Privacy Notice</a>
            <a href="#">Your Privacy Choices</a>
          </div>
        </div>
      </div>
    </div>
  );
}


function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}