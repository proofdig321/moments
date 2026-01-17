# Dynamic Authority Layer - System Mapping & Implementation Plan
**Date**: January 17, 2026  
**Status**: SYSTEM MAPPING COMPLETE  
**Mission**: Map authority layer to existing production systems

---

## 🗺️ EXISTING SYSTEM MAPPING

### Current Architecture (PRODUCTION)
```
WhatsApp Messages → Supabase Edge Function (webhook) → Database
                                ↓
Admin Dashboard (Express.js) ← Supabase Database → Public PWA
                                ↓
Broadcast System (Express.js) → WhatsApp API
```

### Key Tables (EXISTING)
- `messages` - WhatsApp inbound messages
- `moments` - Content for broadcast  
- `subscriptions` - WhatsApp users
- `broadcasts` - Outbound message tracking
- `advisories` - MCP analysis results
- `admin_users` - Admin authentication
- `admin_roles` - Admin permissions

### Key Files (EXISTING)
- `supabase/functions/webhook/index.ts` - WhatsApp message processing
- `src/admin.js` - Admin API endpoints
- `src/broadcast.js` - WhatsApp broadcasting
- `public/admin-dashboard.html` - Admin UI

---

## 🎯 AUTHORITY INTEGRATION POINTS

### 1. Database Layer (NEW TABLES)
**Authority Tables**: Add to existing schema
- `authority_profiles` - User authority metadata
- `authority_audit_log` - Authority change tracking

**Integration**: Extend existing tables with authority context
- `messages.authority_context` (JSONB) - Store authority data
- No changes to existing columns

### 2. Webhook Processing (EXISTING FILE)
**File**: `supabase/functions/webhook/index.ts`
**Integration**: Add authority lookup before message storage
- Lookup authority for `message.from` phone number
- Store authority context in `messages.authority_context`
- Fail-open pattern: Continue if authority lookup fails

### 3. Admin Dashboard (EXISTING FILE)  
**File**: `src/admin.js`
**Integration**: Add authority management endpoints
- `GET /admin/authority` - List authority profiles
- `POST /admin/authority` - Create authority profile
- `PUT /admin/authority/:id` - Update authority profile

### 4. Admin UI (EXISTING FILE)
**File**: `public/admin-dashboard.html`
**Integration**: Add authority management tab
- Feature-flagged authority section
- Authority assignment interface
- Authority audit log viewer

### 5. Broadcast System (EXISTING FILE)
**File**: `src/broadcast.js`  
**Integration**: Add authority-based filtering
- Check creator authority before broadcast
- Apply blast radius limits
- Enforce scope constraints

---

## 📋 MINIMAL IMPLEMENTATION PLAN

### Phase 1: Database Foundation (1 day)
- [x] Create authority tables migration
- [ ] Apply migration to Supabase
- [ ] Test authority lookup function
- [ ] Verify zero impact on existing system

### Phase 2: Webhook Integration (1 day)
- [ ] Add authority lookup to webhook function
- [ ] Store authority context in messages table
- [ ] Test with production webhook traffic
- [ ] Verify fail-open behavior

### Phase 3: Admin API (1 day)
- [ ] Add authority endpoints to admin.js
- [ ] Test authority CRUD operations
- [ ] Verify admin permissions
- [ ] Test audit logging

### Phase 4: Admin UI (1 day)
- [ ] Add authority tab to admin dashboard
- [ ] Create authority management interface
- [ ] Test authority assignment workflow
- [ ] Verify feature flag control

### Phase 5: Broadcast Integration (1 day)
- [ ] Add authority checks to broadcast.js
- [ ] Implement blast radius limits
- [ ] Test scope enforcement
- [ ] Verify backward compatibility

---

## 🔧 INTEGRATION STRATEGY

### Principle: ADDITIVE ONLY
- New tables, new columns, new functions
- Never modify existing table structure
- Never change existing API contracts
- Always fail-open on authority errors

### Data Flow Integration
```
BEFORE: Message → Store → MCP → Admin Review → Broadcast
AFTER:  Message → Authority Lookup → Store (with context) → MCP → Admin Review → Authority-filtered Broadcast
```

### Authority Context Storage
```json
// messages.authority_context (JSONB)
{
  "has_authority": true,
  "level": 3,
  "role": "School Principal", 
  "scope": "school",
  "scope_identifier": "school_001",
  "approval_mode": "auto",
  "blast_radius": 500,
  "lookup_timestamp": "2026-01-17T10:00:00Z"
}
```

---

## 🚀 IMPLEMENTATION STEPS

### Step 1: Apply Database Migration
```bash
# Apply authority tables to Supabase
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260117_add_authority_layer.sql
```

### Step 2: Update Webhook Function
**File**: `supabase/functions/webhook/index.ts`
**Change**: Add authority lookup before message insert
```typescript
// Add authority lookup function
// Modify message insert to include authority_context
```

### Step 3: Extend Admin API
**File**: `src/admin.js`
**Change**: Add authority management routes
```javascript
// Add authority CRUD endpoints
// Integrate with existing admin auth
```

### Step 4: Update Admin UI
**File**: `public/admin-dashboard.html`
**Change**: Add authority management section
```html
<!-- Add authority tab with feature flag -->
<!-- Authority assignment interface -->
```

### Step 5: Enhance Broadcast System
**File**: `src/broadcast.js`
**Change**: Add authority-based filtering
```javascript
// Check authority before broadcast
// Apply scope and radius limits
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Authority lookup function performance
- Authority context serialization
- Admin API endpoint functionality
- Broadcast filtering logic

### Integration Tests  
- Webhook processing with authority
- Admin authority assignment workflow
- End-to-end broadcast with authority limits
- Fail-open behavior verification

### Production Tests
- Shadow mode authority logging
- Performance impact measurement
- Error rate monitoring
- Rollback procedure validation

---

## 📊 SUCCESS METRICS

### Phase 1 Success
- Authority tables created successfully
- Authority lookup function < 50ms
- Zero impact on existing message processing

### Phase 2 Success
- Authority context stored in 100% of messages
- Webhook processing time increase < 10%
- Zero webhook processing failures

### Phase 3 Success
- Admin can create/edit authority profiles
- All authority changes logged in audit trail
- Admin permissions properly enforced

### Phase 4 Success
- Authority management UI functional
- Feature flag controls visibility
- Authority assignment workflow complete

### Phase 5 Success
- Broadcast respects authority limits
- Scope enforcement working correctly
- Backward compatibility maintained

---

## 🚨 ROLLBACK PLAN

### Immediate Rollback
1. **Database**: Authority tables can remain (no impact)
2. **Webhook**: Remove authority lookup (revert function)
3. **Admin**: Disable authority endpoints (feature flag)
4. **UI**: Hide authority tab (feature flag)
5. **Broadcast**: Ignore authority context (default behavior)

### Rollback Triggers
- Authority lookup latency > 100ms
- Webhook processing failures > 1%
- Admin dashboard errors
- Broadcast delivery failures
- Any production impact

---

## 📝 NEXT ACTIONS

### Immediate (Today)
1. Apply database migration to Supabase
2. Test authority lookup function performance
3. Verify zero impact on existing system

### Tomorrow
1. Update webhook function with authority lookup
2. Deploy and monitor webhook performance
3. Test authority context storage

### This Week
1. Complete admin API integration
2. Build authority management UI
3. Test end-to-end authority workflow
4. Deploy broadcast authority filtering

---

**Status**: Ready to proceed with Phase 1  
**Risk Level**: LOW (additive changes only)  
**Estimated Completion**: 5 days  
**Rollback Time**: < 30 minutes