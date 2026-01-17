# Dynamic Authority Layer Research & Design
**Date**: January 17, 2026  
**Status**: Research & Discussion Phase  
**Implementation**: NOT STARTED

---

## 🎯 Executive Summary

This document explores the implementation of a **Dynamic Authority Layer** for the Unami Foundation Moments Platform — a governance system that enables admin-controlled trust, routing, and amplification decisions without breaking existing production workflows.

**Core Principle**: Authority must feel like it always existed, even though it's being added later.

---

## 🧠 WHY: The Problem Space

### Current State Analysis

The Moments platform currently operates with:
- **Binary trust model**: Users are either subscribers or not
- **Flat permission structure**: No gradation of authority or influence
- **Manual moderation**: MCP flags content, but routing is uniform
- **No blast radius control**: All approved content reaches all subscribers in a region
- **Limited sponsor accountability**: No authority tracking for sponsored content sources

### The Gap

Without a dynamic authority layer, the platform cannot:
1. **Differentiate trusted sources** (schools, verified NGOs) from unknown users
2. **Apply graduated moderation** (auto-approve trusted, AI-review new, admin-review flagged)
3. **Control amplification scope** (community-level vs province-wide)
4. **Audit influence patterns** (who creates high-reach content?)
5. **Enforce time-bound authority** (temporary event coordinators)
6. **Respond to abuse dynamically** (suspend authority without deleting accounts)

### Why Dynamic?

Static roles (admin/moderator/user) are insufficient because:
- **Context matters**: A school principal has authority in education, not health policy
- **Trust evolves**: New community leaders emerge; bad actors must be downgraded
- **Scope varies**: Regional coordinators shouldn't have national reach
- **Approval workflows differ**: Trusted sources need speed; unknown sources need scrutiny

---

## 📊 WHAT: Existing Architecture Analysis

### Current Systems (DO NOT BREAK)

#### 1. **WhatsApp Business API**
- **Inbound**: Webhook receives messages → n8n → Firebase/Supabase
- **Outbound**: Broadcast system sends Moments to subscribers
- **Risk**: Any change that blocks message flow breaks core functionality

#### 2. **n8n Workflows**
- Message ingestion and routing
- MCP advisory enrichment
- Broadcast scheduling
- **Risk**: Hard dependencies on data structure

#### 3. **Firebase Stack**
- Auth: User identity
- Firestore: Message storage, user profiles
- Edge Functions: Real-time processing
- **Risk**: Schema changes cascade

#### 4. **Supabase MCP**
- Native content intelligence
- Advisory generation
- Moderation flags
- **Risk**: Authority logic must not block MCP execution

#### 5. **Admin PWA Dashboard**
- Moments creation/editing
- Sponsor management
- Moderation queue
- **Risk**: UI changes must be feature-flagged

#### 6. **Subscriber PWA**
- Public-facing Moments feed
- Regional filtering
- **Risk**: User-facing changes require careful rollout

### Current Data Flow

```
User Message (WhatsApp)
  ↓
n8n Ingestion
  ↓
Firebase Storage + MCP Advisory
  ↓
Admin Moderation (if flagged)
  ↓
Moment Creation
  ↓
Broadcast Scheduling
  ↓
WhatsApp Delivery
```

**Critical Observation**: Authority layer must integrate as **enrichment**, not **gatekeeper**.

---

## 🏗️ HOW: Implementation Strategy (Research Phase)

### Design Principles

1. **Additive Only**: New tables, new fields, new logic paths — never modify existing
2. **Default to Current Behavior**: If authority data missing → system works as today
3. **Progressive Enhancement**: Enable per-feature, per-workflow, per-user
4. **Admin Override Always**: Authority is advisory, admin decision is final
5. **Fail Open**: Errors in authority lookup never block message flow

### Proposed Data Model (Conceptual)

#### New Table: `authority_profiles`

**Purpose**: Store dynamic, admin-assigned authority metadata per user

**Fields** (minimum viable):
- `id` (UUID, primary key)
- `user_id` (foreign key → existing user table)
- `authority_level` (enum: L1-L5 or numeric 1-5)
- `role_label` (string: "School Principal", "Community Leader", "Event Coordinator")
- `scope` (enum: school | community | region | province | national)
- `scope_identifier` (string: specific school ID, region code, etc.)
- `approval_mode` (enum: auto | ai_review | admin_review | hybrid)
- `blast_radius` (integer: max subscribers reachable)
- `risk_threshold` (float: MCP confidence score threshold for auto-approval)
- `status` (enum: active | suspended | expired)
- `valid_from` (timestamp)
- `valid_until` (timestamp, nullable)
- `created_by` (admin user ID)
- `updated_by` (admin user ID)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `metadata` (JSONB: flexible extension field)

**Indexes**:
- `user_id` (fast lookup)
- `status` + `valid_until` (active authority queries)
- `scope` + `scope_identifier` (regional queries)

#### New Table: `authority_audit_log`

**Purpose**: Track all authority assignments, changes, and enforcement actions

**Fields**:
- `id` (UUID)
- `authority_profile_id` (foreign key)
- `action` (enum: created | updated | suspended | expired | enforced)
- `actor_id` (admin who made change)
- `context` (JSONB: what triggered this action)
- `timestamp` (timestamp)

### Integration Points (Research)

#### 1. **WhatsApp Ingestion** (n8n → Firebase)

**Current Flow**:
```
Message arrives → Store in Firestore → Trigger MCP → Store advisory
```

**Proposed Enhancement**:
```
Message arrives → Store in Firestore → Lookup authority profile (async) → Enrich message metadata → Trigger MCP → Store advisory + authority context
```

**Key Decision**: Authority lookup happens **after** storage, **before** routing.

**Failure Mode**: If authority lookup fails → continue with `authority_level: null`

#### 2. **MCP Advisory Generation**

**Current Flow**:
```
Message content → MCP analysis → Advisory (harm score, spam score, escalation flag)
```

**Proposed Enhancement**:
```
Message content + authority context → MCP analysis → Advisory (harm score, spam score, escalation flag, authority-adjusted routing)
```

**Key Decision**: MCP receives authority as **context**, not **instruction**. MCP still flags harmful content from trusted sources.

#### 3. **Admin Moderation Queue**

**Current Flow**:
```
Flagged messages → Admin reviews → Approve/Reject
```

**Proposed Enhancement**:
```
Flagged messages + authority profile → Admin reviews with context → Approve/Reject + Authority adjustment option
```

**Key Decision**: Admin can approve content AND downgrade authority in same action.

#### 4. **Broadcast Routing**

**Current Flow**:
```
Approved Moment → All subscribers in target region
```

**Proposed Enhancement**:
```
Approved Moment + Creator authority → Subscribers within blast radius + scope constraints
```

**Key Decision**: Authority limits **who can reach whom**, not **who can create content**.

#### 5. **Admin Dashboard**

**Current UI**:
- Dashboard (analytics)
- Moments (create/edit)
- Sponsors (manage)
- Moderation (review flags)

**Proposed Addition**:
- **Authority** tab (feature-flagged)
  - List users with authority
  - Assign/edit authority profiles
  - View audit log
  - Suspend/restore authority

**Key Decision**: Feature flag `ENABLE_AUTHORITY_MANAGEMENT` controls visibility.

---

## 🚦 Phased Rollout Strategy

### Phase 1: Shadow Mode (Weeks 1-2)
**Goal**: Collect data without affecting production

- Create `authority_profiles` table (empty)
- Create `authority_audit_log` table (empty)
- Add authority lookup logic (read-only, logs only)
- No routing changes
- No UI changes

**Success Criteria**:
- Authority lookup latency < 50ms
- Zero impact on message throughput
- Logs show successful lookups for test users

### Phase 2: Admin-Only Activation (Weeks 3-4)
**Goal**: Enable authority assignment, observe moderation impact

- Add "Authority" tab to admin dashboard (feature-flagged)
- Allow admins to assign authority profiles
- Authority context visible in moderation queue
- Authority affects **moderation routing only** (auto-approve vs review)
- No user-facing changes

**Success Criteria**:
- Admins can assign/edit authority profiles
- Trusted sources auto-approved (if MCP score safe)
- Unknown sources still go to review queue
- No false negatives (harmful content from trusted sources still flagged)

### Phase 3: Scoped Enforcement (Weeks 5-6)
**Goal**: Enable blast radius and scope controls

- Authority limits broadcast reach
- Scope constraints enforced (school-level authority can't broadcast province-wide)
- Audit log tracks all enforcement actions
- Environment flag `ENFORCE_AUTHORITY_SCOPE` controls activation

**Success Criteria**:
- School coordinators reach only their school subscribers
- Regional coordinators reach only their region
- National-level authority reaches all (admin-assigned only)
- No accidental over-reach

### Phase 4: Full Production (Weeks 7-8)
**Goal**: Complete authority system with user-visible features

- Authority badges visible in subscriber PWA
- Time-bound authority (expiration enforcement)
- Dynamic suspension/restoration
- Full audit trail accessible to admins
- Performance monitoring and optimization

**Success Criteria**:
- Users see verified badges for trusted sources
- Expired authority automatically revoked
- Suspended users cannot broadcast until restored
- System handles 10,000+ authority profiles efficiently
- Zero downtime during authority updates

---

## 🔍 Technical Implementation Details

### Database Queries (Optimized)

#### Authority Lookup (Primary)
```sql
SELECT 
  authority_level,
  role_label,
  scope,
  scope_identifier,
  approval_mode,
  blast_radius,
  risk_threshold,
  status
FROM authority_profiles 
WHERE user_id = $1 
  AND status = 'active'
  AND (valid_until IS NULL OR valid_until > NOW())
LIMIT 1;
```

#### Broadcast Eligibility Check
```sql
SELECT COUNT(*) as eligible_subscribers
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'active'
  AND u.region = $1  -- target region
  AND (
    $2 >= blast_radius_required OR  -- authority blast radius
    u.community_id = $3  -- scope-specific targeting
  );
```

### API Endpoints (New)

#### Admin Authority Management
```
GET    /admin/authority/profiles     # List all authority profiles
POST   /admin/authority/profiles     # Create new authority profile
PUT    /admin/authority/profiles/:id # Update authority profile
DELETE /admin/authority/profiles/:id # Suspend authority (soft delete)
GET    /admin/authority/audit        # View audit log
POST   /admin/authority/bulk-assign  # Bulk authority assignment
```

#### Internal Authority API
```
GET /internal/authority/lookup/:user_id  # Fast authority lookup
POST /internal/authority/enforce         # Log enforcement action
```

### Performance Considerations

#### Caching Strategy
- **Redis cache**: Authority profiles (5-minute TTL)
- **In-memory cache**: Active authority list (1-minute TTL)
- **CDN cache**: Authority badges for PWA (24-hour TTL)

#### Monitoring Metrics
- Authority lookup latency (target: <50ms p95)
- Cache hit rate (target: >90%)
- Authority enforcement accuracy
- False positive/negative rates

---

## 🎯 Success Metrics & KPIs

### Operational Metrics
- **Authority Assignment Rate**: Profiles created per week
- **Enforcement Actions**: Suspensions, scope violations caught
- **Auto-Approval Rate**: Trusted source content bypassing review
- **Moderation Efficiency**: Time saved on trusted source review

### Quality Metrics
- **False Positive Rate**: Harmful content auto-approved from trusted sources (<0.1%)
- **False Negative Rate**: Safe content from trusted sources sent to review (<5%)
- **Authority Accuracy**: Correct scope enforcement (>99%)
- **User Satisfaction**: Trusted source feedback on approval speed

### Business Impact
- **Content Velocity**: Time from creation to broadcast (target: 50% reduction for trusted sources)
- **Moderation Load**: Admin review queue size (target: 30% reduction)
- **Trust Indicators**: User engagement with verified content
- **Sponsor Confidence**: Verified sponsor content performance

---

## ⚠️ Risk Assessment & Mitigation

### Technical Risks

#### Risk: Authority Lookup Latency
**Impact**: Slow message processing
**Mitigation**: 
- Aggressive caching strategy
- Async lookup with fallback
- Circuit breaker pattern

#### Risk: Database Schema Changes
**Impact**: Breaking existing workflows
**Mitigation**:
- Additive-only changes
- Feature flags for all new logic
- Comprehensive rollback procedures

#### Risk: Authority Data Corruption
**Impact**: Wrong users getting elevated privileges
**Mitigation**:
- Immutable audit log
- Admin approval for all authority changes
- Regular authority profile validation

### Business Risks

#### Risk: Authority Abuse
**Impact**: Trusted sources spreading harmful content
**Mitigation**:
- MCP still flags all content regardless of source
- Admin override always available
- Rapid authority suspension capability

#### Risk: Over-Centralization
**Impact**: Too much power concentrated in few users
**Mitigation**:
- Scope limitations enforced
- Time-bound authority assignments
- Regular authority review cycles

#### Risk: Community Backlash
**Impact**: Users perceive system as unfair
**Mitigation**:
- Transparent authority criteria
- Clear appeals process
- Community feedback integration

---

## 🔄 Migration Strategy

### Existing Data Handling
- **No data migration required**: All existing users default to no authority
- **Backward compatibility**: All existing workflows continue unchanged
- **Gradual enhancement**: Authority added to high-value users first

### Rollback Plan
- **Feature flags**: Instant disable of authority enforcement
- **Database rollback**: Authority tables can be dropped without impact
- **Code rollback**: Authority logic isolated in separate modules

---

## 📋 Next Steps & Decision Points

### Immediate Actions (Week 1)
1. **Stakeholder Review**: Present research to Unami Foundation leadership
2. **Technical Validation**: Confirm database schema with engineering team
3. **Resource Planning**: Estimate development effort and timeline
4. **Risk Assessment**: Security review of authority model

### Key Decisions Required
1. **Authority Levels**: How many levels? (Recommend: 5 levels)
2. **Scope Granularity**: School/Community/Region/Province/National sufficient?
3. **Approval Workflows**: Auto-approve threshold for each authority level?
4. **UI Priority**: Admin dashboard vs subscriber PWA features first?
5. **Performance Targets**: Acceptable latency for authority lookups?

### Success Criteria for Go/No-Go
- [ ] Zero impact on existing message throughput
- [ ] Authority lookup latency <100ms p95
- [ ] Admin dashboard authority management functional
- [ ] MCP integration maintains current accuracy
- [ ] Rollback plan tested and validated

---

## 📚 Appendix

### Related Documentation
- [Moments Platform Architecture](/docs/architecture.md)
- [MCP Integration Guide](/docs/mcp-integration.md)
- [Admin Dashboard Specifications](/docs/admin-dashboard.md)
- [WhatsApp Business API Documentation](/docs/whatsapp-integration.md)

### Research References
- Trust & Safety best practices (Meta, Twitter, Discord)
- Community moderation systems (Reddit, Stack Overflow)
- Authority delegation patterns (AWS IAM, Google Cloud IAM)
- South African digital governance frameworks

---

**Document Status**: Research Complete - Awaiting Stakeholder Review  
**Next Review**: January 24, 2026  
**Owner**: Technical Architecture Team  
**Stakeholders**: Unami Foundation Leadership, Engineering Team, Community ManagersGovernance (Weeks 7-8)
**Goal**: Authority governs amplification, reporting, and accountability

- Sponsor content requires authority profile
- Authority-based analytics (who creates high-reach content?)
- Time-bound authority (event coordinators expire after event)
- Suspension workflow (bad actors lose authority, keep account)

**Success Criteria**:
- All sponsored content has authority profile
- Admins can generate "influence reports"
- Expired authority auto-downgrades
- Suspended users can't broadcast, can still receive

---

## 🛡️ Safety & Rollback Strategy

### Failure Modes & Mitigations

| Failure Scenario | Impact | Mitigation |
|-----------------|--------|------------|
| Authority lookup timeout | Message processing delayed | 100ms timeout → fallback to null authority |
| Malformed authority data | Routing logic breaks | Schema validation + safe defaults |
| Admin misconfiguration | Wrong users get authority | Audit log + undo function |
| Authority table unavailable | System-wide failure | Graceful degradation: treat all as null authority |
| Over-restriction | Legitimate content blocked | Admin override always available |

### Rollback Plan

**Per-Phase Rollback**:
- Phase 1: Drop tables (no production impact)
- Phase 2: Disable feature flag (authority tab disappears)
- Phase 3: Set `ENFORCE_AUTHORITY_SCOPE=false` (routing reverts)
- Phase 4: Disable authority checks in broadcast logic

**Emergency Rollback**:
```sql
-- Disable all authority enforcement
UPDATE authority_profiles SET status = 'suspended';
```

**Data Preservation**:
- Never delete authority profiles (audit trail)
- Suspension is reversible
- Audit log is append-only

---

## 🔍 Open Questions for Discussion

### 1. Authority Level Granularity
- **Option A**: 5 levels (L1-L5) with predefined meanings
- **Option B**: Numeric score (1-100) for fine-grained control
- **Option C**: Role-based labels only (no numeric hierarchy)

**Recommendation**: Start with 5 levels (simple, interpretable), expand if needed.

### 2. Scope Hierarchy
- **Question**: Can a regional coordinator also have school-level authority?
- **Options**:
  - Single scope per profile (simple, clear)
  - Multiple scopes per profile (flexible, complex)
  - Hierarchical scopes (regional includes all schools in region)

**Recommendation**: Single scope per profile, allow multiple profiles per user if needed.

### 3. Approval Mode Logic
- **Question**: How does `approval_mode` interact with MCP advisories?
- **Scenarios**:
  - `auto` + high MCP harm score → Override to `admin_review`?
  - `admin_review` + low MCP harm score → Still require admin?

**Recommendation**: MCP always flags harm; authority affects routing of non-harmful content.

### 4. Blast Radius Calculation
- **Question**: Is blast radius a hard cap or a guideline?
- **Options**:
  - Hard cap: System rejects broadcasts exceeding limit
  - Soft cap: Admin warned, can override
  - Dynamic cap: Adjusts based on engagement history

**Recommendation**: Soft cap with admin override (safety + flexibility).

### 5. Time-Bound Authority
- **Question**: What happens when authority expires?
- **Options**:
  - Auto-downgrade to L1 (default user)
  - Auto-suspend (requires admin re-activation)
  - Notify admin for renewal decision

**Recommendation**: Auto-downgrade to L1, notify admin, allow renewal.

### 6. Sponsor Authority
- **Question**: Do sponsors need authority profiles?
- **Considerations**:
  - Sponsored content is admin-created (already trusted)
  - But sponsor reputation matters for transparency
  - Authority could track sponsor "trust score"

**Recommendation**: Phase 4 feature — sponsor authority for accountability, not gatekeeping.

---

## 📋 Research Checklist

Before implementation begins, validate:

- [ ] **Backward Compatibility**: Confirm no existing queries break with new tables
- [ ] **Performance**: Benchmark authority lookup latency (target < 50ms)
- [ ] **Data Migration**: Identify existing users who should receive default authority
- [ ] **Admin Training**: Document authority assignment guidelines
- [ ] **Legal/Compliance**: Confirm authority tracking complies with POPIA/GDPR
- [ ] **Monitoring**: Define metrics for authority system health
- [ ] **Incident Response**: Document authority-related failure scenarios
- [ ] **User Communication**: Draft messaging for authority-affected users (if any)

---

## 🎓 Key Insights from Master Playbook

### 1. **Authority ≠ Roles**
Roles are static (admin, moderator, user). Authority is dynamic, contextual, and revocable.

### 2. **Log Everything, Block Nothing (Initially)**
Phase 1-2 are observational. Enforcement comes later, with data to back decisions.

### 3. **Admin Override is Sacred**
Authority is advisory. Admin decision is always final. No automated system can override admin.

### 4. **Fail Open, Not Closed**
If authority system fails, messages still flow. Safety through redundancy, not gatekeeping.

### 5. **Progressive Enhancement**
Each phase adds capability without removing existing functionality. Users never experience regression.

---

## 🚀 Next Steps (Discussion Phase)

1. **Review this document** with platform stakeholders
2. **Answer open questions** (authority levels, scope hierarchy, etc.)
3. **Validate assumptions** about existing architecture
4. **Define success metrics** for each phase
5. **Create implementation tickets** (only after research approved)
6. **Schedule Phase 1 kickoff** (shadow mode deployment)

---

## 📚 References

- [Moments Platform README](../README.md)
- [Supabase Schema](../../supabase/schema.sql)
- [Moments Schema](../../supabase/moments-schema.sql)
- [Admin Dashboard](../../public/admin-dashboard.html)
- [MCP Advisory System](../../supabase/functions/mcp-advisory/)

---

**Document Status**: DRAFT — Awaiting stakeholder review  
**Next Review**: January 24, 2026  
**Owner**: Platform Architecture Team
