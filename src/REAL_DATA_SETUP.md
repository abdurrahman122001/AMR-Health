# Real Data Integration Setup Guide

## Overview

The AMU National component has been updated to connect to real Supabase data instead of synthetic mock data. This guide explains how to set up and use the real data integration.

## Current Status

✅ **Completed:**
- Server endpoints updated to query real Supabase tables
- AMUNational component displays data source indicators
- Fallback system for synthetic data when real data unavailable
- Database table schema and sample data generation
- Enhanced filtering with real database queries

🔄 **Data Source Indicators:**
- 📊 **Real Data** - Connected to actual Supabase table
- 🔄 **Synthetic Data** - Using fallback mock data
- ⚠️ **Offline Mode** - Server unavailable, using cached data

## Setting Up Real Data

### Step 1: Create the Database Table

1. **Use the Debug Panel:**
   - Navigate to the AMU Dashboard in your application
   - Find the "Server Debug Panel" component
   - Click **"Get Setup SQL"** button
   - Copy the generated SQL commands

2. **Run in Supabase:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to **SQL Editor**
   - Paste and execute the SQL commands
   - This creates the `amu_patients` table with proper schema

### Step 2: Initialize Sample Data

After creating the table, the system will automatically populate it with 970 realistic patient records when you first call the AMU endpoints.

## Database Schema

The `amu_patients` table includes:

```sql
CREATE TABLE amu_patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(50) UNIQUE NOT NULL,
  hospital_code VARCHAR(50) NOT NULL,
  hospital_name VARCHAR(200) NOT NULL,
  ward VARCHAR(100),
  sex CHAR(1) CHECK (sex IN ('M', 'F')),
  age INTEGER CHECK (age >= 0 AND age <= 120),
  has_antibiotics BOOLEAN DEFAULT false,
  survey_date DATE DEFAULT CURRENT_DATE,
  region VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Features

### Real-Time Filtering
- All filters now query the database directly
- Hospital, ward, sex, age group, and region filters supported
- Counts reflect actual filtered results from database

### Data Source Transparency
- Clear indicators show whether you're viewing real or synthetic data
- Error handling gracefully falls back to synthetic data
- Detailed error messages in offline mode

### Sample Data
The system includes realistic data for:
- **5 Hospitals**: Eastern Regional, Korle Bu, Komfo Anokye, Ridge, 37 Military
- **5 Ward Types**: ICU, Medical, Surgical, Emergency, Paediatric
- **Demographics**: Mixed age groups (18-98), balanced sex distribution
- **Antibiotic Usage**: ~85% of patients have antibiotics (realistic prevalence)

## Debugging

Use the **Server Debug Panel** to:
- Test server connectivity
- Verify database table setup
- Check endpoint responses
- Generate setup SQL if needed

## Migration from Synthetic Data

The system automatically:
1. Attempts to use real database first
2. Falls back to KV store synthetic data if database unavailable
3. Falls back to hardcoded mock data if all else fails
4. Clearly indicates which data source is being used

## Next Steps

1. **Custom Data Import**: Replace sample data with your actual patient records
2. **Additional Fields**: Extend the schema to include diagnosis, antibiotics prescribed, etc.
3. **Real-Time Updates**: Set up triggers for live data synchronization
4. **Advanced Analytics**: Add aggregation endpoints for complex reporting

## Troubleshooting

**"Offline Mode" appearing?**
- Check your Supabase database connection
- Ensure the `amu_patients` table exists
- Verify service role key permissions

**Counts seem wrong?**
- Check filter parameters being sent to server
- Use debug panel to inspect actual database queries
- Verify sample data was inserted correctly

**Performance issues?**
- Database includes optimized indexes for common queries
- Consider additional indexes for your specific use cases