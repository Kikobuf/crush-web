// Mirrors github.com/charmbracelet/crush/internal/proto (Go), so this
// file should stay in lockstep with that package if Crush's API changes.
// Pulled directly from source, not guessed from docs, since crush serve's
// wire format isn't published anywhere outside the codebase.

export interface Workspace {
  id: string;
  path: string;
  yolo?: boolean;
  debug?: boolean;
  data_dir?: string;
  version?: string;
  client_id?: string;
  env?: string[];
  channels?: string[];
  skills?: SkillState[];
}

export interface SkillState {
  id: string;
  name: string;
  description: string;
  label: string;
  source: string;
  user_invocable: boolean;
}

export interface Todo {
  content: string;
  status: string;
  active_form: string;
}

export interface Session {
  id: string;
  parent_session_id: string;
  title: string;
  message_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  summary_message_id: string;
  cost: number;
  todos?: Todo[];
  created_at: number;
  updated_at: number;
  is_busy: boolean;
  attached_clients: number;
}

export type MessageRole = "assistant" | "user" | "system" | "tool";

export type FinishReason =
  | "end_turn"
  | "max_tokens"
  | "tool_use"
  | "canceled"
  | "error"
  | "unknown";

export interface ReasoningPart {
  type: "reasoning";
  data: { thinking: string; signature: string; started_at?: number; finished_at?: number };
}
export interface TextPart {
  type: "text";
  data: { text: string };
}
export interface ImageURLPart {
  type: "image_url";
  data: { url: string; detail?: string };
}
export interface BinaryPart {
  type: "binary";
  data: { Path: string; MIMEType: string; Data: string };
}
export interface ToolCallPart {
  type: "tool_call";
  data: { id: string; name: string; input: string; type?: string; finished?: boolean };
}
export interface ToolResultPart {
  type: "tool_result";
  data: {
    tool_call_id: string;
    name: string;
    content: string;
    data?: string;
    mime_type?: string;
    metadata: string;
    is_error: boolean;
  };
}
export interface FinishPart {
  type: "finish";
  data: { reason: FinishReason; time: number; message?: string; details?: string };
}
export interface ShellCommandPart {
  type: "shell_command";
  data: { command: string; output: string; exit_code: number };
}

export type ContentPart =
  | ReasoningPart
  | TextPart
  | ImageURLPart
  | BinaryPart
  | ToolCallPart
  | ToolResultPart
  | FinishPart
  | ShellCommandPart;

export interface Message {
  id: string;
  role: MessageRole;
  session_id: string;
  parts: ContentPart[];
  model: string;
  provider: string;
  created_at: number;
  updated_at: number;
}

export interface Attachment {
  file_path: string;
  file_name: string;
  mime_type: string;
  content: string; // base64
}

export interface AgentMessage {
  session_id: string;
  run_id?: string;
  prompt: string;
  attachments?: Attachment[];
}

export type PermissionAction = "allow" | "allow_session" | "deny";

export interface PermissionRequest {
  id: string;
  session_id: string;
  tool_call_id: string;
  tool_name: string;
  description: string;
  action: string;
  path: string;
  params: unknown;
}

export interface PermissionGrant {
  permission: PermissionRequest;
  action: PermissionAction;
}

export interface QuestionChoice {
  id: string;
  label: string;
  description?: string;
}

export interface QuestionItem {
  id: string;
  type: string;
  label?: string;
  question: string;
  description?: string;
  choices?: QuestionChoice[];
}

export interface QuestionRequest {
  id: string;
  session_id: string;
  tool_call_id: string;
  questions: QuestionItem[];
  confirm_title?: string;
  confirm_description?: string;
}

export interface QuestionResponse {
  request_id: string;
  selected_ids?: string[];
  fill_in_text?: string;
  yes?: boolean;
  notes?: Record<string, string>;
}

export interface QuestionAnswer {
  batch_request_id: string;
  responses: QuestionResponse[];
}

// --- SSE envelope -----------------------------------------------------
// A frame is `data: <JSON of SSEFrame>\n\n`. `payload` itself is always
// a pubsub.Event[T]-shaped `{ type: "created"|"updated"|"deleted", payload: T }`,
// even for "instantaneous" events like permission requests.

export type SSEPayloadType =
  | "lsp_event"
  | "mcp_event"
  | "permission_request"
  | "permission_notification"
  | "message"
  | "session"
  | "file"
  | "agent_event"
  | "config_changed"
  | "skills_event"
  | "run_complete"
  | "update_available"
  | "question_batch_request"
  | "question_batch_notification";

export type EventType = "created" | "updated" | "deleted";

export interface SSEFrame<T = unknown> {
  type: SSEPayloadType;
  payload: {
    type: EventType;
    payload: T;
  };
}

export interface RunComplete {
  session_id: string;
  run_id?: string;
  message_id: string;
  text?: string;
  error?: string;
  cancelled?: boolean;
}

export interface PermissionNotification {
  tool_call_id: string;
  granted: boolean;
  denied: boolean;
}

export interface QuestionNotification {
  batch_id: string;
}
