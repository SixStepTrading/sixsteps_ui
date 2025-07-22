# FarmaBooster - Pharmaceutical Management Platform

A comprehensive pharmaceutical management platform with real-time API integration, user management, and advanced order processing capabilities.

## 🏗️ Architecture Overview

### Frontend Infrastructure
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS 3.x with Dark Mode support
- **State Management**: React Context API (User, Theme, Toast, Sidebar)
- **Routing**: React Router DOM v6 with Protected Routes
- **Icons**: Heroicons v1.x
- **Build Tool**: Create React App with custom TypeScript configuration

### Backend Integration
- **Primary API**: Sixstep Core API (`https://sixstep-be-uq52c.ondigitalocean.app`)
- **Authentication**: JWT Bearer Token with automatic token management
- **HTTP Client**: Axios with request/response interceptors
- **Error Handling**: Centralized error management with user-friendly notifications

## 🔐 Authentication System

### JWT Token Management
- **Storage**: localStorage with automatic cleanup
- **Refresh**: Automatic token validation and refresh
- **Interceptors**: Request interceptor adds Bearer token to all API calls
- **Logout**: Complete session cleanup with redirect to login

### User Roles & Access Control
- **Administrator**: Full system access and user management
- **Manager**: Order and product management capabilities  
- **Pharmacy**: Order placement and pharmacy management
- **Supplier**: Product listing and pricing management

### Protected Routes
- All routes require authentication except `/login`
- Role-based component rendering and feature access
- Automatic redirect to login if unauthenticated

## 🚀 API Integrations

### Authentication Endpoints
```typescript
POST /auth/login
- Body: { email: string, password: string }
- Response: { token: string, user: UserObject }

GET /auth/verify
- Headers: Authorization: Bearer <token>
- Response: Token validation status
```

### User Management
```typescript
POST /users/search
- Body: { entity?: { $ne: null } } | {}
- Response: UserResponse[]

POST /users/create
- Body: CreateUserData (with admin secret for admin users)
- Response: UserResponse

POST /users/edit
- Body: { userId, name, surname, role, email, password?, entity }
- Response: No body (204 status)

POST /users/delete
- Body: { userId: string }
- Response: No body (204 status)
```

### Entity Management
```typescript
GET /entities/get/all
- Response: Entity[]

POST /entities/create
- Body: { entityType, entityName, country, notes, status }
- Response: Entity

PUT /entities/update/:id
- Body: Partial<Entity>
- Response: Entity

DELETE /entities/delete/:id
- Response: No body (204 status)
```

## 🎨 Component Architecture

### Layout Components
- **MainLayout**: Core application wrapper with sidebar and header
- **ModernSidebar**: Responsive sidebar with role-based navigation
- **PrivateRoute**: Authentication wrapper for protected routes

### User Management System
- **UserManagement**: Main user management interface with tabs
- **UsersTable**: Reusable table component for user data display
- **EditUserModal**: Modal for editing existing users
- **DeleteUserModal**: Safety-focused deletion modal with confirmations
- **EntitySelectionStep**: Two-step user creation (entity selection)
- **UserCreationStep**: User details form with role management

### Common Components
- **Atoms**: IconWithBadge, NotificationItem, SidebarItem, ThemeToggle, UserAvatar
- **Molecules**: FilterControls, Pagination, OrderCards, Modals
- **Organisms**: NotificationsPanel, ComplexForms

### Reusable Components
- **ReusableTable**: Generic table with sorting and filtering
- **MultiSelect**: Advanced multi-selection component
- **FilterAccordion**: Collapsible filter sections
- **ActionBar**: Consistent action button layouts

## 🗂️ Project Structure

```
src/
├── components/
│   ├── common/           # Shared components (atoms, molecules, organisms)
│   ├── Dashboard/        # Dashboard-specific components
│   ├── PurchaseOrders/   # Order management components
│   └── UserManagement/   # User management components
├── contexts/             # React Context providers
│   ├── UserContext.tsx   # Authentication and user state
│   ├── ThemeContext.tsx  # Dark/light mode management
│   ├── ToastContext.tsx  # Notification system
│   └── SidebarContext.tsx # Sidebar state management
├── data/                 # Mock data and static data
├── layouts/              # Layout wrapper components
├── types/                # TypeScript type definitions
├── utils/                # Utility functions and API client
└── theme.tsx            # Tailwind theme configuration
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Sixstep Core API Configuration
REACT_APP_SIXSTEP_CORE_URL=https://sixstep-be-uq52c.ondigitalocean.app

# Optional: Pharmaceutical API (if using external data)
REACT_APP_PHARMA_API_KEY=your_api_key_here

# Development/Debug flags
REACT_APP_DEBUG_MODE=false
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher (or yarn equivalent)
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/farmabooster.git
   cd farmabooster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   Access the application at [http://localhost:3000](http://localhost:3000)

### First Login
Use your Sixstep Core API credentials to login. The system will automatically:
- Validate credentials against the API
- Store JWT token securely
- Load user permissions and role data
- Redirect to appropriate dashboard

## 📱 Features

### ✅ Implemented Features

#### 🔐 Authentication & Authorization
- JWT-based login with automatic token management
- Role-based access control (Admin, Manager, Pharmacy, Supplier)
- Protected routing with automatic redirects
- Secure logout with complete session cleanup

#### 👥 User Management
- **User CRUD Operations**: Create, Read, Update, Delete users
- **Entity Management**: Business entity creation and association
- **Two-Step User Creation**: Entity selection + User details
- **Advanced Filtering**: Search, role filter, status filter
- **Safety Features**: Confirmation modals with double verification
- **Real-time Updates**: Automatic data refresh after operations

#### 🎨 UI/UX
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Dark/Light Mode**: System-wide theme switching with persistence
- **Toast Notifications**: Real-time feedback for all user actions
- **Loading States**: Comprehensive loading indicators and skeleton screens
- **Form Validation**: Client-side validation with error messaging

#### 🔧 Technical Features
- **API Integration**: Complete Sixstep Core API integration
- **Error Handling**: Centralized error management with user-friendly messages
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized rendering with React.memo and useCallback
- **Accessibility**: ARIA labels and keyboard navigation support

### 🚧 Planned Features
- Advanced order management system
- Real-time product price comparison
- Inventory tracking and alerts
- Reporting and analytics dashboard
- Multi-language support
- Bulk user operations
- Advanced audit logging

## 🧰 Available Scripts

### Development
```bash
npm start          # Start development server (http://localhost:3000)
npm run build      # Create production build
npm test           # Run test suite
npm run test:coverage  # Run tests with coverage report
```

### Code Quality
```bash
npm run lint       # ESLint code analysis
npm run format     # Prettier code formatting
npm run type-check # TypeScript type checking
```

### Deployment
```bash
npm run build      # Production build
npm run preview    # Preview production build locally
```

## 🔍 API Error Handling

The application implements comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Automatic logout and redirect to login
- **Validation Errors**: Field-specific error messaging
- **Server Errors**: User-friendly error messages with support contact
- **Timeout Handling**: Request timeout management with user feedback

## 🎯 Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Bundle Analysis**: Webpack bundle analyzer integration
- **API Caching**: Intelligent caching of frequently accessed data
- **Image Optimization**: Responsive images with lazy loading
- **Memory Management**: Proper cleanup of event listeners and timers

## 🛡️ Security Features

- **XSS Protection**: Input sanitization and output encoding
- **CSRF Prevention**: Token-based request validation
- **Secure Storage**: JWT tokens in httpOnly cookies (when supported)
- **API Security**: Request signing and validation
- **Input Validation**: Comprehensive client and server-side validation

## 📊 Browser Support

| Browser | Minimum Version | Tested |
|---------|----------------|--------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Sixstep Team**
