const fs = require('fs');

const path = 'app/mahasiswa/laporan/templates/pengesahan/page.js';
let content = fs.readFileSync(path, 'utf8');

// Add config state
if (!content.includes('const [config, setConfig] = useState(null)')) {
  content = content.replace(
    'const [data, setData] = useState(null);',
    'const [data, setData] = useState(null);\n  const [config, setConfig] = useState(null);'
  );
}

// Add QrCode import
if (!content.includes("import { QrCode } from 'lucide-react'")) {
  content = content.replace(
    "import { useSession } from 'next-auth/react';",
    "import { useSession } from 'next-auth/react';\nimport { QrCode } from 'lucide-react';"
  );
}

// Fetch config in useEffect
if (!content.includes('/api/config')) {
  content = content.replace(
    'setData(d);',
    'setData(d);\n            return fetch("/api/config");\n          })\n          .then(res => res?.json())\n          .then(c => {\n            if (c) setConfig(c);'
  );
}

// Replace static Kaprodi block
const staticKaprodi = `
          <div className="mt-20 text-center">
            <p>Mengetahui,</p>
            <p className="mb-24">Ketua Program Studi Manajemen</p>
            <p className="font-bold underline">(..................................................)</p>
            <p>NIDN. </p>
          </div>
`;

const dynamicKaprodi = `
          <div className="mt-20 text-center flex flex-col items-center">
            <p>Mengetahui,</p>
            <p className="mb-6">{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
            <div className="mb-6 p-2 border-2 border-slate-800 inline-flex flex-col items-center justify-center opacity-80 print:opacity-100">
              <QrCode size={64} strokeWidth={1.5} />
              <span className="text-[10px] mt-1 font-sans font-bold tracking-wider">VALIDASI DIGITAL</span>
            </div>
            <p className="font-bold underline uppercase">{config?.nama_pejabat || '(..................................................)'}</p>
            <p>NIDN. {config?.nidn_pejabat || '......................'}</p>
          </div>
`;

content = content.replace(staticKaprodi.trim(), dynamicKaprodi.trim());

// Also replace NIP/NIK of Mentor with NIK if we want, or just leave it. The user said "NIP itu ganti jadi NIDN".
// Actually, mentor has NIP/NIK, we can just leave it as NIP/NIK since mentor is not Kaprodi. 
// But let's check DPL. "NIDN. " -> "NIDN. {pengajuan.dpl_id?.nidn || '......................'}"
content = content.replace(
  '<p>NIDN. </p>',
  '<p>NIDN. {pengajuan?.dpl_id?.nidn || "......................"}</p>'
);

fs.writeFileSync(path, content);
