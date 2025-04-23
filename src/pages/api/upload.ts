import { NextApiRequest, NextApiResponse } from 'next';
import { s3Client } from '../../components/awsConfig';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import formidable, { Fields, Files } from 'formidable';
import { createReadStream } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const key = Array.isArray(fields.key) ? fields.key[0] : fields.key;
    const bucket = Array.isArray(fields.bucket) ? fields.bucket[0] : fields.bucket;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !key || !bucket) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const fileStream = createReadStream(file.filepath);
    const contentType = file.mimetype || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const url = `https://${bucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
    
    return res.status(200).json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
} 