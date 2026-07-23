const fs = require('fs');
const file = 'app/mahasiswa/laporan/templates/pengantar/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { QrCode } from 'lucide-react';", "import QRCode from 'react-qr-code';");

// find <QrCode size={56} strokeWidth={1.5} />
const qrReplace = `const validationUrl = typeof window !== 'undefined' ? \`\${window.location.origin}/validasi/pengantar/\${data.pengajuan._id}\` : '';
              <QRCode value={validationUrl} size={56} />`;

content = content.replace("<QrCode size={56} strokeWidth={1.5} />", qrReplace);

fs.writeFileSync(file, content);
console.log("updated pengantar");
