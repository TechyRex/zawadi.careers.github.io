// Blog Editor JavaScript

// Initialize Blog Editor
const initBlogEditor = async () => {
    console.log('Initializing blog editor...');
    
    // Check admin session
    SessionManager.protectAdminRoute();
    
    // Load editor data
    await loadEditorData();
    
    // Setup sidebar
    setupAdminSidebar();
    
    // Setup editor components
    setupEditorComponents();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup media library
    setupMediaLibrary();
    
    // Load blog if editing
    await loadBlogForEditing();
    
    // Setup logout
    setupLogout();
};

// Load Editor Data
const loadEditorData = async () => {
    await loadCategoriesForEditor();
    await loadMediaLibrary();
};

// Load Categories for Editor
const loadCategoriesForEditor = async () => {
    const categorySelect = document.getElementById('blogCategory');
    if (!categorySelect) return;
    
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        if (categories && categories.length > 0) {
            categorySelect.innerHTML = `
                <option value="">Select a category</option>
                ${categories.map(cat => `
                    <option value="${cat.id}">${cat.name}</option>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Failed to load categories', 'error');
    }
};

// Setup Editor Components
const setupEditorComponents = () => {
    // Initialize Quill editors for each section
    initQuillEditors();
    
    // Setup title to slug generation
    setupSlugGeneration();
    
    // Setup section management
    setupSectionManagement();
    
    // Setup cover image upload
    setupCoverImageUpload();
    
    // Setup character counters
    setupCharacterCounters();
    
    // Setup read time calculator
    setupReadTimeCalculator();
    
    // Setup save status
    setupSaveStatus();
};

// Initialize Quill Editors
const initQuillEditors = () => {
    // Store all Quill instances
    window.quillInstances = {};
    
    // Initialize first section editor
    initSectionEditor(0);
    
    // Reinitialize when new sections are added
    document.addEventListener('sectionAdded', (e) => {
        const index = e.detail.index;
        initSectionEditor(index);
    });
};

// Initialize Section Editor
const initSectionEditor = (index) => {
    const editorId = `sectionEditor${index}`;
    const editorElement = document.getElementById(editorId);
    
    if (!editorElement) return;
    
    // Initialize Quill editor
    const quill = new Quill(editorElement, {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        },
        placeholder: 'Write your section content here...'
    });
    
    // Store instance
    window.quillInstances[index] = quill;
    
    // Update save status on content change
    quill.on('text-change', () => {
        updateSaveStatus('unsaved');
        calculateReadTime();
    });
};

// Setup Slug Generation
const setupSlugGeneration = () => {
    const titleInput = document.getElementById('blogTitle');
    const slugPreview = document.getElementById('slugPreview');
    const editSlugBtn = document.getElementById('editSlugBtn');
    
    if (!titleInput || !slugPreview) return;
    
    let isEditingSlug = false;
    
    // Auto-generate slug from title
    titleInput.addEventListener('input', () => {
        if (!isEditingSlug) {
            const slug = SupabaseUtils.generateSlug(titleInput.value);
            slugPreview.textContent = slug;
        }
    });
    
    // Manual slug editing
    if (editSlugBtn) {
        editSlugBtn.addEventListener('click', () => {
            isEditingSlug = true;
            const currentSlug = slugPreview.textContent;
            
            // Replace preview with input field
            slugPreview.innerHTML = `
                <input type="text" id="slugInput" value="${currentSlug}" style="width: 200px;">
                <button id="saveSlugBtn" class="btn btn-sm btn-primary">Save</button>
                <button id="cancelSlugBtn" class="btn btn-sm btn-outline">Cancel</button>
            `;
            
            // Focus input
            document.getElementById('slugInput').focus();
            
            // Save button
            document.getElementById('saveSlugBtn').addEventListener('click', () => {
                const newSlug = document.getElementById('slugInput').value.trim();
                if (newSlug) {
                    slugPreview.textContent = SupabaseUtils.generateSlug(newSlug);
                }
                isEditingSlug = false;
            });
            
            // Cancel button
            document.getElementById('cancelSlugBtn').addEventListener('click', () => {
                slugPreview.textContent = currentSlug;
                isEditingSlug = false;
            });
        });
    }
};

// Setup Section Management
const setupSectionManagement = () => {
    const sectionsContainer = document.getElementById('sectionsContainer');
    const addSectionBtn = document.getElementById('addSectionBtn');
    
    if (!sectionsContainer || !addSectionBtn) return;
    
    // Add section button
    addSectionBtn.addEventListener('click', () => {
        addNewSection();
    });
    
    // Initial section count
    let sectionCount = 1;
    
    // Add new section
    const addNewSection = () => {
        sectionCount++;
        
        const sectionIndex = sectionCount - 1;
        const sectionHTML = `
            <div class="section-item" data-index="${sectionIndex}">
                <div class="section-header">
                    <div class="section-number">Section ${sectionCount}</div>
                    <div class="section-actions">
                        <button class="btn btn-sm move-section-up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn btn-sm move-section-down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn btn-sm btn-danger remove-section">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="section-body">
                    <input type="text" class="section-title" placeholder="Section Title" data-index="${sectionIndex}">
                    <div class="section-editor" id="sectionEditor${sectionIndex}"></div>
                    <div class="section-media">
                        <label>Add Media to this Section</label>
                        <div class="media-options">
                            <button class="btn btn-outline btn-sm add-image-btn" data-type="image" data-index="${sectionIndex}">
                                <i class="fas fa-image"></i> Add Image
                            </button>
                            <button class="btn btn-outline btn-sm add-video-btn" data-type="video" data-index="${sectionIndex}">
                                <i class="fas fa-video"></i> Add Video
                            </button>
                        </div>
                        <div class="media-preview" id="mediaPreview${sectionIndex}"></div>
                    </div>
                </div>
            </div>
        `;
        
        sectionsContainer.insertAdjacentHTML('beforeend', sectionHTML);
        
        // Dispatch event for editor initialization
        document.dispatchEvent(new CustomEvent('sectionAdded', { 
            detail: { index: sectionIndex } 
        }));
        
        // Setup section event listeners
        setupSectionEventListeners(sectionIndex);
        
        // Update save status
        updateSaveStatus('unsaved');
    };
    
    // Setup initial section event listeners
    setupSectionEventListeners(0);
};

// Setup Section Event Listeners
const setupSectionEventListeners = (index) => {
    const sectionElement = document.querySelector(`.section-item[data-index="${index}"]`);
    if (!sectionElement) return;
    
    // Section title input
    const titleInput = sectionElement.querySelector('.section-title');
    if (titleInput) {
        titleInput.addEventListener('input', () => {
            updateSaveStatus('unsaved');
        });
    }
    
    // Move up button
    const moveUpBtn = sectionElement.querySelector('.move-section-up');
    if (moveUpBtn) {
        moveUpBtn.addEventListener('click', () => {
            moveSection(index, 'up');
        });
    }
    
    // Move down button
    const moveDownBtn = sectionElement.querySelector('.move-section-down');
    if (moveDownBtn) {
        moveDownBtn.addEventListener('click', () => {
            moveSection(index, 'down');
        });
    }
    
    // Remove section button
    const removeBtn = sectionElement.querySelector('.remove-section');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            removeSection(index);
        });
    }
    
    // Add image button
    const addImageBtn = sectionElement.querySelector('.add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', () => {
            showMediaLibrary(index, 'image');
        });
    }
    
    // Add video button
    const addVideoBtn = sectionElement.querySelector('.add-video-btn');
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', () => {
            showMediaLibrary(index, 'video');
        });
    }
};

// Move Section
const moveSection = (index, direction) => {
    const sectionsContainer = document.getElementById('sectionsContainer');
    const sections = Array.from(sectionsContainer.querySelectorAll('.section-item'));
    
    const currentIndex = sections.findIndex(section => 
        parseInt(section.dataset.index) === index
    );
    
    if (direction === 'up' && currentIndex > 0) {
        // Swap with previous section
        const temp = sections[currentIndex];
        sections[currentIndex] = sections[currentIndex - 1];
        sections[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < sections.length - 1) {
        // Swap with next section
        const temp = sections[currentIndex];
        sections[currentIndex] = sections[currentIndex + 1];
        sections[currentIndex + 1] = temp;
    }
    
    // Reorder sections in container
    sectionsContainer.innerHTML = '';
    sections.forEach((section, idx) => {
        section.dataset.index = idx;
        section.querySelector('.section-number').textContent = `Section ${idx + 1}`;
        sectionsContainer.appendChild(section);
    });
    
    updateSaveStatus('unsaved');
};

// Remove Section
const removeSection = (index) => {
    if (!confirm('Are you sure you want to remove this section?')) {
        return;
    }
    
    const sectionElement = document.querySelector(`.section-item[data-index="${index}"]`);
    if (sectionElement) {
        sectionElement.remove();
        
        // Update remaining sections
        const sections = Array.from(document.querySelectorAll('.section-item'));
        sections.forEach((section, idx) => {
            section.dataset.index = idx;
            section.querySelector('.section-number').textContent = `Section ${idx + 1}`;
        });
        
        updateSaveStatus('unsaved');
    }
};

// Setup Cover Image Upload
const setupCoverImageUpload = () => {
    const coverImageUpload = document.getElementById('coverImageUpload');
    const coverImageInput = document.getElementById('coverImageInput');
    const coverImagePlaceholder = document.getElementById('coverImagePlaceholder');
    const coverImagePreview = document.getElementById('coverImagePreview');
    const coverImagePreviewImg = document.getElementById('coverImagePreviewImg');
    const removeCoverImage = document.getElementById('removeCoverImage');
    
    if (!coverImageUpload || !coverImageInput) return;
    
    // Click to upload
    coverImageUpload.addEventListener('click', () => {
        coverImageInput.click();
    });
    
    // File selected
    coverImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }
        
        // Show loading
        coverImagePlaceholder.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Uploading image...</p>
        `;
        
        try {
            // Upload to Supabase Storage
            const result = await SupabaseUtils.uploadFile(file, 'covers');
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Show preview
            coverImagePlaceholder.style.display = 'none';
            coverImagePreview.style.display = 'block';
            coverImagePreviewImg.src = result.url;
            
            // Store file info
            coverImageUpload.dataset.fileUrl = result.url;
            coverImageUpload.dataset.filePath = result.path;
            
            updateSaveStatus('unsaved');
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Failed to upload image', 'error');
            
            // Reset placeholder
            coverImagePlaceholder.innerHTML = `
                <i class="fas fa-image"></i>
                <p>Click to upload cover image</p>
                <span>Recommended: 1200x630px</span>
            `;
        }
    });
    
    // Remove image
    if (removeCoverImage) {
        removeCoverImage.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            if (coverImageUpload.dataset.filePath) {
                try {
                    await SupabaseUtils.deleteFile(coverImageUpload.dataset.filePath);
                } catch (error) {
                    console.error('Delete error:', error);
                }
            }
            
            // Reset
            coverImagePreview.style.display = 'none';
            coverImagePlaceholder.style.display = 'block';
            coverImageInput.value = '';
            delete coverImageUpload.dataset.fileUrl;
            delete coverImageUpload.dataset.filePath;
            
            updateSaveStatus('unsaved');
        });
    }
};

// Setup Character Counters
const setupCharacterCounters = () => {
    const excerptTextarea = document.getElementById('blogExcerpt');
    const metaDescriptionTextarea = document.getElementById('metaDescription');
    
    if (excerptTextarea) {
        excerptTextarea.addEventListener('input', () => {
            const charCount = excerptTextarea.value.length;
            document.getElementById('excerptChars').textContent = charCount;
        });
    }
    
    if (metaDescriptionTextarea) {
        metaDescriptionTextarea.addEventListener('input', () => {
            const charCount = metaDescriptionTextarea.value.length;
            document.getElementById('metaChars').textContent = charCount;
        });
    }
};

// Setup Read Time Calculator
const setupReadTimeCalculator = () => {
    // Recalculate when content changes
    document.addEventListener('editorContentChanged', () => {
        calculateReadTime();
    });
};

// Calculate Read Time
const calculateReadTime = () => {
    let totalContent = '';
    
    // Get all section content
    Object.values(window.quillInstances || {}).forEach(quill => {
        totalContent += quill.getText();
    });
    
    // Calculate read time
    const readTime = SupabaseUtils.calculateReadTime(totalContent);
    
    // Update display
    const readTimeEl = document.getElementById('estimatedReadTime');
    if (readTimeEl) {
        readTimeEl.textContent = readTime;
    }
    
    return readTime;
};

// Setup Save Status
const setupSaveStatus = () => {
    window.editorSaveStatus = 'saved';
    
    // Listen for changes
    document.addEventListener('input', () => {
        if (window.editorSaveStatus === 'saved') {
            updateSaveStatus('unsaved');
        }
    });
};

// Update Save Status
const updateSaveStatus = (status) => {
    window.editorSaveStatus = status;
    const saveStatusEl = document.getElementById('saveStatus');
    
    if (saveStatusEl) {
        const icon = saveStatusEl.querySelector('i');
        const text = saveStatusEl.querySelector('span');
        
        if (status === 'saved') {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#34A853';
            text.textContent = 'Saved';
        } else if (status === 'unsaved') {
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = '#FBBC05';
            text.textContent = 'Unsaved changes';
        } else if (status === 'saving') {
            icon.className = 'fas fa-spinner fa-spin';
            icon.style.color = '#1a73e8';
            text.textContent = 'Saving...';
        }
    }
};

// Setup Form Handlers
const setupFormHandlers = () => {
    // Save button
    const saveBlogBtn = document.getElementById('saveBlogBtn');
    if (saveBlogBtn) {
        saveBlogBtn.addEventListener('click', async () => {
            await saveBlog();
        });
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', async () => {
            await saveBlog('draft');
        });
    }
    
    // Publish button
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            await saveBlog('publish');
        });
    }
    
    // Preview button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            previewBlog();
        });
    }
    
    // Back to dashboard
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.editorSaveStatus === 'unsaved') {
                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    window.location.href = 'admin-dashboard.html';
                }
            } else {
                window.location.href = 'admin-dashboard.html';
            }
        });
    }
    
    // Blog status selector
    const blogStatus = document.getElementById('blogStatus');
    const publishDate = document.getElementById('publishDate');
    
    if (blogStatus && publishDate) {
        blogStatus.addEventListener('change', () => {
            if (blogStatus.value === 'scheduled') {
                publishDate.style.display = 'block';
                
                // Set default date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                publishDate.value = tomorrow.toISOString().slice(0, 16);
            } else {
                publishDate.style.display = 'none';
            }
        });
    }
};

// Save Blog
const saveBlog = async (action = 'save') => {
    // Validate form
    if (!validateBlogForm()) {
        return;
    }
    
    // Update save status
    updateSaveStatus('saving');
    
    try {
        // Get form data
        const blogData = await getBlogFormData();
        
        // Determine status based on action
        let status = 'draft';
        let publishedAt = null;
        
        if (action === 'publish') {
            status = 'published';
            publishedAt = new Date().toISOString();
        } else if (blogData.status === 'scheduled') {
            status = 'scheduled';
            publishedAt = document.getElementById('publishDate').value;
        }
        
        // Prepare blog data
        const blogToSave = {
            title: blogData.title,
            slug: blogData.slug,
            excerpt: blogData.excerpt,
            content: blogData.content,
            cover_image: blogData.coverImage,
            category_id: blogData.categoryId,
            author_name: blogData.author,
            estimated_read_time: blogData.readTime,
            meta_title: blogData.metaTitle,
            meta_description: blogData.metaDescription,
            is_published: status === 'published' || status === 'scheduled',
            published_at: publishedAt
        };
        
        let result;
        
        // Check if we're editing an existing blog
        const urlParams = new URLSearchParams(window.location.search);
        const blogId = urlParams.get('id');
        
        if (blogId) {
            // Update existing blog
            const { data, error } = await supabase
                .from('blogs')
                .update(blogToSave)
                .eq('id', blogId)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
            
            // Delete existing sections
            await supabase
                .from('blog_sections')
                .delete()
                .eq('blog_id', blogId);
        } else {
            // Create new blog
            const { data, error } = await supabase
                .from('blogs')
                .insert([blogToSave])
                .select()
                .single();
            
            if (error) throw error;
            result = data;
        }
        
        // Save sections
        await saveBlogSections(result.id, blogData.sections);
        
        // Update save status
        updateSaveStatus('saved');
        
        // Show success message
        showNotification(`Blog ${action === 'publish' ? 'published' : 'saved'} successfully!`, 'success');
        
        // If publishing, redirect to dashboard after delay
        if (action === 'publish') {
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 2000);
        }
        
        // Update URL with blog ID if new
        if (!blogId && result.id) {
            const newUrl = window.location.pathname + '?id=' + result.id;
            window.history.replaceState({}, '', newUrl);
        }
        
    } catch (error) {
        console.error('Error saving blog:', error);
        updateSaveStatus('unsaved');
        showNotification('Failed to save blog: ' + error.message, 'error');
    }
};

// Validate Blog Form
const validateBlogForm = () => {
    const title = document.getElementById('blogTitle').value.trim();
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const category = document.getElementById('blogCategory').value;
    
    if (!title) {
        showNotification('Please enter a blog title', 'error');
        document.getElementById('blogTitle').focus();
        return false;
    }
    
    if (!excerpt) {
        showNotification('Please enter an excerpt', 'error');
        document.getElementById('blogExcerpt').focus();
        return false;
    }
    
    if (!category) {
        showNotification('Please select a category', 'error');
        document.getElementById('blogCategory').focus();
        return false;
    }
    
    // Check for at least one section
    const sections = document.querySelectorAll('.section-item');
    if (sections.length === 0) {
        showNotification('Please add at least one section', 'error');
        return false;
    }
    
    // Validate each section
    for (const section of sections) {
        const sectionIndex = section.dataset.index;
        const titleInput = section.querySelector('.section-title');
        const quill = window.quillInstances[sectionIndex];
        
        if (!titleInput.value.trim()) {
            showNotification(`Please enter a title for Section ${parseInt(sectionIndex) + 1}`, 'error');
            titleInput.focus();
            return false;
        }
        
        if (!quill || quill.getText().trim().length < 10) {
            showNotification(`Please add content to Section ${parseInt(sectionIndex) + 1}`, 'error');
            return false;
        }
    }
    
    return true;
};

// Get Blog Form Data
const getBlogFormData = async () => {
    // Basic fields
    const title = document.getElementById('blogTitle').value.trim();
    const slug = document.getElementById('slugPreview').textContent.trim();
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const categoryId = document.getElementById('blogCategory').value;
    const author = document.getElementById('blogAuthor').value;
    const metaTitle = document.getElementById('metaTitle').value.trim() || title;
    const metaDescription = document.getElementById('metaDescription').value.trim() || excerpt;
    const status = document.getElementById('blogStatus').value;
    
    // Cover image
    const coverImageUpload = document.getElementById('coverImageUpload');
    const coverImage = coverImageUpload.dataset.fileUrl || null;
    
    // Calculate read time
    const readTime = calculateReadTime();
    
    // Get sections data
    const sections = [];
    const sectionElements = document.querySelectorAll('.section-item');
    
    for (const sectionElement of sectionElements) {
        const index = parseInt(sectionElement.dataset.index);
        const titleInput = sectionElement.querySelector('.section-title');
        const quill = window.quillInstances[index];
        const mediaPreview = document.getElementById(`mediaPreview${index}`);
        
        const sectionData = {
            section_index: index,
            title: titleInput.value.trim(),
            content: quill ? quill.root.innerHTML : '',
            media_type: null,
            media_url: null
        };
        
        // Check for media
        if (mediaPreview) {
            const mediaElement = mediaPreview.querySelector('img, video');
            if (mediaElement) {
                sectionData.media_type = mediaElement.tagName.toLowerCase() === 'video' ? 'video' : 'image';
                sectionData.media_url = mediaElement.src;
            }
        }
        
        sections.push(sectionData);
    }
    
    // Get tags
    const tags = [];
    const tagElements = document.querySelectorAll('.tag');
    tagElements.forEach(tag => {
        tags.push(tag.textContent.trim());
    });
    
    return {
        title,
        slug,
        excerpt,
        categoryId: categoryId || null,
        author,
        coverImage,
        readTime,
        metaTitle,
        metaDescription,
        status,
        sections,
        tags
    };
};

// Save Blog Sections
const saveBlogSections = async (blogId, sections) => {
    if (!sections || sections.length === 0) return;
    
    // Prepare sections for insertion
    const sectionsToInsert = sections.map(section => ({
        blog_id: blogId,
        section_index: section.section_index,
        title: section.title,
        content: section.content,
        media_type: section.media_type,
        media_url: section.media_url
    }));
    
    // Insert sections
    const { error } = await supabase
        .from('blog_sections')
        .insert(sectionsToInsert);
    
    if (error) throw error;
};

// Preview Blog
const previewBlog = async () => {
    // Validate form
    if (!validateBlogForm()) {
        return;
    }
    
    // Get blog data
    const blogData = await getBlogFormData();
    
    // Store in session storage for preview
    sessionStorage.setItem('blogPreview', JSON.stringify(blogData));
    
    // Open preview in new tab
    const previewUrl = 'blog-preview.html';
    window.open(previewUrl, '_blank');
};

// Setup Media Library
const setupMediaLibrary = () => {
    const mediaLibraryBtn = document.getElementById('mediaLibraryBtn');
    const mediaLibraryModal = document.getElementById('mediaLibraryModal');
    const closeMediaModal = document.getElementById('closeMediaModal');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const bulkUploadInput = document.getElementById('bulkUploadInput');
    
    if (!mediaLibraryBtn || !mediaLibraryModal) return;
    
    // Open media library
    mediaLibraryBtn.addEventListener('click', () => {
        mediaLibraryModal.classList.add('active');
    });
    
    // Close media library
    if (closeMediaModal) {
        closeMediaModal.addEventListener('click', () => {
            mediaLibraryModal.classList.remove('active');
        });
    }
    
    // Close when clicking outside
    mediaLibraryModal.addEventListener('click', (e) => {
        if (e.target === mediaLibraryModal) {
            mediaLibraryModal.classList.remove('active');
        }
    });
    
    // Upload dropzone
    if (uploadDropzone && bulkUploadInput) {
        // Click to upload
        uploadDropzone.addEventListener('click', () => {
            bulkUploadInput.click();
        });
        
        // File selection
        bulkUploadInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            await uploadMultipleFiles(files);
        });
        
        // Drag and drop
        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.classList.add('dragover');
        });
        
        uploadDropzone.addEventListener('dragleave', () => {
            uploadDropzone.classList.remove('dragover');
        });
        
        uploadDropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadDropzone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            await uploadMultipleFiles(files);
        });
    }
    
    // Current media selection context
    window.currentMediaSelection = {
        sectionIndex: null,
        mediaType: null
    };
};

// Load Media Library
const loadMediaLibrary = async () => {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;
    
    try {
        // In a real implementation, you would fetch media from Supabase Storage
        // For now, we'll show a placeholder
        
        mediaGrid.innerHTML = `
            <div class="media-placeholder">
                <i class="fas fa-images"></i>
                <p>Media library empty</p>
                <small>Upload images or videos using the dropzone above</small>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading media library:', error);
        mediaGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load media library</p>
            </div>
        `;
    }
};

// Upload Multiple Files
const uploadMultipleFiles = async (files) => {
    const uploadDropzone = document.getElementById('uploadDropzone');
    if (!uploadDropzone) return;
    
    // Show loading
    const originalContent = uploadDropzone.innerHTML;
    uploadDropzone.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <p>Uploading ${files.length} file(s)...</p>
    `;
    
    try {
        const uploadPromises = files.map(file => SupabaseUtils.uploadFile(file, 'media'));
        const results = await Promise.all(uploadPromises);
        
        const successfulUploads = results.filter(r => r.success);
        const failedUploads = results.filter(r => !r.success);
        
        if (successfulUploads.length > 0) {
            showNotification(`Successfully uploaded ${successfulUploads.length} file(s)`, 'success');
            
            // Reload media library
            await loadMediaLibrary();
        }
        
        if (failedUploads.length > 0) {
            showNotification(`Failed to upload ${failedUploads.length} file(s)`, 'error');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Upload failed', 'error');
    } finally {
        // Restore original content
        uploadDropzone.innerHTML = originalContent;
    }
};

// Show Media Library for Selection
const showMediaLibrary = (sectionIndex, mediaType) => {
    // Set selection context
    window.currentMediaSelection = {
        sectionIndex,
        mediaType
    };
    
    // Open media library
    const mediaLibraryModal = document.getElementById('mediaLibraryModal');
    if (mediaLibraryModal) {
        mediaLibraryModal.classList.add('active');
        
        // Update media grid for selection
        updateMediaGridForSelection();
    }
};

// Update Media Grid for Selection
const updateMediaGridForSelection = () => {
    const mediaGrid = document.getElementById('mediaGrid');
    if (!mediaGrid) return;
    
    // In a real implementation, you would show media items with selection capability
    // For now, we'll update the placeholder text
    const placeholder = mediaGrid.querySelector('.media-placeholder');
    if (placeholder) {
        const { sectionIndex, mediaType } = window.currentMediaSelection;
        placeholder.querySelector('p').textContent = `Select ${mediaType} for Section ${sectionIndex + 1}`;
    }
};

// Load Blog for Editing
const loadBlogForEditing = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    
    if (!blogId) return;
    
    try {
        // Fetch blog data
        const { data: blog, error } = await supabase
            .from('blogs')
            .select(`
                *,
                blog_sections(*)
            `)
            .eq('id', blogId)
            .single();
        
        if (error) throw error;
        
        if (!blog) {
            throw new Error('Blog not found');
        }
        
        // Populate form fields
        populateBlogForm(blog);
        
        // Load sections
        await loadBlogSections(blog.blog_sections);
        
        // Update page title
        document.title = `Editing: ${blog.title} | Zawadi Careers Admin`;
        
    } catch (error) {
        console.error('Error loading blog for editing:', error);
        showNotification('Failed to load blog for editing', 'error');
    }
};

// Populate Blog Form
const populateBlogForm = (blog) => {
    // Basic fields
    document.getElementById('blogTitle').value = blog.title || '';
    document.getElementById('slugPreview').textContent = blog.slug || SupabaseUtils.generateSlug(blog.title);
    document.getElementById('blogExcerpt').value = blog.excerpt || '';
    document.getElementById('blogCategory').value = blog.category_id || '';
    document.getElementById('blogAuthor').value = blog.author_name || 'Zawadi Team';
    document.getElementById('metaTitle').value = blog.meta_title || '';
    document.getElementById('metaDescription').value = blog.meta_description || '';
    document.getElementById('blogStatus').value = blog.is_published ? 'published' : 'draft';
    
    // Cover image
    if (blog.cover_image) {
        const coverImageUpload = document.getElementById('coverImageUpload');
        const coverImagePlaceholder = document.getElementById('coverImagePlaceholder');
        const coverImagePreview = document.getElementById('coverImagePreview');
        const coverImagePreviewImg = document.getElementById('coverImagePreviewImg');
        
        coverImagePlaceholder.style.display = 'none';
        coverImagePreview.style.display = 'block';
        coverImagePreviewImg.src = blog.cover_image;
        
        coverImageUpload.dataset.fileUrl = blog.cover_image;
    }
    
    // Read time
    document.getElementById('estimatedReadTime').textContent = blog.estimated_read_time || 0;
    
    // Trigger character count updates
    document.getElementById('blogExcerpt').dispatchEvent(new Event('input'));
    document.getElementById('metaDescription').dispatchEvent(new Event('input'));
};

// Load Blog Sections
const loadBlogSections = async (sections) => {
    if (!sections || sections.length === 0) return;
    
    // Clear existing sections (except first)
    const sectionsContainer = document.getElementById('sectionsContainer');
    const firstSection = sectionsContainer.querySelector('.section-item[data-index="0"]');
    sectionsContainer.innerHTML = '';
    
    if (firstSection) {
        sectionsContainer.appendChild(firstSection);
    }
    
    // Sort sections by index
    sections.sort((a, b) => a.section_index - b.section_index);
    
    // Load each section
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (i === 0 && firstSection) {
            // Populate first section
            const titleInput = firstSection.querySelector('.section-title');
            const quill = window.quillInstances[0];
            
            if (titleInput) titleInput.value = section.title || '';
            if (quill) quill.root.innerHTML = section.content || '';
            
            // Load media if exists
            if (section.media_url) {
                const mediaPreview = document.getElementById('mediaPreview0');
                if (mediaPreview) {
                    const mediaHTML = section.media_type === 'video' ? 
                        `<video controls><source src="${section.media_url}" type="video/mp4"></video>` :
                        `<img src="${section.media_url}" alt="${section.title}">`;
                    
                    mediaPreview.innerHTML = mediaHTML;
                }
            }
        } else {
            // Add new section
            addNewSection();
            
            // Get the newly added section
            const sectionElements = document.querySelectorAll('.section-item');
            const newSection = sectionElements[sectionElements.length - 1];
            const sectionIndex = newSection.dataset.index;
            
            // Populate section data
            const titleInput = newSection.querySelector('.section-title');
            const quill = window.quillInstances[sectionIndex];
            
            if (titleInput) titleInput.value = section.title || '';
            if (quill) {
                // Wait for Quill to initialize
                setTimeout(() => {
                    quill.root.innerHTML = section.content || '';
                }, 100);
            }
            
            // Load media if exists
            if (section.media_url) {
                const mediaPreview = document.getElementById(`mediaPreview${sectionIndex}`);
                if (mediaPreview) {
                    const mediaHTML = section.media_type === 'video' ? 
                        `<video controls><source src="${section.media_url}" type="video/mp4"></video>` :
                        `<img src="${section.media_url}" alt="${section.title}">`;
                    
                    mediaPreview.innerHTML = mediaHTML;
                }
            }
        }
    }
};

// Setup Logout (editor specific)
const setupLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.editorSaveStatus === 'unsaved') {
                if (confirm('You have unsaved changes. Are you sure you want to logout?')) {
                    SessionManager.clearAdminSession();
                }
            } else {
                SessionManager.clearAdminSession();
            }
        });
    }
};

// Export function
window.initBlogEditor = initBlogEditor;
