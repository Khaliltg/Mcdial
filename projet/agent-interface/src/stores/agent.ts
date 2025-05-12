import { writable } from 'svelte/store';

export type AgentStatus = 'READY' | 'PAUSED' | 'DIALING' | 'INCALL' | 'WAITING' | 'OFFLINE';

export interface AgentState {
  user: string;
  fullName: string;
  userLevel: number;
  extension: string;
  phoneLogin: string;
  campaignId: string;
  campaignName: string;
  status: AgentStatus;
  callActive: boolean;
  callEnded: boolean;
  leadId: string | null;
  phoneNumber: string | null;
  contactName: string | null;
  callId: string | null;
  callStartTime: Date | null;
  callDuration: number;
  // Call statistics
  callsToday?: number;
  callsAnswered?: number;
  callsAbandoned?: number;
  avgTalkTime?: number;
  avgWaitTime?: number;
}

const initialState: AgentState = {
  user: '',
  fullName: '',
  userLevel: 0,
  extension: '',
  phoneLogin: '',
  campaignId: '',
  campaignName: '',
  status: 'OFFLINE',
  callActive: false,
  callEnded: false,
  leadId: null,
  phoneNumber: null,
  contactName: null,
  callId: null,
  callStartTime: null,
  callDuration: 0,
  // Call statistics with default values
  callsToday: 0,
  callsAnswered: 0,
  callsAbandoned: 0,
  avgTalkTime: 0,
  avgWaitTime: 0
};

export const agentState = writable<AgentState>(initialState);

// Helper functions to update agent state
export function updateAgentStatus(status: AgentStatus) {
  agentState.update(state => ({ ...state, status }));
}

export function startCall(callData: { 
  leadId?: string | null; 
  phoneNumber: string; 
  contactName?: string;
  callId: string;
}) {
  agentState.update(state => ({
    ...state,
    status: 'INCALL',
    callActive: true,
    callEnded: false,
    leadId: callData.leadId || null,
    phoneNumber: callData.phoneNumber,
    contactName: callData.contactName || null,
    callId: callData.callId,
    callStartTime: new Date(),
    callDuration: 0
  }));
}

export function endCall() {
  agentState.update(state => ({
    ...state,
    status: 'WAITING',
    callActive: false,
    callEnded: true
  }));
}

export function resetCall() {
  agentState.update(state => ({
    ...state,
    status: 'READY',
    callActive: false,
    callEnded: false,
    leadId: null,
    phoneNumber: null,
    contactName: null,
    callId: null,
    callStartTime: null,
    callDuration: 0
  }));
}
