// Supabase Configuration
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

// Utility Functions
const SupabaseUtils = {
    // Format date for display
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Generate slug from title
    generateSlug: (title) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },

    // Calculate read time
    calculateReadTime: (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    },

    // Upload file to Supabase Storage
    uploadFile: async (file, folder = 'uploads') => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('blog-media')
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('blog-media')
                .getPublicUrl(filePath);

            return {
                success: true,
                path: filePath,
                url: publicUrl,
                fileName: fileName
            };
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Delete file from Supabase Storage
    deleteFile: async (filePath) => {
        try {
            const { error } = await supabase.storage
                .from('blog-media')
                .remove([filePath]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get user IP address (for likes tracking)
    getUserIP: async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Could not get IP:', error);
            return 'unknown';
        }
    },

    // Validate email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// Make utilities available globally
window.SupabaseUtils = SupabaseUtils;

// Session Management
const SessionManager = {
    // Admin session
    adminSession: null,

    // Initialize admin session
    initAdminSession: () => {
        const adminData = localStorage.getItem('zawadi_admin');
        if (adminData) {
            try {
                SessionManager.adminSession = JSON.parse(adminData);
                
                // Verify session is still valid
                const sessionAge = Date.now() - SessionManager.adminSession.timestamp;
                const maxAge = 12 * 60 * 60 * 1000; // 12 hours
                
                if (sessionAge > maxAge) {
                    SessionManager.clearAdminSession();
                    return null;
                }
                
                return SessionManager.adminSession;
            } catch (error) {
                SessionManager.clearAdminSession();
                return null;
            }
        }
        return null;
    },

    // Set admin session
    setAdminSession: (adminData) => {
        const sessionData = {
            ...adminData,
            timestamp: Date.now()
        };
        localStorage.setItem('zawadi_admin', JSON.stringify(sessionData));
        SessionManager.adminSession = sessionData;
    },

    // Clear admin session
    clearAdminSession: () => {
        localStorage.removeItem('zawadi_admin');
        SessionManager.adminSession = null;
        window.location.href = 'admin-login.html';
    },

    // Check if admin is logged in
    isAdminLoggedIn: () => {
        return SessionManager.adminSession !== null;
    },

    // Protect admin routes
    protectAdminRoute: () => {
        if (!SessionManager.isAdminLoggedIn()) {
            window.location.href = 'admin-login.html';
        }
    }
};

// Initialize session on page load
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.initAdminSession();
});

// Export session manager
window.SessionManager = SessionManager;