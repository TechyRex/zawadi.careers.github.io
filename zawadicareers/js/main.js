// Main JavaScript for Zawadi Careers

// DOM Elements
const elements = {
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    mobileNav: document.getElementById('mobileNav'),
    newsletterForm: document.getElementById('newsletterForm'),
    newsletterModal: document.getElementById('newsletterModal'),
    closeNewsletterModal: document.getElementById('closeNewsletterModal'),
    modalNewsletterForm: document.getElementById('modalNewsletterForm'),
    mobileSearchBtn: document.getElementById('mobileSearchBtn'),
    mobileSearchOverlay: document.getElementById('mobileSearchOverlay'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    mobileSearchInput: document.getElementById('mobileSearchInput')
};

// Initialize Home Page
const initHomePage = async () => {
    console.log('Initializing home page...');
    
    // Setup navigation
    setupNavigation();
    
    // Load categories
    await loadCategories();
    
    // Load featured blogs
    await loadFeaturedBlogs();
    
    // Setup newsletter forms
    setupNewsletterForms();
    
    // Setup modals
    setupModals();
    
    // Setup mobile search
    setupMobileSearch();
    
    // Track page view
    trackPageView();
};

// Setup Navigation
const setupNavigation = () => {
    if (elements.navToggle && elements.navMenu) {
        elements.navToggle.addEventListener('click', () => {
            elements.navMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.navMenu && elements.navMenu.classList.contains('active')) {
            if (!elements.navMenu.contains(e.target) && 
                !elements.navToggle.contains(e.target)) {
                elements.navMenu.classList.remove('active');
            }
        }
    });
};

// Load Categories for Homepage
const loadCategories = async () => {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (categories && categories.length > 0) {
            categoriesGrid.innerHTML = categories.map(category => `
                <div class="category-card">
                    <div class="category-icon" style="background-color: ${category.color}">
                        <i class="fas fa-${category.icon || 'folder'}"></i>
                    </div>
                    <div class="category-content">
                        <h3>${category.name}</h3>
                        <p>${category.description || 'Career development resources'}</p>
                    </div>
                    <div class="category-stats">
                        <div class="stat">
                            <span class="stat-number">${Math.floor(Math.random() * 50) + 10}</span>
                            <span class="stat-label">Articles</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${Math.floor(Math.random() * 1000) + 100}</span>
                            <span class="stat-label">Reads</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            categoriesGrid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-folder-open"></i>
                    <p>No categories available yet.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load categories. Please try again later.</p>
            </div>
        `;
    }
};

// Load Featured Blogs
const loadFeaturedBlogs = async () => {
    const featuredBlogs = document.getElementById('featuredBlogs');
    if (!featuredBlogs) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name, color)
            `)
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            featuredBlogs.innerHTML = blogs.map(blog => `
                <article class="blog-card">
                    <div class="blog-image-container">
                        ${blog.cover_image ? `
                            <img src="${blog.cover_image}" alt="${blog.title}" class="blog-image" loading="lazy">
                        ` : `
                            <div class="blog-image-placeholder" style="background: ${blog.categories?.color || '#1a73e8'}">
                                <i class="fas fa-newspaper"></i>
                            </div>
                        `}
                        <div class="category-badge" style="background-color: ${blog.categories?.color || '#1a73e8'}">
                            ${blog.categories?.name || 'Uncategorized'}
                        </div>
                    </div>
                    <div class="blog-content">
                        <div class="blog-meta">
                            <span>${SupabaseUtils.formatDate(blog.published_at)}</span>
                            <span class="read-time">
                                <i class="fas fa-clock"></i> ${blog.estimated_read_time || 5} min read
                            </span>
                        </div>
                        <h3><a href="blog-detail.html?id=${blog.id}">${blog.title}</a></h3>
                        <p class="blog-excerpt">${blog.excerpt || 'Read this insightful article...'}</p>
                        <div class="blog-footer">
                            <a href="blog-detail.html?id=${blog.id}" class="btn btn-outline btn-sm">
                                Read More <i class="fas fa-arrow-right"></i>
                            </a>
                            <div class="blog-stats">
                                <span><i class="far fa-eye"></i> ${blog.views_count || 0}</span>
                                <span><i class="far fa-heart"></i> ${blog.likes_count || 0}</span>
                            </div>
                        </div>
                    </div>
                </article>
            `).join('');
        } else {
            featuredBlogs.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-newspaper"></i>
                    <p>No articles published yet. Check back soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading featured blogs:', error);
        featuredBlogs.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load articles. Please try again later.</p>
            </div>
        `;
    }
};

// Setup Newsletter Forms
const setupNewsletterForms = () => {
    // Main newsletter form
    if (elements.newsletterForm) {
        elements.newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleNewsletterSubscription(elements.newsletterForm);
        });
    }
    
    // Modal newsletter form
    if (elements.modalNewsletterForm) {
        elements.modalNewsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleNewsletterSubscription(elements.modalNewsletterForm);
        });
    }
};

// Handle Newsletter Subscription
const handleNewsletterSubscription = async (form) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
        
        // Get form data
        const formData = new FormData(form);
        const email = formData.get('email') || 
                     form.querySelector('input[type="email"]').value;
        const name = formData.get('name') || 
                    form.querySelector('input[type="text"]')?.value || '';
        
        // Validate email
        if (!SupabaseUtils.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Insert into subscribers table
        const { data, error } = await supabase
            .from('subscribers')
            .insert([
                {
                    email: email,
                    name: name,
                    source: 'website'
                }
            ]);
        
        if (error) {
            // Check if it's a duplicate error
            if (error.code === '23505') {
                showNotification('You are already subscribed!', 'info');
                form.reset();
                return;
            }
            throw error;
        }
        
        // Show success message
        showNotification('Successfully subscribed! Check your email for confirmation.', 'success');
        form.reset();
        
        // Close modal if open
        if (elements.newsletterModal && elements.newsletterModal.classList.contains('active')) {
            elements.newsletterModal.classList.remove('active');
        }
        
    } catch (error) {
        console.error('Subscription error:', error);
        showNotification(error.message || 'Failed to subscribe. Please try again.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// Show Newsletter Modal
const showNewsletterModal = () => {
    // Show modal after 30 seconds or on scroll
    let modalShown = false;
    
    const showModal = () => {
        if (!modalShown && elements.newsletterModal) {
            // Check if user has already subscribed
            const hasSubscribed = localStorage.getItem('zawadi_newsletter_subscribed');
            
            if (!hasSubscribed) {
                elements.newsletterModal.classList.add('active');
                modalShown = true;
                
                // Setup close button
                if (elements.closeNewsletterModal) {
                    elements.closeNewsletterModal.addEventListener('click', () => {
                        elements.newsletterModal.classList.remove('active');
                    });
                }
            }
        }
    };
    
    // Show after 30 seconds
    setTimeout(showModal, 30000);
    
    // Show on scroll (50% of page)
    window.addEventListener('scroll', () => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercentage > 50 && !modalShown) {
            showModal();
        }
    });
};

// Setup Modals
const setupModals = () => {
    // Close modal when clicking outside
    if (elements.newsletterModal) {
        elements.newsletterModal.addEventListener('click', (e) => {
            if (e.target === elements.newsletterModal) {
                elements.newsletterModal.classList.remove('active');
            }
        });
    }
};

// Setup Mobile Search
const setupMobileSearch = () => {
    if (elements.mobileSearchBtn && elements.mobileSearchOverlay) {
        elements.mobileSearchBtn.addEventListener('click', () => {
            elements.mobileSearchOverlay.classList.add('active');
            elements.mobileSearchInput.focus();
        });
        
        elements.closeSearchBtn.addEventListener('click', () => {
            elements.mobileSearchOverlay.classList.remove('active');
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.mobileSearchOverlay.classList.contains('active')) {
                elements.mobileSearchOverlay.classList.remove('active');
            }
        });
        
        // Handle search input
        elements.mobileSearchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                await performSearch(query);
            }
        }, 300));
    }
};

// Perform Search
const performSearch = async (query) => {
    const searchResults = document.getElementById('mobileSearchResults');
    if (!searchResults) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name)
            `)
            .ilike('title', `%${query}%`)
            .eq('is_published', true)
            .limit(5);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            searchResults.innerHTML = blogs.map(blog => `
                <a href="blog-detail.html?id=${blog.id}" class="search-result-item">
                    <div class="search-result-content">
                        <h4>${blog.title}</h4>
                        <p>${blog.categories?.name || 'Uncategorized'} • ${SupabaseUtils.formatDate(blog.published_at)}</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </a>
            `).join('');
        } else {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No results found for "${query}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }
};

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Track Page View
const trackPageView = async () => {
    try {
        const ip = await SupabaseUtils.getUserIP();
        const pageUrl = window.location.href;
        const referrer = document.referrer;
        
        await supabase
            .from('user_analytics')
            .insert([
                {
                    page_url: pageUrl,
                    referrer: referrer || 'direct',
                    user_ip: ip,
                    user_agent: navigator.userAgent
                }
            ]);
    } catch (error) {
        console.error('Analytics error:', error);
    }
};

// Show Notification
const showNotification = (message, type = 'info') => {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
};

// Initialize Categories Page
const initCategoriesPage = async () => {
    console.log('Initializing categories page...');
    
    setupNavigation();
    await loadAllCategories();
    setupNewsletterForms();
    trackPageView();
};

// Load All Categories
const loadAllCategories = async () => {
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (!categoriesContainer) return;
    
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select(`
                *,
                blogs:blogs(count)
            `)
            .order('name');
        
        if (error) throw error;
        
        if (categories && categories.length > 0) {
            categoriesContainer.innerHTML = categories.map(category => `
                <div class="category-card-large" style="border-color: ${category.color}">
                    <div class="category-header">
                        <div class="category-icon-large" style="background-color: ${category.color}">
                            <i class="fas fa-${category.icon || 'folder'}"></i>
                        </div>
                        <div class="category-info">
                            <h3>${category.name}</h3>
                            <p class="category-description">${category.description || ''}</p>
                            <div class="category-stats">
                                <span><i class="fas fa-newspaper"></i> ${category.blogs?.[0]?.count || 0} Articles</span>
                                <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 1000) + 100} Reads</span>
                            </div>
                        </div>
                    </div>
                    <div class="category-actions">
                        <a href="blog.html?category=${category.id}" class="btn btn-outline">
                            <i class="fas fa-book-open"></i> Browse Articles
                        </a>
                        <button class="btn btn-primary subscribe-category" data-category="${category.id}">
                            <i class="fas fa-bell"></i> Get Updates
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners to subscribe buttons
            document.querySelectorAll('.subscribe-category').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const categoryId = e.target.dataset.category;
                    showCategorySubscribeModal(categoryId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
};

// Show Category Subscribe Modal
const showCategorySubscribeModal = (categoryId) => {
    // Implementation for category-specific subscription
    showNotification('Category subscription feature coming soon!', 'info');
};

// Add Notification Styles
const addNotificationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .notification-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            max-width: 400px;
            transform: translateX(150%);
            transition: transform 0.3s ease;
            z-index: 9999;
            border-left: 4px solid #1a73e8;
        }
        
        .notification-toast.show {
            transform: translateX(0);
        }
        
        .notification-toast.success {
            border-left-color: #34A853;
        }
        
        .notification-toast.error {
            border-left-color: #EA4335;
        }
        
        .notification-toast.info {
            border-left-color: #1a73e8;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
        
        .notification-toast.success .notification-content i {
            color: #34A853;
        }
        
        .notification-toast.error .notification-content i {
            color: #EA4335;
        }
        
        .notification-toast.info .notification-content i {
            color: #1a73e8;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.3s;
        }
        
        .notification-close:hover {
            background: #f5f5f5;
        }
    `;
    document.head.appendChild(style);
};

// Initialize on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add notification styles
    addNotificationStyles();
    
    // Add mobile search overlay styles if not present
    if (!document.querySelector('#mobileSearchStyles')) {
        const mobileSearchStyles = document.createElement('style');
        mobileSearchStyles.id = 'mobileSearchStyles';
        mobileSearchStyles.textContent = `
            .mobile-search-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: white;
                z-index: 2000;
                display: none;
                flex-direction: column;
            }
            
            .mobile-search-overlay.active {
                display: flex;
            }
            
            .search-container {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .search-container input {
                flex: 1;
                padding: 12px 15px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
            }
            
            .close-search {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #666;
                cursor: pointer;
            }
            
            .search-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .search-result-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 1px solid #eee;
                color: #333;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .search-result-content h4 {
                margin: 0 0 5px 0;
                font-size: 1rem;
            }
            
            .search-result-content p {
                margin: 0;
                font-size: 0.9rem;
                color: #666;
            }
            
            .no-results, .error-message {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
            
            .no-results i, .error-message i {
                font-size: 2rem;
                margin-bottom: 15px;
                color: #999;
            }
        `;
        document.head.appendChild(mobileSearchStyles);
    }
});

// Export functions for use in other modules
window.initHomePage = initHomePage;
window.initCategoriesPage = initCategoriesPage;
window.showNotification = showNotification;