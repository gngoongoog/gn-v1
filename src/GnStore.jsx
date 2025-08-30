import React, { useState, useEffect, useMemo } from 'react';

const GnStore = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('gnstore_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('gnstore_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const productsPerPage = 50;

  // ⚠️ استبدل YOUR_SHEET_ID بالرقم الحقيقي من رابط جدولك
  const GOOGLE_SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1EGDXv8mRcwfUQfmoY4ReWL4ShqFii-BYV42iSIfxa1k/gviz/tq?tqx=out:csv';

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        const csvText = await response.text();

        const rows = csvText.trim().split('\n');
        const headers = rows[0].split(','); // السطر الأول = العناوين

        const productsData = rows.slice(1).map(row => {
          const values = row.split(',');
          const product = {};

          headers.forEach((header, index) => {
            const value = values[index]?.trim().replace(/^"(.*)"$/, '$1') || '';
            product[header.trim()] = value;
          });

          return {
            id: parseInt(product.id) || Math.random(),
            name: product.name || 'منتج بدون اسم',
            price: parseInt(product.price) || 0,
            originalPrice: product.originalPrice ? parseInt(product.originalPrice) : undefined,
            rating: parseFloat(product.rating) || 4,
            reviews: parseInt(product.reviews) || 0,
            image: product.image || 'https://via.placeholder.com/300',
            category: product.category || 'اكسسوارات',
            discount: product.discount ? parseInt(product.discount) : undefined,
            bestseller: product.bestseller?.toLowerCase() === 'true',
          };
        });

        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error('خطأ في تحميل المنتجات:', err);
        setError('فشل تحميل المنتجات. تحقق من رابط Google Sheets.');
        setProducts([]);
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('gnstore_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('gnstore_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' د.ع';
  };

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) {
      alert('السلة فارغة! يرجى إضافة منتجات.');
      return;
    }

    const phoneNumber = '9647707409507'; // بدون +
    let message = '🛍️ *طلب جديد من متجر Gn Store*\n\n';
    message += '*تفاصيل الطلب:*\n\n';

    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      message += `   الكمية: ${item.quantity}\n`;
      message += `   السعر: ${formatPrice(item.price)}\n`;
      message += `   المجموع: ${formatPrice(item.price * item.quantity)}\n\n`;
    });

    message += `*المجموع الكلي: ${formatPrice(cartTotal)}*\n\n`;
    message += 'سأقوم بالتواصل معكم لتأكيد الطلب والتوصيل.\n\n';
    message += 'شكراً لاختياركم متجر Gn Store ❤️';

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return ['all', ...uniqueCategories];
  }, [products]);

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
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty === 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: qty } : item
      ));
    }
  };

  const toggleWishlist = (product) => {
    const inList = wishlist.some(item => item.id === product.id);
    if (inList) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            أضف للسلة
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16,6 12,2 8,6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
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
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-1 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                توصيل مجاني
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                ضمان أصلي
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                استبدال مجاني
              </div>
            </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {viewMode === 'grid' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              )}
            </button>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductGrid = () => {
    if (loading) {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-lg text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            عرض {paginatedProducts.length} من أصل {filteredProducts.length} منتج
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">الصفحة:</span>
            <select
              value={currentPage}
              onChange={e => setCurrentPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[...Array(totalPages)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">من {totalPages}</span>
          </div>
        </div>
        <div className={`grid gap-6 ${viewMode === 'grid' 
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
          : 'grid-cols-1'}`}>
          {paginatedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              السابق
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    );
  };

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
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-gray-400 mb-4">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.4" />
              </svg>
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