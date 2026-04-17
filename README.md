# SkillBridge

SkillBridge is a Campus Skill Exchange Platform for university students.

This foundation includes:
- Authentication (register/login/logout with NextAuth credentials)
- Student profile creation, editing, and public viewing
- Skill offer/request post creation and management
- Search, filter, and sorting on post listings
- Booking/session requests with status workflow
- In-app notifications with unread tracking
- One-to-one chat for accepted bookings

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- NextAuth
- Zod

## Getting Started
1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Apply migrations:
```bash
npm run prisma:migrate:dev -- --name init
```
If you already had an older local schema, run:
```bash
npm run prisma:migrate:dev -- --name auth_fullname_role
npm run prisma:migrate:dev -- --name profile_function2
npm run prisma:migrate:dev -- --name skill_posts_feature3
npm run prisma:migrate:dev -- --name booking_feature5
npm run prisma:migrate:dev -- --name notifications_feature7
npm run prisma:migrate:dev -- --name chat_feature8
```

5. Start development server:
```bash
npm run dev
```

## Auth Routes
- `GET /register` - registration page
- `GET /login` - login page
- `POST /api/auth/[...nextauth]` - NextAuth credentials login flow
- logout via `signOut()` from UI button

## Profile Routes
- `GET /profile/me` - current user's profile
- `GET /profile/edit` - create/edit current user's profile
- `GET /students/[id]` - public student profile (by `userId`)

## Post Routes
- `GET /posts` - list all posts
- `GET /posts/new` - create a post (authenticated)
- `GET /posts/[id]` - post detail
- `GET /posts/[id]/edit` - edit post (owner only)

`/posts` supports query params for discovery:
- `q` keyword search (title, description, skill name)
- `type` (`offer` or `request`)
- `mode` (`online`, `in_person`, or `both`)
- `university` (matches student profile university)
- `status` (`open` or `closed`)
- `sort` (`newest` or `oldest`)

## Booking Routes
- booking request form appears on `GET /posts/[id]` (authenticated users on open posts only)
- `GET /bookings` - incoming and outgoing booking requests

## Notification Routes
- `GET /notifications` - all notifications for current user
- notification bell/dropdown in navbar with unread badge
- review workflows should call `createNewReviewReceivedNotification(...)` from `src/lib/notifications/notification-service.ts`

## Chat Routes
- `GET /messages` - conversation list
- `GET /messages/[id]` - single conversation
- `GET/POST /api/messages/[id]` - near-real-time message refresh and send

## User Model
`User` stores:
- `id`
- `fullName`
- `email`
- `passwordHash`
- `role` (default `"student"`)
- `createdAt`
- `updatedAt`

## SkillPost Model
`SkillPost` stores:
- `id`
- `userId` (owner)
- `type` (`offer` or `request`)
- `title`
- `description`
- `skillName`
- `preferredMode` (`online`, `in_person`, or `both`)
- `status` (`open` or `closed`)
- `createdAt`
- `updatedAt`

## Booking Model
`Booking` stores:
- `postId`
- `requesterId`
- `providerId`
- `message`
- `proposedDate`
- `durationMinutes`
- `sessionMode` (`online` or `in_person`)
- `meetingLocation` (for in-person)
- `meetingLink` (for online, e.g. Zoom)
- `status` (`pending`, `accepted`, `rejected`, `cancelled`, `completed`)
- `createdAt`
- `updatedAt`

## Notification Model
`Notification` stores:
- `id`
- `userId`
- `type`
- `title`
- `message`
- `isRead`
- `relatedEntityType` (optional)
- `relatedEntityId` (optional)
- `createdAt`

## Conversation Model
`Conversation` stores:
- `id`
- `bookingId` (unique)
- `participantOneId`
- `participantTwoId`
- `createdAt`

## Message Model
`Message` stores:
- `id`
- `conversationId`
- `senderId`
- `content`
- `isRead`
- `createdAt`

## Real-time Notes
- Chat uses practical near-real-time polling from the conversation client (`/api/messages/[id]` every ~2.5 seconds).
- No extra infrastructure (WebSocket broker/Pusher/etc.) is required for this setup.

## Proposed Folder Structure
```text
src/
  app/
    login/
    profile/
      edit/
      me/
    register/
    posts/
      [id]/
        edit/
      new/
    students/[id]/
    api/
      auth/[...nextauth]/
    globals.css
    layout.tsx
    page.tsx
  components/
    auth/
    layout/
    profile/
  lib/
    actions/
    auth/
    posts/
    profile/
    validations/
    types/
    db.ts
  types/
    next-auth.d.ts
  middleware.ts
prisma/
  schema.prisma
```

## Scope Notes
This repository intentionally does not include recommendations, voice/video calling, file uploads in chat, realtime push notifications, email notifications, or admin features yet.
