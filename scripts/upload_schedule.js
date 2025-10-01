const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function main() {
  const token = process.env.VERCEL_BLOB_RW;
  if (!token) {
    throw new Error('VERCEL_BLOB_RW environment variable is not set');
  }

  const filePath = path.resolve(__dirname, '..', 'data', 'schedule.json');
  const fileContent = fs.readFileSync(filePath);

  const blob = await put('schedule.json', fileContent, {
    access: 'public',
    token: token,
  });

  // Print the URL to stdout to be captured by the workflow
  console.log(blob.url);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
