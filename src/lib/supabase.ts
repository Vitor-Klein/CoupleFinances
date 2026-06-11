import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbCouple = {
  id: string;
  person1_user_id: string | null;
  person2_user_id: string | null;
  invite_code: string;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  user_id: string;
  couple_id: string;
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
  user_id: string | null;
  couple_id: string;
  person1_name: string;
  person1_salary: number;
  person1_reserve: number;
  person2_name: string;
  person2_salary: number;
  person2_reserve: number;
  updated_at: string;
};

export type DbBudget = {
  id: string;
  couple_id: string;
  category: string;
  amount: number;
  created_at: string;
};

export type DbGoal = {
  id: string;
  couple_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  created_at: string;
};

export type DbCustomCategory = {
  id: string;
  couple_id: string;
  key: string;
  label: string;
  emoji: string;
  color: string;
  type: string;
  created_at: string;
};
