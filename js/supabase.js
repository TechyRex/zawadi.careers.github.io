// Initialize Supabase Client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.1/+esm'

// Replace these with your Supabase project credentials
const SUPABASE_URL = 'https://xtubniixvmwluwybbpos.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWJuaWl4dm13bHV3eWJicG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODc4MDUsImV4cCI6MjA4NjE2MzgwNX0.P278_vaPqKyPcjlaFVqmFHJC6OcqZU30gk2b5SyCOI4';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Export the Supabase client
export default supabase;

// Helper functions
export const uploadFile = async (file, bucket = 'blog-images') => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return {
            success: true,
            url: urlData.publicUrl,
            path: data.path
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export const deleteFile = async (path, bucket = 'blog-images') => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([path]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
};

// Database helper functions
export const getBlogs = async (options = {}) => {
    const {
        limit = 10,
        page = 1,
        category = null,
        featured = false,
        status = 'published'
    } = options;
    
    let query = supabase
        .from('blogs')
        .select('*')
        .eq('status', status);
    
    if (category) {
        query = query.eq('category_id', category);
    }
    
    if (featured) {
        query = query.eq('is_featured', true);
    }
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.order('created_at', { ascending: false })
                .range(from, to);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data;
};

export const getBlogById = async (id) => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) throw error;
    
    return data;
};

export const addBlogView = async (blogId) => {
    // Get current views
    const { data: blog } = await supabase
        .from('blogs')
        .select('views')
        .eq('id', blogId)
        .single();
    
    // Increment views
    const { data, error } = await supabase
        .from('blogs')
        .update({ views: (blog?.views || 0) + 1 })
        .eq('id', blogId);
    
    if (error) throw error;
    
    return data;
};

export const addComment = async (commentData) => {
    const { data, error } = await supabase
        .from('comments')
        .insert([{
            blog_id: commentData.blogId,
            name: commentData.name,
            email: commentData.email,
            content: commentData.content,
            status: 'approved',
            created_at: new Date().toISOString()
        }]);
    
    if (error) throw error;
    
    return data;
};

export const getComments = async (blogId, options = {}) => {
    const { limit = 10, page = 1 } = options;
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);
    
    if (error) throw error;
    
    return data;
};

export const toggleLike = async (blogId, userId) => {
    // Check if user already liked
    const { data: existing } = await supabase
        .from('likes')
        .select('*')
        .eq('blog_id', blogId)
        .eq('user_id', userId)
        .single();
    
    if (existing) {
        // Unlike
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('id', existing.id);
        
        if (error) throw error;
        return { liked: false };
    } else {
        // Like
        const { error } = await supabase
            .from('likes')
            .insert([{
                blog_id: blogId,
                user_id: userId,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        return { liked: true };
    }
};

export const getLikesCount = async (blogId) => {
    const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId);
    
    if (error) throw error;
    
    return count || 0;
};

export const subscribeNewsletter = async (email, name = '') => {
    const { data, error } = await supabase
        .from('subscribers')
        .insert([{
            email: email,
            name: name,
            subscribed_at: new Date().toISOString(),
            active: true
        }]);
    
    if (error) throw error;
    
    return data;
};


