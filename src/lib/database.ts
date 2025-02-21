import supabase from './supabase';
import { Database } from '../types/database.types';

export async function getOrCreateUser(locationId: string) {
  // Try to get existing user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error) {
    // User doesn't exist, create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{ location_id: locationId }])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newUser;
  }

  return user;
}

export async function getCompanyData(locationId: string) {
  const { data, error } = await supabase
    .from('company_data')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getTargetMarketData(locationId: string) {
  const { data, error } = await supabase
    .from('target_market_data')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCampaigns(locationId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getImages(locationId: string) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createCampaign(locationId: string, campaignData: Database['public']['Tables']['campaigns']['Insert']) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{ ...campaignData, location_id: locationId }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCompanyData(locationId: string, companyData: Partial<Database['public']['Tables']['company_data']['Update']>) {
  const { data, error } = await supabase
    .from('company_data')
    .update(companyData)
    .eq('location_id', locationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateTargetMarketData(locationId: string, marketData: Partial<Database['public']['Tables']['target_market_data']['Update']>) {
  const { data, error } = await supabase
    .from('target_market_data')
    .update(marketData)
    .eq('location_id', locationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
