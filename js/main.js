import supabase from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize newsletter popup
    initNewsletterPopup();
    
    // Initialize mobile navigation
    initMobileNavigation();
    
    // Initialize counters
    initCounters();
    
    // Load featured blogs
    loadFeaturedBlogs();
    
    // Setup newsletter forms
    setupNewsletterForms();
});

function initNewsletterPopup() {
    const popup = document.getElementById('newsletterPopup');
    const closeBtn = document.querySelector('.close-popup');
    const subscribeBtns = document.querySelectorAll('#subscribeBtn, #mobileSubscribeBtn, #mobileSubscribeIcon');
    
    // Show popup after 30 seconds
    setTimeout(() => {
        if (!localStorage.getItem('newsletterClosed')) {
            popup.classList.add('show');
        }
    }, 30000);
    
    // Show popup on scroll (50% of page)
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > (document.body.scrollHeight / 2)) {
            if (!localStorage.getItem('newsletterClosed') && !popup.classList.contains('show')) {
                popup.classList.add('show');
            }
        }
    });
    
    // Close popup
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            popup.classList.remove('show');
            localStorage.setItem('newsletterClosed', 'true');
        });
    }
    
    // Open popup on button click
    subscribeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                popup.classList.add('show');
            });
        }
    });
}

function initMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileMenu = document.querySelector('.close-mobile-menu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
        
        closeMobileMenu.addEventListener('click', function() {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    }
}

function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current).toLocaleString();
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target.toLocaleString();
            }
        };
        
        // Start counter when element is in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

async function loadFeaturedBlogs() {
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('status', 'published')
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            const featuredContainer = document.querySelector('.featured-blog-main');
            const blogsGrid = document.getElementById('blogsGrid');
            
            // Set main featured blog
            if (featuredContainer && blogs[0]) {
                const mainBlog = blogs[0];
                featuredContainer.innerHTML = `
                    <div class="featured-blog-card">
                        <div class="featured-blog-image" style="background-image: url('${mainBlog.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643'}')">
                            <div class="featured-blog-category">${getCategoryName(mainBlog.category_id)}</div>
                        </div>
                        <div class="featured-blog-content">
                            <div class="blog-meta">
                                <span class="blog-date">${new Date(mainBlog.created_at).toLocaleDateString()}</span>
                                <span class="blog-read-time">${mainBlog.read_time || '5'} min read</span>
                            </div>
                            <h2 class="blog-title">${mainBlog.title}</h2>
                            <p class="blog-excerpt">${mainBlog.excerpt || mainBlog.content.substring(0, 200)}...</p>
                            <div class="blog-stats">
                                <span class="blog-stat">
                                    <i class="far fa-eye"></i> ${mainBlog.views || 0} views
                                </span>
                                <span class="blog-stat">
                                    <i class="far fa-comment"></i> ${mainBlog.comment_count || 0} comments
                                </span>
                            </div>
                            <a href="blog-detail.html?id=${mainBlog.id}" class="read-more-btn">
                                Read Full Article <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                `;
            }
            
            // Set other featured blogs
            if (blogsGrid && blogs.length > 1) {
                const otherBlogs = blogs.slice(1, 7);
                blogsGrid.innerHTML = otherBlogs.map(blog => `
                    <div class="blog-card">
                        <div class="blog-card-image" style="background-image: url('${blog.featured_image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'}')">
                            <div class="blog-card-category">${getCategoryName(blog.category_id)}</div>
                        </div>
                        <div class="blog-card-content">
                            <div class="blog-card-meta">
                                <span>${new Date(blog.created_at).toLocaleDateString()}</span>
                                <span>• ${blog.read_time || '5'} min read</span>
                            </div>
                            <h3 class="blog-card-title">${blog.title}</h3>
                            <p class="blog-card-excerpt">${blog.excerpt || blog.content.substring(0, 100)}...</p>
                            <a href="blog-detail.html?id=${blog.id}" class="blog-card-link">
                                Read More <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading featured blogs:', error);
    }
}

function getCategoryName(categoryId) {
    const categories = {
        1: 'Career Clarity',
        2: 'Skill Development',
        3: 'Job Search',
        4: 'Opportunities',
        5: 'Professionals',
        6: 'Companies',
        7: 'Stories'
    };
    return categories[categoryId] || 'Career';
}

function setupNewsletterForms() {
    const forms = document.querySelectorAll('.newsletter-form, .main-newsletter-form, .sidebar-newsletter-form, .prompt-newsletter-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const nameInput = this.querySelector('input[type="text"]');
            
            if (!emailInput || !emailInput.value) {
                alert('Please enter your email address');
                return;
            }
            
            try {
                // Save subscriber to Supabase
                const { data, error } = await supabase
                    .from('subscribers')
                    .insert([
                        {
                            email: emailInput.value,
                            name: nameInput ? nameInput.value : '',
                            subscribed_at: new Date().toISOString(),
                            source: 'website'
                        }
                    ]);
                
                if (error) {
                    if (error.code === '23505') { // Unique constraint violation
                        alert('You are already subscribed! Thank you for your interest.');
                    } else {
                        throw error;
                    }
                } else {
                    alert('Thank you for subscribing! You will receive our next newsletter.');
                    
                    // Reset form
                    this.reset();
                    
                    // Close popup if it's open
                    const popup = document.getElementById('newsletterPopup');
                    if (popup && popup.classList.contains('show')) {
                        popup.classList.remove('show');
                    }
                }
            } catch (error) {
                console.error('Error subscribing:', error);
                alert('An error occurred. Please try again.');
            }
        });
    });
}

// Export functions for use in other modules
export { getCategoryName };