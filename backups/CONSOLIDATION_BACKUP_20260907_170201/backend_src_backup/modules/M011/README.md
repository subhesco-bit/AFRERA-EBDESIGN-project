# M011 - User Management

Domain: Identity
Status: ENHANCED

Real CRUD over the `users` table, plus AI-assisted user analytics.

## Features
- Create/get/list/update user, soft-delete (status = 'deleted'), password change (bcrypt)
- User analytics (activity pattern, failed logins, common actions, risk level)
- Engagement scoring (activity + recency)
- Behavior profile (peak hours/days from audit_logs)
- Bulk user creation
