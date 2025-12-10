-- Fix all time entries with duration < 30 minutes to use 30-minute minimum billing
UPDATE time_entries te
SET cost = (30.0 / 60.0) * e.hourly_rate,
    updated_at = CURRENT_TIMESTAMP
FROM employees e
WHERE te.employee_id = e.id
  AND te.is_active = true
  AND te.duration_minutes < 30
  AND e.hourly_rate IS NOT NULL
  AND e.hourly_rate > 0;

