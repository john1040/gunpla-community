# Gunpla Community Platform - Architecture Plan

## Overview
A web application similar to MyAnimeList but specialized for Gunpla (Gundam plastic models), allowing hobbyists to:
- Browse and search Gunpla kits
- View community ratings and reviews
- Share their builds
- Track their collection
- Interact with other builders

## Tech Stack
- Frontend: Next.js
- Backend/Database: Supabase
  - Authentication
  - Database
  - Storage (for build photos)
  - Real-time features

## Core Features

### 1. Gunpla Kit Database
- Comprehensive database of Gunpla kits including:
  - Kit name (English/Japanese)
  - Grade (HG, RG, MG, PG, etc.)
  - Scale (1/144, 1/100, etc.)
  - Series
  - Release date
  - Manufacturer
  - Price
  - Images
  - Technical details
  
Data Collection Strategy:
1. Primary sources to consider:
   - Gundam Wiki
   - Bandai's official website
   - Existing Chinese website (need more details)
   - Gunpla community websites
2. Build a web scraper to gather initial data
3. Manual verification and cleaning of data
4. Set up admin tools for database maintenance

### 2. User Features
- Authentication system
- User profiles
- Build showcases
  - Multiple photos
  - Build description
  - Techniques used
  - Modifications/customizations
  - Paint details
- Collection management
  - Wishlist
  - Currently building
  - Completed builds
  - Planning to build
- Rating system
  - Overall rating
  - Specific aspects (build quality, design, articulation, etc.)
- Social features
  - Follow other builders
  - Comment on builds
  - Like/save builds

### 3. Community Features
- Kit reviews and ratings
- Build guides and tutorials
- Community discussions
- News section for new releases
- Events and contests

## Database Schema (Supabase)

### Tables

1. kits
```sql
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR NOT NULL,
  name_jp VARCHAR,
  grade VARCHAR NOT NULL,
  scale VARCHAR NOT NULL,
  series VARCHAR NOT NULL,
  release_date DATE,
  manufacturer VARCHAR NOT NULL,
  price DECIMAL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

2. kit_images
```sql
CREATE TABLE kit_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID REFERENCES kits(id),
  image_url VARCHAR NOT NULL,
  image_type VARCHAR NOT NULL, -- box_art, product_photo, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

3. users
```sql
-- Managed by Supabase Auth, extended with:
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR,
  bio TEXT,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

4. builds
```sql
CREATE TABLE builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  kit_id UUID REFERENCES kits(id),
  title VARCHAR NOT NULL,
  description TEXT,
  techniques_used TEXT[],
  paint_details TEXT,
  status VARCHAR NOT NULL, -- in_progress, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

5. build_images
```sql
CREATE TABLE build_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  build_id UUID REFERENCES builds(id),
  image_url VARCHAR NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

6. ratings
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  kit_id UUID REFERENCES kits(id),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),
  build_quality INTEGER CHECK (build_quality BETWEEN 1 AND 10),
  design INTEGER CHECK (design BETWEEN 1 AND 10),
  articulation INTEGER CHECK (articulation BETWEEN 1 AND 10),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, kit_id)
);
```

## Project Structure

```
gunpla-community/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── kits/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── builds/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── [username]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── kits/
│   │   ├── builds/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── types/
│   │   └── utils/
│   └── styles/
├── public/
├── scripts/
│   └── data-collection/
└── tests/
```

## Development Phases

### Phase 1: Foundation
1. Set up Next.js project with TypeScript
2. Configure Supabase and create database schema
3. Implement authentication system
4. Create basic UI components and layouts
5. Develop data collection scripts

### Phase 2: Core Features
1. Implement kit browsing and searching
2. Build user profiles and authentication flows
3. Create build showcase functionality
4. Implement rating and review system
5. Add collection management features

### Phase 3: Community Features
1. Add social features (following, comments)
2. Implement build guides and tutorials
3. Create news section
4. Add community discussions
5. Develop moderation tools

### Phase 4: Enhancement
1. Implement advanced search and filters
2. Add analytics and recommendations
3. Optimize performance
4. Add mobile responsiveness
5. Implement PWA features

## Questions for Clarification
1. Can you provide the URL of the Chinese website you mentioned? This would help us understand the data structure and features we might want to incorporate or improve upon.
2. Do you have any specific features you'd like to prioritize in the development phases?
3. Are there any specific design preferences or UI/UX considerations you'd like to incorporate?
4. Would you like to integrate with any external APIs (e.g., for pricing information)?
5. Do you have any specific requirements for the mobile experience?