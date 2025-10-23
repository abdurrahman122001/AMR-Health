import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Helper function to make server requests
export const makeServerRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const url = `${supabaseUrl}/functions/v1/make-server-2267887d/${endpoint}`;
    console.log('Making request to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = 'Unable to read error response';
      }
      console.error('Server error response:', errorText);
      throw new Error(`Server request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    if (!responseText.trim()) {
      console.error('Empty response received from server');
      throw new Error('Server returned empty response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Response text that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from server: ${parseError.message}`);
    }
    
    console.log('Server response data:', data);
    return data;
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
};