# Chat System Implementation - Powered by Donation

## Project Overview

Implementing a chat system to allow donors to check service availability before donating. Users can choose between "Donate Now" (direct donation) or "Chat First" (chat first, then donate).

## Core Flow
1. User sees service listing with two buttons: "Donate Now" and "Chat First"
2. "Chat First" starts chat session with default message "Is this still available?"
3. Provider responds with "Yes, go for it!" or "Sorry, not available"
4. If available, user can proceed to donate
5. System notifies provider after donation

## Technical Approach
- **Database**: Supabase with new chat tables
- **Real-time**: Supabase Realtime subscriptions
- **UI**: Custom React components with Tailwind
- **Languages**: Multi-language support via next-intl (English + Turkish for MVP, remaining 15 languages post-implementation)
- **No Images**: Text-only messaging for MVP

## Database Schema

### chat_sessions
```sql
- id (uuid, primary key)
- service_id (uuid, foreign key to services)
- donor_user_id (uuid, foreign key to users)  
- provider_user_id (uuid, foreign key to users)
- status (enum: 'active', 'closed', 'awaiting_response')
- availability_response (enum: null, 'available', 'unavailable')
- donation_amount (decimal, nullable)
- created_at, updated_at
```

### chat_messages  
```sql
- id (uuid, primary key)
- chat_session_id (uuid, foreign key)
- sender_user_id (uuid, foreign key to users)
- message_text (text)
- message_type (enum: 'availability_check', 'availability_response', 'user_message')
- is_read (boolean, default false)
- created_at
```

### Indexes
```sql
-- Query active chats by provider
CREATE INDEX idx_chat_sessions_provider_status ON chat_sessions(provider_user_id, status);

-- Query donor's chat history  
CREATE INDEX idx_chat_sessions_donor ON chat_sessions(donor_user_id, created_at DESC);

-- Get messages for a chat session
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id, created_at);

-- Unread message counts
CREATE INDEX idx_chat_messages_unread ON chat_messages(sender_user_id, is_read) WHERE is_read = false;
```

## Implementation Tasks

### Phase 1: Database Foundation ✗
- [ ] Design final database schema with RLS policies
- [ ] Create Supabase migration files for chat tables
- [ ] Set up database indexes for performance
- [ ] Configure Supabase Realtime subscriptions

### Phase 2: Core Chat Infrastructure ✗
- [ ] Create chat context provider for state management
- [ ] Build basic chat UI components (ChatBubble, ChatInput, SessionList)
- [ ] Implement message sending functionality
- [ ] Add real-time message receiving with Supabase Realtime
- [ ] Add RLS policies for secure chat access

### Phase 3: Service Integration ✗
- [ ] Replace donation button with "Get Service" button on service pages
- [ ] Implement chat session creation from service pages
- [ ] Create availability check workflow with dual-language default messages
- [ ] Add language compatibility display when starting chat
- [ ] Connect chat approval to existing donation system
- [ ] Add session status management (active/closed/awaiting)

### Phase 3.5: Language Enhancement ✗
- [ ] Add "Chat languages" field to user profiles (optional multi-select)
- [ ] Update user profile UI to include chat language selection
- [ ] Create language compatibility filter for service search/browse
- [ ] Add provider chat languages display on service listings
- [ ] Implement intelligent default message selection based on common languages
- [ ] Add language matching logic for better service recommendations

### Phase 4: User Experience ✗
- [ ] Create provider dashboard for managing chat requests
- [ ] Add notification system for new messages (in-app)
- [ ] Implement chat history and session listing
- [ ] Add proper error handling and loading states
- [ ] Handle anonymous donor display (consistent with privacy rules)

### Phase 5: Multi-language Support ✗
- [ ] Add chat UI translation keys to next-intl files (Turkish only initially)
- [ ] Translate default messages for Turkish
- [ ] Add button labels, placeholders, status messages in Turkish
- [ ] Test language switching between English and Turkish
- [ ] Complete remaining 15 languages after chat system implementation

### Phase 6: Polish & Performance ✗
- [ ] Add mobile responsiveness for chat UI
- [ ] Implement rate limiting to prevent spam
- [ ] Add message validation and sanitization  
- [ ] Add typing indicators and read status
- [ ] Create session cleanup for old/inactive chats

### Phase 7: Advanced Features (Optional) ✗
- [ ] Email notifications for offline users
- [ ] Session archiving and cleanup cron jobs
- [ ] Message search functionality
- [ ] Bulk chat management for providers
- [ ] Analytics for chat conversion rates

### Phase 8: Testing & Launch ✗
- [ ] End-to-end testing of complete user journey
- [ ] Test real-time functionality across different browsers
- [ ] Load testing for concurrent chat sessions
- [ ] Security review of RLS policies and data access
- [ ] Performance testing and optimization

## Database Functions Needed
```sql
-- get_unread_message_count(user_id) -> integer
-- mark_messages_as_read(chat_session_id, user_id) -> void  
-- create_chat_session(service_id, donor_id, provider_id) -> uuid
-- get_user_chat_sessions(user_id) -> chat sessions with latest message
```

## Edge Functions Needed
```javascript
// send-notification - Email/push notifications for new messages
// cleanup-inactive-chats - Archive old sessions after 6 months
// moderate-messages - Content filtering if needed
```

## Cron Jobs Needed
```sql
-- Weekly cleanup of closed chats older than 6 months
-- Daily notification digest for unread messages  
-- Hourly cleanup of abandoned sessions (no messages for 24h)
```

## UI Layout Design

### Desktop/PC Layout (Two-Panel)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Powered by Donation - Chat                                    [Profile] [⚙] │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ Conversations        │ Website Design Service                               │
│                      │ with John D. • Online                               │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ 🟢 Website Design    │                                                      │
│    John D. • 2 new   │ You                           Today 2:30 PM          │
│    "Yes, go for..."  │ Is this still available?                             │
│    2 hours ago       │                                                      │
│                      │                            Today 2:45 PM   John D.  │
├──────────────────────┤                   Yes, go for it! Donate to start   │
│ 🔴 Logo Design       │                                           project    │
│    Sarah M.          │                                                      │
│    "Sorry, fully..." │ You                           Today 3:00 PM          │
│    1 day ago         │ Great! When can we start?                            │
│                      │                                                      │
├──────────────────────┤                            Today 3:15 PM   John D.  │
│ ⭕ Lawn Mowing        │                        I can begin this Monday if    │
│    Mike R.           │                                    you're ready      │
│    "Is this still..."│                                                      │
│    3 days ago        │                                                      │
│                      │                                                      │
├──────────────────────┼──────────────────────────────────────────────────────┤
│                      │ [Type message...]                  [Send] [💰 Donate] │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

### Mobile Layout (Full-Screen Views)
```
Chat Sessions List:                    Individual Chat:
┌─────────────────────────────┐       ┌─────────────────────────────┐
│ ← Your Conversations        │       │ ← Website Design Service    │
├─────────────────────────────┤       │   with John D.              │
│ 🟢 Website Design Service   │       ├─────────────────────────────┤
│    with John D. • 2 new     │       │                             │
│    "Yes, go for..."         │       │ You: Is this available?     │
│    2 hours ago              │       │      Today 2:30 PM          │
├─────────────────────────────┤       │                             │
│ 🔴 Logo Design              │       │           John: Yes, go     │
│    with Sarah M.            │       │           for it! Donate    │
│    "Sorry, fully..."        │       │           Today 2:45 PM     │
│    1 day ago                │       │                             │
├─────────────────────────────┤       │ You: When can we start?     │
│ ⭕ Lawn Mowing Service       │       │      Today 3:00 PM          │
│    with Mike R.             │       │                             │
│    "Is this still..."       │       ├─────────────────────────────┤
│    3 days ago               │       │ [Type...] [Send] [Donate]   │
└─────────────────────────────┘       └─────────────────────────────┘
```

### Status Indicators
- 🟢 Available/Active (green)
- 🔴 Unavailable (red) 
- ⭕ Awaiting Response (yellow)
- ✅ Completed/Donated (blue)

## URL Structure & Routing

### Using Existing Dynamic Routing
Chat system leverages existing `[locale]/[platform]/[entity_type]/[slug]` structure:

**File Structure (Existing):**
```
src/app/[locale]/[platform]/page.tsx
src/app/[locale]/[platform]/[entity_type]/page.tsx  
src/app/[locale]/[platform]/[entity_type]/[slug]/page.tsx
```

**Chat URLs:**
```
/[locale]/chat                     - Chat platform page (handled by [platform]/page.tsx)
/[locale]/chat/sessions            - Sessions list (handled by [platform]/[entity_type]/page.tsx)
/[locale]/chat/sessions/[slug]     - Individual session (handled by [platform]/[entity_type]/[slug]/page.tsx)
/[locale]/chat/messages            - Messages view (handled by [platform]/[entity_type]/page.tsx)
/[locale]/chat/messages/[slug]     - Individual message (handled by [platform]/[entity_type]/[slug]/page.tsx)
```

**Examples (English & Turkish for MVP):**
- English: `/en/chat/sessions`, `/en/chat/sessions/abc123`
- Turkish: `/tr/sohbet/oturumlar`, `/tr/sohbet/oturumlar/abc123`
- (Remaining 15 languages to be added after implementation)

**Implementation Logic:**
- Detect `params.platform === 'chat'` (or translated equivalent)
- Handle `params.entity_type === 'sessions'` or `'messages'`
- Use `params.slug` for individual session/message IDs

**API Endpoints (English only):**
```
/api/chat/sessions/[id]        - Session CRUD operations
/api/chat/messages/[id]        - Message CRUD operations
/api/chat/mark-read           - Mark messages as read
/api/chat/subscribe           - WebSocket/SSE connection setup
/api/chat/typing              - Typing indicators
/api/chat/presence            - Online/offline status
```

**Service Integration:**
```
/[locale]/[platform]/[entity_type]/[slug]?openChat=[sessionId] - Start/continue chat from service page
```

## Key Decisions Made
- ✅ Single button approach: "Get Service" (replaced dual button design)
- ✅ Chat sessions represent individual service bookings (not reused)
- ✅ No auto-translation of user messages (UI only translated)
- ✅ Text-only messaging (no images for MVP)
- ✅ Supabase Realtime + custom UI (not third-party chat service)
- ✅ Anonymous donor handling consistent with platform privacy
- ✅ Two-panel desktop layout, full-screen mobile views
- ✅ Use existing dynamic routing structure (no new files needed)
- ✅ Pre-filled "Is this still available?" message in [Donor Language] / [Provider Language], allowing user to click and send, or type their own message
- ✅ Language compatibility system with optional "chat languages" in user profiles
- ✅ Language filtering for service search and recommendations

## Implementation Notes
- Each chat session is separate (even same donor-provider-service combinations)
- Messages stay as typed (like WhatsApp), only UI elements translated
- Built on existing authentication and database infrastructure
- Maintains platform's privacy-first approach with anonymous donors

---

**Status**: Planning Complete - UI Improvements Applied  
**Recent Updates**: Added eye-catching result counters to organization browse pages with platform-specific theming
**Next Session**: Start with Phase 1 - Database Foundation