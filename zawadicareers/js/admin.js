// Admin Dashboard JavaScript

// Initialize Admin Dashboard
const initAdminDashboard = async () => {
    console.log('Initializing admin dashboard...');
    
    // Check admin session
    SessionManager.protectAdminRoute();
    
    // Load admin data
    loadAdminData();
    
    // Setup sidebar
    setupAdminSidebar();
    
    // Load dashboard stats
    await loadDashboardStats();
    
    // Load recent blogs
    await loadRecentBlogs();
    
    // Load popular blogs
    await loadPopularBlogs();
    
    // Load recent comments
    await loadRecentComments();
    
    // Load recent subscribers
    await loadRecentSubscribers();
    
    // Setup quick actions
    setupQuickActions();
    
    // Setup logout
    setupLogout();
    
    // Setup date display
    updateDateDisplay();
};

// Load Admin Data
const loadAdminData = () => {
    const adminSession = SessionManager.adminSession;
    if (!adminSession) {
        SessionManager.clearAdminSession();
        return;
    }
    
    // Update admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = adminSession.full_name || 'Admin User';
    }
    
    // Update admin role
    const adminRoleEl = document.getElementById('adminRole');
    if (adminRoleEl) {
        adminRoleEl.textContent = adminSession.role || 'Administrator';
    }
};

// Setup Admin Sidebar
const setupAdminSidebar = () => {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    
    if (sidebarToggle && adminSidebar) {
        sidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && adminSidebar && adminSidebar.classList.contains('active')) {
            if (!adminSidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                adminSidebar.classList.remove('active');
            }
        }
    });
};

// Load Dashboard Stats
const loadDashboardStats = async () => {
    try {
        // Total blogs
        const { count: totalBlogs, error: blogsError } = await supabase
            .from('blogs')
            .select('*', { count: 'exact', head: true });
        
        // Total views
        const { data: blogs, error: viewsError } = await supabase
            .from('blogs')
            .select('views_count');
        const totalViews = blogs?.reduce((sum, blog) => sum + (blog.views_count || 0), 0) || 0;
        
        // Total comments
        const { count: totalComments, error: commentsError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true });
        
        // Total subscribers
        const { count: totalSubscribers, error: subsError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        // Weekly stats (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { count: weeklyBlogs, error: weeklyBlogsError } = await supabase
            .from('blogs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString());
        
        const { count: pendingComments, error: pendingError } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);
        
        const { count: newSubscribers, error: newSubsError } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .gte('subscribed_at', oneWeekAgo.toISOString())
            .eq('is_active', true);
        
        // Update UI
        updateStatElement('totalBlogs', totalBlogs || 0);
        updateStatElement('totalViews', totalViews.toLocaleString());
        updateStatElement('totalComments', totalComments || 0);
        updateStatElement('totalSubscribers', totalSubscribers || 0);
        
        updateStatElement('blogChange', `+${weeklyBlogs || 0} this week`);
        updateStatElement('commentChange', `${pendingComments || 0} pending`);
        updateStatElement('subscriberChange', `+${newSubscribers || 0} new`);
        
        // Today's views (simplified - would need better tracking in production)
        const todayViews = Math.floor(totalViews / 30); // Rough estimate
        updateStatElement('viewChange', `+${todayViews} today`);
        
        // Load quick stats
        await loadQuickStats();
        
        // Setup charts
        setupDashboardCharts();
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Failed to load dashboard statistics', 'error');
    }
};

// Update Stat Element
const updateStatElement = (elementId, value) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
};

// Load Quick Stats
const loadQuickStats = async () => {
    try {
        // Average read time
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select('estimated_read_time')
            .eq('is_published', true);
        
        if (blogs && blogs.length > 0) {
            const totalReadTime = blogs.reduce((sum, blog) => sum + (blog.estimated_read_time || 0), 0);
            const avgReadTime = Math.round(totalReadTime / blogs.length);
            updateStatElement('avgReadTime', `${avgReadTime} min`);
        }
        
        // Top category (simplified)
        updateStatElement('topCategory', 'Career Clarity');
        
    } catch (error) {
        console.error('Error loading quick stats:', error);
    }
};

// Setup Dashboard Charts
const setupDashboardCharts = () => {
    // Traffic Chart
    const trafficCtx = document.getElementById('trafficChart')?.getContext('2d');
    if (trafficCtx) {
        new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Views',
                        data: [120, 190, 300, 500, 200, 300, 450],
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Reads',
                        data: [80, 120, 250, 400, 150, 200, 300],
                        borderColor: '#34A853',
                        backgroundColor: 'rgba(52, 168, 83, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};

// Load Recent Blogs
const loadRecentBlogs = async () => {
    const tableBody = document.getElementById('recentBlogsTable');
    if (!tableBody) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            tableBody.innerHTML = blogs.map(blog => `
                <tr>
                    <td>
                        <div class="blog-title-cell">
                            <strong>${blog.title}</strong>
                            <small>${blog.excerpt?.substring(0, 50)}...</small>
                        </div>
                    </td>
                    <td>${blog.categories?.name || 'Uncategorized'}</td>
                    <td>
                        <span class="status-badge ${blog.is_published ? 'status-published' : 'status-draft'}">
                            ${blog.is_published ? 'Published' : 'Draft'}
                        </span>
                    </td>
                    <td>${blog.views_count || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon edit-blog" data-id="${blog.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete-blog" data-id="${blog.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners
            document.querySelectorAll('.edit-blog').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const blogId = e.target.closest('.edit-blog').dataset.id;
                    editBlog(blogId);
                });
            });
            
            document.querySelectorAll('.delete-blog').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const blogId = e.target.closest('.delete-blog').dataset.id;
                    deleteBlog(blogId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading recent blogs:', error);
    }
};

// Load Popular Blogs
const loadPopularBlogs = async () => {
    const popularList = document.getElementById('popularBlogsList');
    if (!popularList) return;
    
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
            popularList.innerHTML = blogs.map((blog, index) => `
                <div class="popular-item">
                    <span class="popular-rank">${index + 1}</span>
                    <div class="popular-content">
                        <h4>${blog.title}</h4>
                        <div class="popular-meta">
                            <span>${blog.categories?.name || 'Uncategorized'}</span>
                            <span><i class="far fa-eye"></i> ${blog.views_count || 0}</span>
                            <span><i class="far fa-heart"></i> ${blog.likes_count || 0}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading popular blogs:', error);
    }
};

// Load Recent Comments
const loadRecentComments = async () => {
    const commentsList = document.getElementById('recentComments');
    if (!commentsList) return;
    
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                *,
                blogs (title)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (comments && comments.length > 0) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name}</span>
                        <span class="comment-date">${SupabaseUtils.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-preview">
                        ${comment.content.substring(0, 100)}...
                    </div>
                    <div class="comment-actions">
                        <small>On: ${comment.blogs?.title || 'Unknown Blog'}</small>
                        <div class="action-buttons">
                            <button class="btn-icon approve-comment" data-id="${comment.id}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon delete-comment" data-id="${comment.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Update pending comments count
            const pendingComments = comments.filter(c => !c.is_approved).length;
            updateStatElement('pendingComments', pendingComments);
            
            // Add event listeners
            document.querySelectorAll('.approve-comment').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const commentId = e.target.closest('.approve-comment').dataset.id;
                    await approveComment(commentId);
                });
            });
            
            document.querySelectorAll('.delete-comment').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const commentId = e.target.closest('.delete-comment').dataset.id;
                    await deleteComment(commentId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading recent comments:', error);
    }
};

// Load Recent Subscribers
const loadRecentSubscribers = async () => {
    const subscribersList = document.getElementById('recentSubscribers');
    if (!subscribersList) return;
    
    try {
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('*')
            .order('subscribed_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (subscribers && subscribers.length > 0) {
            subscribersList.innerHTML = subscribers.map(sub => `
                <div class="subscriber-item">
                    <div class="subscriber-avatar">
                        ${sub.name ? sub.name.charAt(0).toUpperCase() : sub.email.charAt(0).toUpperCase()}
                    </div>
                    <div class="subscriber-info">
                        <div class="subscriber-email">${sub.email}</div>
                        <div class="subscriber-date">${SupabaseUtils.formatDate(sub.subscribed_at)}</div>
                    </div>
                </div>
            `).join('');
        }
        
        // Update total subscribers count
        updateStatElement('subscribersCount', subscribers?.length || 0);
        
    } catch (error) {
        console.error('Error loading subscribers:', error);
    }
};

// Setup Quick Actions
const setupQuickActions = () => {
    const quickBlogBtn = document.getElementById('quickBlogBtn');
    if (quickBlogBtn) {
        quickBlogBtn.addEventListener('click', () => {
            window.location.href = 'admin-blog-editor.html';
        });
    }
    
    const manageBlogsBtn = document.getElementById('manageBlogsBtn');
    if (manageBlogsBtn) {
        manageBlogsBtn.addEventListener('click', () => {
            // In a full implementation, this would navigate to a blog management page
            showNotification('Blog management page coming soon!', 'info');
        });
    }
};

// Setup Logout
const setupLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            SessionManager.clearAdminSession();
        });
    }
};

// Update Date Display
const updateDateDisplay = () => {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
};

// Edit Blog
const editBlog = (blogId) => {
    window.location.href = `admin-blog-editor.html?id=${blogId}`;
};

// Delete Blog
const deleteBlog = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('blogs')
            .delete()
            .eq('id', blogId);
        
        if (error) throw error;
        
        showNotification('Blog deleted successfully', 'success');
        
        // Reload recent blogs
        await loadRecentBlogs();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error deleting blog:', error);
        showNotification('Failed to delete blog', 'error');
    }
};

// Approve Comment
const approveComment = async (commentId) => {
    try {
        const { error } = await supabase
            .from('comments')
            .update({ is_approved: true })
            .eq('id', commentId);
        
        if (error) throw error;
        
        showNotification('Comment approved', 'success');
        
        // Reload comments
        await loadRecentComments();
        
    } catch (error) {
        console.error('Error approving comment:', error);
        showNotification('Failed to approve comment', 'error');
    }
};

// Delete Comment
const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
        
        showNotification('Comment deleted', 'success');
        
        // Reload comments
        await loadRecentComments();
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('Failed to delete comment', 'error');
    }
};

// Initialize Analytics Page
const initAnalyticsPage = async () => {
    console.log('Initializing analytics page...');
    
    // Check admin session
    SessionManager.protectAdminRoute();
    
    // Setup sidebar
    setupAdminSidebar();
    
    // Load analytics data
    await loadAnalyticsData();
    
    // Setup date range selector
    setupDateRangeSelector();
    
    // Setup logout
    setupLogout();
    
    // Update date range display
    updateDateRangeDisplay();
};

// Load Analytics Data
const loadAnalyticsData = async () => {
    try {
        // Get date range
        const period = document.getElementById('analyticsPeriod')?.value || '30';
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Total views
        const { data: blogs, error: blogsError } = await supabase
            .from('blogs')
            .select('views_count')
            .gte('published_at', startDate.toISOString())
            .eq('is_published', true);
        
        const totalViews = blogs?.reduce((sum, blog) => sum + (blog.views_count || 0), 0) || 0;
        updateStatElement('totalViewsMetric', totalViews.toLocaleString());
        
        // Estimate total reads (70% of views for demo)
        const totalReads = Math.floor(totalViews * 0.7);
        updateStatElement('totalReadsMetric', totalReads.toLocaleString());
        
        // Completion rate (estimated)
        const completionRate = '68%';
        updateStatElement('completionRateMetric', completionRate);
        
        // Average read time
        updateStatElement('avgReadTimeMetric', '7.2 min');
        
        // Load top blogs
        await loadTopBlogs(startDate);
        
        // Load recent subscribers
        await loadAnalyticsSubscribers(startDate);
        
        // Setup analytics charts
        setupAnalyticsCharts(startDate, days);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification('Failed to load analytics data', 'error');
    }
};

// Load Top Blogs
const loadTopBlogs = async (startDate) => {
    const tableBody = document.getElementById('topBlogsTable');
    if (!tableBody) return;
    
    try {
        const { data: blogs, error } = await supabase
            .from('blogs')
            .select(`
                *,
                categories (name)
            `)
            .gte('published_at', startDate.toISOString())
            .eq('is_published', true)
            .order('views_count', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (blogs && blogs.length > 0) {
            tableBody.innerHTML = blogs.map(blog => `
                <tr>
                    <td>${blog.title}</td>
                    <td>${blog.views_count || 0}</td>
                    <td>${Math.floor((blog.views_count || 0) * 0.7)}</td>
                    <td>68%</td>
                    <td>${blog.likes_count || 0}</td>
                    <td>${blog.comments_count || 0}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading top blogs:', error);
    }
};

// Load Analytics Subscribers
const loadAnalyticsSubscribers = async (startDate) => {
    const tableBody = document.getElementById('subscribersTable');
    if (!tableBody) return;
    
    try {
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('*')
            .gte('subscribed_at', startDate.toISOString())
            .order('subscribed_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (subscribers && subscribers.length > 0) {
            tableBody.innerHTML = subscribers.map(sub => `
                <tr>
                    <td>${SupabaseUtils.formatDate(sub.subscribed_at)}</td>
                    <td>${sub.email}</td>
                    <td>${sub.source || 'Website'}</td>
                    <td>${sub.interest_area || 'General'}</td>
                </tr>
            `).join('');
            
            // Update new subscribers count
            updateStatElement('newSubscribers', subscribers.length);
        }
    } catch (error) {
        console.error('Error loading subscribers:', error);
    }
};

// Setup Analytics Charts
const setupAnalyticsCharts = (startDate, days) => {
    // Traffic Chart
    const trafficCtx = document.getElementById('trafficChart')?.getContext('2d');
    if (trafficCtx) {
        // Generate labels based on days
        const labels = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        // Generate sample data
        const viewsData = labels.map(() => Math.floor(Math.random() * 500) + 100);
        const readsData = viewsData.map(view => Math.floor(view * 0.7));
        
        new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Views',
                        data: viewsData,
                        borderColor: '#1a73e8',
                        backgroundColor: 'rgba(26, 115, 232, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Reads',
                        data: readsData,
                        borderColor: '#34A853',
                        backgroundColor: 'rgba(52, 168, 83, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Sources Chart (Pie)
    const sourcesCtx = document.getElementById('sourcesChart')?.getContext('2d');
    if (sourcesCtx) {
        new Chart(sourcesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Direct', 'Social Media', 'Search', 'Email', 'Referral'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        '#1a73e8',
                        '#34A853',
                        '#FBBC05',
                        '#EA4335',
                        '#8E44AD'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Category Performance Chart
    const categoriesCtx = document.getElementById('categoriesChart')?.getContext('2d');
    if (categoriesCtx) {
        new Chart(categoriesCtx, {
            type: 'bar',
            data: {
                labels: ['Career Clarity', 'Skill Dev', 'Job Search', 'Opportunities', 'Leadership', 'Companies', 'Stories'],
                datasets: [{
                    label: 'Views',
                    data: [1200, 950, 800, 700, 600, 500, 400],
                    backgroundColor: '#1a73e8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
};

// Setup Date Range Selector
const setupDateRangeSelector = () => {
    const periodSelector = document.getElementById('analyticsPeriod');
    const refreshBtn = document.getElementById('refreshAnalytics');
    
    if (periodSelector) {
        periodSelector.addEventListener('change', async () => {
            await loadAnalyticsData();
            updateDateRangeDisplay();
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadAnalyticsData();
            showNotification('Analytics data refreshed', 'success');
        });
    }
};

// Update Date Range Display
const updateDateRangeDisplay = () => {
    const periodSelector = document.getElementById('analyticsPeriod');
    const dateRangeEl = document.getElementById('currentDateRange');
    
    if (!periodSelector || !dateRangeEl) return;
    
    const days = parseInt(periodSelector.value);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    dateRangeEl.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Export functions
window.initAdminDashboard = initAdminDashboard;
window.initAnalyticsPage = initAnalyticsPage;