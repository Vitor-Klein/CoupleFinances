import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbTransaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  person: string;
  notes: string | null;
  is_recurring_salary: boolean;
  recurrence: string | null;
  recurrence_group_id: string | null;
  created_at: string;
};

export type DbCoupleProfile = {
  id: string;
  user_id: string;
  person1_name: string;
  person1_salary: number;
  person2_name: string;
  person2_salary: number;
  updated_at: string;
};
