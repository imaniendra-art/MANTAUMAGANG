const fs = require('fs');
const file = 'app/mahasiswa/laporan/cetak/transkrip/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { QrCode } from 'lucide-react';", "import QRCode from 'react-qr-code';");

const qrIconReplace = `              {typeof window !== 'undefined' && data?.laporan?._id && (
                <QRCode value={\`\${window.location.origin}/validasi/transkrip/\${data.laporan._id}\`} size={48} />
              )}`;
content = content.replace("<QrCode size={48} strokeWidth={1.5} />", qrIconReplace);

const oldImgReplace = `<img src={qrCodeUrl} alt="QR Code SKPI" className="w-24 h-24 border border-slate-300 p-1 bg-white mb-2" />`;
const newImgReplace = `{typeof window !== 'undefined' && data?.laporan?._id && (
                <div className="w-24 h-24 border border-slate-300 p-1 bg-white mb-2 flex items-center justify-center">
                  <QRCode value={\`\${window.location.origin}/validasi/transkrip/\${data.laporan._id}\`} size={86} />
                </div>
              )}`;
content = content.replace(oldImgReplace, newImgReplace);

fs.writeFileSync(file, content);
console.log("updated transkrip");
