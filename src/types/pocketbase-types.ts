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
	Attachments = "attachments",
	Companies = "companies",
	Metadata = "metadata",
	Posts = "posts",
	Projects = "projects",
	Socials = "socials",
	Testimonials = "testimonials",
	Users = "users",
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

export type AttachmentsRecord = {
	attachment: FileNameString
	created: IsoAutoDateString
	id: string
	title: string
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

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AttachmentsResponse<Texpand = unknown> = Required<AttachmentsRecord> & BaseSystemFields<Texpand>
export type CompaniesResponse<Texpand = unknown> = Required<CompaniesRecord> & BaseSystemFields<Texpand>
export type MetadataResponse<Texpand = unknown> = Required<MetadataRecord> & BaseSystemFields<Texpand>
export type PostsResponse<Texpand = unknown> = Required<PostsRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type SocialsResponse<Texpand = unknown> = Required<SocialsRecord> & BaseSystemFields<Texpand>
export type TestimonialsResponse<Texpand = unknown> = Required<TestimonialsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	attachments: AttachmentsRecord
	companies: CompaniesRecord
	metadata: MetadataRecord
	posts: PostsRecord
	projects: ProjectsRecord
	socials: SocialsRecord
	testimonials: TestimonialsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	attachments: AttachmentsResponse
	companies: CompaniesResponse
	metadata: MetadataResponse
	posts: PostsResponse
	projects: ProjectsResponse
	socials: SocialsResponse
	testimonials: TestimonialsResponse
	users: UsersResponse
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
