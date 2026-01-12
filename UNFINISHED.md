# UNFINISHED Items

## Critical Missing Components
- [x] UUID package import in media.js (RESOLVED)
- [x] MCP endpoint implementation (Railway service deployed)
- [x] n8n workflows (local Docker deployment as source code)
- [ ] Production HTTPS/SSL configuration (deployment specific)
- [ ] Rate limiting implementation details (basic version implemented)
- [ ] Error retry exponential backoff (basic retry implemented)
- [ ] Media file size validation (WhatsApp API handles this)
- [ ] Storage cleanup/archival policies (operational concern)

## Optional Enhancements
- [ ] Message threading/conversation tracking
- [ ] Bulk message broadcasting
- [ ] Analytics dashboard (explicitly not required)
- [ ] Advanced language translation
- [ ] Custom emoji/sticker support
- [ ] Voice message transcription
- [ ] Image OCR processing
- [ ] Video thumbnail generation

## Configuration Assumptions
- MCP advisory service responds within 5 seconds
- Supabase handles concurrent connections
- n8n workflows are manually imported
- WhatsApp Business API limits are managed externally
- HTTPS termination handled by reverse proxy
- File uploads limited to WhatsApp's constraints

## Known Limitations
- No real-time message status updates
- Basic language detection (franc library)
- Simple trust scoring (no ML models)
- Manual escalation process
- No message encryption beyond WhatsApp's
- Single phone number support only

## Production Readiness Gaps
- [ ] Load testing results
- [ ] Backup/disaster recovery procedures
- [ ] Security audit completion
- [ ] Performance benchmarking
- [ ] Compliance documentation (GDPR/POPIA)

---

**Target State**: All critical items resolved, optional items documented as future work.