// Global variables
let currentUser = null;
let socket = null;
let currentChat = null;
let currentPage = 1;
let currentFilters = {};

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        fetchUserProfile();
    }

    // Initialize navigation
    initializeNavigation();
    
    // Initialize modals
    initializeModals();
    
    // Initialize forms
    initializeForms();
    
    // Initialize help requests
    initializeHelpRequests();
    
    // Initialize chat
    initializeChat();
    
    // Initialize location services
    initializeLocation();
    
    // Show home section by default
    showSection('home');
}

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Auth buttons
    document.getElementById('login-btn').addEventListener('click', () => showModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => showModal('register-modal'));
    document.getElementById('logout-btn').addEventListener('click', logout);

    // User dropdown menu items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            if (href) {
                const section = href.substring(1);
                showSection(section);
                
                // Update active link in navigation
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const navLink = document.querySelector(`[href="${href}"]`);
                if (navLink) navLink.classList.add('active');
            }
        });
    });

    // Hero buttons
    document.getElementById('seek-help-btn').addEventListener('click', () => {
        if (currentUser) {
            showModal('create-request-modal');
        } else {
            showModal('login-modal');
        }
    });

    document.getElementById('offer-help-btn').addEventListener('click', () => {
        showSection('help-requests');
    });

    // Footer links
    document.querySelectorAll('footer a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Load section-specific content
        switch(sectionId) {
            case 'help-requests':
                loadHelpRequests();
                break;
            case 'profile':
                loadUserProfile();
                break;
            case 'my-requests':
                loadMyRequests();
                break;
            case 'chats':
                loadChats();
                break;
        }
    }
}

function initializeModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            hideModal(modal.id);
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initializeForms() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Create request form
    document.getElementById('create-request-form').addEventListener('submit', handleCreateRequest);
    
    // Profile update form
    document.getElementById('profile-form').addEventListener('submit', handleUpdateProfile);
    
    // Chat form
    document.getElementById('chat-form').addEventListener('submit', sendMessage);
    
    // Use current location button
    document.getElementById('use-current-location').addEventListener('click', () => {
        getCurrentLocation().then(location => {
            document.getElementById('request-location').value = location;
        });
    });

    // Modal switching functionality
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    const switchToLoginBtn = document.getElementById('switch-to-login');
    
    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => {
            hideModal('login-modal');
            showModal('register-modal');
        });
    }
    
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', () => {
            hideModal('register-modal');
            showModal('login-modal');
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            await fetchUserProfile();
            hideModal('login-modal');
            showToast('Login successful!', 'success');
            e.target.reset();
        } else {
            showToast(result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            await fetchUserProfile();
            hideModal('register-modal');
            showToast('Registration successful!', 'success');
            e.target.reset();
        } else {
            showToast(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('An error occurred during registration', 'error');
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            updateUIForUser();
            initializeSocketOnLogin();
        } else {
            localStorage.removeItem('token');
            currentUser = null;
            updateUIForUser();
        }
    } catch (error) {
        console.error('Fetch user profile error:', error);
        localStorage.removeItem('token');
        currentUser = null;
        updateUIForUser();
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForUser();
    showSection('home');
    showToast('Logged out successfully', 'success');
}

function updateUIForUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const profileNavLink = document.getElementById('profile-nav-link');

    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        
        // Update profile display
        updateProfileDisplay();
        
        // Show profile nav link for logged in users
        if (profileNavLink) {
            profileNavLink.style.display = 'block';
        }
    } else {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
        
        // Hide profile nav link for logged out users
        if (profileNavLink) {
            profileNavLink.style.display = 'none';
        }
    }
}

function initializeHelpRequests() {
    // Filters
    const categoryFilter = document.getElementById('category-filter');
    const urgencyFilter = document.getElementById('urgency-filter');
    const locationFilterBtn = document.getElementById('location-filter-btn');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateFilters);
    }
    
    if (urgencyFilter) {
        urgencyFilter.addEventListener('change', updateFilters);
    }
    
    if (locationFilterBtn) {
        locationFilterBtn.addEventListener('click', useLocationFilter);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(1));
    }
}

async function loadHelpRequests() {
    const loading = document.getElementById('requests-loading');
    const grid = document.getElementById('requests-grid');
    const noRequests = document.getElementById('no-requests');

    if (!loading || !grid || !noRequests) {
        console.error('Required elements not found');
        return;
    }

    loading.style.display = 'block';
    grid.innerHTML = '';
    noRequests.style.display = 'none';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            ...currentFilters
        });

        console.log('Loading help requests with filters:', currentFilters);

        const response = await fetch(`${API_BASE}/help-requests?${params}`);
        const result = await response.json();

        if (response.ok) {
            if (result.helpRequests.length > 0) {
                displayHelpRequests(result.helpRequests);
                updatePagination(result.pagination);
            } else {
                noRequests.style.display = 'block';
            }
        } else {
            showToast('Failed to load help requests', 'error');
        }
    } catch (error) {
        console.error('Load help requests error:', error);
        showToast('An error occurred while loading help requests', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function displayHelpRequests(requests, gridElement = null) {
    const grid = gridElement || document.getElementById('requests-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    requests.forEach(request => {
        const card = createRequestCard(request);
        grid.appendChild(card);
    });
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
        <div class="request-header">
            <div>
                <h3 class="request-title">${request.title}</h3>
                <span class="request-category">${request.category}</span>
            </div>
            <span class="request-urgency urgency-${request.urgency}">${request.urgency}</span>
        </div>
        <p class="request-description">${request.description}</p>
        <div class="request-footer">
            <div class="request-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${request.location?.city || 'Location not specified'}</span>
            </div>
            <div class="request-time">
                ${formatTime(request.createdAt)}
            </div>
        </div>
    `;

    card.addEventListener('click', () => showRequestDetails(request));
    return card;
}

function showRequestDetails(request) {
    const modal = document.getElementById('request-details-modal');
    const title = document.getElementById('request-details-title');
    const body = document.getElementById('request-details-body');

    if (!modal || !title || !body) {
        console.error('Request details modal elements not found');
        return;
    }

    title.textContent = request.title;
    
    // Create accept button HTML only if user is logged in and not the requester
    const acceptButtonHtml = (currentUser && request.requester?._id !== currentUser._id && request.status === 'open') 
        ? `<button class="btn btn-primary" onclick="acceptRequest('${request._id}')">Accept Request</button>` 
        : '';

    body.innerHTML = `
        <div class="request-details">
            <div class="detail-row">
                <strong>Category:</strong> ${request.category}
            </div>
            <div class="detail-row">
                <strong>Urgency:</strong> 
                <span class="urgency-${request.urgency}">${request.urgency}</span>
            </div>
            <div class="detail-row">
                <strong>Description:</strong>
                <p>${request.description}</p>
            </div>
            <div class="detail-row">
                <strong>Location:</strong> ${request.location?.address || 'Not specified'}
            </div>
            <div class="detail-row">
                <strong>Posted by:</strong> ${request.requester?.name || 'Anonymous'}
            </div>
            <div class="detail-row">
                <strong>Posted:</strong> ${formatTime(request.createdAt)}
            </div>
            <div class="detail-row">
                <strong>Status:</strong> ${request.status}
            </div>
            ${acceptButtonHtml}
        </div>
    `;

    showModal('request-details-modal');
}

async function acceptRequest(requestId) {
    console.log('Accepting request:', requestId);
    
    try {
        const response = await fetch(`${API_BASE}/help-requests/${requestId}/accept`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            hideModal('request-details-modal');
            showToast('Request accepted successfully!', 'success');
            loadHelpRequests(); // Refresh the list
        } else {
            showToast(result.message || 'Failed to accept request', 'error');
        }
    } catch (error) {
        console.error('Accept request error:', error);
        showToast('An error occurred while accepting the request', 'error');
    }
}

function updateFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const urgencyFilter = document.getElementById('urgency-filter');
    
    currentFilters = {
        category: categoryFilter ? categoryFilter.value : '',
        urgency: urgencyFilter ? urgencyFilter.value : ''
    };
    
    // Remove empty filters
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    currentPage = 1;
    console.log('Updated filters:', currentFilters);
    loadHelpRequests();
}

async function useLocationFilter() {
    if (navigator.geolocation) {
        try {
            const position = await getCurrentPosition();
            currentFilters.latitude = position.coords.latitude;
            currentFilters.longitude = position.coords.longitude;
            currentFilters.radius = 10000; // 10km
            currentPage = 1;
            loadHelpRequests();
            showToast('Location filter applied', 'success');
        } catch (error) {
            showToast('Failed to get location', 'error');
        }
    } else {
        showToast('Geolocation is not supported by this browser', 'error');
    }
}

function changePage(delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    loadHelpRequests();
}

function updatePagination(pagination) {
    const paginationEl = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (!paginationEl || !pageInfo || !prevBtn || !nextBtn) return;

    if (pagination.pages > 1) {
        paginationEl.style.display = 'flex';
        pageInfo.textContent = `Page ${pagination.page} of ${pagination.pages}`;
        prevBtn.disabled = pagination.page <= 1;
        nextBtn.disabled = pagination.page >= pagination.pages;
    } else {
        paginationEl.style.display = 'none';
    }
}

// Create Request
async function handleCreateRequest(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        urgency: formData.get('urgency'),
        isAnonymous: formData.get('isAnonymous') === 'on',
        coordinates: [0, 0], // Default coordinates
        address: formData.get('location') || ''
    };

    try {
        const response = await fetch(`${API_BASE}/help-requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            hideModal('create-request-modal');
            showToast('Help request created successfully!', 'success');
            e.target.reset();
            loadHelpRequests(); // Refresh the list
        } else {
            showToast(result.message || 'Failed to create help request', 'error');
        }
    } catch (error) {
        console.error('Create request error:', error);
        showToast('An error occurred while creating the request', 'error');
    }
}

// Chat functionality
function initializeChat() {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', sendMessage);
    }
}

function initializeSocket() {
    if (socket) {
        socket.disconnect();
    }

    socket = io();

    socket.on('connect', () => {
        console.log('Connected to chat server');
    });

    socket.on('receive-message', (data) => {
        if (currentChat && data.roomId === currentChat._id) {
            addMessageToChat(data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
    });
}

function initializeSocketOnLogin() {
    if (currentUser) {
        initializeSocket();
    }
}

async function openChat(helpRequestId) {
    try {
        const response = await fetch(`${API_BASE}/chat/${helpRequestId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            currentChat = result.chat;
            displayChat(result.chat);
            socket.emit('join-room', result.chat._id);
        } else {
            showToast(result.message || 'Failed to open chat', 'error');
        }
    } catch (error) {
        console.error('Open chat error:', error);
        showToast('An error occurred while opening the chat', 'error');
    }
}

async function createChat(helpRequestId) {
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ helpRequestId })
        });

        const result = await response.json();

        if (response.ok) {
            currentChat = result.chat;
            displayChat(result.chat);
            socket.emit('join-room', result.chat._id);
        } else {
            showToast(result.message || 'Failed to create chat', 'error');
        }
    } catch (error) {
        console.error('Create chat error:', error);
        showToast('An error occurred while creating the chat', 'error');
    }
}

function displayChat(chat) {
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');

    if (!chatContainer || !chatMessages || !chatForm) return;

    chatContainer.style.display = 'block';
    chatMessages.innerHTML = '';

    chat.messages.forEach(message => {
        addMessageToChat(message);
    });

    chatForm.style.display = 'block';
}

function addMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.sender === currentUser._id ? 'sent' : 'received'}`;
    messageEl.innerHTML = `
        <div class="message-content">
            <p>${message.message}</p>
            <span class="message-time">${formatTime(message.createdAt)}</span>
        </div>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage(e) {
    e.preventDefault();

    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message || !currentChat) return;

    try {
        const response = await fetch(`${API_BASE}/chat/${currentChat._id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const result = await response.json();

        if (response.ok) {
            messageInput.value = '';
            addMessageToChat(result.message);
        } else {
            showToast(result.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showToast('An error occurred while sending the message', 'error');
    }
}

// Profile functionality
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        // Get user profile data
        const profileResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const profileResult = await profileResponse.json();

        if (profileResponse.ok) {
            // Update currentUser with fresh data
            currentUser = profileResult.user;
            
            // Update profile display
            updateProfileDisplay();
            updateProfileForm();
            
            // Get user stats
            const statsResponse = await fetch(`${API_BASE}/users/me/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const statsResult = await statsResponse.json();

            if (statsResponse.ok) {
                updateProfileStats(statsResult.stats);
            }
        } else {
            showToast('Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showToast('An error occurred while loading profile', 'error');
    }
}

function updateProfileDisplay() {
    if (!currentUser) return;

    // Update navigation bar user info
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.name || 'User';
    }
    
    if (userAvatarElement) {
        userAvatarElement.src = currentUser.profile?.avatar || 'https://via.placeholder.com/32';
        userAvatarElement.alt = currentUser.name || 'User Avatar';
    }

    // Update profile page elements
    const profileNameElement = document.getElementById('profile-name');
    const profileEmailElement = document.getElementById('profile-email');
    const profileAvatarElement = document.getElementById('profile-avatar-img');
    
    if (profileNameElement) {
        profileNameElement.textContent = currentUser.name || 'User Name';
    }
    
    if (profileEmailElement) {
        profileEmailElement.textContent = currentUser.email || 'user@example.com';
    }
    
    if (profileAvatarElement) {
        profileAvatarElement.src = currentUser.profile?.avatar || 'https://via.placeholder.com/120';
        profileAvatarElement.alt = currentUser.name || 'Profile';
    }
}

function updateProfileStats(stats) {
    const statsContainer = document.getElementById('profile-stats');
    if (!statsContainer) return;

    // Calculate totals
    const totalRequests = (stats.requested?.total || 0) + (stats.helped?.total || 0);
    const completedRequests = (stats.requested?.completed || 0) + (stats.helped?.completed || 0);
    const activeRequests = (stats.requested?.open || 0) + (stats.requested?.inProgress || 0) + (stats.helped?.inProgress || 0);
    const helpProvided = stats.helped?.total || 0;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalRequests}</div>
            <div class="stat-label">Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${completedRequests}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${activeRequests}</div>
            <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${helpProvided}</div>
            <div class="stat-label">Help Provided</div>
        </div>
    `;
}

function updateProfileActivity(requests) {
    const activityContainer = document.getElementById('profile-activity');
    if (!activityContainer) return;

    if (requests.length === 0) {
        activityContainer.innerHTML = '<p>No recent activity</p>';
        return;
    }

    const activityHTML = requests.map(request => `
        <div class="activity-item">
            <div class="activity-icon">
                ${getActivityIcon(request.status)}
            </div>
            <div class="activity-content">
                <h4>${request.title}</h4>
                <p>${request.description}</p>
                <span class="activity-time">${formatTime(request.createdAt)}</span>
            </div>
        </div>
    `).join('');

    activityContainer.innerHTML = activityHTML;
}

function getActivityIcon(status) {
    const icons = {
        'open': '<i class="fas fa-clock"></i>',
        'in-progress': '<i class="fas fa-spinner"></i>',
        'completed': '<i class="fas fa-check-circle"></i>',
        'cancelled': '<i class="fas fa-times-circle"></i>'
    };
    return icons[status] || '<i class="fas fa-question-circle"></i>';
}

function updateProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form || !currentUser) return;

    // Update form fields with current user data
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const bioInput = form.querySelector('[name="bio"]');
    const skillsInput = form.querySelector('[name="skills"]');
    
    if (nameInput) {
        nameInput.value = currentUser.name || '';
    }
    
    if (phoneInput) {
        phoneInput.value = currentUser.phone || '';
    }
    
    if (bioInput) {
        bioInput.value = currentUser.profile?.bio || '';
    }
    
    if (skillsInput) {
        skillsInput.value = currentUser.profile?.skills?.join(', ') || '';
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        profile: {
            bio: formData.get('bio'),
            skills: formData.get('skills') ? formData.get('skills').split(',').map(skill => skill.trim()) : []
        }
    };

    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            currentUser = result.user;
            updateUIForUser();
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast(result.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('An error occurred while updating profile', 'error');
    }
}

// Location services
function initializeLocation() {
    // Location functionality will be implemented here
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function getCurrentLocation() {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding would be implemented here
        return `${latitude}, ${longitude}`;
    } catch (error) {
        console.error('Get location error:', error);
        throw error;
    }
}

async function updateUserLocation(latitude, longitude) {
    try {
        const response = await fetch(`${API_BASE}/users/location`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitude, longitude })
        });

        if (response.ok) {
            showToast('Location updated successfully', 'success');
        } else {
            showToast('Failed to update location', 'error');
        }
    } catch (error) {
        console.error('Update location error:', error);
        showToast('An error occurred while updating location', 'error');
    }
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function initializeSocketOnLogin() {
    if (currentUser) {
        initializeSocket();
    }
}

async function loadMyRequests() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/help-requests/my-requests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            const container = document.getElementById('my-requests-container');
            if (container) {
                displayHelpRequests(result.helpRequests, container);
            }
        } else {
            showToast('Failed to load your requests', 'error');
        }
    } catch (error) {
        console.error('Load my requests error:', error);
        showToast('An error occurred while loading your requests', 'error');
    }
}

async function loadChats() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            const container = document.getElementById('chats-container');
            if (container) {
                container.innerHTML = '';
                
                result.chats.forEach(chat => {
                    const chatEl = document.createElement('div');
                    chatEl.className = 'chat-item';
                    chatEl.innerHTML = `
                        <div class="chat-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="chat-content">
                            <div class="chat-name">${chat.participants.find(p => p._id !== currentUser._id)?.name || 'Unknown'}</div>
                            <div class="chat-last-message">${chat.lastMessage?.message || 'No messages yet'}</div>
                        </div>
                        <div class="chat-time">${chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : ''}</div>
                    `;
                    
                    chatEl.addEventListener('click', () => openChat(chat.helpRequest));
                    container.appendChild(chatEl);
                });
            }
        } else {
            showToast('Failed to load chats', 'error');
        }
    } catch (error) {
        console.error('Load chats error:', error);
        showToast('An error occurred while loading chats', 'error');
    }
} 