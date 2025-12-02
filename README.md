# FarmaBooster - Pharmaceutical Management Platform

A comprehensive pharmaceutical management platform with real-time API integration, advanced product categorization based on MINSAN codes, user management, and order processing capabilities.

## 🏗️ Architecture Overview

### Frontend Infrastructure
- **Framework**: React 19 with TypeScript
- **Package Manager**: pnpm v9.15.0+ (faster and more efficient than npm)
- **Styling**: Tailwind CSS 3.x with comprehensive Dark Mode support
- **State Management**: React Context API (User, Theme, Toast, Sidebar)
- **Routing**: React Router DOM v7 with Protected Routes
- **Icons**: Heroicons v1.x
- **Build Tool**: Create React App with custom TypeScript configuration
- **Charts**: Chart.js with React integration
- **Animations**: Framer Motion for smooth transitions

### Backend Integration
- **Primary API**: Sixstep Core API (`https://sixstep-be-uq52c.ondigitalocean.app`)
- **Authentication**: JWT Bearer Token with automatic token management
- **HTTP Client**: Axios with request/response interceptors
- **Error Handling**: Centralized error management with user-friendly notifications
- **Session Management**: Automatic logout on token expiration

## 🔐 Authentication System

### JWT Token Management
- **Storage**: localStorage with automatic cleanup
- **Refresh**: Automatic token validation and refresh
- **Interceptors**: Request interceptor adds Bearer token to all API calls
- **Logout**: Complete session cleanup with redirect to login
- **Session Expiry**: Automatic redirect to login when session expires (401 errors)

### User Roles & Access Control
- **Administrator**: Full system access and user management
- **Pharmacy**: Order placement and pharmacy management
- **Supplier**: Product listing and pricing management
- **Landlord**: Property management capabilities
- **Tenant**: Limited access based on tenant permissions

### Protected Routes
- All routes require authentication except `/login`
- Role-based component rendering and feature access
- Automatic redirect to login if unauthenticated
- Admin-only routes with role verification

## 🏥 Pharmaceutical Features

### MINSAN-Based Product Categorization
The platform uses MINSAN (Ministero della Salute Nazionale) codes for automatic product categorization:

- **0** → Human Use Medicines
- **1** → Veterinary Medicines  
- **8** → Homeopathic / Natural Products
- **9** → Parapharmaceuticals (Supplements, vitamins, cosmetics, devices, etc.)

### Product Management
- **Real-time Product Loading**: Integration with Sixstep Core API
- **Advanced Filtering**: Category, manufacturer, supplier, and stock-based filters
- **Price Comparison**: Multi-supplier price comparison with best price identification
- **Stock Management**: Real-time stock availability and warnings
- **Product Search**: Full-text search across product names, descriptions, and codes

### Order Management
- **Draft Orders**: Save and manage draft orders
- **Order Processing**: Complete order lifecycle management
- **Supplier Integration**: Multi-supplier order processing
- **Price Tracking**: Target price vs. actual price monitoring

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

### Product Management
```typescript
POST /products/get
- Body: { page, limit, search?, category?, manufacturer?, inStock?, minPrice?, maxPrice? }
- Response: { products: Product[], totalCount: number, categories: string[], manufacturers: string[], suppliers: string[] }
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
- **AuthGuard**: Global authentication guard with automatic login redirect

### Dashboard System
- **Dashboard**: Main product management interface with advanced filtering
- **ProductTable**: Comprehensive product display with sorting and selection
- **ProductFilter**: Advanced filtering system with MINSAN-based categories
- **ActionBar**: Order management and bulk operations

### User Management System
- **UserManagement**: Main user management interface with tabs
- **UsersTable**: Reusable table component for user data display
- **EditUserModal**: Modal for editing existing users
- **DeleteUserModal**: Safety-focused deletion modal with confirmations
- **EntitySelectionStep**: Two-step user creation (entity selection)
- **UserCreationStep**: User details form with role management
- **EntityManagement**: Business entity creation and association

### Purchase Orders System
- **PurchaseOrdersLayout**: Main order management interface
- **ManageOrders**: Order listing and management
- **OrderDetailPage**: Detailed order view and editing
- **ProductEditModal**: Product editing within orders
- **PickingNotificationModal**: Order picking notifications
- **PickingPreferencesModal**: Picking preferences configuration

### Common Components
- **Atoms**: IconWithBadge, NotificationItem, SidebarItem, ThemeToggle, UserAvatar, TableSkeleton
- **Molecules**: FilterControls, Pagination, OrderCards, Modals, SearchableDropdown
- **Organisms**: NotificationsPanel, ModernSidebar, ComplexForms
- **Reusable**: ReusableTable, MultiSelect, FilterAccordion, ActionBar, FileUploadModal

## 🗂️ Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   │   └── Login.tsx
│   ├── common/               # Shared components
│   │   ├── atoms/           # Basic UI components
│   │   ├── molecules/       # Composite components
│   │   ├── organisms/       # Complex components
│   │   ├── reusable/        # Reusable business components
│   │   └── utils/           # Component utilities
│   ├── Dashboard/           # Dashboard-specific components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   └── ProductTable.tsx # Product table component
│   ├── PurchaseOrders/      # Order management components
│   └── UserManagement/      # User management components
├── contexts/                # React Context providers
│   ├── UserContext.tsx      # Authentication and user state
│   ├── ThemeContext.tsx     # Dark/light mode management
│   ├── ToastContext.tsx     # Notification system
│   └── SidebarContext.tsx   # Sidebar state management
├── data/                    # Mock data and static data
│   ├── mockProducts.ts      # Product mock data
│   ├── mockOrders.ts        # Order mock data
│   └── mockUsers.ts         # User mock data
├── layouts/                 # Layout wrapper components
│   └── MainLayout.tsx
├── types/                   # TypeScript type definitions
│   ├── product.ts           # Product-related types
│   ├── heroicons.d.ts       # Icon type definitions
│   └── xlsx.d.ts           # Excel file type definitions
├── utils/                   # Utility functions and API client
│   ├── api.ts              # API client and endpoints
│   ├── minsanCategories.ts # MINSAN categorization logic
│   ├── exportUtils.ts      # Data export utilities
│   └── draftOrderService.ts # Order draft management
├── hooks/                   # Custom React hooks
│   └── useUploadProgress.ts # Upload progress tracking
└── theme.tsx               # Tailwind theme configuration
```

## 🔧 Environment Variables

### Configuration

Create a `.env` file in the root directory with your configuration:

```env
# Sixstep Core API Configuration
REACT_APP_SIXSTEP_CORE_URL=https://sixstep-be-uq52c.ondigitalocean.app

# Optional: Pharmaceutical API (if using external data)
REACT_APP_PHARMA_API_KEY=your_api_key_here

# Development/Debug flags
REACT_APP_DEBUG_MODE=false
```

### Important Notes

⚠️ **Security**: The `.env` file is automatically ignored by Git (configured in `.gitignore`). Never commit your `.env` file to the repository as it may contain sensitive credentials.

- All `.env*` files are excluded from version control
- Create your own `.env` file locally with your specific configuration
- The `.env` file should remain in your local workspace only

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16.0.0 or higher (v24.11.1 recommended)
- **pnpm**: v9.15.0 or higher (this project uses pnpm as the package manager)
  - Install pnpm: `npm install -g pnpm`
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/farmabooster.git
   cd farmabooster
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   
   ⚠️ **Note**: This project uses `pnpm` as the package manager. If you don't have pnpm installed, run `npm install -g pnpm` first.

3. **Environment setup**
   ```bash
   # Create .env file (if .env.example exists)
   cp .env.example .env
   # Or create .env manually with the configuration above
   # Edit .env with your API configuration
   ```
   
   ⚠️ **Note**: The `.env` file is already configured in `.gitignore` and will not be committed to the repository.

4. **Start development server**
   ```bash
   pnpm start
   ```
   The development server will start and automatically open your browser at [http://localhost:3000](http://localhost:3000)
   
   The server will automatically reload when you make changes to the code.

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
- Role-based access control (Admin, Pharmacy, Supplier, Landlord, Tenant)
- Protected routing with automatic redirects
- Secure logout with complete session cleanup
- Automatic session expiry handling with login redirect

#### 🏥 Pharmaceutical Management
- **MINSAN-Based Categorization**: Automatic product categorization based on MINSAN codes
- **Advanced Product Filtering**: Category, manufacturer, supplier, and stock-based filters
- **Multi-Supplier Price Comparison**: Best price identification across suppliers
- **Real-time Stock Management**: Stock availability and warning indicators
- **Product Search**: Full-text search across all product fields
- **Excel Import/Export**: Bulk product data management

#### 👥 User Management
- **User CRUD Operations**: Create, Read, Update, Delete users
- **Entity Management**: Business entity creation and association
- **Two-Step User Creation**: Entity selection + User details
- **Advanced Filtering**: Search, role filter, status filter
- **Safety Features**: Confirmation modals with double verification
- **Real-time Updates**: Automatic data refresh after operations

#### 📦 Order Management
- **Draft Order System**: Save and manage draft orders
- **Order Processing**: Complete order lifecycle management
- **Multi-Supplier Orders**: Handle orders across multiple suppliers
- **Price Tracking**: Monitor target vs. actual prices
- **Order History**: Complete order tracking and history

#### 🎨 UI/UX
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Dark/Light Mode**: System-wide theme switching with persistence
- **Toast Notifications**: Real-time feedback for all user actions
- **Loading States**: Comprehensive loading indicators and skeleton screens
- **Form Validation**: Client-side validation with error messaging
- **Accessibility**: ARIA labels and keyboard navigation support

#### 🔧 Technical Features
- **API Integration**: Complete Sixstep Core API integration
- **Error Handling**: Centralized error management with user-friendly messages
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized rendering with React.memo and useCallback
- **File Upload**: Excel file processing with progress tracking
- **Data Export**: Excel export functionality

### 🚧 Planned Features
- Advanced reporting and analytics dashboard
- Real-time notifications system
- Inventory tracking and alerts
- Multi-language support
- Bulk user operations
- Advanced audit logging
- Mobile app development
- API rate limiting and caching

## 🧰 Available Scripts

All scripts use `pnpm` as the package manager:

### Development
```bash
pnpm start         # Start development server (http://localhost:3000)
pnpm build         # Create production build
pnpm test          # Run test suite
```

### Code Quality
```bash
# ESLint is configured via react-scripts
# Code formatting follows project standards
```

### Production
```bash
pnpm build         # Create optimized production build
# The build folder contains the production-ready files
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#1976D2) with light/dark variants
- **Secondary**: Purple (#9c27b0) with light/dark variants
- **Success**: Green (#2e7d32) for positive actions
- **Warning**: Orange (#ed6c02) for caution states
- **Error**: Red (#d32f2f) for error states
- **Info**: Light Blue (#0288d1) for informational content

### Dark Mode
- **Background**: Deep blacks and grays (#0a0a0a, #1a1a1a, #2a2a2a)
- **Text**: High contrast whites and grays
- **Borders**: Subtle grays for component separation
- **Cards**: Elevated dark surfaces with proper contrast

### Typography
- **Font Family**: Roboto (primary), Arial (fallback)
- **Scale**: Responsive font sizes from xs (0.75rem) to 4xl (2.25rem)
- **Weights**: Regular, medium, semibold, bold

## 🔒 Security Features

- **JWT Token Management**: Secure token storage and automatic refresh
- **Role-Based Access Control**: Granular permissions based on user roles
- **Protected Routes**: Authentication required for all sensitive operations
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs and outputs
- **CSRF Protection**: Token-based request validation

## 📊 Performance Optimizations

- **Code Splitting**: Route-based code splitting for faster initial loads
- **Lazy Loading**: Component lazy loading for better performance
- **Memoization**: React.memo and useCallback for expensive operations
- **Virtual Scrolling**: Large list virtualization for better performance
- **Image Optimization**: Optimized image loading and caching
- **Bundle Analysis**: Webpack bundle analyzer for size optimization

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API integration and user flow testing
- **E2E Tests**: Complete user journey testing
- **Coverage Reports**: Comprehensive test coverage reporting

### Testing Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for integration tests
- **Cypress**: End-to-end testing framework

## 🚀 Deployment

### Production Build
```bash
pnpm build
```

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFlare, AWS CloudFront
- **Container**: Docker with Nginx
- **Server**: Node.js with Express

### Environment Configuration
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Optimized build with error tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Documentation**: [API_ENDPOINTS_VERIFICATION.md](docs/API_ENDPOINTS_VERIFICATION.md)
- **Component Documentation**: Inline JSDoc comments
- **Type Definitions**: Comprehensive TypeScript interfaces

### Getting Help
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas
- **Email**: Contact the development team for urgent issues

## 🔄 Version History

### v0.1.0 (Current)
- Initial release with core functionality
- MINSAN-based product categorization
- User management system
- Order management system
- Dark/light mode support
- Responsive design

### Planned Releases
- **v0.2.0**: Advanced reporting and analytics
- **v0.3.0**: Real-time notifications
- **v1.0.0**: Production-ready release with full feature set

---

**FarmaBooster** - Streamlining pharmaceutical management with modern technology and intuitive design.