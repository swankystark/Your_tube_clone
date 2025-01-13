# Your Tube Clone

A full-stack YouTube clone built with React, Node.js, Express, and MongoDB. Features include video uploads, comments, likes, real-time chat, and more.

## Features

- 🎥 Video upload and streaming
- 👍 Like/dislike functionality for videos and comments
- 💬 Real-time chat rooms
- 🌐 Multi-language support with automatic translation
- 🔍 Video search and filtering
- 👤 User authentication with Google OAuth
- 📱 Responsive design

## Tech Stack

### Frontend
- React.js
- Redux for state management
- Axios for API calls
- Socket.io-client for real-time features
- Material-UI components

### Backend
- Node.js & Express
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- Google Cloud Translation API

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google OAuth credentials
- Google Cloud Translation API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/Your_tube_clone.git
cd Your_tube_clone
```

2. Install Server Dependencies
```bash
cd Server
npm install
cp .env.example .env  # Configure your environment variables
```

3. Install Client Dependencies
```bash
cd ../client
npm install
cp .env.example .env  # Configure your environment variables
```

4. Configure Environment Variables
- Server `.env`: Add your MongoDB URL, JWT secret, and Google API credentials
- Client `.env`: Add your server URL and Google client ID

5. Start the Development Servers
```bash
# Start the backend server (from Server directory)
npm start

# Start the frontend server (from client directory)
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
Your_tube_clone/
├── client/                 # React frontend
│   ├── src/
│   │   ├── Component/     # React components
│   │   ├── action/        # Redux actions
│   │   ├── Reducers/      # Redux reducers
│   │   └── api/           # API integration
│   └── public/            # Static files
└── Server/                # Node.js backend
    ├── Controllers/       # Route controllers
    ├── Models/           # Database models
    ├── Routes/           # API routes
    └── middleware/       # Custom middleware
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by YouTube's functionality and design
- Thanks to all contributors who have helped shape this project
