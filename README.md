# Short-URL 🔗

A modern, production-ready URL shortening service built with React, Node.js, and TypeORM. Features real-time analytics, user authentication, and a beautiful dashboard.

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[User Browser] --> B[React Router]
        B --> C[Home Route]
        B --> D[Stats Route]
        B --> E[Auth Routes]
        C --> F[URL Form]
        D --> G[Charts & Tables]
        E --> H[Login/Register]
    end

    subgraph "Backend (Node.js)"
        I[Express Server] --> J[Auth Service]
        I --> K[URL Service]
        I --> L[Stats Service]
        I --> M[Click Tracking]
    end

    subgraph "Database"
        N[(TypeORM)]
        N --> O[User Table]
        N --> P[URL Table]
        N --> Q[Click Table]
    end

    A --> I
    I --> N
```

## 🔄 Request Flow Diagrams

### 1. Create Short URL Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Enter long URL + alias
    F->>F: Validate input
    F->>B: POST /?longURL&alias
    Note over B: Attach URL ownership from a verified HttpOnly session cookie
    B->>B: Generate/validate alias
    B->>D: Save URL record
    D-->>B: URL saved
    B-->>F: 201 JSON response
    F->>F: Update recents (localStorage)
    F->>U: Show success toast
```

### 2. URL Redirect Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Backend
    participant D as Database

    U->>B: GET /:alias
    B->>D: Find URL by alias
    D-->>B: URL record
    B->>D: Create Click record
    D-->>B: Click saved
    B-->>U: 302 redirect to longURL
```

### 3. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Click Login/Register
    F->>F: Open modal
    U->>F: Enter credentials
    F->>B: POST /api/auth/login
    B->>D: Validate user
    D-->>B: User data
    B-->>F: User data + HttpOnly session cookie
    F->>F: Update AuthContext (no auth data in localStorage)
    F->>B: GET /api/auth/me with session cookie on reload
    F->>F: Close modal
    F->>U: Show success
```

### 4. Analytics & Stats Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Navigate to /stats
    F->>B: GET /stats/url/:days
    F->>B: GET /stats/click/:days
    F->>B: GET /stats/top/:days/:count

    B->>D: QueryBuilder aggregations
    D-->>B: Aggregated data
    B-->>F: JSON responses

    F->>F: React Query cache
    F->>F: Render charts & tables
    F->>U: Display analytics
```

## 🛠️ Tech Stack

### Frontend

-   **Framework**: React 18 + React Router
-   **Build Tool**: Vite
-   **State Management**: React Query + Context API
-   **UI Components**: Shadcn/ui + Tailwind CSS
-   **Charts**: Recharts
-   **Forms**: React Hook Form + Zod validation

### Backend

-   **Runtime**: Node.js + Express
-   **Database**: TypeORM with MySQL/PostgreSQL
-   **Authentication**: Signed JWT in an HttpOnly cookie with password hashing
-   **Validation**: class-validator
-   **Sample data**: Seeded only when the URL table is empty; can also be requested through `/faker`

### Database Schema

```mermaid
erDiagram
    User {
        int id PK
        string name
        string email UK
        string password
        datetime createdAt
        datetime updatedAt
    }

    URL {
        int id PK
        string alias UK
        string longURL
        datetime createTime
        int userId FK
    }

    Click {
        int id PK
        string alias
        datetime clickTime
        int urlId FK
    }

    User ||--o{ URL : creates
    URL ||--o{ Click : receives
```

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   MySQL/PostgreSQL
-   npm or yarn

### Installation

1. **Clone the repository**

    ```bash
    git clone <your-repo-url>
    cd short-url
    ```

2. **Install dependencies**

    ```bash
    # Frontend
    cd _frontend
    npm install

    # Backend
    cd ../backend
    npm install
    ```

3. **Environment Setup**

    ```bash
    # Backend .env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USERNAME=root
    DB_PASSWORD=password
    DB_DATABASE=shorturl
    PORT=3000
    ```

4. **Database Setup**

    ```bash
    # Create database
    CREATE DATABASE shorturl;

    # Run migrations (TypeORM will auto-create tables)
    npm run start
    ```

5. **JWT Secret**

   The backend reads `JWT_SECRET` from `backend/.env`. Copy
   `backend/.env.example` to `backend/.env`, then set `JWT_SECRET` to a fresh
   random value generated with `openssl rand -base64 32`. Keep `.env` private;
   it is ignored by Git. Set the secret in your deployment environment too.

6. **Start Development**

    ```bash
    # Backend (Terminal 1)
    cd backend
    npm start

    # Frontend (Terminal 2)
    cd _frontend
    npm run dev
    ```

## 📊 API Endpoints

### URL Management

-   `POST /` - Create short URL; a valid session cookie links it to the signed-in user
-   `GET /:alias` - Redirect to long URL

### Analytics

-   `GET /stats/url/:days` - URL creation stats
-   `GET /stats/click/:days` - Click statistics
-   `GET /stats/top/:days/:count` - Top performing URLs

### Authentication

-   `POST /api/auth/register` - User registration
-   `POST /api/auth/login` - User login
-   `GET /api/auth/me` - Current user (valid session cookie required)
-   `POST /api/auth/logout` - Clear the session cookie

### Development

-   `POST /faker` - Generate sample data

## 🎯 Key Features

### 🔐 User Authentication

-   Secure registration and login
-   Password hashing with bcrypt
-   JWT-based session management
-   Access tokens expire after 24 hours
-   Protected routes and API calls

### 🔗 URL Shortening

-   Custom alias support
-   Automatic alias generation
-   Click tracking and analytics
-   Recent URLs in localStorage

### 📈 Analytics Dashboard

-   Real-time click statistics
-   URL creation trends
-   Top performing URLs
-   Time-based filtering (7, 30, 90 days)

### 🎨 Modern UI/UX

-   Responsive design
-   Dark/light theme support
-   Smooth animations
-   Mobile-first approach

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t short-url .

# Run container
docker run -p 3000:3000 short-url
```

### Kubernetes

```bash
kubectl apply -f deployment.yaml
```

### Environment Variables

```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
DB_DATABASE=your-database
JWT_SECRET=<random-secret-at-least-32-bytes>
CORS_ORIGINS=https://your-app-domain.example
```

In local development, use `CORS_ORIGINS=http://localhost:5173`. For deployment,
set it to the app's public origin (for example, its Railway domain).

## 🔧 Development

### Project Structure

```
short-url/
├── _frontend/          # React frontend
│   ├── app/
│   │   ├── components/ # UI components
│   │   ├── contexts/   # React contexts
│   │   ├── routes/     # Page routes
│   │   └── api/        # API client
│   ├── build/          # Production build
│   └── package.json
├── backend/            # Node.js backend
│   ├── src/
│   │   ├── entity/     # TypeORM entities
│   │   ├── services/   # Business logic
│   │   └── routes/     # API routes
│   └── package.json
└── README.md
```

### Available Scripts

#### Frontend

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Backend

```bash
npm run dev          # Start with nodemon
npm run start        # Start production server
npm run build        # Build TypeScript
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

-   **Issues**: [GitHub Issues](https://github.com/yourusername/short-url/issues)
-   **Discussions**: [GitHub Discussions](https://github.com/yourusername/short-url/discussions)
-   **Email**: your-email@example.com

---

Built with ❤️ using modern web technologies
