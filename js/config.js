// js/config.js - Configuration file
console.log('⚙️ Loading KenBarber Configuration...');

// Supabase Configuration
window.SUPABASE_CONFIG = {
    url: 'https://eqjdkpanqwjhuyavvdaf.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxamRrcGFucXdqaHV5YXZ2ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDUxMDQsImV4cCI6MjA4MjQ4MTEwNH0.7aQlOv1bC9_HJS844XhzCFjeiw7iMdV0n9K65uNIDZA'
};

// Fallback Data
window.FALLBACK_DATA = {
    services: [
        { id: 1, name: "Classic Haircut", description: "Professional haircut with styling", price: 30, duration: 30, is_active: true },
        { id: 2, name: "Beard Trim", description: "Precision beard trimming", price: 20, duration: 20, is_active: true },
        { id: 3, name: "Haircut & Beard", description: "Complete grooming package", price: 45, duration: 45, is_active: true },
        { id: 4, name: "Hot Towel Shave", description: "Traditional hot towel shave", price: 25, duration: 25, is_active: true },
        { id: 5, name: "Kids Haircut", description: "Special haircut for children", price: 25, duration: 25, is_active: true }
    ],
    barbers: [
        { id: 1, name: "John Maina", specialization: "Traditional Cuts", experience_years: 8, image_url: "", is_active: true },
        { id: 2, name: "David Omondi", specialization: "Modern Styles", experience_years: 5, image_url: "", is_active: true },
        { id: 3, name: "Peter Kamau", specialization: "Beard Specialist", experience_years: 10, image_url: "", is_active: true }
    ],
    testimonials: [
        { id: 1, customer_name: "James Mwangi", comment: "Best barbershop in Nakuru!", rating: 5, is_approved: true },
        { id: 2, customer_name: "Brian Ochieng", comment: "Great service every time!", rating: 5, is_approved: true },
        { id: 3, customer_name: "Michael Otieno", comment: "Perfect haircut every time.", rating: 5, is_approved: true }
    ]
};

console.log('✅ Configuration loaded');
