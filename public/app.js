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
        showSection('requests');
    });

    // Footer links
    document.querySelectorAll('footer a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);

            // Update active link in navigation
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const navLink = document.querySelector(`.nav-link[href="#${section}"]`);
            if (navLink) navLink.classList.add('active');
        });
    });
}

// Section management
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Load section-specific content
    switch (sectionId) {
        case 'requests':
            loadHelpRequests();
            break;
        case 'profile':
            if (currentUser) {
                loadUserProfile();
            } else {
                showModal('login-modal');
            }
            break;
        case 'my-requests':
            if (currentUser) {
                loadMyRequests();
            } else {
                showModal('login-modal');
            }
            break;
        case 'chats':
            if (currentUser) {
                loadChats();
            } else {
                showModal('login-modal');
            }
            break;
    }
}

// Modal management
function initializeModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    // Auth modal switches
    document.getElementById('switch-to-register').addEventListener('click', () => {
        hideModal('login-modal');
        showModal('register-modal');
    });

    document.getElementById('switch-to-login').addEventListener('click', () => {
        hideModal('register-modal');
        showModal('login-modal');
    });

    // Cancel buttons
    document.getElementById('cancel-create').addEventListener('click', () => {
        hideModal('create-request-modal');
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

// Form initialization
function initializeForms() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Create request form
    document.getElementById('create-request-form').addEventListener('submit', handleCreateRequest);
    
    // Profile form
    document.getElementById('profile-form').addEventListener('submit', handleUpdateProfile);
}

// Authentication
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
            currentUser = result.user;
            updateUIForUser();
            hideModal('login-modal');
            showToast('Login successful!', 'success');
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
        password: formData.get('password'),
        phone: formData.get('phone'),
        role: formData.get('role')
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
            currentUser = result.user;
            updateUIForUser();
            hideModal('register-modal');
            showToast('Account created successfully!', 'success');
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
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Fetch user profile error:', error);
        localStorage.removeItem('token');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForUser();
    showSection('home');
    showToast('Logged out successfully', 'info');
    
    // Disconnect socket if connected
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function updateUIForUser() {
    const navAuth = document.getElementById('nav-auth');
    const navUser = document.getElementById('nav-user');
    const createRequestBtn = document.getElementById('create-request-btn');
    const profileNavLink = document.getElementById('profile-nav-link');

    if (currentUser) {
        navAuth.style.display = 'none';
        navUser.style.display = 'block';
        createRequestBtn.style.display = 'block';
        profileNavLink.style.display = 'block';
        
        // Update user info
        document.getElementById('user-name').textContent = currentUser.name;
        if (currentUser.profile?.avatar) {
            document.getElementById('user-avatar').src = currentUser.profile.avatar;
        }
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
        createRequestBtn.style.display = 'none';
        profileNavLink.style.display = 'none';
    }
}

// Help Requests
function initializeHelpRequests() {
    // Filters
    document.getElementById('category-filter').addEventListener('change', updateFilters);
    document.getElementById('urgency-filter').addEventListener('change', updateFilters);
    document.getElementById('location-filter-btn').addEventListener('click', useLocationFilter);
    
    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

async function loadHelpRequests() {
    const loading = document.getElementById('requests-loading');
    const grid = document.getElementById('requests-grid');
    const noRequests = document.getElementById('no-requests');

    loading.style.display = 'block';
    grid.innerHTML = '';
    noRequests.style.display = 'none';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            ...currentFilters
        });

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

    title.textContent = request.title;
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
            <div class="request-actions">
                ${request.status === 'open' && currentUser && request.requester?._id !== currentUser._id ? 
                    `<button class="btn btn-primary" id="accept-request-btn" data-request-id="${request._id}">Accept Request</button>` : 
                    ''
                }
                ${request.status === 'in-progress' && currentUser && 
                    (request.requester?._id === currentUser._id || request.helper?._id === currentUser._id) ? 
                    `<button class="btn btn-secondary" id="open-chat-btn" data-request-id="${request._id}">Open Chat</button>` : 
                    ''
                }
            </div>
        </div>
    `;

    // Add event listeners for buttons
    const acceptBtn = document.getElementById('accept-request-btn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => acceptRequest(request._id));
    }

    const chatBtn = document.getElementById('open-chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', () => openChat(request._id));
    }

    showModal('request-details-modal');
}

async function acceptRequest(requestId) {
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
            
            // Open chat automatically after accepting
            if (result.chat) {
                currentChat = result.chat;
                displayChat(currentChat);
                if (socket) {
                    socket.emit('join-room', currentChat._id);
                }
                showModal('chat-modal');
            }
            
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
    currentFilters = {
        category: document.getElementById('category-filter').value,
        urgency: document.getElementById('urgency-filter').value
    };
    currentPage = 1;
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
            e.target.reset();
            showToast('Help request created successfully!', 'success');
            loadHelpRequests();
        } else {
            showToast(result.message || 'Failed to create request', 'error');
        }
    } catch (error) {
        console.error('Create request error:', error);
        showToast('An error occurred while creating the request', 'error');
    }
}

// Chat functionality
function initializeChat() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-message-btn');

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function initializeSocket() {
    if (!currentUser || socket) return;

    // Check if Socket.io is available
    if (typeof io === 'undefined') {
        console.log('Socket.io not available, chat features will be limited');
        return;
    }

    try {
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
    } catch (error) {
        console.log('Socket.io connection failed:', error);
    }
}

async function openChat(helpRequestId) {
    try {
        const response = await fetch(`${API_BASE}/chat/help-request/${helpRequestId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            currentChat = result.chat;
            if (currentChat) {
                displayChat(currentChat);
                if (socket) {
                    socket.emit('join-room', currentChat._id);
                }
            } else {
                // Create new chat
                await createChat(helpRequestId);
            }
            showModal('chat-modal');
        } else {
            showToast('Failed to load chat', 'error');
        }
    } catch (error) {
        console.error('Open chat error:', error);
        showToast('An error occurred while opening chat', 'error');
    }
}

async function createChat(helpRequestId) {
    try {
        const response = await fetch(`${API_BASE}/chat/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                helpRequestId: helpRequestId,
                otherUserId: currentUser._id // This would need to be the other user's ID
            })
        });

        const result = await response.json();

        if (response.ok) {
            currentChat = result.chat;
            displayChat(currentChat);
            if (socket) {
                socket.emit('join-room', currentChat._id);
            }
        } else {
            showToast('Failed to create chat', 'error');
        }
    } catch (error) {
        console.error('Create chat error:', error);
        showToast('An error occurred while creating chat', 'error');
    }
}

function displayChat(chat) {
    const messagesContainer = document.getElementById('chat-messages');
    const chatTitle = document.getElementById('chat-title');

    // Set chat title
    const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
    chatTitle.textContent = `Chat with ${otherParticipant?.name || 'User'}`;

    // Display messages
    messagesContainer.innerHTML = '';
    if (chat.messages && chat.messages.length > 0) {
        chat.messages.forEach(message => {
            addMessageToChat(message);
        });
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessageToChat(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const isSent = message.sender === currentUser._id || message.sender?._id === currentUser._id;

    const messageEl = document.createElement('div');
    messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
    messageEl.innerHTML = `
        <img src="${message.sender?.profile?.avatar || 'https://via.placeholder.com/32'}" 
             alt="Avatar" class="message-avatar">
        <div>
            <div class="message-content">${message.content}</div>
            <div class="message-time">${formatTime(message.createdAt)}</div>
        </div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();

    if (!content || !currentChat) return;

    try {
        const response = await fetch(`${API_BASE}/chat/${currentChat._id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        const result = await response.json();

        if (response.ok) {
            messageInput.value = '';
            addMessageToChat(result.chat.messages[result.chat.messages.length - 1]);
        } else {
            showToast('Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showToast('An error occurred while sending message', 'error');
    }
}

// Profile management
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        // Load user stats
        const statsResponse = await fetch(`${API_BASE}/users/me/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateProfileStats(stats.stats);
        }

        // Load recent activity
        const activityResponse = await fetch(`${API_BASE}/users/me/requests?limit=5`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (activityResponse.ok) {
            const activity = await activityResponse.json();
            updateProfileActivity(activity.helpRequests);
        }

        // Update profile form
        updateProfileForm();
    } catch (error) {
        console.error('Load profile error:', error);
        showToast('Failed to load profile data', 'error');
    }
}

function updateProfileStats(stats) {
    document.getElementById('requests-made').textContent = stats.requested.total;
    document.getElementById('requests-helped').textContent = stats.helped.total;
    
    const completionRate = stats.requested.total > 0 ? 
        Math.round((stats.requested.completed / stats.requested.total) * 100) : 0;
    document.getElementById('completion-rate').textContent = `${completionRate}%`;

    // Update rating
    if (stats.rating.average > 0) {
        document.getElementById('profile-rating-text').textContent = 
            `${stats.rating.average} (${stats.rating.total} reviews)`;
    }
}

function updateProfileActivity(requests) {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '';

    requests.forEach(request => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(request.status)}"></i>
            </div>
            <div class="activity-content">
                <h4>${request.title}</h4>
                <p>${request.status} • ${formatTime(request.updatedAt)}</p>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function getActivityIcon(status) {
    switch (status) {
        case 'open': return 'clock';
        case 'in-progress': return 'spinner';
        case 'completed': return 'check';
        case 'cancelled': return 'times';
        default: return 'info';
    }
}

function updateProfileForm() {
    if (!currentUser) return;

    document.getElementById('profile-name-input').value = currentUser.name || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-bio').value = currentUser.profile?.bio || '';
    document.getElementById('profile-skills').value = currentUser.profile?.skills?.join(', ') || '';
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        profile: {
            bio: formData.get('bio'),
            skills: formData.get('skills').split(',').map(s => s.trim()).filter(s => s)
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
    document.getElementById('use-current-location').addEventListener('click', getCurrentLocation);
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function getCurrentLocation() {
    if (navigator.geolocation) {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            // Update location input
            document.getElementById('request-location').value = `${latitude}, ${longitude}`;
            
            // Update user location in profile
            if (currentUser) {
                await updateUserLocation(latitude, longitude);
            }
            
            showToast('Location updated successfully', 'success');
        } catch (error) {
            showToast('Failed to get location', 'error');
        }
    } else {
        showToast('Geolocation is not supported by this browser', 'error');
    }
}

async function updateUserLocation(latitude, longitude) {
    try {
        const response = await fetch(`${API_BASE}/auth/location`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                coordinates: [longitude, latitude]
            })
        });

        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
        }
    } catch (error) {
        console.error('Update location error:', error);
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
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'exclamation-circle' :
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

// Initialize socket when user logs in
function initializeSocketOnLogin() {
    if (currentUser && !socket) {
        initializeSocket();
    }
}

// Load my requests
async function loadMyRequests() {
    const loading = document.getElementById('my-requests-loading');
    const grid = document.getElementById('my-requests-grid');
    const noRequests = document.getElementById('no-my-requests');

    loading.style.display = 'block';
    grid.innerHTML = '';
    noRequests.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/users/me/requests`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.helpRequests.length > 0) {
                displayHelpRequests(result.helpRequests, grid);
            } else {
                noRequests.style.display = 'block';
            }
        } else {
            showToast('Failed to load your requests', 'error');
        }
    } catch (error) {
        console.error('Load my requests error:', error);
        showToast('An error occurred while loading your requests', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

// Load chats
async function loadChats() {
    const loading = document.getElementById('chats-loading');
    const chatsList = document.getElementById('chats-list');
    const noChats = document.getElementById('no-chats');

    loading.style.display = 'block';
    chatsList.innerHTML = '';
    noChats.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE}/chat/user-chats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.chats && result.chats.length > 0) {
                displayChatsList(result.chats);
            } else {
                noChats.style.display = 'block';
            }
        } else {
            showToast('Failed to load chats', 'error');
        }
    } catch (error) {
        console.error('Load chats error:', error);
        showToast('An error occurred while loading chats', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function displayChatsList(chats) {
    const chatsList = document.getElementById('chats-list');
    chatsList.innerHTML = '';

    if (!chats || chats.length === 0) {
        const noChats = document.getElementById('no-chats');
        if (noChats) {
            noChats.style.display = 'block';
        }
        return;
    }

    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        
        const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
        const lastMessage = chat.lastMessage;
        
        chatItem.innerHTML = `
            <div class="chat-item-avatar">
                <img src="${otherParticipant?.profile?.avatar || 'https://via.placeholder.com/40'}" 
                     alt="Avatar" class="chat-avatar">
            </div>
            <div class="chat-item-content">
                <div class="chat-item-header">
                    <h4>${otherParticipant?.name || 'User'}</h4>
                    <span class="chat-time">${lastMessage?.timestamp ? formatTime(lastMessage.timestamp) : formatTime(chat.createdAt)}</span>
                </div>
                <p class="chat-preview">${lastMessage?.content || 'No messages yet'}</p>
                <div class="chat-context">
                    <small>${chat.helpRequest?.title || 'Help Request'}</small>
                </div>
            </div>
        `;

        chatItem.addEventListener('click', () => {
            currentChat = chat;
            displayChat(currentChat);
            if (socket) {
                socket.emit('join-room', currentChat._id);
            }
            showModal('chat-modal');
        });

        chatsList.appendChild(chatItem);
    });
}

// Update the updateUIForUser function to initialize socket
const originalUpdateUIForUser = updateUIForUser;
updateUIForUser = function() {
    originalUpdateUIForUser();
    initializeSocketOnLogin();
}; 