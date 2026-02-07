// Blog JavaScript for Zawadi Careers

// Blog Listing Page
const initBlogPage = async () => {
    console.log('Initializing blog page...');
    
    // Setup navigation
    setupNavigation();
    
    // Load initial blogs
    await loadBlogs();
    
    // Load categories for filter
    await loadBlogCategories();
    
    // Load sidebar content
    await loadSidebarContent();
    
    // Setup filters
    setupBlogFilters();
    
    // Setup search
    setupBlogSearch();
    
    // Setup newsletter forms
    setupNewsletterForms();
    
    // Track page view
    trackPageView();
};

// Load Blogs with Pagination
const loadBlogs = async (page = 1, category = '', sort = 'newest', filter = 'all') => {
    const blogGrid = document.getElementById('blogGrid');
    const pagination = document.getElementById('pagination');
    
    if (!blogGrid) return;
    
    const itemsPerPage = 9;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;
    
    try {
        // Build query
        let query = supabase
            .from('blogs')
            .select(`
                *,
                categories (name, color),
                likes(count)
            `, { count: 'exact' })
            .eq('is_published', true);
        
        // Apply category filter
        if (category) {
            query = query.eq('category_id', category);
        }
        
        // Apply sorting
        switch(sort) {
            case 'newest':
                query = query.order('published_at', { ascending: false });
                break;
            case 'oldest':
                query = query.order('published_at', { ascending: true });
                break;
            case 'popular':
                query = query.order('likes_count', { ascending: false });
                break;
            case 'views':
                query = query.order('views_count', { ascending: false });
                break;
        }
        
        // Apply additional filters
        if (filter === 'featured') {
            // For featured, we might want to manually feature some blogs
            // For now, just show recent
            query = query.order('published_at', { ascending: false });
        } else if (filter === 'popular') {
            query = query.order('likes_count', { ascending: false });
        }
        
        // Get count for pagination
        const { count, error: countError } = await query;
        const totalBlogs = count || 0;
        const totalPages = Math.ceil(totalBlogs / itemsPerPage);
        
        // Get paginated data
        const { data: blogs, error } = await query
            .range(start, end);
        
        if (error) throw error;
        
        // Display blogs
        if (blogs && blogs.length > 0) {
            blogGrid.innerHTML = blogs.map(blog => createBlogCard(blog)).join('');
        } else {
            blogGrid.innerHTML = `
                <div class="no-data" style="grid-column: 1 / -1;">
                    <i class="fas fa-newspaper"></i>
                    <h3>No articles found</h3>
                    <p>Try adjusting your filters or check back later for new content.</p>
                </div>
            `;
        }
        
        // Display pagination
        if (pagination && totalPages > 1) {
            pagination.innerHTML = createPagination(page, totalPages);
            
            // Add pagination event listeners
            document.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const targetPage = parseInt(e.target.dataset.page);
                    if (targetPage && targetPage !== page) {
                        await loadBlogs(targetPage, category, sort, filter);
                    }
                });
            });
        } else if (pagination) {
            pagination.innerHTML = '';
        }
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load articles</h3>
                <p>Please try again later or contact support if the problem persists.</p>
            </div>
        `;
    }
};

// Create Blog Card HTML
const createBlogCard = (blog) => {
    return `
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
                        <span><i class="far fa-comment"></i> ${blog.comments_count || 0}</span>
                    </div>
                </div>
            </div>
        </article>
    `;
};

// Create Pagination HTML
const createPagination = (currentPage, totalPages) => {
    let html = '';
    
    // Previous button
    html += `
        <button class="page-link ${currentPage === 1 ? 'disabled' : ''}" 
                data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button class="page-link ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    html += `
        <button class="page-link ${currentPage === totalPages ? 'disabled' : ''}" 
                data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    return html;
};

// Load Blog Categories for Filter
const loadBlogCategories = async () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const sidebarCategories = document.getElementById('sidebarCategories');
    
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (categories && categories.length > 0) {
            // Populate category filter
            if (categoryFilter) {
                categoryFilter.innerHTML = `
                    <option value="">All Categories</option>
                    ${categories.map(cat => `
                        <option value="${cat.id}">${cat.name}</option>
                    `).join('')}
                `;
            }
            
            // Populate sidebar categories
            if (sidebarCategories) {
                sidebarCategories.innerHTML = categories.map(cat => `
                    <a href="blog.html?category=${cat.id}" class="category-link" style="--category-color: ${cat.color}">
                        <span class="category-dot" style="background-color: ${cat.color}"></span>
                        <span>${cat.name}</span>
                        <span class="category-count">${Math.floor(Math.random() * 20) + 5}</span>
                    </a>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
};

// Load Sidebar Content
const loadSidebarContent = async () => {
    await loadPopularArticles();
    await loadBlogStats();
};

// Load Popular Articles
const loadPopularArticles = async () => {
    const popularArticles = document.getElementById('popularArticles');
    if (!popularArticles) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name)
            `)
            .eq('is_published', true)
            .order('views_count', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            popularArticles.innerHTML = blogs.map((blog, index) => `
                <div class="popular-item">
                    <span class="popular-rank">${index + 1}</span>
                    <div class="popular-content">
                        <h4><a href="blog-detail.html?id=${blog.id}">${blog.title}</a></h4>
                        <div class="popular-meta">
                            <span>${blog.categories?.name || 'Uncategorized'}</span>
                            <span><i class="far fa-eye"></i> ${blog.views_count || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading popular articles:', error);
    }
};

// Load Blog Stats
const loadBlogStats = async () => {
    try {
        // Total articles
        const { count: totalArticles, error: articlesError } = await supabase
            .from('blogs')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);
        
        // Total comments
        const { count: totalComments, error: commentsError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', true);
        
        // Total views
        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select('views_count')
            .eq('is_published', true);
        
        const totalViews = blogs?.reduce((sum, blog) => sum + (blog.views_count || 0), 0) || 0;
        
        // Update UI
        if (document.getElementById('totalArticles')) {
            document.getElementById('totalArticles').textContent = totalArticles || 0;
        }
        if (document.getElementById('totalComments')) {
            document.getElementById('totalComments').textContent = totalComments || 0;
        }
        if (document.getElementById('totalViews')) {
            document.getElementById('totalViews').textContent = totalViews.toLocaleString();
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
};

// Setup Blog Filters
const setupBlogFilters = () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    let currentCategory = '';
    let currentSort = 'newest';
    let currentFilter = 'all';
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', async (e) => {
            currentCategory = e.target.value;
            await loadBlogs(1, currentCategory, currentSort, currentFilter);
        });
    }
    
    // Sort filter
    if (sortFilter) {
        sortFilter.addEventListener('change', async (e) => {
            currentSort = e.target.value;
            await loadBlogs(1, currentCategory, currentSort, currentFilter);
        });
    }
    
    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Load blogs with new filter
            currentFilter = tab.dataset.filter;
            await loadBlogs(1, currentCategory, currentSort, currentFilter);
        });
    });
};

// Setup Blog Search
const setupBlogSearch = () => {
    const searchInput = document.getElementById('blogSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        const performSearch = async () => {
            const query = searchInput.value.trim();
            if (query) {
                await searchBlogs(query);
            }
        };
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
};

// Search Blogs
const searchBlogs = async (query) => {
    const blogGrid = document.getElementById('blogGrid');
    if (!blogGrid) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name, color)
            `)
            .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
            .eq('is_published', true)
            .order('published_at', { ascending: false });
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            blogGrid.innerHTML = blogs.map(blog => createBlogCard(blog)).join('');
            
            // Update pagination
            const pagination = document.getElementById('pagination');
            if (pagination) {
                pagination.innerHTML = `
                    <div class="search-results-info">
                        Found ${blogs.length} result(s) for "${query}"
                        <button class="btn btn-sm btn-outline" id="clearSearch">
                            Clear Search
                        </button>
                    </div>
                `;
                
                // Clear search button
                document.getElementById('clearSearch').addEventListener('click', async () => {
                    await loadBlogs();
                    const searchInput = document.getElementById('blogSearchInput');
                    if (searchInput) searchInput.value = '';
                });
            }
        } else {
            blogGrid.innerHTML = `
                <div class="no-data" style="grid-column: 1 / -1;">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>No articles match your search for "${query}". Try different keywords.</p>
                </div>
            `;
            
            const pagination = document.getElementById('pagination');
            if (pagination) {
                pagination.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Search error:', error);
    }
};

// Blog Detail Page
const initBlogDetailPage = async (blogId) => {
    console.log('Initializing blog detail page:', blogId);
    
    // Setup navigation
    setupNavigation();
    
    // Load blog data
    await loadBlogDetail(blogId);
    
    // Load comments
    await loadComments(blogId);
    
    // Load related articles
    await loadRelatedArticles(blogId);
    
    // Setup interactive features
    setupBlogInteractions(blogId);
    
    // Setup newsletter forms
    setupNewsletterForms();
    
    // Track blog view
    trackBlogView(blogId);
};

// Load Blog Detail
const loadBlogDetail = async (blogId) => {
    try {
        // Fetch blog data
        const { data: blog, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name, color, description),
                blog_sections(*)
            `)
            .eq('id', blogId)
            .single();
        
        if (error) throw error;
        
        if (!blog) {
            throw new Error('Blog not found');
        }
        
        // Update blog view count
        await updateBlogViewCount(blogId);
        
        // Display blog
        displayBlogDetail(blog);
        
        // Setup table of contents
        setupTableOfContents(blog.blog_sections);
        
        // Setup section navigation
        setupSectionNavigation(blog.blog_sections);
        
        // Update meta tags
        updateMetaTags(blog);
        
    } catch (error) {
        console.error('Error loading blog:', error);
        showNotification('Article not found or has been removed.', 'error');
        setTimeout(() => {
            window.location.href = 'blog.html';
        }, 3000);
    }
};

// Display Blog Detail
const displayBlogDetail = (blog) => {
    // Update hero section
    const blogHero = document.getElementById('blogHero');
    if (blogHero) {
        blogHero.innerHTML = `
            <div class="blog-hero-content">
                <div class="blog-category" style="background-color: ${blog.categories?.color || '#1a73e8'}">
                    ${blog.categories?.name || 'Uncategorized'}
                </div>
                <h1>${blog.title}</h1>
                <p class="blog-excerpt">${blog.excerpt || ''}</p>
                <div class="blog-meta-detail">
                    <div class="author-info">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author_name)}&background=1a73e8&color=fff" 
                             alt="${blog.author_name}">
                        <div>
                            <strong>${blog.author_name}</strong>
                            <span>${SupabaseUtils.formatDate(blog.published_at)} • ${blog.estimated_read_time || 5} min read</span>
                        </div>
                    </div>
                    <div class="blog-stats-detail">
                        <span><i class="far fa-eye"></i> ${(blog.views_count || 0) + 1} views</span>
                        <span><i class="far fa-heart"></i> ${blog.likes_count || 0} likes</span>
                        <span><i class="far fa-comment"></i> ${blog.comments_count || 0} comments</span>
                    </div>
                </div>
                ${blog.cover_image ? `
                    <img src="${blog.cover_image}" alt="${blog.title}" class="blog-cover-image">
                ` : ''}
            </div>
        `;
    }
    
    // Update author info
    const authorInfo = document.getElementById('authorInfo');
    if (authorInfo) {
        authorInfo.innerHTML = `
            <div class="author-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author_name)}&background=1a73e8&color=fff&size=80" 
                     alt="${blog.author_name}">
            </div>
            <div class="author-details">
                <h3>${blog.author_name}</h3>
                <p>${blog.author_name === 'Zawadi Team' ? 
                    'Career experts at Zawadi Careers, dedicated to helping Africans achieve their professional goals.' : 
                    'Guest contributor sharing insights and experiences.'}</p>
                <div class="author-social">
                    <a href="#"><i class="fab fa-twitter"></i></a>
                    <a href="#"><i class="fab fa-linkedin"></i></a>
                </div>
            </div>
        `;
    }
    
    // Display first section
    if (blog.blog_sections && blog.blog_sections.length > 0) {
        displaySection(blog.blog_sections[0], 0, blog.blog_sections.length);
    }
};

// Display Section
const displaySection = (section, currentIndex, totalSections) => {
    const blogArticle = document.getElementById('blogArticle');
    if (!blogArticle) return;
    
    blogArticle.innerHTML = `
        <div class="section-content" data-section="${currentIndex}">
            <h2>${section.title}</h2>
            <div class="section-body">
                ${section.content}
            </div>
            ${section.media_url ? `
                <div class="section-media">
                    ${section.media_type === 'video' ? `
                        <video controls class="blog-video">
                            <source src="${section.media_url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    ` : `
                        <img src="${section.media_url}" alt="${section.title}" class="blog-image-large">
                    `}
                </div>
            ` : ''}
        </div>
    `;
    
    // Update section indicator
    updateSectionIndicator(currentIndex + 1, totalSections);
    
    // Update progress bar
    updateProgressBar(currentIndex + 1, totalSections);
    
    // Update TOC active item
    updateActiveTOCItem(currentIndex);
};

// Update Section Indicator
const updateSectionIndicator = (current, total) => {
    const currentSectionEl = document.getElementById('currentSection');
    const totalSectionsEl = document.getElementById('totalSections');
    const prevBtn = document.getElementById('prevSectionBtn');
    const nextBtn = document.getElementById('nextSectionBtn');
    
    if (currentSectionEl) currentSectionEl.textContent = current;
    if (totalSectionsEl) totalSectionsEl.textContent = total;
    if (prevBtn) prevBtn.disabled = current === 1;
    if (nextBtn) nextBtn.disabled = current === total;
};

// Update Progress Bar
const updateProgressBar = (current, total) => {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = ((current - 1) / (total - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }
};

// Setup Table of Contents
const setupTableOfContents = (sections) => {
    const tocNav = document.getElementById('tocNav');
    const tocSidebar = document.getElementById('tocSidebar');
    const tocToggle = document.getElementById('tocToggle');
    const tocMobileToggle = document.getElementById('tocMobileToggle');
    const mobileTocBtn = document.getElementById('mobileTocBtn');
    
    if (!sections || !sections.length) return;
    
    // Create TOC items
    if (tocNav) {
        tocNav.innerHTML = sections.map((section, index) => `
            <a href="#" class="toc-item" data-section="${index}">
                <span class="toc-number">${index + 1}</span>
                <span class="toc-title">${section.title}</span>
            </a>
        `).join('');
        
        // Add click handlers
        tocNav.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const sectionIndex = parseInt(item.dataset.section);
                await navigateToSection(sectionIndex, sections);
                
                // Close TOC on mobile
                if (tocSidebar) {
                    tocSidebar.classList.remove('active');
                }
            });
        });
    }
    
    // Toggle TOC sidebar
    if (tocToggle) {
        tocToggle.addEventListener('click', () => {
            if (tocSidebar) {
                tocSidebar.classList.remove('active');
            }
        });
    }
    
    if (tocMobileToggle) {
        tocMobileToggle.addEventListener('click', () => {
            if (tocSidebar) {
                tocSidebar.classList.add('active');
            }
        });
    }
    
    if (mobileTocBtn) {
        mobileTocBtn.addEventListener('click', () => {
            if (tocSidebar) {
                tocSidebar.classList.add('active');
            }
        });
    }
};

// Update Active TOC Item
const updateActiveTOCItem = (sectionIndex) => {
    document.querySelectorAll('.toc-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.section) === sectionIndex) {
            item.classList.add('active');
        }
    });
};

// Setup Section Navigation
const setupSectionNavigation = (sections) => {
    const prevBtn = document.getElementById('prevSectionBtn');
    const nextBtn = document.getElementById('nextSectionBtn');
    
    let currentSectionIndex = 0;
    
    if (prevBtn) {
        prevBtn.addEventListener('click', async () => {
            if (currentSectionIndex > 0) {
                currentSectionIndex--;
                await navigateToSection(currentSectionIndex, sections);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
                await navigateToSection(currentSectionIndex, sections);
            } else {
                // Show completion modal when last section is reached
                showCompletionModal();
            }
        });
    }
    
    // Handle keyboard navigation
    document.addEventListener('keydown', async (e) => {
        if (e.key === 'ArrowLeft' && currentSectionIndex > 0) {
            currentSectionIndex--;
            await navigateToSection(currentSectionIndex, sections);
        } else if (e.key === 'ArrowRight' && currentSectionIndex < sections.length - 1) {
            currentSectionIndex++;
            await navigateToSection(currentSectionIndex, sections);
        }
    });
};

// Navigate to Section
const navigateToSection = async (sectionIndex, sections) => {
    const section = sections[sectionIndex];
    if (!section) return;
    
    // Display section
    displaySection(section, sectionIndex, sections.length);
    
    // Scroll to top of article
    const blogArticle = document.getElementById('blogArticle');
    if (blogArticle) {
        blogArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Track section view
    await trackSectionView(section.id);
};

// Track Section View
const trackSectionView = async (sectionId) => {
    try {
        // This could be enhanced to track more detailed analytics
        console.log('Section viewed:', sectionId);
    } catch (error) {
        console.error('Error tracking section view:', error);
    }
};

// Show Completion Modal
const showCompletionModal = () => {
    const modal = document.getElementById('readingCompleteModal');
    if (modal) {
        modal.classList.add('active');
        
        // Setup modal buttons
        const closeBtn = document.getElementById('closeReadingModal');
        const subscribeBtn = document.getElementById('subscribeAfterRead');
        const exploreBtn = document.getElementById('exploreMoreBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                // Scroll to newsletter section
                const newsletterSection = document.querySelector('.newsletter-section');
                if (newsletterSection) {
                    newsletterSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                window.location.href = 'blog.html';
            });
        }
        
        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
};

// Update Blog View Count
const updateBlogViewCount = async (blogId) => {
    try {
        // Get current view count
        const { data: blog, error: fetchError } = await supabase
            .from('blogs')
            .select('views_count')
            .eq('id', blogId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Increment view count
        const newViewCount = (blog.views_count || 0) + 1;
        
        const { error: updateError } = await supabase
            .from('blogs')
            .update({ views_count: newViewCount })
            .eq('id', blogId);
        
        if (updateError) throw updateError;
        
    } catch (error) {
        console.error('Error updating view count:', error);
    }
};

// Track Blog View
const trackBlogView = async (blogId) => {
    try {
        const ip = await SupabaseUtils.getUserIP();
        
        await supabase
            .from('user_analytics')
            .insert([
                {
                    blog_id: blogId,
                    user_ip: ip,
                    user_agent: navigator.userAgent,
                    page_url: window.location.href,
                    referrer: document.referrer || 'direct'
                }
            ]);
    } catch (error) {
        console.error('Error tracking blog view:', error);
    }
};

// Load Comments
const loadComments = async (blogId, page = 1) => {
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    if (!commentsList) return;
    
    const commentsPerPage = 10;
    const start = (page - 1) * commentsPerPage;
    const end = start + commentsPerPage - 1;
    
    try {
        const { data: comments, error, count } = await supabase
            .from('comments')
            .select('*', { count: 'exact' })
            .eq('blog_id', blogId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .range(start, end);
        
        if (error) throw error;
        
        // Update comments count
        if (commentsCount) {
            commentsCount.textContent = `${count || 0} Comment${count !== 1 ? 's' : ''}`;
        }
        
        // Display comments
        if (comments && comments.length > 0) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name}</span>
                        <span class="comment-date">${SupabaseUtils.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-content">
                        ${comment.content}
                    </div>
                    <div class="comment-actions">
                        <button class="comment-like-btn" data-comment-id="${comment.id}">
                            <i class="far fa-thumbs-up"></i> Helpful (${comment.likes_count || 0})
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners for comment likes
            document.querySelectorAll('.comment-like-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const commentId = e.target.closest('.comment-like-btn').dataset.commentId;
                    await likeComment(commentId);
                });
            });
        } else {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comment-slash"></i>
                    <h3>No comments yet</h3>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
        }
        
        // Setup load more button if needed
        setupLoadMoreComments(blogId, page, count || 0, commentsPerPage);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load comments. Please try again later.</p>
            </div>
        `;
    }
};

// Setup Load More Comments
const setupLoadMoreComments = (blogId, currentPage, totalComments, commentsPerPage) => {
    const loadMoreBtn = document.getElementById('loadMoreComments');
    if (!loadMoreBtn) return;
    
    const totalPages = Math.ceil(totalComments / commentsPerPage);
    
    if (currentPage < totalPages) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = async () => {
            await loadComments(blogId, currentPage + 1);
        };
    } else {
        loadMoreBtn.style.display = 'none';
    }
};

// Like Comment
const likeComment = async (commentId) => {
    try {
        // For now, just increment the count
        // In production, you'd want to track user-specific likes
        const { error } = await supabase.rpc('increment_comment_likes', {
            comment_id: commentId
        });
        
        if (error) throw error;
        
        // Reload comments to update counts
        const blogId = new URLSearchParams(window.location.search).get('id');
        if (blogId) {
            await loadComments(blogId);
        }
        
    } catch (error) {
        console.error('Error liking comment:', error);
        showNotification('Failed to like comment. Please try again.', 'error');
    }
};

// Setup Blog Interactions
const setupBlogInteractions = (blogId) => {
    // Like button
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            await handleLikeBlog(blogId);
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('shareBtn');
    const articleShareBtn = document.getElementById('shareArticleBtn');
    const tocShareBtn = document.getElementById('tocShareBtn');
    const mobileShareBtn = document.getElementById('mobileShareBtn');
    
    const shareButtons = [shareBtn, articleShareBtn, tocShareBtn, mobileShareBtn];
    shareButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                showShareModal(blogId);
            });
        }
    });
    
    // Comment form
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSubmitComment(blogId);
        });
    }
    
    // Bookmark button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            handleBookmark(blogId);
        });
    }
};

// Handle Like Blog
const handleLikeBlog = async (blogId) => {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    
    if (!likeBtn || !likeCount) return;
    
    try {
        // Check if user has already liked (using IP as identifier)
        const userIP = await SupabaseUtils.getUserIP();
        
        // Check for existing like
        const { data: existingLikes, error: checkError } = await supabase
            .from('likes')
            .select('id')
            .eq('blog_id', blogId)
            .eq('user_ip', userIP)
            .limit(1);
        
        if (checkError) throw checkError;
        
        if (existingLikes && existingLikes.length > 0) {
            // User already liked - unlike
            const { error: deleteError } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLikes[0].id);
            
            if (deleteError) throw deleteError;
            
            // Update UI
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = `<i class="far fa-heart"></i> <span>${parseInt(likeCount.textContent) - 1}</span> Likes`;
            likeCount.textContent = parseInt(likeCount.textContent) - 1;
            
            showNotification('Removed your like', 'info');
        } else {
            // Add like
            const { error: insertError } = await supabase
                .from('likes')
                .insert([
                    {
                        blog_id: blogId,
                        user_ip: userIP,
                        user_agent: navigator.userAgent
                    }
                ]);
            
            if (insertError) throw insertError;
            
            // Update UI
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = `<i class="fas fa-heart"></i> <span>${parseInt(likeCount.textContent) + 1}</span> Likes`;
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
            
            showNotification('Thanks for liking this article!', 'success');
        }
        
    } catch (error) {
        console.error('Error handling like:', error);
        showNotification('Failed to update like. Please try again.', 'error');
    }
};

// Show Share Modal
const showShareModal = (blogId) => {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    // Get current URL
    const currentUrl = window.location.href;
    const shareUrl = document.getElementById('shareUrl');
    const copyUrlBtn = document.getElementById('copyUrlBtn');
    
    if (shareUrl) {
        shareUrl.value = currentUrl;
    }
    
    // Setup copy button
    if (copyUrlBtn) {
        copyUrlBtn.onclick = () => {
            shareUrl.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!', 'success');
        };
    }
    
    // Setup share buttons
    document.querySelectorAll('.share-option').forEach(btn => {
        btn.onclick = () => {
            const platform = btn.dataset.platform;
            shareOnPlatform(platform, currentUrl);
        };
    });
    
    // Show modal
    modal.classList.add('active');
    
    // Setup close button
    const closeBtn = document.getElementById('closeShareModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.remove('active');
        };
    }
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
};

// Share on Platform
const shareOnPlatform = (platform, url) => {
    const title = document.title;
    const text = `Check out this article on Zawadi Careers: ${title}`;
    
    let shareUrl = '';
    
    switch(platform) {
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(url);
            showNotification('Link copied to clipboard!', 'success');
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
};

// Handle Submit Comment
const handleSubmitComment = async (blogId) => {
    const commentForm = document.getElementById('commentForm');
    if (!commentForm) return;
    
    const nameInput = document.getElementById('commentName');
    const emailInput = document.getElementById('commentEmail');
    const contentInput = document.getElementById('commentContent');
    const submitBtn = commentForm.querySelector('button[type="submit"]');
    
    if (!nameInput || !contentInput) return;
    
    const name = nameInput.value.trim();
    const email = emailInput?.value.trim() || '';
    const content = contentInput.value.trim();
    
    // Validation
    if (!name) {
        showNotification('Please enter your name', 'error');
        nameInput.focus();
        return;
    }
    
    if (!content) {
        showNotification('Please enter your comment', 'error');
        contentInput.focus();
        return;
    }
    
    if (email && !SupabaseUtils.validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }
    
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        
        // Insert comment
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    blog_id: blogId,
                    user_name: name,
                    user_email: email || null,
                    content: content,
                    is_approved: false // Requires admin approval
                }
            ]);
        
        if (error) throw error;
        
        // Show success message
        showNotification('Comment submitted for moderation. Thank you!', 'success');
        
        // Reset form
        commentForm.reset();
        
        // Reload comments (even though new one won't show until approved)
        await loadComments(blogId);
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        showNotification('Failed to submit comment. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
    }
};

// Handle Bookmark
const handleBookmark = (blogId) => {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (!bookmarkBtn) return;
    
    // Get existing bookmarks
    let bookmarks = JSON.parse(localStorage.getItem('zawadi_bookmarks') || '[]');
    
    // Check if already bookmarked
    const existingIndex = bookmarks.indexOf(blogId);
    
    if (existingIndex > -1) {
        // Remove bookmark
        bookmarks.splice(existingIndex, 1);
        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Save';
        showNotification('Removed from saved articles', 'info');
    } else {
        // Add bookmark
        bookmarks.push(blogId);
        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        showNotification('Article saved for later', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('zawadi_bookmarks', JSON.stringify(bookmarks));
};

// Load Related Articles
const loadRelatedArticles = async (blogId) => {
    const relatedArticles = document.getElementById('relatedArticles');
    if (!relatedArticles) return;
    
    try {
        // First, get the current blog to know its category
        const { data: currentBlog, error: blogError } = await supabase
            .from('blogs')
            .select('category_id')
            .eq('id', blogId)
            .single();
        
        if (blogError) throw blogError;
        
        if (!currentBlog) return;
        
        // Get related articles (same category, excluding current)
        const { data: related, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name, color)
            `)
            .eq('category_id', currentBlog.category_id)
            .eq('is_published', true)
            .neq('id', blogId)
            .order('published_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        if (related && related.length > 0) {
            relatedArticles.innerHTML = related.map(blog => `
                <article class="related-card">
                    <div class="related-image">
                        ${blog.cover_image ? `
                            <img src="${blog.cover_image}" alt="${blog.title}" loading="lazy">
                        ` : `
                            <div class="image-placeholder" style="background: ${blog.categories?.color || '#1a73e8'}">
                                <i class="fas fa-newspaper"></i>
                            </div>
                        `}
                    </div>
                    <div class="related-content">
                        <span class="related-category" style="color: ${blog.categories?.color || '#1a73e8'}">
                            ${blog.categories?.name || 'Uncategorized'}
                        </span>
                        <h4><a href="blog-detail.html?id=${blog.id}">${blog.title}</a></h4>
                        <div class="related-meta">
                            <span>${SupabaseUtils.formatDate(blog.published_at)}</span>
                            <span><i class="fas fa-clock"></i> ${blog.estimated_read_time || 5} min</span>
                        </div>
                    </div>
                </article>
            `).join('');
        } else {
            // If no related articles, show recent articles
            const { data: recent, error: recentError } = await supabase
                .from('blogs')
                .select(`
                    *,
                    categories (name, color)
                `)
                .eq('is_published', true)
                .neq('id', blogId)
                .order('published_at', { ascending: false })
                .limit(3);
            
            if (recentError) throw recentError;
            
            if (recent && recent.length > 0) {
                relatedArticles.innerHTML = recent.map(blog => createRelatedCard(blog)).join('');
            } else {
                relatedArticles.innerHTML = `
                    <div class="no-related">
                        <p>No related articles found.</p>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error loading related articles:', error);
        relatedArticles.innerHTML = `
            <div class="error-message">
                <p>Failed to load related articles.</p>
            </div>
        `;
    }
};

// Create Related Card
const createRelatedCard = (blog) => {
    return `
        <article class="related-card">
            <div class="related-image">
                ${blog.cover_image ? `
                    <img src="${blog.cover_image}" alt="${blog.title}" loading="lazy">
                ` : `
                    <div class="image-placeholder" style="background: ${blog.categories?.color || '#1a73e8'}">
                        <i class="fas fa-newspaper"></i>
                    </div>
                `}
            </div>
            <div class="related-content">
                <span class="related-category" style="color: ${blog.categories?.color || '#1a73e8'}">
                    ${blog.categories?.name || 'Uncategorized'}
                </span>
                <h4><a href="blog-detail.html?id=${blog.id}">${blog.title}</a></h4>
                <div class="related-meta">
                    <span>${SupabaseUtils.formatDate(blog.published_at)}</span>
                    <span><i class="fas fa-clock"></i> ${blog.estimated_read_time || 5} min</span>
                </div>
            </div>
        </article>
    `;
};

// Update Meta Tags
const updateMetaTags = (blog) => {
    // Update page title
    document.title = `${blog.title} | Zawadi Careers`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && blog.meta_description) {
        metaDescription.setAttribute('content', blog.meta_description);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.setAttribute('content', blog.title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && blog.meta_description) {
        ogDescription.setAttribute('content', blog.meta_description);
    }
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && blog.cover_image) {
        ogImage.setAttribute('content', blog.cover_image);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
        ogUrl.setAttribute('content', window.location.href);
    }
};

// Export functions
window.initBlogPage = initBlogPage;
window.initBlogDetailPage = initBlogDetailPage;