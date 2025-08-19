# AgencyOS

A modern, full-featured agency management platform built with Next.js and Supabase.

## Features

- **Multi-Role Dashboard** - Separate dashboards for admins, team members, and clients
- **Service Management** - Track projects, milestones, and tasks with Kanban boards
- **Client Portal** - Secure client access to their projects and communication
- **Real-time Messaging** - Built-in chat system with file attachments
- **Knowledge Base** - Organize and share resources and documentation
- **Email & SMS** - Automated notifications via Resend and Twilio
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Supabase (Auth, Database, Storage, Realtime)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod validation
- Playwright for E2E testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Resend account (for emails)
- Twilio account (for SMS)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd final-agency
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

4. Set up the database:
```bash
# Run migrations
psql $DATABASE_URL < scripts/setup-database.sql

# Create demo users (optional)
node scripts/create-demo-users.js
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Demo Accounts

```
Admin:    admin@demo.com        (password: password123)
Team:     team@demo.com          (password: password123)
Client:   sarah@acmecorp.com    (password: password123)
```

## Project Structure

```
├── app/                # Next.js app directory
│   ├── (auth)/        # Public authentication routes
│   ├── (dashboard)/   # Protected dashboard routes
│   ├── actions/       # Server actions
│   └── api/          # API routes
├── features/         # Feature-based modules
├── shared/          # Shared utilities and components
├── scripts/         # Database and setup scripts
└── supabase/       # Supabase migrations
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm run test
```

## Testing

The project uses Playwright for end-to-end testing:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Debug tests
npm run test:debug
```

## Deployment

The application can be deployed to any platform that supports Next.js:

1. **Vercel** (recommended)
   - Connect your GitHub repository
   - Add environment variables
   - Deploy

2. **Other platforms**
   - Build: `npm run build`
   - Start: `npm start`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please open an issue in the repository.