import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
    organizerLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(() => ({}))
        .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
