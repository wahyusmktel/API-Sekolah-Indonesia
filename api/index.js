const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Load data dan inisialisasi index in-memory
let allSchools = null;
let npsnIndex = null;
let idIndex = null;
let cachedStats = null;
let cachedProvinsi = null;

function initData() {
  if (allSchools) return;

  const dataPath = path.join(process.cwd(), 'sekolah_indonesia.json');
  console.log('Loading dataset from:', dataPath);
  allSchools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  npsnIndex = new Map();
  idIndex = new Map();
  const provMap = new Map();

  const jenjangCounts = {};
  const statusCounts = {};

  for (let i = 0; i < allSchools.length; i++) {
    const s = allSchools[i];
    if (s.npsn) npsnIndex.set(s.npsn, s);
    if (s.id) idIndex.set(s.id, s);

    if (s.kode_prop && !provMap.has(s.kode_prop)) {
      provMap.set(s.kode_prop, {
        kode_prop: s.kode_prop,
        propinsi: s.propinsi
      });
    }

    if (s.bentuk) {
      jenjangCounts[s.bentuk] = (jenjangCounts[s.bentuk] || 0) + 1;
    }
    if (s.status) {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    }
  }

  cachedProvinsi = Array.from(provMap.values()).sort((a, b) => a.propinsi.localeCompare(b.propinsi));

  cachedStats = {
    total_data: allSchools.length,
    jenjang: jenjangCounts,
    status: {
      negeri: statusCounts['N'] || 0,
      swasta: statusCounts['S'] || 0
    },
    total_provinsi: cachedProvinsi.length,
    total_kabupaten: new Set(allSchools.map(s => s.kode_kab_kota).filter(Boolean)).size,
    total_kecamatan: new Set(allSchools.map(s => s.kode_kec).filter(Boolean)).size
  };

  console.log(`Initialized ${allSchools.length} schools into memory.`);
}

// Middleware agar data siap sebelum menangani request
app.use((req, res, next) => {
  try {
    initData();
    next();
  } catch (err) {
    console.error('Failed to load dataset:', err);
    res.status(500).json({
      status: 'error',
      message: 'Gagal memuat dataset sekolah.',
      detail: err.message
    });
  }
});

// Sajikan folder public untuk halaman dokumentasi interaktif
app.use(express.static(path.join(process.cwd(), 'public')));

// Helper response paginasi
function paginate(data, page, perPage) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const pp = Math.min(1000, Math.max(1, parseInt(perPage, 10) || 20));
  const total = data.length;
  const totalPage = Math.ceil(total / pp);
  const start = (p - 1) * pp;
  const sliced = data.slice(start, start + pp);

  return {
    creator: 'wahyusmktel',
    status: 'success',
    total_data: total,
    page: p,
    per_page: pp,
    total_page: totalPage,
    dataSekolah: sliced
  };
}

// Router API
const router = express.Router();

// 1. STATISTIK
router.get(['/stats', '/statistik'], (req, res) => {
  res.json({
    creator: 'wahyusmktel',
    status: 'success',
    data: cachedStats
  });
});

// 2. DAFTAR PROVINSI
router.get(['/provinsi', '/propinsi'], (req, res) => {
  res.json({
    creator: 'wahyusmktel',
    status: 'success',
    total: cachedProvinsi.length,
    data: cachedProvinsi
  });
});

// 3. DAFTAR KABUPATEN / KOTA
router.get(['/kabupaten', '/kab_kota'], (req, res) => {
  const { provinsi, kode_prop } = req.query;
  const kabMap = new Map();

  for (let i = 0; i < allSchools.length; i++) {
    const s = allSchools[i];
    if (kode_prop && s.kode_prop !== kode_prop) continue;
    if (provinsi && !s.propinsi.toLowerCase().includes(provinsi.toLowerCase())) continue;

    if (s.kode_kab_kota && !kabMap.has(s.kode_kab_kota)) {
      kabMap.set(s.kode_kab_kota, {
        kode_kab_kota: s.kode_kab_kota,
        kabupaten_kota: s.kabupaten_kota,
        kode_prop: s.kode_prop,
        propinsi: s.propinsi
      });
    }
  }

  const list = Array.from(kabMap.values()).sort((a, b) => a.kabupaten_kota.localeCompare(b.kabupaten_kota));
  res.json({
    creator: 'wahyusmktel',
    status: 'success',
    total: list.length,
    data: list
  });
});

// 4. DAFTAR KECAMATAN
router.get(['/kecamatan', '/kec'], (req, res) => {
  const { kab_kota, kode_kab_kota } = req.query;
  const kecMap = new Map();

  for (let i = 0; i < allSchools.length; i++) {
    const s = allSchools[i];
    if (kode_kab_kota && s.kode_kab_kota !== kode_kab_kota) continue;
    if (kab_kota && !s.kabupaten_kota.toLowerCase().includes(kab_kota.toLowerCase())) continue;

    if (s.kode_kec && !kecMap.has(s.kode_kec)) {
      kecMap.set(s.kode_kec, {
        kode_kec: s.kode_kec,
        kecamatan: s.kecamatan,
        kode_kab_kota: s.kode_kab_kota,
        kabupaten_kota: s.kabupaten_kota,
        propinsi: s.propinsi
      });
    }
  }

  const list = Array.from(kecMap.values()).sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
  res.json({
    creator: 'wahyusmktel',
    status: 'success',
    total: list.length,
    data: list
  });
});

// 5. DETAIL SEKOLAH (NPSN atau ID)
router.get('/sekolah/detail/:npsnOrId', (req, res) => {
  const { npsnOrId } = req.params;
  const found = npsnIndex.get(npsnOrId) || idIndex.get(npsnOrId);

  if (!found) {
    return res.status(404).json({
      creator: 'wahyusmktel',
      status: 'error',
      message: `Sekolah dengan NPSN atau ID '${npsnOrId}' tidak ditemukan.`
    });
  }

  res.json({
    creator: 'wahyusmktel',
    status: 'success',
    dataSekolah: found
  });
});

// 6. SEARCH KHUSUS NAMA SEKOLAH (kompatibel dengan /sekolah/s?sekolah=...)
router.get('/sekolah/s', (req, res) => {
  const query = (req.query.sekolah || req.query.q || req.query.nama || '').trim().toLowerCase();
  const page = req.query.page || 1;
  const perPage = req.query.perPage || req.query.per_page || 20;

  if (!query) {
    return res.status(400).json({
      creator: 'wahyusmktel',
      status: 'error',
      message: "Parameter 'sekolah' atau 'q' harus diisi. Contoh: /sekolah/s?sekolah=telkom"
    });
  }

  const results = allSchools.filter(s => s.sekolah.toLowerCase().includes(query));
  res.json(paginate(results, page, perPage));
});

// 7. GET SEKOLAH BY JENJANG (/sekolah/sd, /sekolah/smp, /sekolah/sma, /sekolah/smk)
router.get('/sekolah/:jenjang(sd|smp|sma|smk|slb|sdlb|smplb|smlb|SD|SMP|SMA|SMK|SLB|SDLB|SMPLB|SMLB)', (req, res) => {
  const targetJenjang = req.params.jenjang.toUpperCase();
  const {
    page,
    perPage,
    status,
    provinsi,
    kode_prop,
    kab_kota,
    kode_kab_kota,
    kec,
    kode_kec
  } = req.query;

  let filtered = allSchools.filter(s => s.bentuk.toUpperCase() === targetJenjang);

  if (status) {
    filtered = filtered.filter(s => s.status.toUpperCase() === status.toUpperCase());
  }
  if (kode_prop) {
    filtered = filtered.filter(s => s.kode_prop === kode_prop.trim());
  } else if (provinsi) {
    const p = provinsi.trim().toLowerCase();
    filtered = filtered.filter(s => s.propinsi.toLowerCase().includes(p));
  }

  if (kode_kab_kota) {
    filtered = filtered.filter(s => s.kode_kab_kota === kode_kab_kota.trim());
  } else if (kab_kota) {
    const k = kab_kota.trim().toLowerCase();
    filtered = filtered.filter(s => s.kabupaten_kota.toLowerCase().includes(k));
  }

  if (kode_kec) {
    filtered = filtered.filter(s => s.kode_kec === kode_kec.trim());
  } else if (kec) {
    const kc = kec.trim().toLowerCase();
    filtered = filtered.filter(s => s.kecamatan.toLowerCase().includes(kc));
  }

  res.json(paginate(filtered, page, perPage));
});

// 8. GET SELURUH DATA SEKOLAH DENGAN FILTER MULTI-PARAM (/sekolah)
router.get('/sekolah', (req, res) => {
  const {
    page,
    perPage,
    npsn,
    sekolah,
    q,
    bentuk,
    jenjang,
    status,
    provinsi,
    kode_prop,
    kab_kota,
    kode_kab_kota,
    kec,
    kode_kec
  } = req.query;

  // Optimasi jika query langsung by NPSN
  if (npsn) {
    const found = npsnIndex.get(npsn.trim());
    return res.json({
      creator: 'wahyusmktel',
      status: 'success',
      total_data: found ? 1 : 0,
      page: 1,
      per_page: 1,
      total_page: found ? 1 : 0,
      dataSekolah: found ? [found] : []
    });
  }

  let filtered = allSchools;

  // Filter jenjang / bentuk
  const b = (bentuk || jenjang || '').trim().toUpperCase();
  if (b) {
    filtered = filtered.filter(s => s.bentuk.toUpperCase() === b);
  }

  // Filter status (N / S)
  if (status) {
    filtered = filtered.filter(s => s.status.toUpperCase() === status.trim().toUpperCase());
  }

  // Search keyword nama sekolah
  const keyword = (sekolah || q || '').trim().toLowerCase();
  if (keyword) {
    filtered = filtered.filter(s => s.sekolah.toLowerCase().includes(keyword));
  }

  // Filter provinsi
  if (kode_prop) {
    filtered = filtered.filter(s => s.kode_prop === kode_prop.trim());
  } else if (provinsi) {
    const p = provinsi.trim().toLowerCase();
    filtered = filtered.filter(s => s.propinsi.toLowerCase().includes(p));
  }

  // Filter kab / kota
  if (kode_kab_kota) {
    filtered = filtered.filter(s => s.kode_kab_kota === kode_kab_kota.trim());
  } else if (kab_kota) {
    const k = kab_kota.trim().toLowerCase();
    filtered = filtered.filter(s => s.kabupaten_kota.toLowerCase().includes(k));
  }

  // Filter kecamatan
  if (kode_kec) {
    filtered = filtered.filter(s => s.kode_kec === kode_kec.trim());
  } else if (kec) {
    const kc = kec.trim().toLowerCase();
    filtered = filtered.filter(s => s.kecamatan.toLowerCase().includes(kc));
  }

  res.json(paginate(filtered, page, perPage));
});

// Pasang router untuk prefix /api dan tanpa prefix (agar kompatibel 100%)
app.use('/api', router);
app.use('/', router);

// Halaman root jika public tidak ter-serve
app.get('/', (req, res) => {
  const indexPath = path.join(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    creator: 'wahyusmktel',
    status: 'online',
    message: 'API Sekolah Indonesia Siap Digunakan. Kunjungi dokumentasi untuk info penggunaan.',
    endpoints: {
      documentation: '/',
      sekolah: '/sekolah?page=1&perPage=20',
      search: '/sekolah/s?sekolah=telkom',
      jenjang: '/sekolah/SMK?page=1&perPage=20',
      provinsi: '/provinsi',
      stats: '/stats'
    }
  });
});

module.exports = app;
