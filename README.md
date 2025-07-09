# KYC Verification System

A comprehensive, enterprise-grade Know Your Customer (KYC) verification platform built with modern web technologies and advanced security features.

🔗 **Live Demo**: [https://kyc01.netlify.app/](https://kyc01.netlify.app/)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Security](#security)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Frontend Features
- **Multi-step KYC Process** - Progressive verification with step-by-step guidance
- **User Authentication** - Secure login/register with session management
- **Document Upload** - File validation, preview, and secure storage
- **Facial Verification** - Real-time camera access and biometric matching
- **Admin Dashboard** - Comprehensive application review and management
- **Responsive Design** - Professional UI/UX across all devices
- **Real-time Validation** - Form validation with instant error feedback
- **Progress Tracking** - Visual progress indicators throughout the process

### Backend & Database
- **Supabase Integration** - Comprehensive database schema and real-time features
- **Secure Authentication** - JWT tokens with automatic session management
- **File Storage** - Secure document and image storage with access controls
- **Row Level Security** - Database-level security policies
- **Audit Logging** - Complete tracking of all user actions
- **Risk Assessment** - Automated scoring algorithm for applications
- **Admin Management** - Role-based access control system

## 🏗️ Architecture

```
Frontend (React/Next.js)
├── Authentication Layer
├── KYC Verification Flow
├── Document Management
├── Facial Recognition
└── Admin Dashboard

Backend (Supabase)
├── Authentication Service
├── Database (PostgreSQL)
├── File Storage
├── Real-time Subscriptions
└── Edge Functions
```

## 🔒 Security Features

- **End-to-end Encryption** - All data transmission is encrypted
- **Secure File Upload** - Type validation and size limits
- **Audit Trail** - Complete compliance and security monitoring
- **Role-based Access Control** - Admin function restrictions
- **Data Anonymization** - GDPR compliance features
- **Session Management** - Automatic timeout and secure sessions
- **Input Sanitization** - SQL injection and XSS prevention
- **Biometric Security** - Facial verification with confidence scoring

## 📊 Database Schema

### Core Tables

#### Users
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
```

#### KYC Applications
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- status (ENUM: pending, approved, rejected, under_review)
- risk_score (INTEGER)
- submission_date (TIMESTAMP)
- review_date (TIMESTAMP)
- reviewer_id (UUID, Foreign Key)
- personal_info (JSONB)
- verification_results (JSONB)
```

#### Documents
```sql
- id (UUID, Primary Key)
- application_id (UUID, Foreign Key)
- document_type (VARCHAR)
- file_path (VARCHAR)
- file_size (INTEGER)
- mime_type (VARCHAR)
- upload_date (TIMESTAMP)
- verification_status (ENUM)
```

#### Facial Data
```sql
- id (UUID, Primary Key)
- application_id (UUID, Foreign Key)
- image_path (VARCHAR)
- confidence_score (DECIMAL)
- verification_result (BOOLEAN)
- processed_at (TIMESTAMP)
```

#### Audit Logs
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- action (VARCHAR)
- resource_type (VARCHAR)
- resource_id (UUID)
- details (JSONB)
- ip_address (INET)
- user_agent (TEXT)
- timestamp (TIMESTAMP)
```

#### Admin Users
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- role (ENUM: admin, super_admin, reviewer)
- permissions (JSONB)
- assigned_at (TIMESTAMP)
- assigned_by (UUID, Foreign Key)
```

#### System Settings
```sql
- id (UUID, Primary Key)
- key (VARCHAR, Unique)
- value (JSONB)
- description (TEXT)
- updated_at (TIMESTAMP)
- updated_by (UUID, Foreign Key)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Modern web browser with camera support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kyc-verification-system.git
   cd kyc-verification-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Click "Connect to Supabase" in the application

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application base URL | Yes |
| `FACIAL_RECOGNITION_API_KEY` | Facial recognition service key | No |
| `AUDIT_LOG_RETENTION_DAYS` | Audit log retention period | No |

### Supabase Configuration

1. **Enable Authentication**
   - Go to Authentication > Settings
   - Enable email authentication
   - Configure email templates

2. **Set up Storage**
   - Create buckets for documents and facial images
   - Configure access policies

3. **Configure Row Level Security**
   - Enable RLS on all tables
   - Apply security policies from `/supabase/policies.sql`

## 📱 Usage

### For Users

1. **Registration**
   - Create account with email and password
   - Verify email address

2. **KYC Verification**
   - Complete personal information
   - Upload required documents
   - Complete facial verification
   - Submit application

3. **Track Progress**
   - View application status
   - Receive notifications on updates

### For Admins

1. **Admin Dashboard**
   - Review pending applications
   - Approve/reject applications
   - View audit logs

2. **Application Management**
   - Search and filter applications
   - View detailed application data
   - Download documents

## 🔧 API Documentation

### Authentication Endpoints

```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/profile
```

### KYC Endpoints

```typescript
POST /api/kyc/applications
GET /api/kyc/applications/:id
PUT /api/kyc/applications/:id
DELETE /api/kyc/applications/:id
```

### Document Endpoints

```typescript
POST /api/documents/upload
GET /api/documents/:id
DELETE /api/documents/:id
```

### Admin Endpoints

```typescript
GET /api/admin/applications
PUT /api/admin/applications/:id/approve
PUT /api/admin/applications/:id/reject
GET /api/admin/audit-logs
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

## 📈 Monitoring

- **Application Performance** - Real-time monitoring with error tracking
- **Security Monitoring** - Audit log analysis and alerting
- **Database Performance** - Query optimization and indexing
- **User Analytics** - Application completion rates and user behavior

## 🔄 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Configure build settings

2. **Environment Variables**
   - Add all required environment variables
   - Set up production Supabase project

3. **Build Configuration**
   ```toml
   [build]
   command = "npm run build"
   publish = "dist"
   
   [build.environment]
   NODE_VERSION = "18"
   ```

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy to your hosting provider
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.example.com](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/Neerajupadhayay2004/kyc-verification-system/issues)
- **Email**: support@example.com

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Next.js](https://nextjs.org) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React Hook Form](https://react-hook-form.com) for form handling

---

**Built with ❤️ for secure and compliant KYC verification**
