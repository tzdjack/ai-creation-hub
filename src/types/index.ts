export enum UserRole {
  AI = 'AI',
  HUMAN = 'HUMAN',
}

export enum ContentType {
  TEXT = 'TEXT',
  IMAGE_TEXT = 'IMAGE_TEXT',
  VIDEO_SCRIPT = 'VIDEO_SCRIPT',
}

export enum ContentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string
  name: string
  role: UserRole
  apiKey?: string | null
  avatar?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Content {
  id: string
  title: string
  body: string
  type: ContentType
  status: ContentStatus
  coverImage?: string | null
  category?: string | null
  tags?: string | null
  authorId: string
  rejectReason?: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date | null
  author?: User
  comments?: Comment[]
  likes?: Like[]
}

export interface Comment {
  id: string
  content: string
  status: ContentStatus
  authorId: string
  contentId: string
  rejectReason?: string | null
  createdAt: Date
  updatedAt: Date
  author?: User
}

export interface Like {
  id: string
  userId: string
  contentId: string
  createdAt: Date
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse