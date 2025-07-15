# Reverse Recruiting SaaS - Project Scope

## 📊 Project Status

**Current Phase:** Phase 1 - Project Foundation  
**Current Step:** Step 1.5 - Client Management ✅ IN PROGRESS  
**Next Step:** Tighten up RLS policy
**Overall Progress:** 23% (5/22 steps completed)

### Completed Steps:
- ✅ Step 1.1: Project Setup (Next.js 14, TypeScript, Tailwind CSS, ESLint)
- ✅ Step 1.2: Supabase Configuration (Database schema, RLS, client setup)
- ✅ Step 1.3: Authentication System (Login/register, role management, auth middleware)
- ✅ Step 1.4: Basic Layout & Navigation (shadcn/ui components, dark mode, theme toggle)
- ✅ Step 1.5: Client Management (Client meta drawer fetches/updates meta from clients_meta, UUID matching, scrollable UI, debugged, permissive RLS for dev)
- ✅ Step 1.5: GitHub Version Control Setup (Repository connected, clean history, .gitignore in place, node_modules and large files excluded, ready for collaboration/CI/CD)

### In Progress:
- 🔄 Step 1.5: Client Management (UI/UX refinements, meta editing, RLS policy to be tightened)

### Upcoming:
- ⏳ Tighten up RLS policy (replace permissive policy with secure, role-based access)
- ⏳ Step 1.6: Job Listings Management

---

## Version Control & Collaboration

- GitHub repository is fully connected and authenticated
- Clean commit history (no node_modules or large files)
- .gitignore in place for all sensitive and build files
- Project pushed to remote repository
- Ready for collaboration and CI/CD

## Project Overview
A SaaS backend tool for managing reverse recruiting clients, with team collaboration features, email campaign management, and comprehensive data tracking.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) with TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **UI Components:** shadcn/ui with Tailwind CSS
- **Email Integration:** Gmail API with OAuth 2.0
- **State Management:** Zustand + React Query
- **Form Handling:** React Hook Form with Zod validation
- **Export:** ExcelJS for Excel file generation

## Core Features

### 1. User Management & Authentication
- **User Roles:** Manager, Final User
- **Manager Permissions:** Full CRUD access to assigned clients
- **Final User Permissions:** Read-only access to single assigned client
- **Client Assignment:** Multiple managers per client, one final user per client

### 2. Client Management
- Client registration and profile management
- Client assignment to managers and final users
- Client status tracking (active, inactive, prospect)
- Notes and internal communication
- **Client meta drawer:** Fetches and updates meta data from clients_meta table, with correct UUID matching and scrollable UI. Debugging and RLS troubleshooting completed. Permissive RLS enabled for development; will be tightened next.

### 3. Job Listings Management
- Manual job registration with application method selection
- Application methods: email, LinkedIn, Indeed, Glassdoor, company portal, other
- Job status tracking: active, paused, closed, applied, interview_scheduled, rejected, offer_received
- Inline editing for managers
- Pagination for all data displays

### 4. Recruiter Management
- Recruiter registration and profile management
- Duplicate prevention (email-based)
- Recruiter-job associations
- Recruiter database with search and filtering

### 5. Email Campaign System
- Email template creation with placeholders
- Template variables: [first_name_recruiter], [company], [listing_role], etc.
- Campaign creation for email-method jobs only
- Gmail OAuth 2.0 integration
- Campaign scheduling and monitoring
- Reply tracking and follow-up automation

### 6. Data Export
- Excel export for client data
- Includes job listings and email campaigns
- Comprehensive data formatting

### 7. Audit & Logging
- Data access logs for all operations
- User action tracking
- IP address and user agent logging

## Database Schema

### Core Tables
```sql
-- User Profiles (extends Supabase auth)
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL DEFAULT 'final_user',
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Clients
clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  linkedin_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Client Assignments
client_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, manager_id)
)

client_final_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  final_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id),
  UNIQUE(final_user_id)
)

-- Job Listings
job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_range TEXT,
  job_url TEXT,
  description TEXT,
  requirements TEXT[],
  application_method application_method NOT NULL,
  application_url TEXT,
  status job_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Recruiters
recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  position TEXT,
  linkedin_url TEXT,
  phone TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Job-Recruiter Associations
job_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_listing_id, recruiter_id)
)

-- Gmail Integrations
gmail_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Email Templates
email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Email Campaigns
email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  gmail_integration_id UUID REFERENCES gmail_integrations(id),
  template_id UUID REFERENCES email_templates(id),
  custom_subject TEXT,
  custom_body TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Email Recipients
email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Data Access Logs
data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Implementation Steps

### Phase 1: Project Foundation (Week 1-2)

#### Step 1.1: Project Setup ✅ COMPLETED
- [x] Initialize Next.js 14 project with TypeScript
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Set up ESLint and Prettier
- [x] Configure environment variables
- [x] Set up Git repository and branching strategy

**Progress Notes:**
- ✅ Next.js 14 with App Router successfully initialized
- ✅ TypeScript configured with proper JSX support and import aliases
- ✅ Tailwind CSS installed and configured with proper content paths
- ✅ ESLint configured with Next.js core web vitals
- ✅ shadcn/ui components installed and configured (Card, Button, Input, Label, Badge, Separator, Alert, DropdownMenu)
- ✅ Dark mode theme system implemented with next-themes
- ✅ Theme toggle refactored to a minimal slider: only light and dark icons, no labels, no system option. UI is streamlined and matches latest requirements.
- ✅ All UI components refactored to use shadcn/ui with modern dark styling
- ✅ Consistent design system with proper color tokens and spacing
- ✅ Basic project structure created with src/app directory
- ✅ Package.json updated with proper scripts and dependencies
- ✅ README.md created with project documentation

#### Step 1.2: Supabase Configuration ✅ COMPLETED
- [x] Create Supabase project
- [x] Set up database schema (all tables)
- [x] Configure Row Level Security (RLS) policies
- [x] Set up Supabase client configuration
- [x] Test database connections

**Progress Notes:**
- ✅ Supabase JavaScript client installed and configured
- ✅ Complete database schema created with all tables and relationships
- ✅ Row Level Security (RLS) policies implemented for data protection
- ✅ Supabase client configuration in `src/lib/supabase.ts`
- ✅ Database connection test component created
- ✅ Comprehensive setup guide created (`SUPABASE_SETUP.md`)
- ✅ Database schema file created (`database-schema.sql`)
- ✅ Environment variables template provided

#### Step 1.3: Authentication System ✅ COMPLETED
- [x] Implement Supabase Auth integration
- [x] Create login/register pages
- [x] Set up user role management
- [x] Create authentication middleware
- [x] Test user registration and login flows

**Progress Notes:**
- ✅ Supabase Auth integration with custom user profiles
- ✅ Login page with form validation and error handling
- ✅ Registration page with role selection and password confirmation
- ✅ Authentication context for state management across the app
- ✅ AuthGuard component for route protection and role-based access
- ✅ Dashboard page with role-based content and user information
- ✅ Authentication status component for homepage
- ✅ User role management (manager/final_user) with proper permissions
- ✅ Automatic profile creation on user registration
- ✅ Sign out functionality and session management

#### Step 1.4: Basic Layout & Navigation ✅ COMPLETED
- [x] Create main layout component
- [x] Implement navigation sidebar
- [x] Add role-based menu items
- [x] Create welcome page
- [x] Set up responsive design

#### Step 1.5: Client Management ✅ IN PROGRESS
- [x] Client meta drawer fetches and updates meta data from clients_meta table (UUID matching, scrollable UI)
- [x] Debugging and RLS troubleshooting completed
- [x] Permissive RLS enabled for development
- [ ] Tighten up RLS policy (next step)
- [ ] UI/UX refinements, meta editing polish

#### Step 1.5: GitHub Version Control Setup ✅ COMPLETED
- [x] Repository connected
- [x] Clean history
- [x] .gitignore in place
- [x] node_modules and large files excluded
- [x] Ready for collaboration/CI/CD

### Upcoming:
- ⏳ Tighten up RLS policy (replace permissive policy with secure, role-based access)
- ⏳ Step 1.6: Job Listings Management

### Phase 2: User Management & Permissions (Week 3-4)

#### Step 2.1: User Profile Management
- [ ] Create user profile table and API
- [ ] Implement user role assignment
- [ ] Create user management interface (admin only)
- [ ] Add user profile editing
- [ ] Test role-based access

#### Step 2.2: Client Assignment System
- [ ] Create client assignment tables
- [ ] Implement client-manager assignment interface
- [ ] Create client-final user assignment
- [ ] Add assignment notes functionality
- [ ] Test assignment workflows

#### Step 2.3: Permission System
- [ ] Create RoleGuard component
- [ ] Implement ClientGuard component
- [ ] Add permission hooks (useAuth, usePermissions)
- [ ] Test permission restrictions
- [ ] Add access denied pages

#### Step 2.4: Client Management
- [ ] Create client CRUD operations
- [ ] Implement client listing with pagination
- [ ] Add client search and filtering
- [ ] Create client detail pages
- [ ] Test client management workflows

### Phase 3: Job Listings Management (Week 5-6)

#### Step 3.1: Job Listings CRUD
- [ ] Create job listings API endpoints
- [ ] Implement job creation form
- [ ] Add job editing functionality
- [ ] Create job detail pages
- [ ] Test job management workflows

#### Step 3.2: Inline Editing Tables
- [ ] Create useEditableTable hook
- [ ] Implement inline editing for job tables
- [ ] Add optimistic updates
- [ ] Create editable table components
- [ ] Test inline editing functionality

#### Step 3.3: Application Method Handling
- [ ] Create application method enum
- [ ] Implement method-specific forms
- [ ] Add status tracking for different methods
- [ ] Create status update workflows
- [ ] Test application method flows

#### Step 3.4: Pagination System
- [ ] Create usePagination hook
- [ ] Implement PaginatedTable component
- [ ] Add pagination to all data tables
- [ ] Create pagination controls
- [ ] Test pagination across all views

### Phase 4: Recruiter Management (Week 7-8)

#### Step 4.1: Recruiter CRUD Operations
- [ ] Create recruiter API endpoints
- [ ] Implement recruiter registration form
- [ ] Add recruiter editing functionality
- [ ] Create recruiter detail pages
- [ ] Test recruiter management

#### Step 4.2: Duplicate Prevention
- [ ] Implement email-based duplicate checking
- [ ] Create recruiter association logic
- [ ] Add duplicate warning UI
- [ ] Test duplicate prevention
- [ ] Add recruiter merge functionality

#### Step 4.3: Job-Recruiter Associations
- [ ] Create association table and API
- [ ] Implement recruiter assignment to jobs
- [ ] Add primary recruiter designation
- [ ] Create association management UI
- [ ] Test association workflows

#### Step 4.4: Recruiter Database
- [ ] Create recruiter search functionality
- [ ] Add recruiter filtering options
- [ ] Implement recruiter performance tracking
- [ ] Create recruiter analytics
- [ ] Test recruiter database features

### Phase 5: Email Template System (Week 9-10)

#### Step 5.1: Template Management
- [ ] Create email templates table and API
- [ ] Implement template CRUD operations
- [ ] Create template creation form
- [ ] Add template editing functionality
- [ ] Test template management

#### Step 5.2: Placeholder System
- [ ] Define template placeholder variables
- [ ] Create placeholder insertion UI
- [ ] Implement placeholder replacement logic
- [ ] Add placeholder validation
- [ ] Test placeholder functionality

#### Step 5.3: Template Variables
- [ ] Create template variable mapping
- [ ] Implement variable replacement at send time
- [ ] Add variable preview functionality
- [ ] Create variable documentation
- [ ] Test variable replacement

#### Step 5.4: Template Selection
- [ ] Create template selection interface
- [ ] Add template preview functionality
- [ ] Implement template customization
- [ ] Create template library
- [ ] Test template selection workflow

### Phase 6: Gmail Integration (Week 11-12)

#### Step 6.1: OAuth 2.0 Setup
- [ ] Configure Gmail API credentials
- [ ] Implement OAuth 2.0 flow
- [ ] Create token management system
- [ ] Add token refresh logic
- [ ] Test OAuth integration

#### Step 6.2: Email Sending
- [ ] Create Gmail service wrapper
- [ ] Implement email sending functionality
- [ ] Add email scheduling
- [ ] Create email queue system
- [ ] Test email sending

#### Step 6.3: Token Management
- [ ] Implement secure token storage
- [ ] Add token encryption
- [ ] Create token refresh automation
- [ ] Add token validation
- [ ] Test token management

#### Step 6.4: Integration Management
- [ ] Create Gmail integration UI
- [ ] Add integration status monitoring
- [ ] Implement integration troubleshooting
- [ ] Create integration documentation
- [ ] Test integration workflows

### Phase 7: Campaign Management (Week 13-14)

#### Step 7.1: Campaign Creation
- [ ] Create campaign API endpoints
- [ ] Implement campaign creation wizard
- [ ] Add template selection integration
- [ ] Create recipient selection
- [ ] Test campaign creation

#### Step 7.2: Campaign Scheduling
- [ ] Implement campaign scheduling
- [ ] Add scheduling validation
- [ ] Create schedule management UI
- [ ] Add schedule conflict detection
- [ ] Test scheduling functionality

#### Step 7.3: Campaign Monitoring
- [ ] Create campaign status tracking
- [ ] Implement real-time status updates
- [ ] Add campaign analytics
- [ ] Create campaign reports
- [ ] Test monitoring features

#### Step 7.4: Reply Tracking
- [ ] Implement email reply detection
- [ ] Create reply parsing logic
- [ ] Add reply status updates
- [ ] Create reply notifications
- [ ] Test reply tracking

### Phase 8: Follow-up System (Week 15-16)

#### Step 8.1: Follow-up Sequences
- [ ] Create follow-up sequence tables
- [ ] Implement sequence creation UI
- [ ] Add sequence management
- [ ] Create sequence templates
- [ ] Test sequence creation

#### Step 8.2: Automated Follow-ups
- [ ] Implement follow-up scheduling
- [ ] Add follow-up email sending
- [ ] Create follow-up tracking
- [ ] Add follow-up analytics
- [ ] Test automated follow-ups

#### Step 8.3: Follow-up Management
- [ ] Create follow-up management UI
- [ ] Add follow-up customization
- [ ] Implement follow-up pause/resume
- [ ] Create follow-up reports
- [ ] Test follow-up management

### Phase 9: Export Functionality (Week 17)

#### Step 9.1: Excel Export Setup
- [ ] Install and configure ExcelJS
- [ ] Create export service
- [ ] Implement data formatting
- [ ] Add export validation
- [ ] Test export functionality

#### Step 9.2: Client Data Export
- [ ] Create client data export API
- [ ] Implement job listings export
- [ ] Add campaign data export
- [ ] Create export UI
- [ ] Test export workflows

#### Step 9.3: Export Customization
- [ ] Add export format options
- [ ] Implement export scheduling
- [ ] Create export history
- [ ] Add export notifications
- [ ] Test export customization

### Phase 10: Audit & Logging (Week 18)

#### Step 10.1: Data Access Logging
- [ ] Create logging table and API
- [ ] Implement logging middleware
- [ ] Add comprehensive logging
- [ ] Create log viewing interface
- [ ] Test logging functionality

#### Step 10.2: Audit Trail
- [ ] Implement audit trail system
- [ ] Add change tracking
- [ ] Create audit reports
- [ ] Add audit notifications
- [ ] Test audit features

#### Step 10.3: Security Logging
- [ ] Add security event logging
- [ ] Implement login tracking
- [ ] Create security reports
- [ ] Add security alerts
- [ ] Test security logging

### Phase 11: Testing & Quality Assurance (Week 19-20)

#### Step 11.1: Unit Testing
- [ ] Set up testing framework
- [ ] Write component tests
- [ ] Add API endpoint tests
- [ ] Create utility function tests
- [ ] Test coverage reporting

#### Step 11.2: Integration Testing
- [ ] Test user workflows
- [ ] Test permission systems
- [ ] Test email integration
- [ ] Test export functionality
- [ ] Performance testing

#### Step 11.3: User Acceptance Testing
- [ ] Create test scenarios
- [ ] Test with different user roles
- [ ] Test edge cases
- [ ] Performance optimization
- [ ] Bug fixes and refinements

### Phase 12: Deployment & Documentation (Week 21-22)

#### Step 12.1: Environment Setup
- [ ] Configure development environment
- [ ] Set up production environment
- [ ] Configure CI/CD pipeline
- [ ] Set up monitoring
- [ ] Test deployment process

#### Step 12.2: Documentation
- [ ] Create user documentation
- [ ] Write technical documentation
- [ ] Create API documentation
- [ ] Add inline code comments
- [ ] Create deployment guides

#### Step 12.3: Final Testing & Launch
- [ ] End-to-end testing
- [ ] Security testing
- [ ] Performance testing
- [ ] User training
- [ ] Production launch

## Success Criteria

### Functional Requirements
- [ ] All user roles can access appropriate data
- [ ] Client assignment system works correctly
- [ ] Job listings can be created and managed
- [ ] Recruiter duplicate prevention works
- [ ] Email campaigns can be created and sent
- [ ] Follow-up system functions properly
- [ ] Export functionality generates correct Excel files
- [ ] All data is properly logged

### Performance Requirements
- [ ] Page load times under 2 seconds
- [ ] Email sending works reliably
- [ ] Database queries are optimized
- [ ] Pagination works smoothly
- [ ] Export files generate quickly

### Security Requirements
- [ ] Row Level Security properly implemented
- [ ] User permissions enforced
- [ ] Data access logged
- [ ] Gmail tokens encrypted
- [ ] Input validation working

### Usability Requirements
- [ ] Intuitive user interface
- [ ] Responsive design
- [ ] Clear error messages
- [ ] Helpful user feedback
- [ ] Consistent design language

## Risk Mitigation

### Technical Risks
- **Gmail API Limits:** Implement rate limiting and queue system
- **Database Performance:** Use proper indexing and query optimization
- **Email Delivery:** Implement retry logic and delivery tracking
- **Token Expiration:** Automated token refresh system

### Business Risks
- **User Adoption:** Comprehensive user training and documentation
- **Data Security:** Regular security audits and monitoring
- **Scalability:** Architecture designed for future growth
- **Compliance:** Data access logging and audit trails

## Future Enhancements

### Phase 2 Features (Post-Launch)
- Bulk import functionality
- Advanced analytics dashboard
- Slack/Teams integration
- Automated follow-up sequences
- Multi-email provider support
- Advanced reporting
- Mobile application
- API for third-party integrations

## Conclusion

This project scope provides a comprehensive roadmap for building a robust reverse recruiting SaaS platform. The phased approach ensures manageable development cycles while delivering value incrementally. Each phase builds upon the previous one, creating a solid foundation for future enhancements.

The focus on team collaboration, security, and user experience will ensure the platform meets the needs of both managers and final users while maintaining data integrity and providing valuable insights through comprehensive logging and export capabilities. 