import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  console.log('Health check endpoint called');
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "AMU Surveillance Server is running"
  });
});

// Enhanced diagnostic endpoint
app.get("/diagnostic", async (c) => {
  console.log('=== DIAGNOSTIC ENDPOINT CALLED ===');
  
  const diagnostics = {
    server: {
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing',
        serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing'
      }
    },
    database: {
      connection: 'unknown',
      error: null
    }
  };
  
  // Test database connection
  try {
    console.log('Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('AMR_HH')
      .select('ORGANISM')
      .limit(1);
    
    if (testError) {
      diagnostics.database.connection = 'failed';
      diagnostics.database.error = testError.message;
      console.error('Database test failed:', testError);
    } else {
      diagnostics.database.connection = 'success';
      diagnostics.database.recordsFound = testData?.length || 0;
      console.log('Database test successful');
    }
  } catch (error) {
    diagnostics.database.connection = 'error';
    diagnostics.database.error = error.message;
    console.error('Database test error:', error);
  }
  
  console.log('Diagnostic results:', diagnostics);
  return c.json(diagnostics);
});

// Quick connectivity test endpoint
app.get("/quick-test", (c) => {
  console.log('Quick test endpoint called');
  return c.json({ 
    status: "Server responding",
    timestamp: new Date().toISOString(),
    message: "Basic connectivity confirmed"
  });
});

// Test endpoint for debugging
app.get("/test", (c) => {
  console.log('Test endpoint called');
  return c.json({ 
    message: "Test endpoint working",
    timestamp: new Date().toISOString()
  });
});

// Debug route to list all available routes
app.get("/routes", (c) => {
  console.log('Routes endpoint called');
  return c.json({
    availableRoutes: [
      '/health',
      '/diagnostic', 
      '/quick-test',
      '/test',
      '/routes',
      '/filter-options',
      '/filter-values/:column',
      '/amu-quality-indicators',
      '/amu-quality-filter-values',
      '/amu-filter-values (legacy)'
    ],
    message: "Available endpoints in this edge function"
  });
});

// Quality indicators calculation endpoint
app.get("/amu-quality-indicators", async (c) => {
  try {
    console.log('Quality indicators calculation endpoint called');
    const filters = c.req.query();
    console.log('Query filters:', filters);
    
    let query = supabase.from('AMU_HH').select(`
      reason_in_notes,
      guideline_compliance,
      culture_to_lab_yesno,
      treatment,
      treatment_based_on_biomarker_d,
      is_a_stopreview_date_documente
    `, { count: 'exact' });
    
    // Apply dynamic filters - only the 12 allowed columns
    const allowedFilterColumns = [
      'diagnosis', 'indication', 'treatment', 'district', 'year_of_survey',
      'antimicrobial_name', 'atc5', 'atc4', 'atc3', 'atc2', 'aware', 'diagnosis_site'
    ];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (allowedFilterColumns.includes(key) && value && value !== 'no_filters') {
        console.log(`Applying filter: ${key} = ${value}`);
        if (value === 'true' || value === 'false') {
          query = query.eq(key, value === 'true');
        } else if (value === 'null') {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      }
    });
    
    // Apply NULL filtering for quality indicator fields
    query = query
      .not('reason_in_notes', 'is', null)
      .not('guideline_compliance', 'is', null)
      .not('culture_to_lab_yesno', 'is', null)
      .not('treatment', 'is', null)
      .not('treatment_based_on_biomarker_d', 'is', null)
      .not('is_a_stopreview_date_documente', 'is', null);
    
    const { data: filteredRecords, count: totalRecords, error } = await query;
    
    if (error) {
      console.error('Error querying AMU_HH data for quality indicators:', error);
      throw new Error(`Failed to query AMU_HH table: ${error.message}`);
    }
    
    console.log(`Total filtered records for quality indicators:`, totalRecords);
    
    // Calculate quality indicators percentages
    let reasonInNotesCount = 0;
    let guidelineComplianceCount = 0;
    let cultureTakenCount = 0;
    let targetedTherapyCount = 0;
    let biomarkerUsedCount = 0;
    let reviewDateCount = 0;
    
    if (filteredRecords && filteredRecords.length > 0) {
      filteredRecords.forEach(record => {
        if (record.reason_in_notes === true) reasonInNotesCount++;
        if (record.guideline_compliance === true) guidelineComplianceCount++;
        if (record.culture_to_lab_yesno === true) cultureTakenCount++;
        if (record.treatment === "TARGETED") targetedTherapyCount++;
        if (record.treatment_based_on_biomarker_d === true) biomarkerUsedCount++;
        if (record.is_a_stopreview_date_documente === true) reviewDateCount++;
      });
    }
    
    const reasonInNotesPercentage = totalRecords > 0 ? (reasonInNotesCount / totalRecords * 100) : 0;
    const guidelineCompliancePercentage = totalRecords > 0 ? (guidelineComplianceCount / totalRecords * 100) : 0;
    const cultureTakenPercentage = totalRecords > 0 ? (cultureTakenCount / totalRecords * 100) : 0;
    const targetedTherapyPercentage = totalRecords > 0 ? (targetedTherapyCount / totalRecords * 100) : 0;
    const biomarkerUsedPercentage = totalRecords > 0 ? (biomarkerUsedCount / totalRecords * 100) : 0;
    const reviewDatePercentage = totalRecords > 0 ? (reviewDateCount / totalRecords * 100) : 0;
    
    const qualityData = {
      totalRecords: totalRecords || 0,
      indicators: [
        {
          subject: 'Reason in Notes',
          field: 'reason_in_notes',
          value: parseFloat(reasonInNotesPercentage.toFixed(1)),
          count: reasonInNotesCount,
          target: 80
        },
        {
          subject: 'Guideline Compliant',
          field: 'guideline_compliance',
          value: parseFloat(guidelineCompliancePercentage.toFixed(1)),
          count: guidelineComplianceCount,
          target: 80
        },
        {
          subject: 'Culture Taken',
          field: 'culture_to_lab_yesno',
          value: parseFloat(cultureTakenPercentage.toFixed(1)),
          count: cultureTakenCount,
          target: 80
        },
        {
          subject: 'Targeted Therapy',
          field: 'treatment',
          value: parseFloat(targetedTherapyPercentage.toFixed(1)),
          count: targetedTherapyCount,
          target: 80
        },
        {
          subject: 'Biomarker Used',
          field: 'treatment_based_on_biomarker_d',
          value: parseFloat(biomarkerUsedPercentage.toFixed(1)),
          count: biomarkerUsedCount,
          target: 80
        },
        {
          subject: 'Review Date',
          field: 'is_a_stopreview_date_documente',
          value: parseFloat(reviewDatePercentage.toFixed(1)),
          count: reviewDateCount,
          target: 80
        }
      ],
      dataSource: 'real_supabase_table',
      tableName: 'AMU_HH',
      timestamp: new Date().toISOString()
    };
    
    console.log('Returning quality indicators data:', qualityData);
    return c.json(qualityData);
    
  } catch (error) {
    console.error('Error calculating quality indicators from AMU_HH:', error);
    return c.json({ 
      error: `Failed to calculate quality indicators: ${error.message}`,
      dataSource: 'error'
    }, 500);
  }
});

// Quality-specific filter values endpoint (for ViewBy component compatibility)  
app.get("/amu-quality-filter-values", async (c) => {
  const column = c.req.query('column');
  console.log(`Quality filter values endpoint called for column: ${column}`);
  
  if (!column) {
    return c.json({
      success: false,
      error: 'Column name is required',
      message: 'Please provide a column parameter'
    }, 400);
  }
  
  // Validate that the column is one of the 21 restricted AMU_HH columns  
  const allowedColumns = [
    'activity', 'age_cat', 'antimicrobial_name', 'atc2', 'atc3', 'atc4', 'atc5',
    'aware', 'county', 'dept_type', 'diagnosis', 'diagnosis_site', 'district',
    'indication', 'main_dept', 'name', 'route', 'sex', 'sub_dept', 'treatment',
    'year_of_survey'
  ];
  
  if (!allowedColumns.includes(column)) {
    return c.json({
      success: false,
      error: 'Invalid column',
      message: `Column '${column}' is not allowed. Allowed columns: ${allowedColumns.join(', ')}`
    }, 400);
  }
  
  try {
    console.log(`Querying distinct values for column: ${column} (quality endpoint)`);
    const { data, error } = await supabase
      .from('AMU_HH')
      .select(column)
      .not(column, 'is', null)
      .not(column, 'eq', '')
      .order(column);
    
    if (error) {
      console.error(`Database error for column ${column}:`, error);
      return c.json({
        success: false,
        error: 'Database query failed',
        message: error.message
      }, 500);
    }
    
    // Get distinct values and format as options for ViewBy component
    const distinctValues = [...new Set(data?.map(row => row[column]).filter(Boolean))]
      .sort()
      .map(value => ({
        value: value.toString(),
        label: value.toString()
      }));
    
    console.log(`Found ${distinctValues.length} distinct values for ${column} (quality format)`);
    
    return c.json({
      success: true,
      options: distinctValues,
      count: distinctValues.length,
      column: column
    });
    
  } catch (error) {
    console.error(`Error querying column ${column} (quality):`, error);
    return c.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// AMU Filter Values endpoint - restricted to 21 validated AMU_HH columns
app.get("/amu-filter-values", async (c) => {
  const column = c.req.query('column');
  console.log(`AMU filter values endpoint called for column: ${column}`);
  
  if (!column) {
    return c.json({
      error: 'Column name is required',
      message: 'Please provide a column parameter'
    }, 400);
  }
  
  // Validate that the column is one of the 21 restricted AMU_HH columns  
  const allowedColumns = [
    'activity', 'age_cat', 'antimicrobial_name', 'atc2', 'atc3', 'atc4', 'atc5',
    'aware', 'county', 'dept_type', 'diagnosis', 'diagnosis_site', 'district',
    'indication', 'main_dept', 'name', 'route', 'sex', 'sub_dept', 'treatment',
    'year_of_survey'
  ];
  
  if (!allowedColumns.includes(column)) {
    return c.json({
      error: 'Invalid column',
      message: `Column '${column}' is not allowed. Allowed columns: ${allowedColumns.join(', ')}`
    }, 400);
  }
  
  try {
    console.log(`Querying distinct values for column: ${column} (legacy endpoint)`);
    const { data, error } = await supabase
      .from('AMU_HH')
      .select(column)
      .not(column, 'is', null)
      .not(column, 'eq', '')
      .order(column);
    
    if (error) {
      console.error(`Database error for column ${column}:`, error);
      return c.json({
        error: 'Database query failed',
        message: error.message
      }, 500);
    }
    
    // Get distinct values - return in legacy format
    const distinctValues = [...new Set(data?.map(row => row[column]).filter(Boolean))].sort();
    
    console.log(`Found ${distinctValues.length} distinct values for ${column} (legacy format)`);
    
    return c.json({
      values: distinctValues,
      count: distinctValues.length,
      column: column
    });
    
  } catch (error) {
    console.error(`Error querying column ${column} (legacy):`, error);
    return c.json({
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// Filter options endpoint - returns the 12 specific AMU_HH columns
app.get("/filter-options", (c) => {
  console.log('Filter options endpoint called');
  
  const filterOptions = [
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'indication', label: 'Indication' },
    { value: 'treatment', label: 'Treatment Approach' },
    { value: 'district', label: 'District' },
    { value: 'year_of_survey', label: 'Year of Survey' },
    { value: 'antimicrobial_name', label: 'Antimicrobial Name' },
    { value: 'atc5', label: 'ATC5 Code' },
    { value: 'atc4', label: 'ATC4 Code' },
    { value: 'atc3', label: 'ATC3 Code' },
    { value: 'atc2', label: 'ATC2 Code' },
    { value: 'aware', label: 'AWaRe Category' },
    { value: 'diagnosis_site', label: 'Diagnosis Site' }
  ];
  
  return c.json({
    success: true,
    data: filterOptions,
    count: filterOptions.length
  });
});

// Filter values endpoint - returns distinct values for a specific column  
app.get("/filter-values/:column", async (c) => {
  const column = c.req.param('column');
  console.log(`Filter values endpoint called for column: ${column}`);
  
  // Validate that the column is one of the 21 restricted AMU_HH columns  
  const allowedColumns = [
    'activity', 'age_cat', 'antimicrobial_name', 'atc2', 'atc3', 'atc4', 'atc5',
    'aware', 'county', 'dept_type', 'diagnosis', 'diagnosis_site', 'district',
    'indication', 'main_dept', 'name', 'route', 'sex', 'sub_dept', 'treatment',
    'year_of_survey'
  ];
  
  if (!allowedColumns.includes(column)) {
    return c.json({
      success: false,
      error: 'Invalid column',
      message: `Column '${column}' is not allowed. Allowed columns: ${allowedColumns.join(', ')}`
    }, 400);
  }
  
  try {
    console.log(`Querying distinct values for column: ${column}`);
    const { data, error } = await supabase
      .from('AMU_HH')
      .select(column)
      .not(column, 'is', null)
      .not(column, 'eq', '')
      .order(column);
    
    if (error) {
      console.error(`Database error for column ${column}:`, error);
      return c.json({
        success: false,
        error: 'Database query failed',
        message: error.message
      }, 500);
    }
    
    // Get distinct values
    const distinctValues = [...new Set(data?.map(row => row[column]).filter(Boolean))]
      .sort()
      .map(value => ({
        value: value.toString(),
        label: value.toString()
      }));
    
    console.log(`Found ${distinctValues.length} distinct values for ${column}`);
    
    return c.json({
      success: true,
      data: distinctValues,
      count: distinctValues.length,
      column: column
    });
    
  } catch (error) {
    console.error(`Error querying column ${column}:`, error);
    return c.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// Global error handler for uncaught exceptions
app.onError((err, c) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Check if it's a database connectivity issue
  if (err.message.includes('502 Bad Gateway') || 
      err.message.includes('AMR_HH table not found') ||
      err.message.includes('timeout') ||
      err.message.includes('network') ||
      err.message.includes('connection')) {
    return c.json({
      success: false,
      error: 'Database connectivity issue',
      message: 'The database is temporarily unavailable. Please try again in a few moments.',
      details: err.message
    }, 503);
  }
  
  // Generic error response for other issues
  return c.json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again.',
    details: err.message,
    stack: err.stack
  }, 500);
});

console.log('=== STARTING SUPABASE EDGE FUNCTION SERVER ===');
console.log('Environment check:');
console.log('- SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'Present' : 'Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'Present' : 'Missing');

Deno.serve(app.fetch);