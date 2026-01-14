import type { AttachmentsResponse, MetadataResponse, SocialsResponse } from "./pocketbase-types";

export type ProjectExpand = {
    coverImage: AttachmentsResponse;
    projectDetails: MetadataResponse[];
};

export type ProjectInfoExpand = {
    coverImage: AttachmentsResponse;
    coverVideo: AttachmentsResponse;
    brochure: AttachmentsResponse;
    socials: SocialsResponse[];
    projectDetails: MetadataResponse[];
}

export interface Address {
    name: string;
    state?: string;
    suburb?: string;
    postcode?: string;
    county?: string;
    district?: string;
}

export type PostInfoExpand = {
    featuredImage: AttachmentsResponse;
    category: MetadataResponse[];
}

export type TestimonialInfoExpand = {
    authorAvatar: AttachmentsResponse;
}
