# Preview approval gate

The existing production button was disabled by the required authorization checkbox, not a missing Nasir build. Checking the box enabled Preview Ready. However, the redundant manual route verifier and manual-only copy contradicted the completed worker record. Rendering also revalidated the protected deployment on each page load.

Completed worker evidence now supplies the built prerequisite only when request, current saved slug, active brief, ready_for_review state, required QA flags, authenticated preview and identity verification, scoped files, branch and HTTPS preview URL all match. Worker completion still performs external deployment verification. Failed, incomplete, mismatched and unverified evidence fails closed. Legacy manual route verification remains available.

The page shows verified build/QA/protection and removes the redundant manual button for worker builds. Authorization remains required; Customer Approved still requires the separate Preview Ready stage. No actual Nasir approval is submitted by the verification script.

Verification: test-preview-approval.mjs, test-build-worker.mjs, test-admin-slugs.mjs, verify-preview-gate.mjs, lint and production build. The browser check only toggles and restores the authorization checkbox; it never clicks approval/build actions. Synthetic database fixtures are removed after tests.

No migration, regeneration, new Nasir deployment, email or DNS change is needed.
