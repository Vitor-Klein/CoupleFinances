import {
  supabase,
  type DbTransaction,
  type DbCoupleProfile,
  type DbCouple,
  type DbBudget,
  type DbGoal,
  type DbCustomCategory,
} from '../lib/supabase';
import type {
  Transaction,
  CoupleProfile,
  Couple,
  Budget,
  Goal,
  CustomCategory,
  TransactionType,
  CategoryType,
  RecurrenceType,
  PersonKey,
} from '../types';

const DEFAULT_PROFILE: CoupleProfile = {
  person1Name: 'Eu',
  person1Salary: 0,
  person1Reserve: 0,
  person2Name: 'Parceiro(a)',
  person2Salary: 0,
  person2Reserve: 0,
};

export function txFromDb(row: DbTransaction): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type as TransactionType,
    category: row.category as CategoryType,
    date: row.date,
    person: row.person as PersonKey,
    notes: row.notes ?? undefined,
    isRecurringSalary: row.is_recurring_salary,
    recurrence: (row.recurrence ?? 'none') as RecurrenceType,
    recurrenceGroupId: row.recurrence_group_id ?? undefined,
  };
}

function txToDb(
  userId: string,
  coupleId: string,
  tx: Transaction,
): Omit<DbTransaction, 'created_at'> {
  return {
    id: tx.id,
    user_id: userId,
    couple_id: coupleId,
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

export function profileFromDb(row: DbCoupleProfile): CoupleProfile {
  return {
    person1Name: row.person1_name,
    person1Salary: Number(row.person1_salary),
    person1Reserve: Number(row.person1_reserve ?? 0),
    person2Name: row.person2_name,
    person2Salary: Number(row.person2_salary),
    person2Reserve: Number(row.person2_reserve ?? 0),
  };
}

function coupleFromDb(row: DbCouple): Couple {
  return {
    id: row.id,
    person1UserId: row.person1_user_id,
    person2UserId: row.person2_user_id,
    inviteCode: row.invite_code,
  };
}

export function budgetFromDb(row: DbBudget): Budget {
  return { id: row.id, category: row.category, amount: Number(row.amount) };
}

export function goalFromDb(row: DbGoal): Goal {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    targetDate: row.target_date ?? undefined,
  };
}

export function customCategoryFromDb(row: DbCustomCategory): CustomCategory {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    emoji: row.emoji,
    color: row.color,
    type: row.type as TransactionType,
  };
}

function transformUpdates(updates: Partial<Transaction>): Partial<DbTransaction> {
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
  return dbUpdates;
}

export const StorageService = {
  // ---------- Casal ----------
  async loadCouple(): Promise<Couple | null> {
    const { data, error } = await supabase.from('couples').select('*').maybeSingle();
    if (error) throw error;
    return data ? coupleFromDb(data) : null;
  },

  async createCouple(): Promise<Couple> {
    const { data, error } = await supabase.rpc('create_couple');
    if (error) throw error;
    return coupleFromDb(data as DbCouple);
  },

  async joinCouple(code: string): Promise<Couple> {
    const { data, error } = await supabase.rpc('join_couple', { code });
    if (error) throw error;
    return coupleFromDb(data as DbCouple);
  },

  async regenerateInviteCode(): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_invite_code');
    if (error) throw error;
    return data as string;
  },

  async deleteMyAccount(): Promise<void> {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
  },

  // ---------- Transações ----------
  async loadTransactions(coupleId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(txFromDb);
  },

  async insertTransactions(userId: string, coupleId: string, txs: Transaction[]): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert(txs.map((t) => txToDb(userId, coupleId, t)));
    if (error) throw error;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update(transformUpdates(updates))
      .eq('id', id);
    if (error) throw error;
  },

  async updateTransactionsByGroup(
    groupId: string,
    fromDate: string,
    updates: Partial<Transaction>,
  ): Promise<void> {
    const dbUpdates = transformUpdates(updates);
    delete dbUpdates.date; // a data de cada ocorrência da série é preservada
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

  /** Marca uma série recorrente como encerrada (a auto-extensão para de gerar futuras) */
  async endRecurrenceSeries(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ recurrence: null })
      .eq('recurrence_group_id', groupId);
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

  // ---------- Perfil ----------
  async loadProfile(coupleId: string): Promise<CoupleProfile> {
    const { data, error } = await supabase
      .from('couple_profiles')
      .select('*')
      .eq('couple_id', coupleId)
      .maybeSingle();
    if (error) throw error;
    return data ? profileFromDb(data) : DEFAULT_PROFILE;
  },

  async upsertProfile(userId: string, coupleId: string, profile: CoupleProfile): Promise<void> {
    const { error } = await supabase.from('couple_profiles').upsert(
      {
        user_id: userId,
        couple_id: coupleId,
        person1_name: profile.person1Name,
        person1_salary: profile.person1Salary,
        person1_reserve: profile.person1Reserve,
        person2_name: profile.person2Name,
        person2_salary: profile.person2Salary,
        person2_reserve: profile.person2Reserve,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'couple_id' },
    );
    if (error) throw error;
  },

  // ---------- Orçamentos ----------
  async loadBudgets(coupleId: string): Promise<Budget[]> {
    const { data, error } = await supabase.from('budgets').select('*').eq('couple_id', coupleId);
    if (error) throw error;
    return (data ?? []).map(budgetFromDb);
  },

  async upsertBudget(coupleId: string, category: string, amount: number): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ couple_id: coupleId, category, amount }, { onConflict: 'couple_id,category' })
      .select()
      .single();
    if (error) throw error;
    return budgetFromDb(data as DbBudget);
  },

  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- Metas ----------
  async loadGoals(coupleId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(goalFromDb);
  },

  async insertGoal(coupleId: string, goal: Goal): Promise<void> {
    const { error } = await supabase.from('goals').insert({
      id: goal.id,
      couple_id: coupleId,
      name: goal.name,
      emoji: goal.emoji,
      target_amount: goal.targetAmount,
      saved_amount: goal.savedAmount,
      target_date: goal.targetDate ?? null,
    });
    if (error) throw error;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const dbUpdates: Partial<DbGoal> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.savedAmount !== undefined) dbUpdates.saved_amount = updates.savedAmount;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate ?? null;
    const { error } = await supabase.from('goals').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- Categorias customizadas ----------
  async loadCustomCategories(coupleId: string): Promise<CustomCategory[]> {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(customCategoryFromDb);
  },

  async insertCustomCategory(coupleId: string, category: CustomCategory): Promise<void> {
    const { error } = await supabase.from('custom_categories').insert({
      id: category.id,
      couple_id: coupleId,
      key: category.key,
      label: category.label,
      emoji: category.emoji,
      color: category.color,
      type: category.type,
    });
    if (error) throw error;
  },

  async deleteCustomCategory(id: string): Promise<void> {
    const { error } = await supabase.from('custom_categories').delete().eq('id', id);
    if (error) throw error;
  },
};
