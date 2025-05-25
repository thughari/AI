export enum MessageType {
  USER = 'user',
  AGENT = 'agent',
  ERROR = 'error',
}

export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  sources?: Source[];
}

export interface AgentResponse {
  text: string;
  sources?: Source[];
}
