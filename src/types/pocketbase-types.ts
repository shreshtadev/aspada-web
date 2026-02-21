/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Agents = "agents",
	Attachments = "attachments",
	ChatCache = "chat_cache",
	ChatLogs = "chat_logs",
	Companies = "companies",
	Documents = "documents",
	LeadActivities = "leadActivities",
	Leads = "leads",
	Metadata = "metadata",
	Posts = "posts",
	Processes = "processes",
	Projects = "projects",
	Socials = "socials",
	Testimonials = "testimonials",
	Users = "users",
	Ventures = "ventures",
}

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

export type GeoPoint = {
	lon: number
	lat: number
}

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export enum AgentsRoleOptions {
	"Admin" = "Admin",
	"Agent" = "Agent",
	"Manager" = "Manager",
}
export type AgentsRecord = {
	contactPhone: string
	created: IsoAutoDateString
	displayName?: string
	id: string
	isActive?: boolean
	role?: AgentsRoleOptions
	staffUser?: RecordIdString
	updated: IsoAutoDateString
}

export type AttachmentsRecord = {
	attachment: FileNameString
	created: IsoAutoDateString
	id: string
	title: string
	updated: IsoAutoDateString
}

export type ChatCacheRecord<Tembedding = unknown> = {
	answer?: string
	created: IsoAutoDateString
	embedding?: null | Tembedding
	helpful_count?: number
	hitCount?: number
	id: string
	isSemantic?: boolean
	question?: string
	unhelpful_count?: number
	updated: IsoAutoDateString
}

export enum ChatLogsRoleOptions {
	"user" = "user",
	"model" = "model",
}
export type ChatLogsRecord<Tmetadata = unknown> = {
	content?: string
	created: IsoAutoDateString
	id: string
	metadata?: null | Tmetadata
	role?: ChatLogsRoleOptions
	sessionId?: string
	updated: IsoAutoDateString
}

export type CompaniesRecord = {
	addressLine1?: string
	city?: string
	companyAlternatePhone1?: string
	companyAlternatePhone2?: string
	companyFacebook?: string
	companyInsta?: string
	companyMainEmail?: string
	companyMainPhone?: string
	companyName: string
	companyYoutube?: string
	created: IsoAutoDateString
	id: string
	pincode?: string
	state?: string
	updated: IsoAutoDateString
}

export type DocumentsRecord = {
	attachments?: FileNameString[]
	created: IsoAutoDateString
	id: string
	slug: string
	step?: RecordIdString
	title: string
	updated: IsoAutoDateString
}

export enum LeadActivitiesContactTypeOptions {
	"Call" = "Call",
	"Whatsapp" = "Whatsapp",
	"Email" = "Email",
	"Site Visit" = "Site Visit",
	"Note" = "Note",
}
export type LeadActivitiesRecord = {
	completedAt?: string
	contactType?: LeadActivitiesContactTypeOptions
	created: IsoAutoDateString
	createdBy?: RecordIdString
	id: string
	lead?: RecordIdString
	note?: string
	scheduledAt?: string
	updated: IsoAutoDateString
}

export enum LeadsStatusOptions {
	"New" = "New",
	"Contacted" = "Contacted",
	"Qualified" = "Qualified",
	"Site Visit" = "Site Visit",
	"Negotiation" = "Negotiation",
	"Closed" = "Closed",
	"Lost" = "Lost",
}

export enum LeadsSourceOptions {
	"aspadaChat" = "aspadaChat",
	"aspadaForms" = "aspadaForms",
	"website" = "website",
	"referral" = "referral",
	"portal" = "portal",
	"ads" = "ads",
	"walkin" = "walkin",
}
export type LeadsRecord = {
	assignedAgent?: RecordIdString
	budgetMax?: number
	budgetMin?: number
	contactEmail?: string
	contactNo?: string
	created: IsoAutoDateString
	fullName?: string
	id: string
	interest?: string
	preferredLocation?: string
	source?: LeadsSourceOptions
	status?: LeadsStatusOptions
	updated: IsoAutoDateString
}

export enum MetadataCategoryTypeOptions {
	"amenity" = "amenity",
	"postCategory" = "postCategory",
	"tag" = "tag",
	"specification" = "specification",
	"statsSettings" = "statsSettings",
	"contactSettings" = "contactSettings",
	"gallery" = "gallery",
}
export type MetadataRecord = {
	attachments?: RecordIdString[]
	categoryType?: MetadataCategoryTypeOptions
	id: string
	showInTiles?: boolean
	summary?: string
	title: string
}

export enum PostsIsPublishedOptions {
	"draft" = "draft",
	"published" = "published",
}
export type PostsRecord = {
	category?: RecordIdString[]
	content?: HTMLString
	created: IsoAutoDateString
	featuredImage?: RecordIdString
	id: string
	isPublished?: PostsIsPublishedOptions
	title: string
	updated: IsoAutoDateString
}

export enum ProcessesStatusOptions {
	"todo" = "todo",
	"in_progress" = "in_progress",
	"review" = "review",
	"done" = "done",
}
export type ProcessesRecord = {
	created: IsoAutoDateString
	id: string
	parent?: RecordIdString
	project?: RecordIdString
	sequence?: number
	status?: ProcessesStatusOptions
	title?: string
	updated: IsoAutoDateString
}

export enum ProjectsCategoryOptions {
	"residential" = "residential",
	"commercial" = "commercial",
	"plots" = "plots",
}

export enum ProjectsStatusOptions {
	"upcoming" = "upcoming",
	"completed" = "completed",
	"ongoing" = "ongoing",
}
export type ProjectsRecord = {
	addressLine1?: string
	brochure?: RecordIdString
	category?: ProjectsCategoryOptions
	city?: string
	coverImage?: RecordIdString
	coverVideo?: RecordIdString
	created: IsoAutoDateString
	description?: HTMLString
	district?: string
	id: string
	location?: GeoPoint
	pincode?: string
	projectDetails?: RecordIdString[]
	slug?: string
	socials?: RecordIdString[]
	state?: string
	status?: ProjectsStatusOptions
	title: string
	updated: IsoAutoDateString
}

export enum SocialsShareUrlTypeOptions {
	"instagram" = "instagram",
	"facebook" = "facebook",
	"youtube" = "youtube",
}
export type SocialsRecord = {
	created: IsoAutoDateString
	id: string
	shareUrl?: string
	shareUrlType?: SocialsShareUrlTypeOptions
	title: string
	updated: IsoAutoDateString
}

export enum TestimonialsSourceOptions {
	"web" = "web",
	"email" = "email",
	"twitter" = "twitter",
	"facebook" = "facebook",
}
export type TestimonialsRecord = {
	authorAvatar?: RecordIdString
	authorAvatarUrl?: string
	authorName: string
	authorRole?: string
	content?: HTMLString
	created: IsoAutoDateString
	id: string
	project?: RecordIdString
	rating?: number
	source?: TestimonialsSourceOptions
	updated: IsoAutoDateString
}

export enum UsersRoleOptions {
	"admin" = "admin",
	"staff" = "staff",
}
export type UsersRecord = {
	avatar?: FileNameString
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	role?: UsersRoleOptions
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type VenturesRecord = {
	created: IsoAutoDateString
	id: string
	slug: string
	title: string
	updated: IsoAutoDateString
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AgentsResponse<Texpand = unknown> = Required<AgentsRecord> & BaseSystemFields<Texpand>
export type AttachmentsResponse<Texpand = unknown> = Required<AttachmentsRecord> & BaseSystemFields<Texpand>
export type ChatCacheResponse<Tembedding = unknown, Texpand = unknown> = Required<ChatCacheRecord<Tembedding>> & BaseSystemFields<Texpand>
export type ChatLogsResponse<Tmetadata = unknown, Texpand = unknown> = Required<ChatLogsRecord<Tmetadata>> & BaseSystemFields<Texpand>
export type CompaniesResponse<Texpand = unknown> = Required<CompaniesRecord> & BaseSystemFields<Texpand>
export type DocumentsResponse<Texpand = unknown> = Required<DocumentsRecord> & BaseSystemFields<Texpand>
export type LeadActivitiesResponse<Texpand = unknown> = Required<LeadActivitiesRecord> & BaseSystemFields<Texpand>
export type LeadsResponse<Texpand = unknown> = Required<LeadsRecord> & BaseSystemFields<Texpand>
export type MetadataResponse<Texpand = unknown> = Required<MetadataRecord> & BaseSystemFields<Texpand>
export type PostsResponse<Texpand = unknown> = Required<PostsRecord> & BaseSystemFields<Texpand>
export type ProcessesResponse<Texpand = unknown> = Required<ProcessesRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type SocialsResponse<Texpand = unknown> = Required<SocialsRecord> & BaseSystemFields<Texpand>
export type TestimonialsResponse<Texpand = unknown> = Required<TestimonialsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type VenturesResponse<Texpand = unknown> = Required<VenturesRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	agents: AgentsRecord
	attachments: AttachmentsRecord
	chat_cache: ChatCacheRecord
	chat_logs: ChatLogsRecord
	companies: CompaniesRecord
	documents: DocumentsRecord
	leadActivities: LeadActivitiesRecord
	leads: LeadsRecord
	metadata: MetadataRecord
	posts: PostsRecord
	processes: ProcessesRecord
	projects: ProjectsRecord
	socials: SocialsRecord
	testimonials: TestimonialsRecord
	users: UsersRecord
	ventures: VenturesRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	agents: AgentsResponse
	attachments: AttachmentsResponse
	chat_cache: ChatCacheResponse
	chat_logs: ChatLogsResponse
	companies: CompaniesResponse
	documents: DocumentsResponse
	leadActivities: LeadActivitiesResponse
	leads: LeadsResponse
	metadata: MetadataResponse
	posts: PostsResponse
	processes: ProcessesResponse
	projects: ProjectsResponse
	socials: SocialsResponse
	testimonials: TestimonialsResponse
	users: UsersResponse
	ventures: VenturesResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
