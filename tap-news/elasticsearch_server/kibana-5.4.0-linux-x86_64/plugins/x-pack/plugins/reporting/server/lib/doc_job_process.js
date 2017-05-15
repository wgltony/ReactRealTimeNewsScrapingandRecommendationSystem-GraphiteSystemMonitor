import { omit } from 'lodash';
import { oncePerServer } from './once_per_server';
import { generateDocumentFactory } from './generate_document';
import { cryptoFactory } from './crypto';

const KBN_SCREENSHOT_HEADER_BLACKLIST = [
  'accept-encoding',
  'content-length',
  'content-type',
  'host'
];

function docJobProcessFn(server) {
  const { printablePdf } = generateDocumentFactory(server);
  const crypto = cryptoFactory(server);

  return async function docJobProcess(job) {
    const { title, objects, query, headers:serializedEncryptedHeaders } = job;
    let decryptedHeaders;

    try {
      decryptedHeaders = await crypto.decrypt(serializedEncryptedHeaders);
    } catch (e) {
      throw new Error('Failed to decrypt report job data. Please re-generate this report.');
    };

    const headers = omit(decryptedHeaders, KBN_SCREENSHOT_HEADER_BLACKLIST);
    const pdfDoc = await printablePdf(title, objects, query, headers);
    return {
      contentType: 'application/pdf',
      buffer: await pdfDoc.getBuffer(),
    };
  };
}

export const docJobProcessFactory = oncePerServer(docJobProcessFn);
