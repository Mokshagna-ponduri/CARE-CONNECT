# CareConnect - Community-Driven Help Platform

CareConnect is a full-stack web application that bridges the gap between people who need help and those willing to offer it within their local community. Built with HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with role-based access (Seeker/Helper)
- **Help Requests**: Create, view, and manage help requests with categories and urgency levels
- **Location-Based Matching**: Find help requests near you using geolocation
- **Real-Time Chat**: Socket.io powered messaging between users
- **Rating System**: Rate and review help exchanges
- **Profile Management**: Complete user profiles with skills and interests

### Categories of Help
- 🍽️ Food assistance
- 📚 Education & Tutoring
- 🏥 Medical support
- 👴 Elderly care
- 🚨 Emergency assistance
- 🚗 Transportation
- 🏠 Household tasks
- 📦 Other services

### User Experience
- **Mobile Responsive**: Works seamlessly on all devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Real-Time Updates**: Live notifications and chat
- **Privacy Controls**: Anonymous posting options
- **Safety Features**: User verification and reporting system

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd careconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/careconnect
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5678
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application*   Open your browser and navigate to `http://localhost:3001`

## 📁 Project Structure

```
careconnect/
├── models/                 # MongoDB schemas
│   ├── User.js            # User model with authentication
│   ├── HelpRequest.js     # Help request model
│   └── Chat.js           # Chat and messaging model
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── helpRequests.js   # Help request management
│   ├── users.js          # User profile and stats
│   └── chat.js           # Chat functionality
├── middleware/            # Custom middleware
│   └── auth.js           # JWT authentication middleware
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   └── app.js           # Frontend JavaScript
├── server.js             # Main server file
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/location` - Update user location

### Help Requests
- `GET /api/help-requests` - Get all help requests with filters
- `GET /api/help-requests/nearby` - Get nearby requests
- `POST /api/help-requests` - Create new help request
- `GET /api/help-requests/:id` - Get specific request
- `PUT /api/help-requests/:id/accept` - Accept a request
- `PUT /api/help-requests/:id/complete` - Complete a request
- `PUT /api/help-requests/:id/rate` - Rate a completed request

### Users
- `GET /api/users/profile/:id` - Get user profile
- `GET /api/users/search` - Search users
- `GET /api/users/me/requests` - Get user's requests
- `GET /api/users/me/stats` - Get user statistics
- `GET /api/users/top-helpers` - Get top rated helpers

### Chat
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/:chatId` - Get chat messages
- `POST /api/chat/:chatId/messages` - Send message
- `POST /api/chat/start` - Start new chat
- `PUT /api/chat/:chatId/read` - Mark messages as read

## 🎨 Frontend Features

### Responsive Design
- Mobile-first approach
- Bootstrap-inspired components
- Smooth animations and transitions
- Accessible design patterns

### Interactive Elements
- Real-time chat with Socket.io
- Location-based filtering
- Dynamic form validation
- Toast notifications
- Modal dialogs

### User Interface
- Clean, modern design
- Intuitive navigation
- Visual feedback for actions
- Loading states and error handling

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment

1. **Set environment variables for production**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   PORT=process.env.PORT
   ```

2. **Deploy to platforms like:**
   - **Heroku**: `git push heroku main`
   - **Render**: Connect your GitHub repository
   - **Railway**: Deploy with one click
   - **Vercel**: Deploy frontend and backend separately

### Database Setup
- Use MongoDB Atlas for cloud database
- Set up proper indexes for performance
- Configure backup and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Font Awesome** for icons
- **Inter Font** for typography
- **Socket.io** for real-time communication
- **MongoDB** for database
- **Express.js** for backend framework

## 📞 Support

For support and questions:
- Email: support@careconnect.com
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder

## 🔮 Future Enhancements

- [ ] Push notifications
- [ ] File upload for images
- [ ] Advanced search filters
- [ ] Community forums
- [ ] Emergency alert system
- [ ] Integration with social media
- [ ] Mobile app development
- [ ] AI-powered matching
- [ ] Payment integration
- [ ] Multi-language support

---

**Built with ❤️ for stronger communities** 

## How to Set Up Admin Access:

### Step 1: Create a User Account First
1. Go to `http://localhost:3001`
2. Click "Sign Up" and create an account
3. Remember the email you used

### Step 2: Run the Admin Setup Script
```bash
node setup-admin.js
```

### Step 3: Access Admin Features

**Method 1: Using API Endpoints**
You can access admin statistics via API calls:

```bash
<code_block_to_apply_changes_from>
```

**Method 2: Using Browser Developer Tools**
1. Open your browser and go to `http://localhost:3001`
2. Login with your admin account
3. Open Developer Tools (F12)
4. Go to Console tab
5. Run this JavaScript code:

```javascript
// Get your JWT token from localStorage
const token = localStorage.getItem('token');

// Fetch admin stats
fetch('/api/users/admin/stats', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
.then(response => response.json())
.then(data => {
    console.log('Admin Stats:', data);
})
.catch(error => console.error('Error:', error));
```

## Admin Features Available:

1. **User Statistics**: Total users, active users, recent registrations
2. **Request Statistics**: Total requests, completion rates, recent activity
3. **System Overview**: Platform usage metrics

## Future Enhancement:
I can also create a proper admin dashboard UI if you'd like. Would you like me to add a complete admin panel with a user interface?

Let me know if you need help with any of these steps! 
