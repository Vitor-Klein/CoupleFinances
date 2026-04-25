import { supabase, type DbTransaction, type DbCoupleProfile } from '../lib/supabase';
import type { Transaction, CoupleProfile, TransactionType, CategoryType, RecurrenceType } from '../types';

const DEFAULT_PROFILE: CoupleProfile = {
  person1Name: 'Eu',
  person1Salary: 0,
  person2Name: 'Parceiro(a)',
  person2Salary: 0,
};

function txFromDb(row: DbTransaction): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type as TransactionType,
    category: row.category as CategoryType,
    date: row.date,
    person: row.person as 'me' | 'partner',
    notes: row.notes ?? undefined,
    isRecurringSalary: row.is_recurring_salary,
    recurrence: (row.recurrence ?? 'none') as RecurrenceType,
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
  };
}

function txToDb(userId: string, tx: Transaction): Omit<DbTransaction, 'created_at'> {
  return {
    id: tx.id,
    user_id: userId,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    date: tx.date,
    person: tx.person,
    notes: tx.notes ?? null,
    is_recurring_salary: tx.isRecurringSalary ?? false,
    recurrence: tx.recurrence && tx.recurrence !== 'none' ? tx.recurrence : null,
    recurrence_group_id: tx.recurrenceGroupId ?? null,
  };
}

function profileFromDb(row: DbCoupleProfile): CoupleProfile {
  return {
    person1Name: row.person1_name,
    person1Salary: Number(row.person1_salary),
    person2Name: row.person2_name,
    person2Salary: Number(row.person2_salary),
  };
}

export const StorageService = {
  async loadTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(txFromDb);
  },

  async insertTransaction(userId: string, tx: Transaction): Promise<void> {
    const { error } = await supabase.from('transactions').insert(txToDb(userId, tx));
    if (error) throw error;
  },

  async insertTransactions(userId: string, txs: Transaction[]): Promise<void> {
    const { error } = await supabase.from('transactions').insert(txs.map((t) => txToDb(userId, t)));
    if (error) throw error;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const dbUpdates: Partial<DbTransaction> = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.person !== undefined) dbUpdates.person = updates.person;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;
    if (updates.recurrence !== undefined)
      dbUpdates.recurrence = updates.recurrence !== 'none' ? updates.recurrence : null;

    const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async updateTransactionsByGroup(
    groupId: string,
    fromDate: string,
    updates: Partial<Transaction>,
  ): Promise<void> {
    const dbUpdates: Partial<DbTransaction> = {};
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.person !== undefined) dbUpdates.person = updates.person;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes ?? null;

    const { error } = await supabase
      .from('transactions')
      .update(dbUpdates)
      .eq('recurrence_group_id', groupId)
      .gte('date', fromDate);
    if (error) throw error;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteTransactionsByGroup(groupId: string, fromDate: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('recurrence_group_id', groupId)
      .gte('date', fromDate);
    if (error) throw error;
  },

  async loadProfile(userId: string): Promise<CoupleProfile> {
    const { data, error } = await supabase
      .from('couple_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? profileFromDb(data) : DEFAULT_PROFILE;
  },

  async upsertProfile(userId: string, profile: CoupleProfile): Promise<void> {
    const { error } = await supabase.from('couple_profiles').upsert(
      {
        user_id: userId,
        person1_name: profile.person1Name,
        person1_salary: profile.person1Salary,
        person2_name: profile.person2Name,
        person2_salary: profile.person2Salary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
  },
};
