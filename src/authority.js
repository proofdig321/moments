import { supabase } from '../config/supabase.js';

// In-memory cache for authority lookups (TTL: 5 minutes)
const authorityCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Dynamic Authority Service
 * Phase 1.2: Core authority lookup with caching and fail-open pattern
 * 
 * Design Principles:
 * - Fail-open: Errors never block message processing
 * - Fast: < 50ms lookup with caching
 * - Additive: Authority data enriches, never gates
 */

/**
 * Lookup authority profile for a user
 * @param {string} userIdentifier - Phone number or user ID
 * @returns {Promise<Object|null>} Authority profile or null
 */
export async function lookupAuthority(userIdentifier) {
  if (!userIdentifier) return null;
  
  const startTime = Date.now();
  
  try {
    // Check cache first
    const cacheKey = `auth:${userIdentifier}`;
    const cached = authorityCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Authority cache hit for ${userIdentifier} (${Date.now() - startTime}ms)`);
      return cached.data;
    }
    
    // Database lookup using optimized function
    const { data, error } = await supabase.rpc('lookup_authority', {
      p_user_identifier: userIdentifier
    });
    
    const lookupTime = Date.now() - startTime;
    
    if (error) {
      console.warn(`Authority lookup error for ${userIdentifier}:`, error.message);
      // Fail-open: Return null, don't block processing
      return null;
    }
    
    // Cache the result (even if null)
    const authorityData = data && data.length > 0 ? data[0] : null;
    authorityCache.set(cacheKey, {
      data: authorityData,
      timestamp: Date.now()
    });
    
    console.log(`Authority lookup for ${userIdentifier}: ${authorityData ? 'found' : 'none'} (${lookupTime}ms)`);
    
    return authorityData;
    
  } catch (error) {
    const lookupTime = Date.now() - startTime;
    console.error(`Authority lookup exception for ${userIdentifier} (${lookupTime}ms):`, error.message);
    
    // Fail-open: Always return null on errors
    return null;
  }
}

/**
 * Get authority context for message processing
 * @param {string} userIdentifier - Phone number or user ID
 * @returns {Promise<Object>} Authority context object
 */
export async function getAuthorityContext(userIdentifier) {
  const authority = await lookupAuthority(userIdentifier);
  
  if (!authority) {
    return {
      hasAuthority: false,
      level: 0,
      role: 'unknown',
      scope: 'none',
      approvalMode: 'admin_review',
      blastRadius: 0,
      riskThreshold: 0.5
    };
  }
  
  return {
    hasAuthority: true,
    level: authority.authority_level || 1,
    role: authority.role_label || 'community_member',
    scope: authority.scope || 'community',
    scopeIdentifier: authority.scope_identifier,
    approvalMode: authority.approval_mode || 'ai_review',
    blastRadius: authority.blast_radius || 100,
    riskThreshold: authority.risk_threshold || 0.7,
    metadata: authority.metadata || {}
  };
}

/**
 * Check if user has authority for specific action
 * @param {string} userIdentifier - Phone number or user ID
 * @param {string} action - Action to check (e.g., 'auto_approve', 'broadcast_region')
 * @param {Object} context - Additional context (region, category, etc.)
 * @returns {Promise<boolean>} True if authorized
 */
export async function hasAuthority(userIdentifier, action, context = {}) {
  const authority = await getAuthorityContext(userIdentifier);
  
  if (!authority.hasAuthority) return false;
  
  switch (action) {
    case 'auto_approve':
      return authority.approvalMode === 'auto' && authority.level >= 2;
      
    case 'broadcast_region':
      if (authority.scope === 'national') return true;
      if (authority.scope === 'province' && context.region === authority.scopeIdentifier) return true;
      if (authority.scope === 'region' && context.region === authority.scopeIdentifier) return true;
      return false;
      
    case 'bypass_review':
      return authority.level >= 3 && authority.approvalMode !== 'admin_review';
      
    case 'high_blast_radius':
      return authority.blastRadius >= (context.requestedRadius || 1000);
      
    default:
      return false;
  }
}

/**
 * Create authority profile (admin only)
 * @param {Object} profileData - Authority profile data
 * @param {string} createdBy - Admin user ID
 * @returns {Promise<Object>} Created profile
 */
export async function createAuthorityProfile(profileData, createdBy) {
  try {
    const {
      userIdentifier,
      authorityLevel = 1,
      roleLabel,
      scope,
      scopeIdentifier,
      approvalMode = 'ai_review',
      blastRadius = 100,
      riskThreshold = 0.7,
      validUntil,
      metadata = {}
    } = profileData;
    
    // Validate required fields
    if (!userIdentifier || !roleLabel || !scope) {
      throw new Error('Missing required fields: userIdentifier, roleLabel, scope');
    }
    
    // Insert authority profile
    const { data: profile, error: insertError } = await supabase
      .from('authority_profiles')
      .insert({
        user_identifier: userIdentifier,
        authority_level: authorityLevel,
        role_label: roleLabel,
        scope,
        scope_identifier: scopeIdentifier,
        approval_mode: approvalMode,
        blast_radius: blastRadius,
        risk_threshold: riskThreshold,
        valid_until: validUntil,
        created_by: createdBy,
        updated_by: createdBy,
        metadata
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Log the creation
    await supabase.rpc('log_authority_action', {
      p_authority_profile_id: profile.id,
      p_action: 'created',
      p_actor_id: createdBy,
      p_context: { profileData }
    });
    
    // Clear cache for this user
    clearAuthorityCache(userIdentifier);
    
    console.log(`Authority profile created for ${userIdentifier}: ${roleLabel} (${scope})`);
    
    return profile;
    
  } catch (error) {
    console.error('Create authority profile error:', error.message);
    throw error;
  }
}

/**
 * Update authority profile (admin only)
 * @param {string} profileId - Authority profile ID
 * @param {Object} updates - Fields to update
 * @param {string} updatedBy - Admin user ID
 * @returns {Promise<Object>} Updated profile
 */
export async function updateAuthorityProfile(profileId, updates, updatedBy) {
  try {
    // Get current profile for cache clearing
    const { data: currentProfile } = await supabase
      .from('authority_profiles')
      .select('user_identifier')
      .eq('id', profileId)
      .single();
    
    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('authority_profiles')
      .update({
        ...updates,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Log the update
    await supabase.rpc('log_authority_action', {
      p_authority_profile_id: profileId,
      p_action: 'updated',
      p_actor_id: updatedBy,
      p_context: { updates }
    });
    
    // Clear cache for this user
    if (currentProfile?.user_identifier) {
      clearAuthorityCache(currentProfile.user_identifier);
    }
    
    console.log(`Authority profile updated: ${profileId}`);
    
    return profile;
    
  } catch (error) {
    console.error('Update authority profile error:', error.message);
    throw error;
  }
}

/**
 * Suspend authority profile (admin only)
 * @param {string} profileId - Authority profile ID
 * @param {string} suspendedBy - Admin user ID
 * @param {string} reason - Suspension reason
 * @returns {Promise<Object>} Suspended profile
 */
export async function suspendAuthorityProfile(profileId, suspendedBy, reason = 'Admin action') {
  try {
    return await updateAuthorityProfile(profileId, {
      status: 'suspended'
    }, suspendedBy);
    
  } catch (error) {
    console.error('Suspend authority profile error:', error.message);
    throw error;
  }
}

/**
 * Clear authority cache for specific user
 * @param {string} userIdentifier - Phone number or user ID
 */
export function clearAuthorityCache(userIdentifier) {
  const cacheKey = `auth:${userIdentifier}`;
  authorityCache.delete(cacheKey);
  console.log(`Authority cache cleared for ${userIdentifier}`);
}

/**
 * Clear all authority cache (for testing/debugging)
 */
export function clearAllAuthorityCache() {
  const size = authorityCache.size;
  authorityCache.clear();
  console.log(`Authority cache cleared (${size} entries)`);
}

/**
 * Get cache statistics (for monitoring)
 */
export function getAuthorityCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of authorityCache.entries()) {
    if ((now - value.timestamp) < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: authorityCache.size,
    validEntries,
    expiredEntries,
    cacheTtlMs: CACHE_TTL
  };
}

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of authorityCache.entries()) {
    if ((now - value.timestamp) >= CACHE_TTL) {
      authorityCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Authority cache cleanup: removed ${cleanedCount} expired entries`);
  }
}, 10 * 60 * 1000);

export default {
  lookupAuthority,
  getAuthorityContext,
  hasAuthority,
  createAuthorityProfile,
  updateAuthorityProfile,
  suspendAuthorityProfile,
  clearAuthorityCache,
  clearAllAuthorityCache,
  getAuthorityCacheStats
};