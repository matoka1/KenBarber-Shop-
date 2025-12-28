// supabase.js - Supabase Client Setup
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Configuration (in production, use environment variables)
const supabaseUrl = 'https://eqjdkpanqwjhuyavvdaf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxamRrcGFucXdqaHV5YXZ2ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDUxMDQsImV4cCI6MjA4MjQ4MTEwNH0.7aQlOv1bC9_HJS844XhzCFjeiw7iMdV0n9K65uNIDZA';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the client
export default supabase;

// Helper functions
export class SupabaseService {
    
    // ========== BARBERS ==========
    static async getBarbers() {
        try {
            const { data, error } = await supabase
                .from('barbers')
                .select('*')
                .eq('is_active', true)
                .order('experience_years', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching barbers:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getBarberById(id) {
        try {
            const { data, error } = await supabase
                .from('barbers')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching barber:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== SERVICES ==========
    static async getServices() {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching services:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getServiceById(id) {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching service:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== APPOINTMENTS ==========
    static async createAppointment(appointmentData) {
        try {
            // Generate booking reference
            const bookingRef = 'KB' + Date.now().toString().slice(-6);
            
            const appointment = {
                ...appointmentData,
                booking_reference: bookingRef,
                status: 'confirmed',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('appointments')
                .insert([appointment])
                .select()
                .single();
            
            if (error) throw error;
            
            // Update customer's total bookings
            await this.updateCustomerBookings(appointmentData.customer_id);
            
            return { 
                success: true, 
                data: { ...data, booking_ref: bookingRef } 
            };
        } catch (error) {
            console.error('Error creating appointment:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getAppointments(date = null, barberId = null) {
        try {
            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    customers:customer_id(full_name, phone, email),
                    services:service_id(name, price),
                    barbers:barber_id(name)
                `)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });
            
            if (date) {
                query = query.eq('appointment_date', date);
            }
            
            if (barberId) {
                query = query.eq('barber_id', barberId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async checkAvailability(date, time, barberId = null) {
        try {
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('appointment_date', date)
                .eq('appointment_time', time)
                .in('status', ['confirmed', 'pending']);
            
            if (barberId) {
                query = query.eq('barber_id', barberId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Check against maximum capacity
            const maxAppointments = barberId ? 1 : 3; // 1 per barber, 3 total
            const isAvailable = data.length < maxAppointments;
            
            return { 
                success: true, 
                data: { 
                    isAvailable, 
                    bookedSlots: data.length,
                    maxSlots: maxAppointments 
                } 
            };
        } catch (error) {
            console.error('Error checking availability:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async updateAppointmentStatus(id, status) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({ 
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating appointment:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== CUSTOMERS ==========
    static async findOrCreateCustomer(customerData) {
        try {
            // Check if customer exists by phone
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', customerData.phone)
                .single();
            
            if (existingCustomer) {
                // Update last visit
                await supabase
                    .from('customers')
                    .update({ 
                        last_visit: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingCustomer.id);
                
                return { success: true, data: existingCustomer, isNew: false };
            }
            
            // Create new customer
            const customer = {
                ...customerData,
                created_at: new Date().toISOString(),
                total_bookings: 0
            };
            
            const { data, error } = await supabase
                .from('customers')
                .insert([customer])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data, isNew: true };
        } catch (error) {
            console.error('Error with customer:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async updateCustomerBookings(customerId) {
        try {
            // Get current booking count
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id')
                .eq('customer_id', customerId)
                .in('status', ['confirmed', 'completed']);
            
            const bookingCount = appointments?.length || 0;
            
            // Update customer
            const { error } = await supabase
                .from('customers')
                .update({ 
                    total_bookings: bookingCount,
                    last_visit: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', customerId);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating customer bookings:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== WORKING HOURS ==========
    static async getWorkingHours() {
        try {
            const { data, error } = await supabase
                .from('working_hours')
                .select('*')
                .eq('is_active', true)
                .order('day_of_week', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching working hours:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getTodaysHours() {
        try {
            const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            const { data, error } = await supabase
                .from('working_hours')
                .select('*')
                .eq('day_of_week', today)
                .eq('is_active', true)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching today''s hours:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== SPECIAL OFFERS ==========
    static async getActiveOffers() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('special_offers')
                .select('*')
                .eq('is_active', true)
                .lte('valid_from', today)
                .gte('valid_until', today)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching offers:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== TESTIMONIALS ==========
    static async getTestimonials(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async createTestimonial(testimonialData) {
        try {
            const testimonial = {
                ...testimonialData,
                is_approved: false,
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('testimonials')
                .insert([testimonial])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating testimonial:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== NOTIFICATIONS ==========
    static async createNotification(notificationData) {
        try {
            const notification = {
                ...notificationData,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
                .from('notifications')
                .insert([notification])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== ANALYTICS ==========
    static async getDailyStats(date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            // Get appointments for the day
            const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('amount_paid, status')
                .eq('appointment_date', targetDate);
            
            if (appointmentsError) throw appointmentsError;
            
            // Calculate stats
            const stats = {
                date: targetDate,
                totalAppointments: appointments.length,
                confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
                completedAppointments: appointments.filter(a => a.status === 'completed').length,
                totalRevenue: appointments
                    .filter(a => a.status === 'completed')
                    .reduce((sum, a) => sum + (parseFloat(a.amount_paid) || 0), 0),
                averageRevenue: 0
            };
            
            if (stats.completedAppointments > 0) {
                stats.averageRevenue = stats.totalRevenue / stats.completedAppointments;
            }
            
            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching daily stats:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getMonthlyStats(year, month) {
        try {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('appointment_date, amount_paid, status')
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate)
                .in('status', ['completed']);
            
            if (error) throw error;
            
            // Group by day
            const dailyStats = {};
            appointments.forEach(apt => {
                const day = apt.appointment_date;
                if (!dailyStats[day]) {
                    dailyStats[day] = { date: day, count: 0, revenue: 0 };
                }
                dailyStats[day].count++;
                dailyStats[day].revenue += parseFloat(apt.amount_paid) || 0;
            });
            
            // Calculate totals
            const totalRevenue = Object.values(dailyStats).reduce((sum, day) => sum + day.revenue, 0);
            const totalAppointments = Object.values(dailyStats).reduce((sum, day) => sum + day.count, 0);
            
            return {
                success: true,
                data: {
                    year,
                    month,
                    totalRevenue,
                    totalAppointments,
                    averageDailyRevenue: totalRevenue / Object.keys(dailyStats).length || 0,
                    dailyStats: Object.values(dailyStats)
                }
            };
        } catch (error) {
            console.error('Error fetching monthly stats:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export the service class
export { SupabaseService };
