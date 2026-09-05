# Nestro

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Express](https://img.shields.io/badge/Express-5-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Status](https://img.shields.io/badge/Status-Active%20Development-blue)

### 🔗 Live

| | |
|---|---|
| **Storefront** | https://nestro-nikkx.vercel.app |
| **API** | https://nestro-api.onrender.com |

> The API runs on Render's free tier and sleeps after ~15 minutes of inactivity — the first request may take 30–50 seconds to wake it.
>
> **Nestro is a portfolio project, not a real store.** The catalog, reviews and accounts are demo data, and nothing on it can actually be purchased.

### 🔑 Demo Accounts

Sign in at [/login](https://nestro-nikkx.vercel.app/login) to try either side of the app.

| Role | Email | Password | What you can do |
|---|---|---|---|
| **Admin** | `admin@nestro.com` | `changeme123` | Full admin panel — manage products, variants, master data, and moderate reviews |
| **Customer** | `priya.demo@nestro.test` | `demopassword123` | Browse, filter, add to cart, save to wishlist, write and edit reviews |

A few notes on what these accounts can and can't do:

- **Admins can't post reviews** — reviews are customer-only by design, the same rule Cart and Wishlist follow. Sign in as the customer for that.
- **Neither account can change its own password** — the profile endpoint accepts a name and nothing else, so the demo can't be locked.
- Anything an admin edits or deletes here is demo data, and the seed scripts rebuild it from scratch.

Other demo customers exist (`arjun.demo@`, `neha.demo@`, `rohit.demo@`, `ananya.demo@`, `vikram.demo@` — all `@nestro.test`, same password) — useful if you want to see a product's reviews from more than one account.

---

> 🚧 **Nestro is currently under active development.**
>
> Nestro is a production-style furniture e-commerce platform that I'm building to learn professional full-stack software engineering while creating a portfolio-quality project. Every feature is developed with scalability, clean architecture, and industry best practices in mind.

---

# 📖 About the Project

Nestro is more than just another CRUD application.

It is my long-term learning project where I practice building software the way professional development teams do.

Instead of rushing to finish features, I focus on:

- Clean Architecture
- Reusable Components
- Production Folder Structure
- REST API Design
- Scalable Backend Development
- Professional Git Workflow
- Documentation
- Real-world Development Practices

The goal is to build an application that demonstrates not only technical skills but also software engineering thinking.

---

Nestro is being designed as a unified commerce platform rather than a single application.

The long-term vision consists of multiple client applications sharing a common backend.

Current architecture includes:

- Admin Application
- Customer Store

Future expansion may include:

- Seller Portal
- Mobile Application
- Public API

This approach allows the platform to grow while keeping business logic centralized inside a shared backend.

---

# 🎯 Project Goals

Through Nestro, I aim to learn and practice:

### Frontend

- Next.js App Router
- React
- Tailwind CSS
- Component Architecture
- State Management
- API Integration
- Reusable UI Components

### Backend

- Express.js
- MongoDB
- Mongoose
- REST API Design
- Middleware
- Authentication
- Authorization
- File Upload

### Software Engineering

- Clean Code
- Separation of Concerns
- Scalable Folder Structure
- Documentation
- Git Workflow
- Deployment
- Production-Level Development Practices

---

# 🛠 Tech Stack

## Frontend

- Next.js (App Router)
- React
- Tailwind CSS v4
- Axios
- Sonner
- Lucide React
- clsx
- React Hook Form
- Zod Validation

---

## Backend

- Node.js
- Express.js v5
- MongoDB
- Mongoose
- dotenv
- cors
- nodemon
- Zod (request validation)
- Multer
- Cloudinary (image upload & storage)
- helmet
- express-rate-limit
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- cookie-parser

---

## Testing

- Jest
- Supertest
- mongodb-memory-server (in-memory MongoDB for integration tests — never touches real data)

---

## Planned Integrations

Next, in this order:

1. **Email infrastructure** — Nestro currently has no email-sending integration at all (Contact and Newsletter both store submissions only). This is the blocker behind everything below.
2. **Password reset** — the most valuable of the four. Right now a customer who forgets their password has permanently lost the account.
3. **Email verification on register** — likely verify-but-don't-block, so trying the demo doesn't require a real inbox.
4. **Passwordless OTP login** — as an *alternative* sign-in path rather than mandatory 2FA, which is uncommon on customer storefront accounts.

Also planned: Refresh Tokens, and a Super Admin role once there's genuinely more than one admin to manage.

---

# 📸 Screenshots

> Screenshots will be added as the project progresses.

### Admin Dashboard

Coming Soon

---

### Categories Module

#### Categories List

![Categories List](.github/assets/images/category-list.png)

Browse, search, edit and manage furniture categories from the admin panel.

---

#### Create / Edit Category

![Category Modal](.github/assets/images/category-modal.png)

A reusable form used for both creating and updating categories.

---

### Product & Variant Management

#### Backend

- Create Product
- Get All Products (with populated category, brand, room types, and a computed variant count)
- Get Product By ID
- Update Product
- Delete Product — cascade-aware: blocks with a variant count if the product has variants, requires explicit confirmation to delete the product and all its variants together
- Create Product Variant
- Get All Variants for a Product
- Get Variant By ID
- Update Variant
- Delete Variant
- Referential Integrity — Category, Brand, Room Type, Material, and Color cannot be deleted while a Product or Variant still references them
- Auto-generated, Collision-safe SKUs — built from the product, material, and color, disambiguated with a document ID fragment rather than relying on truncated names staying unique
- Compound Uniqueness — a Product cannot have two variants with the same material and color
- Money stored as Integer Minor Units (paise), never floats
- Cloudinary Cleanup on Delete and Image Replacement — for both products and variants
- Route-level ObjectId Validation
- Reference-existence Validation (not just ID format) on create and update
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Products Listing with Search, Sort, Pagination
- Create Product
- Edit Product
- Cascade-aware Delete Confirmation — shows the exact variant count before deleting a product with variants
- Dedicated Create/Edit Routes (not a modal, since a Product is a composite entity with its own variants)
- Variant Management Page per Product
- Variant Create/Edit Modal
- Multi-image Gallery with a configurable per-entity image cap
- Room Type Multi-select
- Specification Key/Value Editor
- Guided "first variant" prompt immediately after creating a product
- Shared Form Validation Pattern (React Hook Form + Zod), mirrored on the backend
- Loading States
- Error Handling
- Toast Notifications

---

### Authentication & Authorization

#### Backend

- User Model with bcrypt-hashed passwords (never stored or returned in plain text)
- JWT-based Authentication delivered via an httpOnly cookie (not readable by client-side JavaScript, not stored in localStorage)
- Register, Login, Logout, and "Current User" endpoints
- Re-verifies the logged-in user against the database on every request, rather than trusting a role embedded in the token — a role change or deactivation takes effect immediately
- Role-Based Access Control — a reusable `authorize(...roles)` middleware, composed the same way across every protected route
- Every write operation (Create, Update, Delete) across every module — Categories, Room Types, Brands, Materials, Colors, Products, Variants, and Image Upload — requires a logged-in Admin; all read operations remain public
- A dedicated, stricter rate limiter on the login and register endpoints specifically, on top of the general API rate limit
- Public registration always creates a Customer account — there is no way for a self-registered user to grant themselves Admin access
- Idempotent admin-account seed script, kept deliberately separate from the Master Data seed script so reseeding test data never touches real admin accounts

#### Frontend

- Login Page (React Hook Form + Zod)
- Register Page (customer sign-up, mirrors the Login page's pattern)
- Global Auth State via React Context (checks for an existing session on load)
- Route Guard on the Admin Panel — redirects to Login unless a logged-in Admin is confirmed
- Role-based Post-login Redirect — Admin lands on the admin panel, Customer lands on the storefront
- Logout, wired into the Admin Header

---

### Customer Store

#### Backend

- `optionalAuthenticate` middleware — a request can be anonymous, a logged-in Customer, or a logged-in Admin, and each sees different data from the same route without three separate endpoints
- Product Listing and Product Detail respect this: an anonymous or Customer caller only ever sees `published` products; an Admin sees every status, exactly like the admin panel already did
- Filtering by Category, Brand, Material, and Color (Material/Color reached via a Variant lookup, since they live on the Variant, not the Product)
- Cart and Wishlist — Customer-only, a logged-in Admin is explicitly forbidden rather than just unauthenticated. Cart stores a live reference to the variant (price/stock always reflect the current value, never a stale snapshot) and validates stock and active status on every add/update
- Real, computed product counts per Category and Room Type (no hardcoded placeholder)
- A minimal Contact-message endpoint (stores the submission; no email integration)
- A Profile-update endpoint for a Customer to edit their own name

#### Frontend

- Its own route group and layout (Navbar/Footer), visually distinct from the admin panel
- Homepage — hero, Shop by Category / Shop by Room (real counts), New Arrivals
- Product Listing with filters, Product Detail with a variant/color picker, Add to Cart, and a Wishlist toggle
- Cart page — quantity control, live subtotal, remove item
- Wishlist page
- About and Contact pages
- Account/Profile page — edit name, an honest empty state for Order History (no orders can exist yet — Commerce isn't built)
- No fabricated content anywhere on the storefront — no invented reviews, ratings, or business statistics; only real, computable data is shown

---

# 🏗 Architecture

```
                    NESTRO

          ┌──────────────────────┐
          │                      │

          ▼                      ▼

   Admin Application     Customer Store

          │                      │

          └─────────┬────────────┘
                    │

            Express REST API

                    │

     ┌──────────────┴──────────────┐

     ▼                             ▼

Business Logic              Shared Middleware

                    │

               MongoDB Models

                    │

                 MongoDB

```

Both the Admin Application and the Customer Store communicate with the same backend API.

The backend is designed as the single source of truth for business logic, authentication, inventory, products and future commerce features.

---

# 📁 Project Structure

```

Nestro/
│
├── client/
│ ├── src/
│ │ ├── app/
│ │ ├── components/
│ │ ├── context/
│ │ ├── hooks/
│ │ ├── services/
│ │ ├── utils/
│ │ └── lib/
│
├── server/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middlewares/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── scripts/
│ │ ├── utils/
│ │ ├── validators/
│ │ ├── app.js
│ │ └── server.js
│ └── tests/
│
└── README.md

```

# ✨ Features

## ✅ Completed

### Admin Dashboard

- Responsive Admin Layout
- Sidebar Navigation
- Dashboard Header
- Reusable UI Structure

---

### Category Management

#### Backend

- Create Category
- Get All Categories
- Get Category By ID
- Update Category
- Delete Category
- Duplicate Category Validation
- ObjectId Validation Middleware
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Categories Listing
- Create Category
- Edit Category
- Delete Category
- Shared Create/Edit Modal
- Shared Category Form
- Delete Confirmation Modal
- Loading States
- Error Handling
- Toast Notifications
- Axios Service Layer

### Room Type Management

#### Backend

- Create Room Type
- Get All Room Types
- Get Room Type By ID
- Update Room Type
- Delete Room Type
- Duplicate Room Type Validation
- ObjectId Validation Middleware
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Room Types Listing
- Create Room Type
- Edit Room Type
- Delete Room Type
- Shared Create/Edit Modal
- Shared Room Type Form
- Delete Confirmation Modal
- Loading States
- Error Handling
- Toast Notifications
- Axios Service Layer

### Brand Management

#### Backend

- Create Brand
- Get All Brands
- Get Brand By ID
- Update Brand
- Delete Brand
- Duplicate Brand Validation
- ObjectId Validation Middleware
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Brands Listing
- Create Brand
- Edit Brand
- Delete Brand
- Shared Create/Edit Modal
- Shared Brand Form
- Delete Confirmation Modal
- Loading States
- Error Handling
- Toast Notifications
- Axios Service Layer

### Material Management

#### Backend

- Create Material
- Get All Materials
- Get Material By ID
- Update Material
- Delete Material
- Duplicate Material Validation
- ObjectId Validation Middleware
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Materials Listing
- Create Material
- Edit Material
- Delete Material
- Shared Create/Edit Modal
- Shared Material Form
- Delete Confirmation Modal
- Loading States
- Error Handling
- Toast Notifications
- Axios Service Layer

### Color Management

#### Backend

- Create Color
- Get All Colors
- Get Color By ID
- Update Color
- Delete Color
- Duplicate Color Validation
- Route-level ObjectId Validation
- Proper Error Handling
- RESTful API Structure

#### Frontend

- Colors Listing
- Create Color
- Edit Color
- Delete Color
- Shared Create/Edit Modal
- Shared Color Form
- Delete Confirmation Modal
- Loading States
- Error Handling
- Toast Notifications
- Axios Service Layer

---

### Reusable Architecture

- Service Layer Pattern via a Shared Service Factory (`createResourceService`) — every Master Data module's CRUD service is generated from one function instead of hand-written per module
- Shared CRUD Hook (`useCrud`) — all state, handlers, search/sort/filter/pagination logic for every Master Data admin page lives in one hook
- Shared Query Builder (`buildQueryFeatures`) — backend search, sort, and filter logic built once and reused across all 5 controllers, backed by a MongoDB text index rather than a regex scan
- Shared Search, Sortable Columns, Status Filter, and Pagination UI — one component each, reused across every Master Data table
- Reusable Delete Confirmation Modal
- Reusable Empty State Component
- Shared Axios Instance
- Reusable Validation Middleware
- Shared Text Formatter Utilities
- Feature-based Folder Structure
- Shared Form Validation Pattern (React Hook Form + Zod)
- Database Seed Script for local development/testing

---

### Hardening Pass

A full correctness and security review of the backend, completed before starting the Product module:

- Regex-based input escaped everywhere it reaches a database query, preventing false matches and catastrophic backtracking
- Pagination limits capped, and sortable fields whitelisted against arbitrary query input
- CORS restricted to known origins, with helmet and rate limiting added at the API boundary
- Required environment variables validated at boot, failing fast instead of failing silently
- Orphaned Cloudinary images cleaned up automatically on delete and on image replace
- Slug collisions resolved with a numeric suffix instead of silently colliding
- Search moved from an unindexed regex scan to a MongoDB text index

---

### Automated Testing

141 Jest + Supertest integration tests across 14 suites (Categories, Room Types, Brands, Materials, Colors, Products, Variants, Authentication, Users, Cart, Wishlist, Contact, Newsletter, and Reviews), covering the main success path and the most likely failure path for each route:

- Runs against an in-memory MongoDB (`mongodb-memory-server`) that exists only for the duration of the test run — real data is never touched
- Explicit coverage for the authorization layer itself: an unauthenticated request and a wrong-role request are both tested against a protected route, not just the "happy path"
- Regression tests for a real access-control gap found and fixed in a pre-deployment security audit
- Introduced incrementally alongside each module rather than deferred to the end

---

### User Directory & Settings

- Admin **Users** page — every registered account, with search, role filter and status filter
- **Deactivation, not deletion.** A User is referenced by Cart, Wishlist and Review, so deleting one would orphan all three. Deactivating blocks the account on its **very next request** — the auth middleware re-reads the user from the database on every request rather than trusting the token, so it takes effect immediately instead of waiting out a 7-day JWT
- Two guards against unrecoverable states: an admin can't change their own status, and the last active admin can't be deactivated
- **No role editing by design** — promoting an account to admin is Super Admin territory, deliberately deferred until there's a real second-admin scenario. The validator is strict, so a `role` field in the payload is rejected rather than silently ignored
- Admin **Settings** page — contains only what actually works: the account's own name, real read-only system values, and an explicit "Not configurable yet" list naming what's missing and why (store settings need Checkout, password change needs email, role management needs Super Admin). A settings screen full of controls that save nowhere would be the same problem as a dashboard full of invented numbers

---

### Reviews

- Real `Review` model — not a rating field on the Product. Star ratings shown anywhere on the storefront are **computed by aggregation** from actual review documents, so they can never drift out of sync with the reviews people wrote
- One review per customer per product, enforced by a compound unique index — a repeat attempt gets a clear "edit yours instead" rather than a raw duplicate-key error
- Customer-only creation (a logged-in admin is explicitly forbidden, same rule as Cart and Wishlist); owner-only editing; deletion by the owner **or** an admin
- The delete rule is deliberately *ownership* logic in the controller rather than a role gate on the route — "may this kind of user do this" and "may this user touch this record" are different questions
- Rating summary computed with a distribution breakdown (how many 5-star, 4-star, …), powering the rating bars on the product page
- Admin moderation page — read and delete only, with rating filter and full-text search over review comments. No create/edit path exists, because reviews are customer-only
- Ratings reach product listing cards through the same one-aggregation-per-page approach as prices — never an N+1 query, regardless of page size
- A product with no reviews reports `null`, not `0` — the UI renders no stars at all rather than five empty ones reading as "rated zero"

**On honesty:** these are seeded demo reviews, and the site says so in its footer. The distinction this project draws is between a *hardcoded claim* (a "4.8/5" typed into the markup — never acceptable) and a *real system carrying demo data* (a review collection, real endpoints, real aggregation — the same kind of demo data as the seeded catalog itself). A "Bestseller" badge is deliberately **not** built, because nothing can compute it until Orders exist.

---

### Deployment

- Frontend on **Vercel**, backend on **Render**, database on **MongoDB Atlas** — deploying from `main` on every push
- Because the two apps live on different domains, the auth cookie had to move to `sameSite: "none"` in production. That silently removes the CSRF protection `sameSite: "lax"` was providing, so a dedicated **Origin-verification middleware** was added on every write route in the same change — reading from the same allow-list CORS uses, so the two can't disagree
- Required environment variables are validated at boot, so a misconfigured deploy fails immediately and visibly rather than surfacing as a confusing 500 on the first request

---

### Catalog Seeding at Scale

- `npm run seed:catalog` builds a realistic catalog — **132 products, 386 variants** — with photography fetched live from the **Unsplash Search API** rather than a hand-maintained list of image URLs
- Photos are pooled per category and uploaded to Cloudinary **once**, then reused across that category's products — capping a would-be 400+ uploads at ~300, one time
- **Resumable**: a category that already has products is skipped, so an interrupted run continues where it stopped. This wasn't hypothetical — the first run hit Unsplash's hourly rate limit partway through
- A companion backfill script fills specifications, variant dimensions and weight, and varied product descriptions, and retries any category whose image search came back empty

---

### Pre-Deployment Security Audit

A full-codebase review carried out ahead of the first deployment, separate from any single feature:

- Found and fixed a real access-control gap — a variant-listing endpoint could leak an unpublished product's price, stock, and SKU because it was missing a status check its sibling endpoint already had
- Centralized error handling on the image upload endpoint, matching the pattern used everywhere else instead of returning a raw internal error message
- Added a whitelist for the upload endpoint's folder parameter instead of accepting an unvalidated string

---

# 🚀 Roadmap

## Phase 1 — Admin Foundation

- ✅ Admin Dashboard
- ✅ Categories
- ✅ Room Types
- ✅ Brands
- ✅ Materials
- ✅ Colors
- ✅ Image Upload
- ✅ Search, Pagination, Sorting, Filtering
- ✅ Error Handling Improvements
- ✅ Hardening Pass (security, data integrity, and correctness review)

---

## Phase 2 — Product Management

- ✅ Products
- ✅ Product Variants
- ✅ Product Gallery
- Inventory
- Stock Management (basic stock + low-stock threshold is in; a dedicated Inventory entity is deferred)
- ✅ Pricing
- ✅ Product Status

---

## Phase 3 — Customer Store

- ✅ Home Page
- ✅ Product Listing
- ✅ Product Details
- ✅ Filters
- ✅ Wishlist
- ✅ Shopping Cart
- ✅ About / Contact / Account pages
- ✅ Site-wide Search (backed by a MongoDB text index)
- ✅ Sort, Loading Skeletons, Breadcrumbs
- ✅ Product Reviews & Ratings
- ✅ Fully Responsive (mobile / tablet / laptop / large screens)

---

## Phase 4 — Platform

- ✅ Authentication (backend + frontend)
- ✅ Authorization / RBAC (backend)
- ✅ Admin
- ✅ Login / Register UI
- ✅ Customer Accounts (registration, login, and a profile page to edit their name)
- Super Admin (deliberately deferred — no real use case yet with a single admin)

---

## Phase 5 — Commerce

- Checkout
- Address Management
- Payment Integration
- Orders
- Order Tracking

---

## Phase 6 — Platform Expansion

- Seller Portal
- Marketplace Support
- Reports
- Analytics
- Mobile API

---

## Phase 7 — Dashboard & Analytics

- Sales Dashboard
- Reports
- Charts
- Business Analytics

---

# ⚙️ Getting Started

## Clone the Repository

```bash
git clone https://github.com/nikhil-nikkx7890/nestro.git
```

---

## Install Dependencies

### Client

```bash
cd client
npm install
```

### Server

```bash
cd server
npm install
```

---

## Configure Environment Variables

### Server

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=a_long_random_secret_string
JWT_EXPIRES_IN=7d

# Optional — only read by `npm run seed:catalog`.
# Free key from unsplash.com/developers.
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

> `CLIENT_URL` accepts a comma-separated list and drives **both** CORS and the Origin-verification middleware. In production it must exactly match the deployed frontend's domain, or every write request will be rejected with a 403.

---

### Seed Scripts

Run in this order against a fresh database:

```bash
npm run seed              # Master Data (categories, brands, materials, colors, room types)
npm run seed:master-images  # photography for categories / room types / materials
npm run seed:admin        # an admin account
npm run seed:catalog      # products + variants with photography (needs UNSPLASH_ACCESS_KEY)
npm run seed:reviews      # demo customers + product reviews
```

---

### Client

Create a `.env.local` file inside the `client` directory.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Run the Application

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

Open:

```
http://localhost:3000
```

to view the application.

# 📚 Learning Journey

Nestro is my long-term learning project where I document my journey of becoming a Full Stack MERN Developer.

Every completed module helps me practice:

- Software Architecture
- Clean Code
- REST API Development
- React & Next.js
- Express.js
- MongoDB
- Production Folder Structure
- Git & GitHub Workflow
- Documentation
- Scalable Application Design

Rather than only focusing on building features, I aim to understand the reasoning behind every architectural and engineering decision.

---

# 📈 Current Progress

## Project Status

🟢 Backend Foundation

🟢 Admin Dashboard

🟢 Category Management

🟢 Room Type Management

🟢 Brand Management

🟢 Material Management

🟢 Colors

🟢 Master Data Foundation Complete

🟢 Image Upload

🟢 Search, Pagination, Sorting, Filtering

🟢 Error Handling Improvements

🟢 Hardening Pass (security & data integrity)

🟢 Product & Variant Management

🟢 Authentication & Authorization (Backend + Frontend)

🟢 Customer Store (Listing, Filters, Product Detail, Cart, Wishlist, Home/About/Contact/Account)

🟢 Automated Testing (141 Jest/Supertest tests)

🟢 Pre-Deployment Security Audit

🟢 **Deployed & Live** (Vercel + Render + Atlas)

🟢 Catalog at Scale (132 products, 386 variants, real photography)

🟢 Reviews & Ratings (+ admin moderation)

🟢 Search, Sort & Responsive Pass

⚪ Checkout & Payments

⚪ Orders

⚪ Dashboard & Analytics

---

# 🧠 Engineering Principles

This project follows a few core principles throughout development:

- Think before coding.
- Build one complete feature at a time.
- Prefer clean architecture over shortcuts.
- Keep components reusable but avoid premature abstraction.
- Test every feature before committing.
- Keep documentation synchronized with development.
- Follow meaningful Conventional Commits.
- Learn every concept before moving to the next one.
- Build the foundation before introducing complexity.
- Make architectural decisions intentionally and document them.
- Introduce reusable abstractions only after multiple proven implementations.

---

# 🤝 Contributing

This project is currently a personal learning and portfolio project.

Suggestions, feedback, and discussions are always welcome.

If you have ideas for improving the architecture or implementation, feel free to open an issue or start a discussion.

---

# 👨‍💻 Author

**Nikhil Choudhary**

- GitHub: https://github.com/nikhil-nikkx7890
- LinkedIn: https://www.linkedin.com/in/nikhil-choudhary-27b2b83b9/

---

## ⭐ If you find this project interesting, consider giving it a star.

It motivates me to continue improving Nestro and documenting my journey as I build a production-style furniture e-commerce application.
