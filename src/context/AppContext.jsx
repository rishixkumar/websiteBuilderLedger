import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadWorkspace, debouncedSave } from '../lib/storage';
import { createEmptyClient } from '../lib/defaults';

const AppContext = createContext(null);

function touchClient(client, patch) {
  return { ...client, ...patch, updatedAt: new Date().toISOString() };
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload, ui: state.ui };

    case 'SET_VIEW':
      return { ...state, ui: { ...state.ui, view: action.view } };

    case 'SELECT_CLIENT':
      return { ...state, ui: { ...state.ui, selectedClientId: action.id } };

    case 'SET_SEARCH':
      return { ...state, ui: { ...state.ui, search: action.search } };

    case 'SET_FILTERS':
      return { ...state, ui: { ...state.ui, filters: { ...state.ui.filters, ...action.filters } } };

    case 'SET_SORT':
      return { ...state, ui: { ...state.ui, sort: action.sort } };

    case 'TOGGLE_SIDEBAR':
      return { ...state, ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed } };

    case 'ADD_CLIENT': {
      const client = action.client || createEmptyClient(action.stageId || 'lead');
      if (action.name) client.name = action.name;
      return { ...state, clients: [...state.clients, client], ui: { ...state.ui, selectedClientId: client.id } };
    }

    case 'UPDATE_CLIENT': {
      const clients = state.clients.map((c) =>
        c.id === action.id ? touchClient(c, action.patch) : c
      );
      return { ...state, clients };
    }

    case 'DELETE_CLIENT': {
      const clients = state.clients.filter((c) => c.id !== action.id);
      const selectedClientId =
        state.ui.selectedClientId === action.id ? null : state.ui.selectedClientId;
      return { ...state, clients, ui: { ...state.ui, selectedClientId } };
    }

    case 'DUPLICATE_CLIENT': {
      const source = state.clients.find((c) => c.id === action.id);
      if (!source) return state;
      const now = new Date().toISOString();
      const copy = {
        ...source,
        id: uuidv4(),
        name: `${source.name} (copy)`,
        starred: false,
        activities: [
          { id: uuidv4(), type: 'note', text: 'Duplicated from another client', at: now },
        ],
        createdAt: now,
        updatedAt: now,
      };
      return { ...state, clients: [...state.clients, copy] };
    }

    case 'SET_CLIENT_FIELD': {
      const clients = state.clients.map((c) => {
        if (c.id !== action.clientId) return c;
        return touchClient(c, {
          fields: { ...c.fields, [action.fieldId]: action.value },
        });
      });
      return { ...state, clients };
    }

    case 'SET_CLIENT_STAGE': {
      const stage = state.settings.pipelineStages.find((s) => s.id === action.stageId);
      const clients = state.clients.map((c) => {
        if (c.id !== action.clientId) return c;
        const activities = [
          {
            id: uuidv4(),
            type: 'stage',
            text: `Moved to ${stage?.label || action.stageId}`,
            at: new Date().toISOString(),
          },
          ...c.activities,
        ];
        return touchClient(c, { stageId: action.stageId, activities });
      });
      return { ...state, clients };
    }

    case 'ADD_ACTIVITY': {
      const clients = state.clients.map((c) => {
        if (c.id !== action.clientId) return c;
        const activity = {
          id: uuidv4(),
          type: action.activityType || 'note',
          text: action.text,
          at: new Date().toISOString(),
        };
        return touchClient(c, { activities: [activity, ...c.activities] });
      });
      return { ...state, clients };
    }

    case 'TOGGLE_STAR': {
      const clients = state.clients.map((c) =>
        c.id === action.id ? touchClient(c, { starred: !c.starred }) : c
      );
      return { ...state, clients };
    }

    case 'SET_THEME':
      return {
        ...state,
        settings: { ...state.settings, theme: action.theme },
      };

    case 'UPDATE_STAGES':
      return {
        ...state,
        settings: { ...state.settings, pipelineStages: action.stages },
      };

    case 'UPDATE_FIELDS':
      return {
        ...state,
        settings: { ...state.settings, fieldDefinitions: action.fields },
      };

    case 'UPDATE_TAGS':
      return {
        ...state,
        settings: { ...state.settings, tags: action.tags },
      };

    case 'IMPORT_WORKSPACE':
      return { ...action.workspace, ui: state.ui };

    case 'SHOW_TOAST':
      return { ...state, ui: { ...state.ui, toast: action.toast } };

    case 'HIDE_TOAST':
      return { ...state, ui: { ...state.ui, toast: null } };

    case 'SET_SAVE_STATUS':
      return { ...state, ui: { ...state.ui, saveStatus: action.status } };

    default:
      return state;
  }
}

const initialUI = {
  view: 'dashboard',
  selectedClientId: null,
  search: '',
  filters: { stageId: '', starred: false, upcomingCall: false },
  sort: 'updated',
  sidebarCollapsed: false,
  toast: null,
  saveStatus: 'saved',
};

function initState() {
  const workspace = loadWorkspace();
  return { ...workspace, ui: initialUI };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    dispatch({ type: 'SET_SAVE_STATUS', status: 'saving' });
    const { ui, ...workspace } = stateRef.current;
    debouncedSave(workspace).then((ok) => {
      dispatch({ type: 'SET_SAVE_STATUS', status: ok ? 'saved' : 'error' });
    });
  }, [state.clients, state.settings, state.version]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'dark');
  }, [state.settings.theme]);

  const showToast = useCallback((message, type = 'success') => {
    dispatch({ type: 'SHOW_TOAST', toast: { message, type } });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2800);
  }, []);

  const value = {
    state,
    dispatch,
    showToast,
    getClient: (id) => state.clients.find((c) => c.id === id),
    getStage: (stageId) => state.settings.pipelineStages.find((s) => s.id === stageId),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
