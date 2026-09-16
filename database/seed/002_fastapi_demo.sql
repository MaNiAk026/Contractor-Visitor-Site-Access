-- STEP-03 deterministic business data. Sample training and policy values are not Renewi-approved production policy.

BEGIN;

INSERT INTO app.users (id, name, email, role, label) VALUES
('u-admin', 'Elise van Dijk', 'admin@demo.renewi.local', 'platform_admin', 'Platform admin'),
('u-sheq', 'Milan Bakker', 'sheq@demo.renewi.local', 'compliance', 'Compliance / SHEQ'),
('u-site', 'Joost Visser', 'site@demo.renewi.local', 'site_admin', 'Site administrator'),
('u-planner', 'Lara de Wit', 'planner@demo.renewi.local', 'planner', 'Planner / requester'),
('u-agency', 'Amina Khan', 'agency@demo.renewi.local', 'contractor', 'Contractor / agency'),
('u-driver', 'Nora Jansen', 'driver@demo.renewi.local', 'driver', 'Driver / visitor'),
('u-gate', 'Samira El Idrissi', 'gate@demo.renewi.local', 'gate_operator', 'Gate operator'),
('u-audit', 'Willem Smit', 'audit@demo.renewi.local', 'auditor', 'Auditor')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role, label = EXCLUDED.label, active = TRUE;

INSERT INTO app.companies (id, name, country_code) VALUES
('COM-201', 'Dutch Freight BV', 'NL'),
('COM-202', 'Westport Logistics', 'NL'),
('COM-203', 'Metro Maintenance', 'NL'),
('COM-204', 'GreenLoop Services', 'BE'),
('COM-205', 'Independent carrier', 'NL'),
('COM-206', 'Rotterdam Haulage', 'NL')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country_code = EXCLUDED.country_code;

INSERT INTO app.sites (id, name, country_code) VALUES
('SITE-001', 'Vlaardingen', 'NL'),
('SITE-002', 'Rotterdam', 'NL'),
('SITE-003', 'Antwerp', 'BE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country_code = EXCLUDED.country_code, active = TRUE;

INSERT INTO app.people (id, company_id, full_name, population) VALUES
('PER-1008', 'COM-201', 'Nora Jansen', 'external_driver'),
('PER-1012', 'COM-202', 'Daan van Leeuwen', 'temporary_driver'),
('PER-1016', 'COM-203', 'Ravi Patel', 'maintenance_contractor'),
('PER-1021', 'COM-204', 'Eva de Groot', 'permanent_contractor'),
('PER-1023', 'COM-205', 'Tom van Dalen', 'external_driver'),
('PER-1030', 'COM-206', 'Omar Benali', 'renewi_driver')
ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id, full_name = EXCLUDED.full_name, population = EXCLUDED.population;

INSERT INTO app.requirement_rules (id, site_id, population, requirement_type, required, active) VALUES
('RULE-001', 'SITE-001', 'external_driver', 'verified_driving_licence', TRUE, TRUE),
('RULE-002', 'SITE-001', 'external_driver', 'sample_sheq_training', TRUE, TRUE),
('RULE-003', 'SITE-001', NULL, 'no_active_blacklist', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET active = TRUE;

INSERT INTO app.training_modules (id, title, version, pass_threshold, content_locale) VALUES
('TRN-001', 'Sample Vlaardingen site rules', '2026.1', 80, 'en')
ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, pass_threshold = EXCLUDED.pass_threshold;

INSERT INTO app.training_attempts (id, person_id, training_module_id, module_version, score, passed) VALUES
('ATT-001', 'PER-1008', 'TRN-001', '2026.1', 92, TRUE),
('ATT-002', 'PER-1021', 'TRN-001', '2026.1', 65, FALSE)
ON CONFLICT (id) DO UPDATE SET score = EXCLUDED.score, passed = EXCLUDED.passed;

INSERT INTO app.evidence (id, person_id, evidence_type, storage_reference, status, expires_on, extracted_fields) VALUES
('EVD-001', 'PER-1008', 'driving_licence', 'local://evidence/nora-licence.pdf', 'verified', DATE '2027-09-15', '{"confidence": 0.82, "mock_extraction": true, "document_country": "NL", "document_label": "Dutch Driving Licence", "holder_name": "Nora Jansen", "licence_categories": ["C", "CE"], "professional_driver": true}'::jsonb),
('EVD-002', 'PER-1012', 'identity_document', 'local://evidence/daan-id.pdf', 'pending_review', DATE '2027-01-15', '{"confidence": 0.78, "mock_extraction": true, "document_country": "NL", "document_label": "Dutch Identity Card", "holder_name": "Daan van Leeuwen"}'::jsonb),
('EVD-003', 'PER-1016', 'vca_certificate', 'local://evidence/ravi-vca.pdf', 'expired', DATE '2026-09-15', '{"confidence": 0.91, "mock_extraction": true, "document_label": "VCA Certificate", "holder_name": "Ravi Patel"}'::jsonb),
('EVD-004', 'PER-1008', 'identity_document', 'local://evidence/nora-dutch-id.pdf', 'verified', DATE '2029-09-15', '{"confidence": 0.96, "mock_extraction": true, "document_country": "NL", "document_label": "Dutch Identity Card", "holder_name": "Nora Jansen", "document_number": "DEMO-NL-ID-1008", "demo_data": true}'::jsonb),
('EVD-005', 'PER-1008', 'driver_qualification_code95', 'local://evidence/nora-code95.pdf', 'verified', DATE '2029-09-15', '{"confidence": 0.94, "mock_extraction": true, "document_country": "NL", "document_label": "Driver Qualification Card - Code 95", "holder_name": "Nora Jansen", "qualification": "Code 95", "vehicle_categories": ["C", "CE"], "demo_data": true}'::jsonb),
('EVD-006', 'PER-1008', 'renewi_employee_id_demo', 'local://evidence/nora-renewi-id-demo.pdf', 'verified', NULL, '{"confidence": 1.0, "mock_extraction": false, "document_label": "Renewi Employee ID - DEMO", "holder_name": "Nora Jansen", "badge_type": "Employee ID", "demo_data": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, expires_on = EXCLUDED.expires_on, extracted_fields = EXCLUDED.extracted_fields;

INSERT INTO app.visits (id, person_id, site_id, site_name, purpose, compliance_status, visit_status, short_notice) VALUES
('VIS-0248', 'PER-1008', 'SITE-001', 'Vlaardingen', 'Waste delivery â€” bay 4', 'Pass', 'approved', TRUE),
('VIS-0251', 'PER-1012', 'SITE-001', 'Vlaardingen', 'Vehicle collection', 'Pending', 'pending', FALSE),
('VIS-0255', 'PER-1021', 'SITE-001', 'Vlaardingen', 'Hosted site visit', 'Fail', 'pending', FALSE),
('VIS-0256', 'PER-1016', 'SITE-001', 'Vlaardingen', 'Forklift safety inspection', 'Expired', 'approved', FALSE),
('VIS-0257', 'PER-1023', 'SITE-001', 'Vlaardingen', 'Materials delivery', 'Blocked', 'approved', TRUE),
('VIS-0231', 'PER-1030', 'SITE-001', 'Vlaardingen', 'Waste delivery â€” bay 2', 'Pass', 'active', FALSE)
ON CONFLICT (id) DO UPDATE SET compliance_status = EXCLUDED.compliance_status, visit_status = EXCLUDED.visit_status, short_notice = EXCLUDED.short_notice, updated_at = NOW();

INSERT INTO app.access_authorizations (id, visit_id, token, status, expires_at) VALUES
('PASS-8391', 'VIS-0248', 'qr_demo_7f4a91', 'active', TIMESTAMPTZ '2099-12-31 23:59:59+00'),
('PASS-8392', 'VIS-0256', 'qr_demo_expired_9c2d', 'active', TIMESTAMPTZ '2099-12-31 23:59:59+00'),
('PASS-8393', 'VIS-0257', 'qr_demo_blocked_5b1e', 'active', TIMESTAMPTZ '2099-12-31 23:59:59+00'),
('PASS-8394', 'VIS-0248', 'qr_demo_mismatch_8a20', 'active', TIMESTAMPTZ '2099-12-31 23:59:59+00')
ON CONFLICT (id) DO UPDATE SET token = EXCLUDED.token, status = EXCLUDED.status, expires_at = EXCLUDED.expires_at;

INSERT INTO app.blacklist_entries (id, person_id, reason, active) VALUES
('BLK-001', 'PER-1023', 'Sample safety exception awaiting controlled resolution.', TRUE)
ON CONFLICT (id) DO UPDATE SET active = TRUE, reason = EXCLUDED.reason;

TRUNCATE app.operational_records, app.dashboard_metrics, app.dashboard_activity, app.search_index;

INSERT INTO app.operational_records (id, module, title, subtitle, status, updated, owner, tags, sort_order) VALUES
('PER-1008', 'people', 'Nora Jansen', 'Dutch Freight BV Â· External driver', 'Pass', 'Updated today', 'Lara de Wit', ARRAY['Vlaardingen', 'CE licence'], 1),
('PER-1012', 'people', 'Daan van Leeuwen', 'Westport Logistics Â· Temporary driver', 'Pending', 'Evidence uploaded 15 min ago', 'Milan Bakker', ARRAY['ID review'], 2),
('PER-1016', 'people', 'Ravi Patel', 'Metro Maintenance Â· Maintenance contractor', 'Expired', 'VCA expired yesterday', 'Milan Bakker', ARRAY['Re-validation'], 3),
('PER-1021', 'people', 'Eva de Groot', 'GreenLoop Services Â· Permanent contractor', 'Fail', 'Site rules assessment: 65%', 'Milan Bakker', ARRAY['Training'], 4),
('PER-1023', 'people', 'Tom van Dalen', 'Independent carrier Â· External driver', 'Blocked', 'Active blacklist entry', 'Compliance team', ARRAY['Safety exception'], 5),
('COM-201', 'companies', 'Dutch Freight BV', '2 linked people Â· Corporate evidence', 'Pass', 'Updated today', 'Compliance team', ARRAY['NL'], 1),
('COM-202', 'companies', 'Westport Logistics', '1 linked person Â· Corporate evidence', 'Pending', 'Identity review needed', 'Compliance team', ARRAY['NL'], 2),
('SITE-001', 'sites', 'Vlaardingen', 'Netherlands Â· 2 active gates', 'Active', 'Gate connectivity healthy', 'Joost Visser', ARRAY['Pilot site'], 1),
('SITE-002', 'sites', 'Rotterdam', 'Netherlands Â· Configuration draft', 'Attention', 'Rule configuration in review', 'Platform admin', ARRAY['Future site'], 2),
('VIS-0248', 'visits', 'Nora Jansen', 'Dutch Freight BV Â· External driver', 'Pass', 'Arrives 10:30', 'Lara de Wit', ARRAY['Vlaardingen', 'Short notice'], 1),
('VIS-0251', 'visits', 'Daan van Leeuwen', 'Westport Logistics Â· Temporary driver', 'Pending', 'Arrives 11:15', 'Milan Bakker', ARRAY['ID review'], 2),
('VIS-0255', 'visits', 'Eva de Groot', 'GreenLoop Services Â· Visitor', 'Fail', 'Arrives 13:00', 'Lara de Wit', ARRAY['Hosted'], 3),
('EVD-001', 'evidence', 'Nora Jansen — Dutch driving licence', 'Netherlands · C/CE categories · human verified', 'Pass', 'Expires 15 September 2027', 'Milan Bakker', ARRAY['NL', 'C/CE', 'Verified'], 1),
('EVD-004', 'evidence', 'Nora Jansen — Dutch identity card', 'Netherlands · identity document · human verified', 'Pass', 'Expires 15 September 2029', 'Milan Bakker', ARRAY['NL', 'Identity', 'Verified'], 2),
('EVD-005', 'evidence', 'Nora Jansen — Driver Qualification Card / Code 95', 'Professional driver qualification · C/CE · verified', 'Pass', 'Expires 15 September 2029', 'Milan Bakker', ARRAY['Code 95', 'Professional driver', 'Verified'], 3),
('EVD-006', 'evidence', 'Nora Jansen — Renewi Employee ID — DEMO', 'Demo employee badge · fictional data · verified', 'Pass', 'No expiry configured', 'Milan Bakker', ARRAY['Renewi', 'Employee ID', 'DEMO'], 4),
('EVD-002', 'evidence', 'Daan van Leeuwen — Dutch identity document', 'Netherlands · mock extraction requires review', 'Pending', 'Uploaded 15 min ago', 'Milan Bakker', ARRAY['NL', 'Identity', 'OCR mock'], 5),
('ATT-001', 'training', 'Vlaardingen site rules', 'Nora Jansen Â· version 2026.1 Â· 92%', 'Pass', 'Completed today', 'Sample LMS', ARRAY['Versioned'], 1),
('ATT-002', 'training', 'Vlaardingen site rules', 'Eva de Groot Â· version 2026.1 Â· 65%', 'Fail', 'Requires a retake', 'Sample LMS', ARRAY['Versioned'], 2),
('VIS-0248', 'compliance', 'Nora Jansen â€” ready', 'All mandatory sample requirements are current', 'Pass', 'Re-evaluated on gate scan', 'Compliance service', ARRAY['Explainable'], 1),
('VIS-0251', 'compliance', 'Daan van Leeuwen â€” reviewer action', 'Identity evidence is pending human verification', 'Pending', 'Re-evaluated on gate scan', 'Compliance service', ARRAY['Explainable'], 2),
('BLK-001', 'blacklist', 'Tom van Dalen', 'Sample safety exception', 'Blocked', 'Controlled override required', 'Compliance team', ARRAY['Audited'], 1),
('PASS-8391', 'access', 'Nora Jansen access pass', 'Opaque QR authorization Â· Vlaardingen', 'Issued', 'Expires in local demo window', 'Access service', ARRAY['Opaque token'], 1),
('AUD-001', 'audit', 'Recent access decisions', 'Audit events are append-only and server-authored', 'Active', 'Filter by actor, action, or entity', 'Audit service', ARRAY['Traceability'], 1),
('NOT-001', 'notifications', 'Expiry reminder', 'Mock message delivery recorded', 'Active', '31 min ago', 'Mock notification provider', ARRAY['No email sent'], 1),
('SET-001', 'settings', 'Requirement rules', 'Site-scoped and population-aware configuration', 'Active', 'Updated today', 'Platform admin', ARRAY['Data-driven'], 1),
('VIS-0231', 'roster', 'Omar Benali', 'Rotterdam Haulage Â· External driver', 'Active', 'Entered 08:12', 'Gate 2', ARRAY[]::TEXT[], 1),
('VIS-0238', 'roster', 'Maaike Vos', 'CleanWaste Partners Â· Contractor', 'Active', 'Entered 08:46', 'Gate 1', ARRAY[]::TEXT[], 2),
('VIS-0240', 'roster', 'Noah de Boer', 'Vlaar Transport Â· Temporary driver', 'Active', 'Entered 09:03', 'Gate 2', ARRAY[]::TEXT[], 3);

INSERT INTO app.dashboard_metrics (label, value, change, status, target, sort_order) VALUES
('Expected today', '48', '+6 since yesterday', 'neutral', '/visits', 1),
('Currently on site', '19', '7 drivers Â· 12 contractors', 'success', '/visits', 2),
('Ready to approve', '12', '4 need reviewer action', 'warning', '/compliance', 3),
('Access denied', '3', 'All decisions explained', 'danger', '/audit', 4);

INSERT INTO app.dashboard_activity (id, action, detail, actor, time, status, sort_order) VALUES
('ACT-01', 'Evidence verified', 'Driving licence for Nora Jansen approved', 'Milan Bakker', '8 min ago', 'success', 1),
('ACT-02', 'Gate access denied', 'Daan van Leeuwen â€” identity review needed', 'Samira El Idrissi', '16 min ago', 'danger', 2),
('ACT-03', 'Training completed', 'Site rules assessment: 92% score', 'Omar Benali', '24 min ago', 'success', 3),
('ACT-04', 'Expiry reminder sent', 'VCA certificate expires in 14 days', 'Renewi notification service', '31 min ago', 'warning', 4);

INSERT INTO app.search_index (id, "group", title, description, href) VALUES
('PER-1008', 'People', 'Nora Jansen', 'External driver Â· Dutch Freight BV', '/people'),
('COM-201', 'Companies', 'Dutch Freight BV', 'Corporate compliance: pass', '/companies'),
('VIS-0248', 'Visits', 'Nora Jansen â€” 10:30 arrival', 'Vlaardingen Â· access ready', '/visits'),
('SITE-001', 'Sites', 'Vlaardingen', 'Netherlands Â· Gate 1 and Gate 2', '/sites'),
('PASS-8391', 'Access passes', 'qr_demo_7f4a91', 'Active opaque QR pass', '/access');

INSERT INTO app.demo_seed_runs (seed_key, seed_version, seeded_at, description)
VALUES ('local-demo-domain', '2026-09-16-step-03', TIMESTAMPTZ '2026-09-16 00:00:00+00', 'Deterministic FastAPI domain and integration demo scenarios.')
ON CONFLICT (seed_key) DO UPDATE
SET seed_version = EXCLUDED.seed_version, seeded_at = EXCLUDED.seeded_at, description = EXCLUDED.description;

COMMIT;

