import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  receiptUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions)
      if (!session?.user) throw new Error("No autorizado")
      const businessId = (session.user as any).businessId as string
      return { businessId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, businessId: metadata.businessId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
