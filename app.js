// DOM Elements
const productsContainer = document.getElementById('products-container');
const loadingElement = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const brandFilter = document.getElementById('brand-filter');
const priceFilter = document.getElementById('price-filter');
const paginationContainer = document.getElementById('pagination');
const productsPerPage = 12;

// Global Variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

// Main function to fetch products
async function getProductsData() {
    const url = "https://api.daaif.net/products?limit=200&delay=3000";

    try {
        loadingElement.style.display = 'block';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        allProducts = Object.values(data.products);
        initFilters();
        applyFilters();
    } catch (error) {
        console.error('Error fetching products:', error);
        loadingElement.innerHTML = '<p class="text-red-500">Error loading products. Please try again later.</p>';
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Initialize filter options
function initFilters() {
    // Clear existing options
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    brandFilter.innerHTML = '<option value="">All Brands</option>';

    // Get unique categories and brands
    const categories = [...new Set(allProducts.map(p => p.category))];
    const brands = [...new Set(allProducts.map(p => p.brand))];

    // Populate category filter
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryFilter.appendChild(option);
    });

    // Populate brand filter
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

// Apply filters and show results
function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedBrand = brandFilter.value;
    const selectedPrice = priceFilter.value;

    filteredProducts = allProducts.filter(product => {
        // Search in multiple fields
        const searchFields = [
            product.title,
            product.description,
            product.brand,
            product.category,
            ...product.tags || []
        ].join(' ').toLowerCase();
        
        const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm);
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesBrand = !selectedBrand || product.brand === selectedBrand;
        
        let matchesPrice = true;
        if (selectedPrice) {
            switch(selectedPrice) {
                case 'under10': matchesPrice = product.price < 10; break;
                case '10to50': matchesPrice = product.price >= 10 && product.price <= 50; break;
                case '50to100': matchesPrice = product.price > 50 && product.price <= 100; break;
                case 'over100': matchesPrice = product.price > 100; break;
            }
        }
        
        return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    currentPage = 1;
    renderProducts();
    renderPagination();
}

// Render products to the page
function renderProducts() {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    productsContainer.innerHTML = '';

    if (productsToShow.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-700">No products found</h3>
                <p class="text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    productsToShow.forEach(product => {
        const avgRating = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
        const stars = Math.round(avgRating);
        
        let priceHtml = `$${product.price.toFixed(2)}`;
        if (product.discountPercentage) {
            const discountedPrice = product.price * (1 - product.discountPercentage / 100);
            priceHtml = `
                <span class="text-gray-500 line-through mr-2">$${product.price.toFixed(2)}</span>
                <span class="text-primary font-semibold">$${discountedPrice.toFixed(2)}</span>
                <span class="bg-red-100 text-red-800 text-xs font-medium ml-2 px-2 py-0.5 rounded">${product.discountPercentage}% OFF</span>
            `;
        }
        
        const html = `
            <div class="product-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300">
                <div class="relative overflow-hidden">
                    <img src="${product.images[0]}" alt="${product.title}" class="product-image w-full h-64 object-cover">
                    ${product.availabilityStatus === 'Low Stock' ? 
                        '<span class="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">Low Stock</span>' : ''}
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <button class="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-600 transition">Add to Cart</button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-gray-800 truncate">${product.title}</h3>
                        <div class="flex items-center">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star ${i < stars ? 'text-yellow-400' : 'text-gray-300'}"></i>`
                            ).join('')}
                            <span class="text-gray-500 text-sm ml-1">(${product.reviews.length})</span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
                    <div class="flex items-center justify-between">
                        <div class="text-lg font-semibold">${priceHtml}</div>
                        <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">${product.brand}</span>
                    </div>
                </div>
                <div class="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                    <button class="text-primary hover:text-blue-600 text-sm font-medium flex items-center">
                        <i class="far fa-heart mr-1"></i> Wishlist
                    </button>
                    <button class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center view-details" data-product-id="${product.id}">
                        <i class="fas fa-eye mr-1"></i> Quick View
                    </button>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', html);
    });

    // Add event listeners for quick view buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-product-id'));
            const product = allProducts.find(p => p.id === productId);
            if (product) showProductDetails(product);
        });
    });
}

// Render pagination controls
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = `px-3 py-1 mx-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            renderPagination();
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `px-3 py-1 mx-1 rounded ${currentPage === i ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderProducts();
            renderPagination();
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = `px-3 py-1 mx-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'}`;
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            renderPagination();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Show product details modal
function showProductDetails(product) {
    const avgRating = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
    const stars = Math.round(avgRating);

    const modalHtml = `
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="product-modal">
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="relative">
                    <button class="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100" id="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                    <div class="space-y-4">
                        <div class="rounded-lg overflow-hidden">
                            <img src="${product.images[0]}" alt="${product.title}" class="w-full h-auto">
                        </div>
                        <div class="grid grid-cols-4 gap-2">
                            ${product.images.map(img => 
                                `<img src="${img}" alt="" class="cursor-pointer border rounded hover:border-primary h-20 object-cover">`
                            ).join('')}
                        </div>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">${product.title}</h2>
                        <div class="flex items-center mb-4">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star ${i < stars ? 'text-yellow-400' : 'text-gray-300'}"></i>`
                            ).join('')}
                            <span class="text-gray-500 ml-2">${avgRating.toFixed(1)} (${product.reviews.length} reviews)</span>
                        </div>
                        
                        <div class="mb-6">
                            ${product.discountPercentage ? `
                                <div class="flex items-center">
                                    <span class="text-3xl font-bold text-primary">$${(product.price * (1 - product.discountPercentage/100)).toFixed(2)}</span>
                                    <span class="text-lg text-gray-500 line-through ml-2">$${product.price.toFixed(2)}</span>
                                    <span class="bg-red-100 text-red-800 text-sm font-medium ml-3 px-2 py-1 rounded">Save ${product.discountPercentage}%</span>
                                </div>
                            ` : `
                                <span class="text-3xl font-bold text-primary">$${product.price.toFixed(2)}</span>
                            `}
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold mb-2">Description</h3>
                            <p class="text-gray-600">${product.description}</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <h4 class="text-sm font-medium text-gray-500">Brand</h4>
                                <p class="font-medium">${product.brand}</p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-500">Category</h4>
                                <p class="font-medium capitalize">${product.category}</p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-500">Stock</h4>
                                <p class="font-medium ${product.stock < 10 ? 'text-yellow-600' : 'text-green-600'}">${product.stock} available</p>
                            </div>
                            <div>
                                <h4 class="text-sm font-medium text-gray-500">SKU</h4>
                                <p class="font-medium">${product.sku || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-4 mb-6">
                            <div class="flex items-center border rounded-md">
                                <button class="px-3 py-2 text-gray-600 hover:text-primary">-</button>
                                <span class="px-3 py-2 border-x">1</span>
                                <button class="px-3 py-2 text-gray-600 hover:text-primary">+</button>
                            </div>
                            <button class="flex-1 bg-primary hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium transition">
                                Add to Cart
                            </button>
                        </div>
                        
                        <div class="border-t pt-4">
                            <div class="flex items-center text-sm text-gray-600 mb-2">
                                <i class="fas fa-truck mr-2"></i>
                                <span>${product.shippingInformation || 'Free shipping on all orders'}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600 mb-2">
                                <i class="fas fa-shield-alt mr-2"></i>
                                <span>${product.warrantyInformation || '1-year manufacturer warranty'}</span>
                            </div>
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-undo mr-2"></i>
                                <span>${product.returnPolicy || '30-day return policy'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Reviews Section -->
                <div class="border-t p-6">
                    <h3 class="text-xl font-semibold mb-4">Customer Reviews</h3>
                    ${product.reviews.length > 0 ? `
                        <div class="space-y-4">
                            ${product.reviews.map(review => `
                                <div class="border-b pb-4">
                                    <div class="flex justify-between mb-2">
                                        <div>
                                            <span class="font-medium">${review.reviewerName}</span>
                                            <div class="flex items-center">
                                                ${Array.from({length: 5}, (_, i) => 
                                                    `<i class="fas fa-star ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'} text-sm"></i>`
                                                ).join('')}
                                            </div>
                                        </div>
                                        <span class="text-gray-500 text-sm">${new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                    <p class="text-gray-600">${review.comment}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-gray-500">No reviews yet.</p>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('product-modal').remove();
    });
    
    document.getElementById('product-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// Debounce function to improve performance
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    getProductsData();
    
    // Event listeners with debouncing for better performance
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    categoryFilter.addEventListener('change', applyFilters);
    brandFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
});