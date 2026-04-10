// frontend/src/stores/authStore.ts

import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { API_BASE_URL } from '@/config';


export interface Company {
    id: string;
    business_name: string;
    industry?: string;
    logo_url?: string;
    status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
}

interface CompanyMembership {
    role: 'ADMIN' | 'MANAGER' | 'VIEWER';
    company_id: string;
    companies: Company;
}

export interface WorkspaceMembership {
    workspace_id: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "VIEWER";
    full_names: string;
    email: string;
    workspaces: {
        id: string;
        name: string;
        status: "ACTIVE" | "PENDING" | "SUSPENDED";
    };
}

interface AuthState {
    user: User | null;
    session: Session | null;
    workspaces: WorkspaceMembership[];
    companies: CompanyMembership[];

    activeWorkspace: WorkspaceMembership | null;
    activeCompany: CompanyMembership | null;
    loading: boolean;
    error: string | null;
    isWorkspaceActive: () => boolean;
    isWorkspacePending: () => boolean;
    isWorkspaceSuspended: () => boolean;
    getCompanyRole: (companyId: string) => string | null;
    checkUser: () => void;
    login: (email: string, password: string) => Promise<void>;
    loadContext: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    workspaces: [],
    companies: [],
    activeWorkspace: null,
    activeCompany: null,
    loading: false,
    error: null,

    isWorkspaceActive: () =>
        get().activeWorkspace?.workspaces.status === 'ACTIVE',

    isWorkspacePending: () =>
        get().activeWorkspace?.workspaces.status === 'PENDING',

    isWorkspaceSuspended: () =>
        get().activeWorkspace?.workspaces.status === 'SUSPENDED',

    getCompanyRole: (companyId: string) => {
        const membership = get().companies.find(
            (c) => c.company_id === companyId
        );
        return membership?.role ?? null;
    },


    checkUser: async () => {
        set({ loading: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            set({ user: null, session: null, loading: false });
            return;
        }

        set({ user: session.user, session });
        await get().loadContext();
        set({ loading: false });
    },

    login: async (email, password) => {
        set({ loading: true, error: null });

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            set({ error: error.message, loading: false });
            throw error;
        }

        set({ user: data.user, session: data.session });
        await get().loadContext();
        set({ loading: false });
    },

    loadContext: async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const res = await fetch(`${API_BASE_URL}/me/context`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const context = await res.json();

            set({
                workspaces: context.workspaces ?? [],
                companies: context.companies ?? [],
                activeWorkspace: context.workspaces?.[0] ?? null,
                activeCompany: context.companies?.[0] ?? null,
            });
        } catch (err) {
            console.error("Failed to load context", err);
        }
    },

    logout: async () => {
        set({ loading: true, error: null });
        const { error } = await supabase.auth.signOut();
        if (error) {
            set({ error: error.message, loading: false });
        } else {
            set({
                user: null,
                session: null,
                workspaces: [],
                activeWorkspace: null,
                loading: false,
            });
        }
    },
}));
