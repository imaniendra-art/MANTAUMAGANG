async function run() {
  const userId = '6a60d90a317d1e8f2197d1e3'; // Mentor 12341234
  try {
    const res = await fetch(`http://localhost:3020/api/logbook?role=mentor&userId=${userId}`);
    const data = await res.json();
    console.log("Fetched data length:", data.length);
    if(data.length > 0) {
      console.log("First item pengajuan_id:", data[0].pengajuan_id);
    }
  } catch(e) {
    console.error(e);
  }
}
run();
