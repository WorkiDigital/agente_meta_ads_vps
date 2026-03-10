export interface Profile {
    name: string;
    niche: string;
    toneOfVoice: string;
    brandIdentity: string;
    otherDetails: string;
}
export interface ModelPost {
    id: string;
    content: string;
    description: string;
    addedAt: string;
}
export interface PhotoReference {
    id: string;
    filename: string;
    description: string;
    addedAt: string;
}
export interface DatabaseSchema {
    profile: Profile;
    modelPosts: ModelPost[];
    photos: PhotoReference[];
}
export declare function readDb(): DatabaseSchema;
export declare function writeDb(data: DatabaseSchema): void;
export declare function updateProfile(profileContent: Partial<Profile>): Profile;
export declare function addModelPost(content: string, description: string): ModelPost;
export declare function addPhotoReference(filename: string, description: string): PhotoReference;
//# sourceMappingURL=db.d.ts.map