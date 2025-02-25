# Profile Page Enhancement Plan

## Overview
Enhance the profile page to showcase user's wishlist, ratings, and activity in an organized and visually appealing way.

## Components Structure

### 1. Profile Header Section
- User avatar
- Display name
- Account creation date
- Email (if user is viewing their own profile)
- Edit profile button (for own profile)

### 2. Wishlist Section
- Grid display of wanted kits
- For each kit:
  - Kit image
  - Kit name (EN/JP)
  - Grade and scale
  - Quick remove button (for own profile)
- Empty state message if no kits in wishlist

### 3. Activity Section
- Recent Ratings subsection
  - Kit name and grade
  - Rating value (stars)
  - Date given
- Recent Comments subsection
  - Kit name
  - Comment preview
  - Date posted
  - Link to full comment

## Required Database Queries

### New Queries to Implement
1. Get user's wanted list with kit details:
```sql
SELECT 
  w.*,
  k.name_en,
  k.name_jp,
  k.grade,
  k.scale,
  ki.image_url
FROM wanted_list w
JOIN kits k ON w.kit_id = k.id
LEFT JOIN kit_images ki ON k.id = ki.kit_id
WHERE w.user_id = :userId
ORDER BY w.created_at DESC;
```

2. Get user's rating history:
```sql
SELECT 
  r.*,
  k.name_en,
  k.grade
FROM ratings r
JOIN kits k ON r.kit_id = k.id
WHERE r.user_id = :userId
ORDER BY r.created_at DESC
LIMIT 10;
```

3. Get user's recent comments:
```sql
SELECT 
  c.*,
  k.name_en,
  k.grade
FROM comments c
JOIN kits k ON c.kit_id = k.id
WHERE c.user_id = :userId
ORDER BY c.created_at DESC
LIMIT 10;
```

## Implementation Steps

1. Backend Tasks
   - Create new TypeScript types for the enhanced queries
   - Add new utility functions in kit-interactions.ts
   - Update profile page server component to fetch all required data

2. Frontend Tasks
   - Create new UI components for each section
   - Implement responsive grid layout for wishlist
   - Add loading states and error handling
   - Style with Tailwind CSS matching existing design
   - Add animations for interactions (optional)

## Notes
- All queries should be server-side rendered for optimal performance
- Implement proper error boundaries for each section
- Consider pagination for wishlist if user has many items
- Add proper loading states using React Suspense
- Ensure all components are responsive on mobile devices