import supabase, { getBlogs, getBlogById, addBlogView, getComments, addComment, toggleLike, getLikesCount } from './supabase.js';
import { getCategoryName } from './main.js';

// Blog page functionality
if (document.querySelector('.blog-posts')) {
    loadBlogPosts();
}

// Blog detail functionality
if (document.querySelector('.blog-detail-container')) {
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    if (blogId) {
        loadBlogDetail(blogId);
    }
}

async function loadBlogPosts(options = {}) {
    try {
        const { category = 'all', page = 1, sort = 'newest' } = options;
        
        let query = supabase
            .from('blogs')
            .select('*')
            .eq('status', 'published');
        
        if (category !== 'all') {
            const categoryMap = {
                'career-clarity': 1,
                'skill-development': 2,
                'job-search': 3,
                'opportunities': 4,
                'professionals': 5,
                'companies': 6,
                'stories': 7
            };
            
            if (categoryMap[category]) {
                query = query.eq('category_id', categoryMap[category]);
            }
        }
        
        // Apply sorting
        switch(sort) {
            case 'oldest':
                query = query.order('created_at', { ascending: true });
                break;
            case 'popular':
                query = query.order('views', { ascending: false });
                break;
            case 'reading-time':
                query = query.order('read_time', { ascending: true });
                break;
            default: // newest
                query = query.order('created_at', { ascending: false });
        }
        
        const from = (page - 1) * 9;
        const to = from + 8;
        
        const { data: blogs, error } = await query.range(from, to);
        
        if (error) throw error;
        
        displayBlogPosts(blogs);
        
        // Load popular posts
        await loadPopularPosts();
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

function displayBlogPosts(blogs) {
    const container = document.getElementById('blogPosts');
    
    if (!blogs || blogs.length === 0) {
        container.innerHTML = `
            <div class="no-blogs" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-newspaper" style="font-size: 64px; color: #cbd5e0; margin-bottom: 20px;"></i>
                <h3 style="color: #4a5568; margin-bottom: 10px;">No articles yet</h3>
                <p style="color: #718096;">Check back soon for new content!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = blogs.map(blog => `
        <article class="blog-post-card">
            <div class="blog-post-image">
                <img src="${blog.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}" alt="${blog.title}">
                <div class="blog-post-category">${getCategoryName(blog.category_id)}</div>
            </div>
            <div class="blog-post-content">
                <div class="blog-post-meta">
                    <span class="post-date">${new Date(blog.created_at).toLocaleDateString()}</span>
                    <span class="post-read-time">${blog.read_time || '5'} min read</span>
                </div>
                <h2 class="blog-post-title">
                    <a href="blog-detail.html?id=${blog.id}">${blog.title}</a>
                </h2>
                <p class="blog-post-excerpt">${blog.excerpt || blog.content.substring(0, 150)}...</p>
                <div class="blog-post-footer">
                    <div class="post-stats">
                        <span class="post-stat">
                            <i class="far fa-eye"></i> ${blog.views || 0}
                        </span>
                        <span class="post-stat">
                            <i class="far fa-comment"></i> ${blog.comment_count || 0}
                        </span>
                        <span class="post-stat">
                            <i class="far fa-heart"></i> ${blog.likes_count || 0}
                        </span>
                    </div>
                    <a href="blog-detail.html?id=${blog.id}" class="read-more-btn">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');
}

async function loadPopularPosts() {
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('status', 'published')
            .order('views', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('popularPosts');
        if (container) {
            container.innerHTML = blogs.map(blog => `
                <a href="blog-detail.html?id=${blog.id}" class="popular-post">
                    <div class="popular-post-image">
                        <img src="${blog.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}" alt="${blog.title}">
                    </div>
                    <div class="popular-post-content">
                        <h4>${blog.title}</h4>
                        <div class="popular-post-meta">
                            <span>${new Date(blog.created_at).toLocaleDateString()}</span>
                            <span>• ${blog.read_time || '5'} min</span>
                        </div>
                    </div>
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading popular posts:', error);
    }
}

export async function loadBlogDetail(blogId) {
    try {
        // Load blog data
        const blog = await getBlogById(blogId);
        
        if (!blog) {
            showErrorState();
            return;
        }
        
        // Increment view count
        await addBlogView(blogId);
        
        // Display blog content
        displayBlogDetail(blog);
        
        // Load comments
        await loadComments(blogId);
        
        // Load related articles
        await loadRelatedArticles(blog.category_id, blogId);
        
        // Setup comment form
        setupCommentForm(blogId);
        
        // Setup like button
        setupLikeButton(blogId);
        
        // Setup reading navigation
        setupReadingNavigation(blog.content);
        
    } catch (error) {
        console.error('Error loading blog detail:', error);
        showErrorState();
    }
}

function displayBlogDetail(blog) {
    const container = document.getElementById('blogDetailContainer');
    
    // Split content into pages (for the paginated reading experience)
    const pages = splitContentIntoPages(blog.content);
    
    container.innerHTML = `
        <div class="blog-detail">
            <!-- Header -->
            <header class="blog-detail-header">
                <div class="blog-header-meta">
                    <span class="blog-category">${getCategoryName(blog.category_id)}</span>
                    <span class="blog-date">${new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
                <h1 class="blog-detail-title">${blog.title}</h1>
                <div class="blog-author">
                    <div class="author-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="author-info">
                        <span class="author-name">${blog.author || 'Zawadi Careers'}</span>
                        <span class="author-role">Career Expert</span>
                    </div>
                </div>
            </header>
            
            <!-- Featured Image -->
            ${blog.featured_image ? `
                <div class="blog-featured-image">
                    <img src="${blog.featured_image}" alt="${blog.title}">
                </div>
            ` : ''}
            
            <!-- Pages -->
            <div class="blog-pages" id="blogPages">
                ${pages.map((page, index) => `
                    <div class="blog-page ${index === 0 ? 'active' : ''}" data-page="${index + 1}">
                        <div class="page-content">${page}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Tags -->
            ${blog.tags ? `
                <div class="blog-tags">
                    ${blog.tags.split(',').map(tag => `
                        <span class="blog-tag">${tag.trim()}</span>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Share -->
            <div class="blog-share">
                <span>Share this article:</span>
                <div class="share-buttons">
                    <button class="share-btn twitter" data-platform="twitter">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="share-btn linkedin" data-platform="linkedin">
                        <i class="fab fa-linkedin"></i>
                    </button>
                    <button class="share-btn facebook" data-platform="facebook">
                        <i class="fab fa-facebook"></i>
                    </button>
                    <button class="share-btn whatsapp" data-platform="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="share-btn copy" data-action="copy">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Hide loading state
    document.getElementById('loadingState').style.display = 'none';
    
    // Update reading stats
    document.getElementById('viewCount').textContent = (blog.views || 0) + 1;
    document.getElementById('readingTime').textContent = `${blog.read_time || '5'} min`;
    document.getElementById('totalPages').textContent = pages.length;
    
    // Setup share buttons
    setupShareButtons(blog);
}

function splitContentIntoPages(content, wordsPerPage = 300) {
    // Remove HTML tags for word counting
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/);
    
    const pages = [];
    let currentPage = [];
    let currentWordCount = 0;
    
    // Simple parser to split by paragraphs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const elements = Array.from(tempDiv.children);
    let currentHtml = '';
    
    elements.forEach(element => {
        const elementText = element.textContent || '';
        const elementWordCount = elementText.split(/\s+/).length;
        
        if (currentWordCount + elementWordCount > wordsPerPage && currentHtml) {
            pages.push(currentHtml);
            currentHtml = element.outerHTML;
            currentWordCount = elementWordCount;
        } else {
            currentHtml += element.outerHTML;
            currentWordCount += elementWordCount;
        }
    });
    
    if (currentHtml) {
        pages.push(currentHtml);
    }
    
    // If no proper split found, split by words
    if (pages.length <= 1 && words.length > wordsPerPage) {
        pages.length = 0; // Clear array
        for (let i = 0; i < words.length; i += wordsPerPage) {
            const pageWords = words.slice(i, i + wordsPerPage);
            pages.push(`<p>${pageWords.join(' ')}</p>`);
        }
    }
    
    return pages.length > 0 ? pages : [content];
}

async function loadComments(blogId) {
    try {
        const comments = await getComments(blogId, { limit: 10 });
        
        const container = document.getElementById('commentsList');
        const countElement = document.getElementById('commentsCount');
        const noComments = document.getElementById('noComments');
        
        if (comments && comments.length > 0) {
            if (noComments) noComments.style.display = 'none';
            
            container.innerHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-header">
                        <div class="comment-author">
                            <div class="comment-avatar">
                                ${comment.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="comment-author-info">
                                <h4 class="comment-author-name">${comment.name}</h4>
                                <span class="comment-time">${new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="comment-content">
                        ${comment.content}
                    </div>
                    <div class="comment-actions">
                        <button class="comment-reply-btn">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>
                </div>
            `).join('');
            
            countElement.textContent = `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`;
            
            // Show load more button if there are more comments
            const totalComments = await getTotalCommentsCount(blogId);
            if (totalComments > comments.length) {
                document.getElementById('loadMoreComments').style.display = 'block';
            }
            
        } else {
            if (noComments) noComments.style.display = 'block';
            countElement.textContent = '0 Comments';
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function getTotalCommentsCount(blogId) {
    const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId)
        .eq('status', 'approved');
    
    if (error) throw error;
    return count || 0;
}

function setupCommentForm(blogId) {
    const form = document.getElementById('commentForm');
    
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('commenterName').value.trim();
        const email = document.getElementById('commenterEmail').value.trim();
        const content = document.getElementById('commentContent').value.trim();
        
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        if (!content) {
            alert('Please enter your comment');
            return;
        }
        
        try {
            await addComment({
                blogId: blogId,
                name: name,
                email: email || 'anonymous@example.com',
                content: content
            });
            
            alert('Comment submitted successfully! It will appear after approval.');
            form.reset();
            
            // Reload comments
            await loadComments(blogId);
            
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error submitting comment. Please try again.');
        }
    });
}

function setupLikeButton(blogId) {
    const likeBtn = document.getElementById('likeBtn');
    const mobileLikeBtn = document.getElementById('mobileLikeBtn');
    
    if (!likeBtn) return;
    
    // Get initial like count
    updateLikeCount(blogId);
    
    const handleLike = async () => {
        try {
            // For now, use a simple approach without user authentication
            // In production, you might want to track by IP or use cookies
            const userId = 'guest-' + Math.random().toString(36).substr(2, 9);
            
            const { liked } = await toggleLike(blogId, userId);
            
            // Update UI
            const icon = likeBtn.querySelector('i');
            const mobileIcon = mobileLikeBtn?.querySelector('i');
            
            if (liked) {
                icon.className = 'fas fa-heart';
                if (mobileIcon) mobileIcon.className = 'fas fa-heart';
                likeBtn.classList.add('liked');
                if (mobileLikeBtn) mobileLikeBtn.classList.add('liked');
            } else {
                icon.className = 'far fa-heart';
                if (mobileIcon) mobileIcon.className = 'far fa-heart';
                likeBtn.classList.remove('liked');
                if (mobileLikeBtn) mobileLikeBtn.classList.remove('liked');
            }
            
            // Update count
            updateLikeCount(blogId);
            
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };
    
    likeBtn.addEventListener('click', handleLike);
    if (mobileLikeBtn) {
        mobileLikeBtn.addEventListener('click', handleLike);
    }
}

async function updateLikeCount(blogId) {
    try {
        const count = await getLikesCount(blogId);
        
        const countElement = document.getElementById('likeCount');
        const mobileCount = document.querySelector('#mobileLikeBtn span');
        
        if (countElement) countElement.textContent = count;
        if (mobileCount) mobileCount.textContent = count;
        
    } catch (error) {
        console.error('Error getting like count:', error);
    }
}

function setupReadingNavigation(content) {
    const pages = document.querySelectorAll('.blog-page');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const progressBar = document.getElementById('progressBar');
    
    let currentPage = 1;
    const totalPages = pages.length;
    
    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        
        // Hide all pages
        pages.forEach(p => p.classList.remove('active'));
        
        // Show current page
        pages[page - 1].classList.add('active');
        
        // Update UI
        currentPage = page;
        currentPageEl.textContent = page;
        
        // Update progress bar
        const progress = ((page - 1) / (totalPages - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update button states
        prevBtn.disabled = page === 1;
        nextBtn.disabled = page === totalPages;
    }
    
    // Initial setup
    goToPage(1);
    
    // Event listeners
    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToPage(currentPage - 1);
        } else if (e.key === 'ArrowRight') {
            goToPage(currentPage + 1);
        }
    });
}

async function loadRelatedArticles(categoryId, excludeId) {
    try {
        const { data: related, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('category_id', categoryId)
            .neq('id', excludeId)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        const container = document.getElementById('relatedArticles');
        if (container && related && related.length > 0) {
            container.innerHTML = related.map(blog => `
                <article class="related-article">
                    <a href="blog-detail.html?id=${blog.id}" class="related-article-link">
                        <div class="related-article-image">
                            <img src="${blog.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}" alt="${blog.title}">
                        </div>
                        <div class="related-article-content">
                            <h3 class="related-article-title">${blog.title}</h3>
                            <p class="related-article-excerpt">${blog.excerpt || blog.content.substring(0, 100)}...</p>
                            <div class="related-article-meta">
                                <span>${new Date(blog.created_at).toLocaleDateString()}</span>
                                <span>• ${blog.read_time || '5'} min read</span>
                            </div>
                        </div>
                    </a>
                </article>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading related articles:', error);
    }
}

function setupShareButtons(blog) {
    const shareButtons = document.querySelectorAll('.share-btn');
    const url = window.location.href;
    const title = blog.title;
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.dataset.platform;
            const action = this.dataset.action;
            
            if (action === 'copy') {
                navigator.clipboard.writeText(url)
                    .then(() => alert('Link copied to clipboard!'))
                    .catch(err => console.error('Error copying:', err));
                return;
            }
            
            let shareUrl;
            switch(platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                    break;
                default:
                    return;
            }
            
            window.open(shareUrl, '_blank', 'width=600,height=400');
        });
    });
}

function showErrorState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
}


// Cool blog interactions
document.addEventListener('DOMContentLoaded', function() {
    // Animate blog cards on scroll
    const blogCards = document.querySelectorAll('.blog-post-card, .featured-blog-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    blogCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Category filter hover effects
    const filterPills = document.querySelectorAll('.filter-pill');
    
    filterPills.forEach(pill => {
        pill.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(-3px) scale(1.05)';
                this.style.boxShadow = '0 15px 30px var(--glow-color)';
            }
        });
        
        pill.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = '';
                this.style.boxShadow = '';
            }
        });
        
        // Click effect
        pill.addEventListener('click', function() {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            // Ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.7);
                transform: scale(0);
                animation: rippleEffect 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add ripple effect CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        
        .stat-item:hover i.fa-eye {
            animation: eyeBlink 0.6s;
        }
        
        @keyframes eyeBlink {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.8); }
        }
        
        .stat-item:hover i.fa-comment {
            animation: commentBounce 0.6s;
        }
        
        @keyframes commentBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
        
        .stat-item:hover i.fa-heart {
            animation: heartBeat 0.6s;
        }
        
        @keyframes heartBeat {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.2); }
            50% { transform: scale(0.95); }
            75% { transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    // Search bar focus effect
    const searchInput = document.getElementById('blogSearch');
    const searchContainer = document.querySelector('.search-container');
    
    if (searchInput && searchContainer) {
        searchInput.addEventListener('focus', () => {
            searchContainer.style.transform = 'translateY(-5px)';
            searchContainer.style.boxShadow = '0 20px 50px var(--glow-color)';
        });
        
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                searchContainer.style.transform = '';
                searchContainer.style.boxShadow = '';
            }
        });
    }
});