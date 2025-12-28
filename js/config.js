// config.js - Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://eqjdkpanqwjhuyavvdaf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxamRrcGFucXdqaHV5YXZ2ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDUxMDQsImV4cCI6MjA4MjQ4MTEwNH0.7aQlOv1bC9_HJS844XhzCFjeiw7iMdV0n9K65uNIDZA',
    serviceRoleKey: 'your-service-role-key-here'
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
