const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api-sekolah-indonesia.vercel.app/sekolah';
const PER_PAGE = 2500;
const OUTPUT_JSON = path.join(__dirname, 'sekolah_indonesia.json');
const OUTPUT_SQL = path.join(__dirname, 'sekolah_indonesia.sql');

function clean(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  const val = String(str).trim();
  if (val === '') return 'NULL';
  return "'" + val.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

async function fetchWithRetry(url, retries = 5, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn(`[Retry ${i + 1}/${retries}] Failed to fetch ${url}: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

async function main() {
  console.log('=== Memulai Pengunduhan Data Sekolah Seluruh Indonesia ===');
  
  // Ambil metadata halaman pertama
  console.log('Mengambil info awal dari API...');
  const firstBatch = await fetchWithRetry(`${BASE_URL}?page=1&perPage=${PER_PAGE}`);
  const totalData = firstBatch.total_data;
  const totalPages = Math.ceil(totalData / PER_PAGE);

  console.log(`Total Data: ${totalData.toLocaleString('id-ID')} sekolah`);
  console.log(`Jumlah Halaman: ${totalPages} (perPage = ${PER_PAGE})\n`);

  const allSchools = [];

  // Proses halaman pertama
  for (const item of firstBatch.dataSekolah || []) {
    allSchools.push({
      id: clean(item.id),
      npsn: clean(item.npsn),
      sekolah: clean(item.sekolah),
      bentuk: clean(item.bentuk),
      status: clean(item.status),
      alamat_jalan: clean(item.alamat_jalan),
      lintang: clean(item.lintang),
      bujur: clean(item.bujur),
      kode_prop: clean(item.kode_prop),
      propinsi: clean(item.propinsi),
      kode_kab_kota: clean(item.kode_kab_kota),
      kabupaten_kota: clean(item.kabupaten_kota),
      kode_kec: clean(item.kode_kec),
      kecamatan: clean(item.kecamatan)
    });
  }
  console.log(`[1/${totalPages}] Mengambil data... (${allSchools.length.toLocaleString('id-ID')} / ${totalData.toLocaleString('id-ID')})`);

  // Download sisa halaman secara berurutan atau concurrency kecil agar stabil & tidak kena rate limit
  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchWithRetry(`${BASE_URL}?page=${page}&perPage=${PER_PAGE}`);
    for (const item of data.dataSekolah || []) {
      allSchools.push({
        id: clean(item.id),
        npsn: clean(item.npsn),
        sekolah: clean(item.sekolah),
        bentuk: clean(item.bentuk),
        status: clean(item.status),
        alamat_jalan: clean(item.alamat_jalan),
        lintang: clean(item.lintang),
        bujur: clean(item.bujur),
        kode_prop: clean(item.kode_prop),
        propinsi: clean(item.propinsi),
        kode_kab_kota: clean(item.kode_kab_kota),
        kabupaten_kota: clean(item.kabupaten_kota),
        kode_kec: clean(item.kode_kec),
        kecamatan: clean(item.kecamatan)
      });
    }

    if (page % 5 === 0 || page === totalPages) {
      console.log(`[${page}/${totalPages}] Berhasil mengambil ${allSchools.length.toLocaleString('id-ID')} dari ${totalData.toLocaleString('id-ID')} sekolah...`);
    }

    // Jeda kecil 150ms agar server tetap stabil
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\nSemua data berhasil diambil! Total: ${allSchools.length.toLocaleString('id-ID')} sekolah.`);

  // 1. Simpan ke JSON
  console.log('\nMenyimpan ke file JSON...');
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allSchools, null, 2), 'utf8');
  const jsonStat = fs.statSync(OUTPUT_JSON);
  console.log(`✓ File JSON selesai: ${OUTPUT_JSON} (${(jsonStat.size / (1024 * 1024)).toFixed(2)} MB)`);

  // 2. Simpan ke SQL
  console.log('\nMembuat file SQL...');
  const sqlStream = fs.createWriteStream(OUTPUT_SQL, { encoding: 'utf8' });

  sqlStream.write(`-- Dump Data Sekolah Seluruh Indonesia\n`);
  sqlStream.write(`-- Total Data: ${allSchools.length}\n`);
  sqlStream.write(`-- Tanggal: ${new Date().toISOString()}\n\n`);

  sqlStream.write(`SET NAMES utf8mb4;\n`);
  sqlStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

  sqlStream.write(`CREATE TABLE IF NOT EXISTS \`sekolah\` (\n`);
  sqlStream.write(`  \`id\` VARCHAR(50) NOT NULL,\n`);
  sqlStream.write(`  \`npsn\` VARCHAR(20) NOT NULL,\n`);
  sqlStream.write(`  \`sekolah\` VARCHAR(255) NOT NULL,\n`);
  sqlStream.write(`  \`bentuk\` VARCHAR(20) DEFAULT NULL,\n`);
  sqlStream.write(`  \`status\` VARCHAR(10) DEFAULT NULL,\n`);
  sqlStream.write(`  \`alamat_jalan\` TEXT DEFAULT NULL,\n`);
  sqlStream.write(`  \`lintang\` VARCHAR(50) DEFAULT NULL,\n`);
  sqlStream.write(`  \`bujur\` VARCHAR(50) DEFAULT NULL,\n`);
  sqlStream.write(`  \`kode_prop\` VARCHAR(20) DEFAULT NULL,\n`);
  sqlStream.write(`  \`propinsi\` VARCHAR(100) DEFAULT NULL,\n`);
  sqlStream.write(`  \`kode_kab_kota\` VARCHAR(20) DEFAULT NULL,\n`);
  sqlStream.write(`  \`kabupaten_kota\` VARCHAR(100) DEFAULT NULL,\n`);
  sqlStream.write(`  \`kode_kec\` VARCHAR(20) DEFAULT NULL,\n`);
  sqlStream.write(`  \`kecamatan\` VARCHAR(100) DEFAULT NULL,\n`);
  sqlStream.write(`  PRIMARY KEY (\`id\`),\n`);
  sqlStream.write(`  KEY \`idx_npsn\` (\`npsn\`),\n`);
  sqlStream.write(`  KEY \`idx_sekolah\` (\`sekolah\`),\n`);
  sqlStream.write(`  KEY \`idx_bentuk\` (\`bentuk\`),\n`);
  sqlStream.write(`  KEY \`idx_propinsi\` (\`kode_prop\`),\n`);
  sqlStream.write(`  KEY \`idx_kab_kota\` (\`kode_kab_kota\`),\n`);
  sqlStream.write(`  KEY \`idx_kecamatan\` (\`kode_kec\`)\n`);
  sqlStream.write(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`);

  // Batch insert per 500 rows
  const BATCH_SIZE = 500;
  for (let i = 0; i < allSchools.length; i += BATCH_SIZE) {
    const chunk = allSchools.slice(i, i + BATCH_SIZE);
    sqlStream.write(`INSERT INTO \`sekolah\` (\`id\`, \`npsn\`, \`sekolah\`, \`bentuk\`, \`status\`, \`alamat_jalan\`, \`lintang\`, \`bujur\`, \`kode_prop\`, \`propinsi\`, \`kode_kab_kota\`, \`kabupaten_kota\`, \`kode_kec\`, \`kecamatan\`) VALUES\n`);
    
    const rows = chunk.map(s => {
      return `(${escapeSql(s.id)}, ${escapeSql(s.npsn)}, ${escapeSql(s.sekolah)}, ${escapeSql(s.bentuk)}, ${escapeSql(s.status)}, ${escapeSql(s.alamat_jalan)}, ${escapeSql(s.lintang)}, ${escapeSql(s.bujur)}, ${escapeSql(s.kode_prop)}, ${escapeSql(s.propinsi)}, ${escapeSql(s.kode_kab_kota)}, ${escapeSql(s.kabupaten_kota)}, ${escapeSql(s.kode_kec)}, ${escapeSql(s.kecamatan)})`;
    });

    sqlStream.write(rows.join(',\n') + `;\n\n`);
  }

  sqlStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  sqlStream.end();

  await new Promise((resolve, reject) => {
    sqlStream.on('finish', resolve);
    sqlStream.on('error', reject);
  });

  const sqlStat = fs.statSync(OUTPUT_SQL);
  console.log(`✓ File SQL selesai: ${OUTPUT_SQL} (${(sqlStat.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log('\n=== Semua Proses Selesai dengan Sukses! ===');
}

main().catch(err => {
  console.error('Error saat proses:', err);
  process.exit(1);
});
