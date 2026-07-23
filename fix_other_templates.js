const fs = require('fs');

function fixPengantar() {
  const path = 'app/mahasiswa/laporan/templates/pengantar/page.js';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('const [config, setConfig] = useState(null)')) {
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [config, setConfig] = useState(null);'
    );
  }

  if (!content.includes("import { QrCode } from 'lucide-react'")) {
    content = content.replace(
      "import { useSession } from 'next-auth/react';",
      "import { useSession } from 'next-auth/react';\nimport { QrCode } from 'lucide-react';"
    );
  }

  if (!content.includes('/api/config')) {
    content = content.replace(
      '// Fetch specific posisi data for preview during application',
      'fetch("/api/config").then(res=>res.json()).then(c=>{if(c)setConfig(c)});\n      // Fetch specific posisi data for preview during application'
    );
    // There's two fetch blocks in pengantar, let's just add a generic useEffect for config
    content = content.replace(
      'useEffect(() => {',
      'useEffect(() => {\n    fetch("/api/config").then(res=>res.json()).then(c=>{if(c)setConfig(c)}).catch(console.error);\n'
    );
  }

  const staticKaprodi = `
            <div className="w-1/2">
              <p>Ketua Program Studi Manajemen,</p>
              <p className="mb-12 mt-2 text-sm text-slate-400">(Stempel & Tanda Tangan)</p>
              <p className="font-bold underline">....................................................</p>
              <p>NIDN. ....................................</p>
            </div>
`;
  const dynamicKaprodi = `
            <div className="w-1/2 flex flex-col items-end text-right">
              <p>{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
              <div className="my-4 p-2 border-2 border-slate-800 inline-flex flex-col items-center justify-center opacity-80 print:opacity-100">
                <QrCode size={56} strokeWidth={1.5} />
                <span className="text-[10px] mt-1 font-sans font-bold tracking-wider">VALIDASI DIGITAL</span>
              </div>
              <p className="font-bold underline uppercase">{config?.nama_pejabat || '....................................................'}</p>
              <p>NIDN. {config?.nidn_pejabat || '....................................'}</p>
            </div>
`;
  content = content.replace(staticKaprodi.trim(), dynamicKaprodi.trim());
  fs.writeFileSync(path, content);
}

function fixTranskrip() {
  const path = 'app/mahasiswa/laporan/cetak/transkrip/page.js';
  let content = fs.readFileSync(path, 'utf8');

  if (!content.includes('const [config, setConfig] = useState(null)')) {
    content = content.replace(
      'const [data, setData] = useState(null);',
      'const [data, setData] = useState(null);\n  const [config, setConfig] = useState(null);'
    );
  }

  if (!content.includes("import { QrCode } from 'lucide-react'")) {
    content = content.replace(
      "import { useSession } from 'next-auth/react';",
      "import { useSession } from 'next-auth/react';\nimport { QrCode } from 'lucide-react';"
    );
  }

  if (!content.includes('/api/config')) {
    content = content.replace(
      'setData(d);',
      'setData(d);\n            fetch("/api/config").then(r=>r.json()).then(c=>{if(c)setConfig(c)});'
    );
  }

  const staticKaprodi = `
            <div className="w-1/3 text-center text-sm">
              <p className="mb-1">Makassar, {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
              <p className="font-bold mb-20">Ketua Program Studi Manajemen</p>
              <div className="border-b-[1.5px] border-black w-full mb-1"></div>
              <p className="text-xs">NIDN. ........................................</p>
            </div>
`;
  const dynamicKaprodi = `
            <div className="w-1/3 text-center text-sm flex flex-col items-center">
              <p className="mb-1">Makassar, {new Date(pengajuan.tanggal_selesai).toLocaleDateString('id-ID')}</p>
              <p className="font-bold">{config?.jabatan_pejabat || 'Ketua Program Studi Manajemen'}</p>
              <div className="my-4 p-2 border-2 border-slate-800 inline-flex flex-col items-center justify-center opacity-80 print:opacity-100">
                <QrCode size={48} strokeWidth={1.5} />
                <span className="text-[8px] mt-1 font-sans font-bold tracking-wider">VALIDASI DIGITAL</span>
              </div>
              <p className="font-bold underline uppercase">{config?.nama_pejabat || '........................................'}</p>
              <p className="text-xs mt-1">NIDN. {config?.nidn_pejabat || '........................................'}</p>
            </div>
`;
  content = content.replace(staticKaprodi.trim(), dynamicKaprodi.trim());
  fs.writeFileSync(path, content);
}

fixPengantar();
fixTranskrip();
