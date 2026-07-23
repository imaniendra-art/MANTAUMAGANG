const fs = require('fs');

const path = 'app/profil/page.js';
let content = fs.readFileSync(path, 'utf8');

// Add nama_lengkap and nim_nidn to initial state
content = content.replace(
  /nidn: "",\n\s*nomor_hp: "",\n\s*email: ""/g,
  'nama_lengkap: "",\n    nim_nidn: "",\n    nidn: "",\n    nomor_hp: "",\n    email: ""'
);

// Add to useEffect initialization
content = content.replace(
  /nidn: session.user.nidn \|\| "",/g,
  'nama_lengkap: session.user.nama_lengkap || "",\n        nim_nidn: session.user.nim_nidn || "",\n        nidn: session.user.nidn || "",'
);

// Add the inputs to the form, right after <form ...>
const formStart = '<form onSubmit={handleProfilSubmit} className="space-y-5 mb-8">';
const inputsToAdd = `
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={profilData.nama_lengkap}
                  onChange={(e) => setProfilData({...profilData, nama_lengkap: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama Lengkap beserta gelar"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ID (Username) / NIM</label>
                <input 
                  type="text" 
                  required
                  value={profilData.nim_nidn}
                  onChange={(e) => setProfilData({...profilData, nim_nidn: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Username untuk Login"
                />
              </div>
`;

if (!content.includes('value={profilData.nama_lengkap}')) {
  content = content.replace(formStart, formStart + inputsToAdd);
  fs.writeFileSync(path, content);
  console.log("Updated page.js!");
} else {
  console.log("page.js already updated!");
}
