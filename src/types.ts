// src/components/types.ts
export type UserStatus = 'guest' | 'registered' | 'subscribed' | 'owner';

export interface StoryFormData {
  name: string;
  character: string;
  location: string;
  voiceId: string;
  templateId: string;
  isInteractive: boolean;
}
