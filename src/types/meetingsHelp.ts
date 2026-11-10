/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type MeetingRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface MeetingDecision {
  id: string;
  decision: string;
  recordedBy: string;
  timestamp: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  isCompleted: boolean;
  createdTaskId?: string; // Links to created task in Tasks module
  createdAt: string;
}

export interface MeetingAttendee {
  employeeId: string;
  name: string;
  roleTitle?: string;
  department?: string;
  email?: string;
  avatarUrl?: string;
  hasAttended?: boolean;
  joinedAt?: string;
}

export interface ScheduledMeeting {
  id: string;
  companyId: string;
  title: string;
  agenda: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  locationType: 'online' | 'in_person' | 'hybrid';
  locationDetails?: string; // Physical room name or address
  videoRoomId: string; // unique room derived from companyId + meetingId
  videoJoinUrl: string; // Jitsi link
  recurrence: MeetingRecurrence;
  status: MeetingStatus;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  attendees: MeetingAttendee[];
  minutesNotes?: string;
  decisions?: MeetingDecision[];
  actionItems?: MeetingActionItem[];
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// SUPPORT TICKETS (Mwongozo & Msaada)
// ---------------------------------------------------------------------------

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'training' | 'other';

export interface TicketMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  isOwnerReply: boolean;
  message: string;
  attachmentUrl?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  companyId: string;
  companyName: string;
  userUid: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  initialDescription: string;
  attachmentUrl?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ---------------------------------------------------------------------------
// GETTING STARTED ONBOARDING CHECKLIST ITEM
// ---------------------------------------------------------------------------

export interface OnboardingStepItem {
  id: string;
  titleSw: string;
  titleEn: string;
  descSw: string;
  descEn: string;
  targetTab: string;
  isCompleted: boolean;
}
