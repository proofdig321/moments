SELECT setting_key, setting_value, updated_at 
FROM system_settings 
WHERE setting_key IN ('monthly_budget', 'warning_threshold', 'message_cost', 'daily_limit')
ORDER BY setting_key;
