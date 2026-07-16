import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

export const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? "",
    region: "us-east-1", // Minio mengabaikan ini, tapi tetap wajib diisi
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
    },
    forcePathStyle: true, // Wajib true untuk Minio
});

/**
 * Mengupload base64 string ke MinIO
 * @param {string} base64String - Data URI base64 (e.g. data:image/jpeg;base64,...)
 * @param {string} folderPrefix - Folder prefix (e.g. "logbook")
 * @returns {Promise<string>} URL file di MinIO
 */
export async function uploadToMinio(base64String, folderPrefix = "uploads") {
    if (!base64String || !base64String.startsWith('data:')) return base64String;

    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            throw new Error('Format base64 tidak valid');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Menentukan ekstensi berdasarkan mimeType
        let extension = 'bin';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
        else if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('pdf')) extension = 'pdf';
        
        const fileName = `${folderPrefix}/${Date.now()}-${uuidv4()}.${extension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.MINIO_BUCKET ?? "",
            Key: fileName,
            Body: buffer,
            ContentType: mimeType,
            // ACL: 'public-read' // Tidak digunakan jika bucket tidak public
        });

        await s3Client.send(command);

        // Mengembalikan format URL absolute
        return `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${fileName}`;
    } catch (err) {
        console.error("Gagal upload file ke Minio:", err);
        throw err;
    }
}

/**
 * Menerima URL file mentah, jika URL tersebut dari MinIO, 
 * akan mengembalikan Signed URL sementara yang bisa diakses publik.
 */
export async function generatePresignedUrl(fileUrl) {
    if (!fileUrl || !process.env.MINIO_ENDPOINT) return fileUrl;

    try {
        const prefix = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/`;
        if (fileUrl.startsWith(prefix)) {
            const key = fileUrl.replace(prefix, "");
            const command = new GetObjectCommand({
                Bucket: process.env.MINIO_BUCKET ?? "",
                Key: decodeURIComponent(key),
            });
            // URL berlaku selama 1 jam (3600 detik)
            return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        }
    } catch (err) {
        console.error("Gagal membuat presigned URL:", err);
    }
    return fileUrl;
}

/**
 * Menghapus file dari MinIO berdasarkan URL-nya
 */
export async function deleteFromMinio(fileUrl) {
    if (!fileUrl || !process.env.MINIO_ENDPOINT) return;

    try {
        const prefix = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/`;
        if (fileUrl.startsWith(prefix)) {
            const key = fileUrl.replace(prefix, "");
            const command = new DeleteObjectCommand({
                Bucket: process.env.MINIO_BUCKET ?? "",
                Key: decodeURIComponent(key),
            });
            await s3Client.send(command);
        }
    } catch (err) {
        console.error("Gagal menghapus file dari Minio:", err);
    }
}
