# Universal Deadline & Penalty Guardian

A penalty-driven deadline tracking system built with **Next.js** that helps you never miss critical obligations by providing escalating notifications as deadlines approach.

**Repository: [https://github.com/IgnasTamosaitis/deadline-guardian](https://github.com/IgnasTamosaitis/deadline-guardian)**

## Features

### Core MVP Features

- **Critical Obligations Management** - Track deadlines with consequences, categories, and severity levels
- **Escalating Notifications** - Automatic email alerts at 30, 7, and 1 day before deadlines
- **Urgency Indicators** - Visual color-coded urgency based on days remaining and severity
- **Free Tier with Paywall** - 2 free active obligations, upgrade prompts for unlimited
- **Notification Logging** - Complete history of sent notifications with success tracking
- **Email Notifications** - Beautifully formatted HTML emails with deadline details

### Additional Features

- Marketing landing page with animated Terminal element
- Pricing page with Stripe Checkout integration
- Dashboard with user/team management
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs
- Activity logging system for user events
- Cron job system for automated notification checks

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Supabase)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Email**: Console logging (production: Resend/SendGrid)
- **Scheduling**: Vercel Cron Jobs

## Project Structure

```
├── app/
│   ├── (dashboard)/
│   │   ├── obligations/          # Main obligations CRUD pages
│   │   ├── test-notifications/   # Notification testing UI
│   │   └── dashboard/            # User/team management
│   └── api/
│       └── cron/
│           └── notifications/    # Cron job endpoint for email notifications
├── lib/
│   ├── db/
│   │   ├── schema.ts            # Database schema (obligations, notifications)
│   │   ├── queries.ts           # Database queries
│   │   └── notifications.ts     # Notification logic
│   └── notifications/
│       └── email-service.ts     # Email formatting and sending
└── components/
    └── ui/                      # shadcn/ui components
```

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## Testing the Notification System

See detailed documentation in [NOTIFICATIONS.md](./NOTIFICATIONS.md).

### Quick Test

1. Navigate to `/test-notifications` in the app
2. Create test obligations with deadlines:
   - 30 days from now (triggers 30-day warning)
   - 7 days from now (triggers 7-day warning)
   - 1 day from now (triggers 1-day critical alert)
3. Click "Run Notification Check" button
4. Check server console for formatted email output

### Manual API Call

```bash
curl -X POST http://localhost:3000/api/cron/notifications
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Stripe Webhooks (Local Testing)

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `NEXT_PUBLIC_APP_URL`: Set this to your production domain (for email links).
3. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment.
4. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
5. `POSTGRES_URL`: Set this to your production database URL.
6. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.
7. `CRON_SECRET`: Set this to a secure random string for protecting cron endpoints.
8. `RESEND_API_KEY`: (Optional) Your Resend API key for email notifications.
9. `EMAIL_FROM`: (Optional) Your sender email address for notifications.

### Set up Email Notifications

1. Sign up for [Resend](https://resend.com) or another email service
2. Get your API key and add it to environment variables
3. Update `lib/notifications/email-service.ts` to use the email service (instructions in code comments)
4. Verify your sending domain in the email service dashboard

### Configure Cron Jobs

Vercel Cron is already configured in `vercel.json` to run every 6 hours. The cron job will automatically check for obligations needing notifications and send emails.

Alternatively, use an external cron service to call:

```
POST https://yourdomain.com/api/cron/notifications
Authorization: Bearer YOUR_CRON_SECRET
```

## Development Phases

### ✅ Phase 1: Data Model & Schema (Complete)

- Created `critical_obligations` table with all necessary fields
- Added enums for category, severity, and status
- Implemented database migrations with Drizzle
- Added `obligation_notifications` table for tracking sent notifications

### ✅ Phase 2: Backend Logic (Complete)

- Implemented CRUD operations with server actions
- Added free tier paywall (2 active obligations limit)
- Created notification checking logic with threshold detection
- Built notification logging system

### ✅ Phase 3: User Interface (Complete)

- Built obligations list page with urgency indicators
- Created add/edit obligation forms with visual selectors
- Implemented mark as complete functionality
- Added delete confirmation dialogs
- Polished UI with gradients, shadows, and animations

### ✅ Phase 4: Escalation Logic & Notifications (Complete)

- Implemented 30/7/1 day notification thresholds
- Created email notification service with HTML templates
- Built cron job endpoint for automated checking
- Added notification testing UI
- Configured Vercel Cron for production

### 🔜 Future Enhancements

- AI-powered severity suggestions based on consequence text
- Mobile app with push notifications
- Calendar integration (Google Calendar, Outlook)
- Team collaboration features
- Advanced analytics and reporting
- Custom notification schedules per obligation

## Credits

This project is built on top of the [Next.js SaaS Starter](https://github.com/nextjs/saas-starter) template.
