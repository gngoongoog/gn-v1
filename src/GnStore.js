import React, { useState, useMemo } from 'react';

const GnStore = () => {
  // --- البيانات الثابتة (بدون Google Sheets) ---
  const products = [
    {
      id: 1,
      name: 'كيبل USB-C سريع الشحن',
      price: 23000,
      originalPrice: 37000,
      rating: 4.5,
      reviews: 1243,
      image: 'https://images.unsplash.com/photo-1583863788434-e8ec2120f9de?w=300&h=300&fit=crop',
      category: 'كيبلات',
      discount: 38,
      bestseller: true
    },
    {
      id: 2,
      name: 'سماعات بلوتوث لاسلكية عالية الجودة',
      price: 129000,
      originalPrice: 215000,
      rating: 4.7,
      reviews: 856,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      category: 'سماعات',
      discount: 40
    },
    {
      id: 3,
      name: 'شاحن لاسلكي سريع 15W',
      price: 47000,
      originalPrice: 72000,
      rating: 4.3,
      reviews: 567,
      image: 'https://images.unsplash.com/photo-1609205807107-e8ec2120f9de?w=300&h=300&fit=crop',
      category: 'شاحنات',
      discount: 34
    },
    {
      id: 4,
      name: 'حامي شاشة زجاجي مقاوم للكسر',
      price: 13000,
      originalPrice: 23000,
      rating: 4.6,
      reviews: 2341,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
      category: 'لزقات حماية',
      discount: 44,
      bestseller: true
    }
  ];

  const categories = ['all', 'اكسسوارات', 'شاحنات', 'كيبلات', 'سماعات', 'لزقات حماية'];

  // --- الحالة ---
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('gnstore_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('gnstore_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const productsPerPage = 50;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' د.ع';
  };

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) {
      alert('السلة فارغة!');
      return;
    }

    const phoneNumber = '9647707409507';
    let message = '🛍️ *طلب جديد من متجر Gn Store*\n\n';
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      message += `   الكمية: ${item.quantity}\n`;
      message += `   السعر: ${formatPrice(item.price)}\n`;
      message += `   المجموع: ${formatPrice(item.price * item.quantity)}\n\n`;
    });
    message += `*المجموع الكلي: ${formatPrice(cartTotal)}*\n\n`;
    message += 'شكراً لاختياركم متجر Gn Store ❤️';

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty === 0) removeFromCart(id);
    else setCart(cart.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const toggleWishlist = (product) => {
    const inList = wishlist.some(item => item.id === product.id);
    setWishlist(inList
      ? wishlist.filter(item => item.id !== product.id)
      : [...wishlist, product]
    );
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discount}%
          </div>
        )}
        {product.bestseller && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            الأكثر مبيعاً
          </div>
        )}
        <button
          onClick={() => toggleWishlist(product)}
          className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${
            wishlist.some(i => i.id === product.id)
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill={wishlist.some(i => i.id === product.id) ? 'currentColor' : 'none'} />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={i < Math.floor(product.rating) ? '#fbbf24' : '#d1d5db'} stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 mr-1">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-purple-600">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through mr-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addToCart(product)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-1"
          >
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Gn Store</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ابحث عن المنتجات..."
                className="w-full px-4 py-2 pr-10 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <svg className="absolute right-3 top-2.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <button
              onClick={() => setCurrentView('cart')}
              className="relative p-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const Categories = () => (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'جميع المنتجات' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ProductGrid = () => (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600">
          عرض {paginatedProducts.length} من أصل {filteredProducts.length} منتج
        </p>
      </div>
      <div className={`grid gap-6 ${viewMode === 'grid' 
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
        : 'grid-cols-1'}`}>
        {paginatedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );

  const CartView = () => (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">سلة التسوق</h2>
        <button
          onClick={() => setCurrentView('home')}
          className="text-purple-600 hover:text-purple-700"
        >
          العودة للتسوق
        </button>
      </div>
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">سلة التسوق فارغة</p>
          <button
            onClick={() => setCurrentView('home')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ابدأ التسوق
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-purple-600 font-bold">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ملخص الطلب</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>التوصيل:</span>
                <span className="text-green-600">مجاني</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>المجموع الكلي:</span>
                <span className="text-purple-600">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <button
              onClick={sendOrderToWhatsApp}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
            >
              إرسال الطلب عبر الواتساب
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <Categories />
      {currentView === 'home' ? <ProductGrid /> : <CartView />}
    </div>
  );
};

export default GnStore;
