// Authentication JavaScript

// Initialize Admin Login
const initAdminLogin = () => {
    console.log('Initializing admin login...');
    
    // Check if already logged in
    if (SessionManager.isAdminLoggedIn()) {
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
    
    if (!loginForm || !loginBtn) return;
    
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
        
        if (!SupabaseUtils.validateEmail(email)) {
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

// Authenticate Admin
const authenticateAdmin = async (email, password) => {
    try {
        // Note: In production, you should use Supabase Auth for authentication
        // This is a simplified version for demo purposes
        
        // Fetch admin user from database
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .single();
        
        if (error) {
            // No admin found or other error
            console.error('Admin fetch error:', error);
            return null;
        }
        
        // In production, use proper password hashing (bcrypt, etc.)
        // For this demo, we're using a simple check
        // In reality, you should NEVER store plain text passwords
        
        // IMPORTANT: This is for demo purposes only
        // In a real application, use Supabase Auth or proper password hashing
        const { data: authCheck, error: authError } = await supabase.rpc(
            'verify_admin_password',
            {
                p_email: email,
                p_password: password
            }
        );
        
        if (authError) {
            console.error('Auth check error:', authError);
            return null;
        }
        
        if (authCheck && authCheck.is_valid) {
            // Update last login
            await supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', admin.id);
            
            // Return admin data (excluding password)
            return {
                id: admin.id,
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
};

// Create Admin User (Initial Setup)
// This should only be run once to create the first admin user
const createInitialAdmin = async () => {
    // This function should be called manually from browser console
    // during initial setup
  
    const adminData = {
        email: 'admin@zawadicareers.com',
        password_hash: 'hashed_password_here', // Use proper hashing in production
        full_name: 'System Administrator',
        role: 'super_admin'
    };
  
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .insert([adminData])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('Initial admin created:', data);
        return data;
    } catch (error) {
        console.error('Error creating admin:', error);
        return null;
    }
};

// Password Strength Checker (for admin password changes)
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

// Export functions
window.initAdminLogin = initAdminLogin;
window.createInitialAdmin = createInitialAdmin;
window.checkPasswordStrength = checkPasswordStrength;

// Note: In a production environment, you should:
// 1. Use Supabase Auth for authentication
// 2. Implement proper password hashing
// 3. Add rate limiting
// 4. Implement 2FA for admin accounts
// 5. Use secure session management
// 6. Implement proper logging and monitoring
