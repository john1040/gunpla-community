# Gunpla Community Platform - MVP Plan

## MVP Scope
Creating a focused MVP to validate core features and gather user feedback before expanding.

### Core Features for MVP

1. Authentication
- Google OAuth integration via Supabase Auth
- User profile creation upon signup

2. Gunpla Kit Database
- Core kit information:
  - Name (English/Japanese)
  - Grade
  - Scale
  - Release date
  - Images
  - Basic description
- Data scraping strategy:
  - Target initial scraping from acg.78dm.net
  - Focus on RG kits first as proof of concept
  - Expand to other grades after validation

3. Community Features
- Rating system
- Comments with replies
- Like system for comments
- Wanted list functionality

### Database Schema (MVP)

1. kits
```sql
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR NOT NULL,
  name_jp VARCHAR,
  grade VARCHAR NOT NULL,
  scale VARCHAR NOT NULL,
  release_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

2. kit_images
```sql
CREATE TABLE kit_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID REFERENCES kits(id),
  image_url VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

3. users (managed by Supabase Auth)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

4. ratings
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  kit_id UUID REFERENCES kits(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, kit_id)
);
```

5. comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  kit_id UUID REFERENCES kits(id),
  parent_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

6. comment_likes
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  comment_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, comment_id)
);
```

7. wanted_list
```sql
CREATE TABLE wanted_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  kit_id UUID REFERENCES kits(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, kit_id)
);
```

## Project Structure (MVP)

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
│   │   └── profile/
│   │       └── [username]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # layout components
│   │   └── shared/       # shared components
│   ├── lib/
│   │   ├── supabase/     # supabase client
│   │   └── utils/        # utility functions
│   └── styles/           # global styles
├── scripts/
│   └── data-scraping/    # data collection scripts
└── tests/
```

## Tech Stack (MVP)
- Next.js (App Router)
- Supabase
- TailwindCSS
- shadcn/ui
- TypeScript

## Implementation Plan

### Phase 1: Setup (1-2 weeks)
1. Initialize Next.js project with TypeScript
2. Set up Supabase project
3. Configure TailwindCSS and shadcn/ui
4. Implement Google OAuth
5. Create database schema

### Phase 2: Data Collection (1-2 weeks)
1. Build scraper for acg.78dm.net
2. Start with RG kits as proof of concept
3. Store data in Supabase
4. Create admin interface for data verification

### Phase 3: Core Features (2-3 weeks)
1. Implement kit listing and details pages
2. Create rating system
3. Build comment system with replies
4. Add like functionality for comments
5. Create wanted list feature

### Phase 4: Polish (1-2 weeks)
1. Responsive design implementation
2. Performance optimization
3. Error handling
4. Testing
5. Deployment

Total Estimated Time: 5-9 weeks

## Technical Considerations

1. Mobile Responsiveness
- Implement mobile-first design using TailwindCSS
- Ensure touch-friendly UI elements
- Optimize images for mobile devices

2. Performance
- Implement image optimization
- Use Next.js Image component
- Implement infinite scrolling for lists
- Cache frequently accessed data

3. SEO
- Implement metadata
- Use semantic HTML
- Ensure proper URL structure

4. Security
- Implement rate limiting
- Add input validation
- Use Supabase RLS policies

## Next Steps

1. Review and approve MVP plan
2. Set up development environment
3. Create repository and project structure
4. Begin with Phase 1 implementation
5. Plan for regular progress reviews