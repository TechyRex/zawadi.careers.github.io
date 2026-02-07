// Authentication JavaScript

// Initialize Admin Login
const initAdminLogin = () => {
    console.log('Initializing admin login...');
    
    // Check if already logged in
    if (SessionManager && SessionManager.isAdminLoggedIn()) {
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    // Setup login form
    setupLoginForm();
};

// Setup Login Form
const setupLoginForm = () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!loginForm || !loginBtn) {
        console.error('Login form elements not found');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        
        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        if (!window.SupabaseUtils || !window.SupabaseUtils.validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Disable button and show loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        try {
            // Authenticate admin
            const adminData = await authenticateAdmin(email, password);
            
            if (adminData) {
                // Set session
                SessionManager.setAdminSession(adminData);
                
                // Redirect to dashboard
                showNotification('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
            } else {
                showError('Invalid credentials');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred during login');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    });
    
    // Show/hide error message
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
    
    // Clear error on input
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        });
    });
};

// Authenticate Admin using Supabase Auth
const authenticateAdmin = async (email, password) => {
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // Use Supabase Auth for authentication
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Authentication error:', error);
            return null;
        }

        if (data && data.user) {
            return {
                id: data.user.id,
                email: data.user.email,
                access_token: data.session.access_token
            };
        }
        
        return null;
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
};

// Show notification function (for success messages)
const showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
};

// Create Admin User (Initial Setup)
const createInitialAdmin = async (email, password, fullName) => {
    try {
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        // Create user with Supabase Auth
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    role: 'super_admin'
                }
            }
        });

        if (error) throw error;
        
        console.log('Initial admin created:', data);
        return data;
    } catch (error) {
        console.error('Error creating admin:', error);
        return null;
    }
};

// Password Strength Checker
const checkPasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= minLength) strength++;
    else feedback.push(`At least ${minLength} characters`);
    
    if (hasUpperCase) strength++;
    else feedback.push('At least one uppercase letter');
    
    if (hasLowerCase) strength++;
    else feedback.push('At least one lowercase letter');
    
    if (hasNumbers) strength++;
    else feedback.push('At least one number');
    
    if (hasSpecialChar) strength++;
    else feedback.push('At least one special character');
    
    return {
        strength: (strength / 5) * 100,
        isStrong: strength >= 4,
        feedback: feedback
    };
};

// Make functions globally available
window.initAdminLogin = initAdminLogin;
window.authenticateAdmin = authenticateAdmin;
window.createInitialAdmin = createInitialAdmin;
window.checkPasswordStrength = checkPasswordStrength;
window.showNotification = showNotification;
