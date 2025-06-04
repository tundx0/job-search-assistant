# Job Search Assistant Web Application

A robust, enterprise-grade platform for generating tailored resumes and cover letters using advanced AI. This project demonstrates deep expertise in modern system design, modular architecture, and scalable engineering patterns.

## Architectural Highlights

- **Separation of Concerns & Modularity**: Every major concern—AI, storage, authentication, business logic, and UI—is encapsulated in its own module or provider. This ensures maintainability, testability, and clarity.
- **Pluggable Provider Architecture**: Storage and AI integrations leverage the Strategy Pattern and Dependency Inversion Principle. All providers implement common interfaces, enabling seamless runtime selection and future extensibility (e.g., adding new storage backends or AI models).
- **Advanced API & Data Layer**: Uses Next.js API routes, Prisma ORM, and strict schema validation with Zod. Clean boundaries between API, data, and service layers.
- **Security & Best Practices**: Secure authentication (NextAuth.js), environment-based secrets, and strict user authorization checks throughout the stack.
- **Performance & Scalability**: Caching, direct URL generation for public assets, and async job processing ensure the system is ready for high-traffic production use.
- **Modern UI/UX**: Built with Next.js App Router, TailwindCSS, and shadcn/ui for a best-in-class user experience.

## Key Features

- **User Authentication**: Secure registration, login, and social OAuth
- **Profile Management**: Structured, extensible user data model
- **Job Application Tracking**: Persistent, queryable application records
- **AI-Powered Resume & Cover Letters**: Dynamic provider selection, prompt engineering, and ATS optimization toggles
- **Extensible File Storage**: Unified interface for AWS S3, Supabase, and local storage with direct URL support
- **Admin & Metrics Dashboards**: Real-time analytics and system health monitoring

## System Design Patterns Used

- **Strategy Pattern**: All storage and AI providers implement the same interface, allowing runtime selection and easy extension.
- **Dependency Inversion Principle**: High-level modules depend on abstractions, not concrete implementations.
- **Separation of Concerns**: UI, business logic, storage, and AI are all cleanly separated.
- **Validation Layer**: Zod schemas enforce data integrity at every API boundary.

## Project Structure

```
job-assistant/
├── src/
│   ├── app/                     # Next.js App Router structure
│   │   ├── (authenticated)/     # Protected routes group
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── jobs/            # Job submission and details
│   │   │   │   ├── [id]/        # Job detail page
│   │   │   │   └── new/         # New job submission
│   │   │   └── profile/         # Profile editor
│   │   ├── api/                 # API routes (clean boundary)
│   │   ├── auth/                # Authentication pages
│   │   └── page.tsx             # Landing page
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Core libraries and service providers
│   │   ├── ai/                  # AI provider abstraction & integration
│   │   ├── storage/             # Storage provider abstraction & integration
│   │   ├── db/                  # Database utilities
│   │   └── auth/                # Auth/session utilities
│   └── middleware.ts            # Auth protection middleware
├── prisma/                      # Prisma schema and migrations
├── public/                      # Static assets
├── .env.example                 # Example environment variables
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Extensibility Example: Adding a New Storage Provider

1. Implement the `IStorageProvider` interface in a new class (e.g., `AzureBlobProvider`).
2. Register the provider in the provider factory.
3. No changes required to business logic or API routes—plug and play.

## Advanced Features

- **ATS Optimization Toggle**: Users can enable/disable advanced resume optimization for ATS systems, affecting AI prompt construction and output.
- **Direct URL Storage**: Public files use direct URLs for efficiency; private files use signed URLs, all abstracted behind the provider interface.
- **User AI Provider Preference**: Each user can select their preferred AI provider, which is respected throughout the resume generation process.
- **Comprehensive Testing**: Includes unit and integration tests for all providers and critical flows.
- **Admin Observability**: System health, storage usage, and backup status are surfaced in admin dashboards.

## Setup & Deployment

Standard Node.js, Next.js, and PostgreSQL setup. See original instructions for details. The architecture supports scaling to multiple regions, cloud storage, and multi-provider AI out of the box.

---

This project is a showcase of advanced system design, modular architecture, and real-world engineering best practices—ready for production and future growth.

## Project Structure

```
job-assistant/
├── src/
│   ├── app/                     # Next.js App Router structure
│   │   ├── (authenticated)/     # Protected routes group
│   │   │   ├── dashboard/       # Dashboard page
│   │   │   ├── jobs/            # Job submission and details
│   │   │   │   ├── [id]/        # Job detail page
│   │   │   │   └── new/         # New job submission
│   │   │   └── profile/         # Profile editor
│   │   ├── api/                 # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── jobs/            # Job application endpoints
│   │   │   └── profile/         # User profile endpoints
│   │   ├── auth/                # Authentication pages
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   └── page.tsx             # Landing page
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── forms/               # Form components
│   ├── lib/                     # Utility functions and services
│   │   ├── auth/                # Authentication utilities
│   │   ├── db/                  # Database utilities
│   │   ├── ai/                  # AI service integration
│   │   └── storage/             # File storage integration
│   └── middleware.ts            # Auth protection middleware
├── prisma/                      # Prisma schema and migrations
│   └── schema.prisma            # Database schema
├── public/                      # Static assets
├── .env.example                 # Example environment variables
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Database Schema

```typescript
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  passwordHash   String
  name           String
  bio            String?
  experience     Json
  education      Json
  skills         String[]
  jobApplications JobApplication[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  accounts       Account[]       // NextAuth.js
  sessions       Session[]       // NextAuth.js
}

model JobApplication {
  id             String          @id @default(uuid())
  userId         String
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobTitle       String
  companyName    String
  jobDescription String          @db.Text
  tailoredResume String          // Generated resume content
  coverLetter    String          // Generated cover letter content
  status         String          // pending/submitted/etc
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

// NextAuth.js Models
model Account {
  id                 String  @id @default(uuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional, for social login)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/job-assistant.git
   cd job-assistant
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your own values for:
   - Database connection string
   - NextAuth secret and URL
   - OAuth provider credentials
   - OpenAI API key
   - File storage credentials

4. Initialize the database

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Run the development server

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

This application is ready for deployment on platforms like Vercel or Netlify for the frontend, with a PostgreSQL database from providers like Supabase, Railway, or Neon.

## Usage Flow

1. **Register/Login**: Create an account or log in with existing credentials
2. **Complete Profile**: Add your professional information, skills, experience, and education
3. **Submit Job Application**: Paste a job description for a position you're interested in
4. **Review Generated Documents**: View and download the AI-generated resume and cover letter
5. **Track Applications**: Monitor the status of all your job applications

## License

MIT
