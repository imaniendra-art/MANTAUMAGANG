import('node-fetch').then(({default: fetch}) => {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('nama_institusi', 'Test Institusi');
  form.append('nama_pejabat_pengesah', 'Test Pejabat');
  form.append('nidn_pejabat', '123');
  form.append('jabatan_pejabat', 'Ketua');
  
  fetch('http://localhost:3020/api/config', {
    method: 'POST',
    body: form
  }).then(res => res.text()).then(text => console.log("Result:", text))
  .catch(err => console.error(err));
});
