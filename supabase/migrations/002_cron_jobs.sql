-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Poll Gmail every 5 minutes
SELECT cron.schedule('poll-gmail', '*/5 * * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/poll-gmail',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);

-- Morning digest at 7am UTC
SELECT cron.schedule('morning-digest', '0 7 * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/morning-digest',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);

-- Check overdue invoices at 9am UTC
SELECT cron.schedule('check-overdue', '0 9 * * *',
  $$SELECT net.http_post(url := current_setting('app.supabase_url') || '/functions/v1/check-overdue',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_key')))$$
);
