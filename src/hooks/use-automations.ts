import { create } from "zustand";
import { 
  listAutomations, 
  upsertAutomation, 
  deleteAutomation, 
  listAutomationLogs 
} from "@/lib/platform.functions";

export type AutomationStatus = 'ACTIVA' | 'PAUSADA' | 'BORRADOR';

export interface Automation {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  channel?: string;
  trigger_config: Record<string, any>;
  conditions_config: Record<string, any>[];
  actions_config: Record<string, any>[];
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  trigger_type: string;
  result: string;
  error_message?: string;
  executed_at: string;
  execution_data: any;
}

interface AutomationsState {
  automations: Automation[];
  isLoading: boolean;
  error: string | null;
  
  fetchAutomations: () => Promise<void>;
  saveAutomation: (input: Partial<Automation> & { name: string }) => Promise<Automation>;
  removeAutomation: (id: string) => Promise<void>;
  updateStatus: (id: string, status: AutomationStatus) => Promise<void>;
  getLogs: (automationId?: string, page?: number) => Promise<{ rows: AutomationLog[], total: number }>;
}

export const useAutomationsStore = create<AutomationsState>((set, get) => ({
  automations: [],
  isLoading: false,
  error: null,

  fetchAutomations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await listAutomations();
      set({ automations: data as Automation[], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  saveAutomation: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const { id, ...rest } = input;
      const result = await upsertAutomation({ 
        data: { 
          id, 
          input: {
            name: rest.name,
            description: rest.description,
            status: rest.status ?? 'BORRADOR',
            channel: rest.channel,
            trigger_config: rest.trigger_config ?? {},
            conditions_config: rest.conditions_config ?? [],
            actions_config: rest.actions_config ?? [],
          }
        } 
      });
      await get().fetchAutomations();
      set({ isLoading: false });
      return result as Automation;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  removeAutomation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAutomation({ data: { id } });
      set(state => ({
        automations: state.automations.filter(a => a.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateStatus: async (id, status) => {
    const automation = get().automations.find(a => a.id === id);
    if (!automation) return;
    
    await get().saveAutomation({ ...automation, status });
  },

  getLogs: async (automationId, page = 1) => {
    try {
      const result = await listAutomationLogs({ data: { automation_id: automationId, page } });
      return result as { rows: AutomationLog[], total: number };
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      return { rows: [], total: 0 };
    }
  }
}));
