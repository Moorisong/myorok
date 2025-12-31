# Myorok Backend Server

Backend server for Kakao OAuth authentication in the Myorok application.

## Features

- Kakao OAuth 2.0 authentication
- JWT token generation and verification
- User information retrieval from Kakao API
- TypeScript support
- Express.js REST API

## Prerequisites

- Node.js 18+
- npm or yarn
- Kakao Developers account with OAuth app configured

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in the environment variables in `.env`:
```
KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URI=https://myorok.haroo.site/auth/kakao
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## API Endpoints

### POST /auth/kakao
Authenticate user with Kakao OAuth authorization code.

**Request Body:**
```json
{
  "code": "kakao_authorization_code"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "nickname": "User Nickname",
    "profileImage": "https://..."
  },
  "token": "jwt_token"
}
```

### POST /auth/logout
Logout user (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-12-31T00:00:00.000Z"
}
```

## Project Structure

```
apps/backend/
├── src/
│   ├── config/
│   │   └── index.ts          # Configuration and environment variables
│   ├── controllers/
│   │   └── authController.ts # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.ts # JWT verification middleware
│   ├── routes/
│   │   └── authRoutes.ts     # API routes
│   └── server.ts             # Express server setup
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The API uses standard HTTP status codes:
- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing authentication
- `404 Not Found` - Route not found
- `500 Internal Server Error` - Server error

All errors return JSON in the format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security

- Environment variables for sensitive data
- JWT token-based authentication
- CORS enabled
- Request validation
- Error logging without exposing sensitive information

## License

MIT
