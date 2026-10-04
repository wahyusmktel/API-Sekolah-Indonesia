# API Sekolah Indonesia 🇮🇩

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Data Count](https://img.shields.io/badge/Data%20Sekolah-215.373-emerald.svg)](#)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel)](#cara-deploy-ke-vercel)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B-green.svg?logo=node.js)](#)

REST API gratis dan open-source untuk mengakses **215.373+ Data Pokok Sekolah Seluruh Indonesia** (SD, SMP, SMA, SMK, dan SLB) lengkap dengan NPSN, alamat, koordinat latitude/longitude, dan wilayah administratif (Provinsi, Kab/Kota, Kecamatan).

Project ini dilengkapi dengan **dokumentasi interaktif (playground web)**, skrip downloader mandiri, berkas database `.sql`, dan konfigurasi siap deploy ke **Vercel Serverless**.

---

## 🌟 Fitur Utama

- ⚡ **Super Cepat & Efisien**: In-memory caching dengan respons sub-10ms.
- 🎯 **Pencarian & Filter Fleksibel**: Cari berdasarkan nama sekolah, NPSN, jenjang, status (Negeri/Swasta), provinsi, kabupaten/kota, dan kecamatan.
- 🌐 **Dokumentasi Interaktif**: Halaman web bawaan untuk mencoba langsung endpoint secara real-time.
- 📦 **100% Backward Compatible**: Format endpoint dan respons kompatibel dengan API versi terdahulu.
- 💾 **Dataset Lengkap**: Disertakan berkas `sekolah_indonesia.json` (75 MB) dan `sekolah_indonesia.sql` (47 MB) untuk kebutuhan database pribadi.
- 🚀 **Siap Deploy ke Vercel**: Tanpa konfigurasi rumit, langsung online dalam hitungan detik.

---

## 📊 Ringkasan Dataset

| Jenjang | Jumlah Sekolah | Status | Jumlah |
| :--- | :--- | :--- | :--- |
| **SD** | 148.479 | **Negeri** | 166.417 |
| **SMP** | 38.045 | **Swasta** | 48.955 |
| **SMA** | 13.181 | **Provinsi** | 34 |
| **SMK** | 13.491 | **Kab/Kota** | 514 |
| **SLB / Khusus** | 2.176 | **Kecamatan** | 6.919 |
| **Total** | **215.373** | | |

---

## 🚀 Panduan Penggunaan API

Base URL (setelah di-deploy ke Vercel atau dijalankan lokal):
```bash
https://your-domain.vercel.app
# atau http://localhost:5000 (lokal)
```

### 1. Menampilkan Semua Sekolah (Paginasi & Filter)

```http
GET /sekolah?page=1&perPage=10
```

**Query Parameters:**
| Parameter | Tipe | Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | Nomor halaman (default: `1`) |
| `perPage` | Integer | `20` | Jumlah item per halaman (default: `20`, maks `1000`) |
| `npsn` | String | `20106343` | Pencarian langsung berdasarkan NPSN |
| `sekolah` / `q` | String | `telkom` | Filter kata kunci nama sekolah |
| `jenjang` / `bentuk`| String | `SMK` | Filter jenjang (`SD`, `SMP`, `SMA`, `SMK`, `SLB`) |
| `status` | String | `N` | Filter status: `N` (Negeri) atau `S` (Swasta) |
| `provinsi` | String | `Jawa Barat` | Filter berdasarkan nama provinsi |
| `kode_prop` | String | `020000` | Filter kode provinsi |
| `kab_kota` | String | `Bandung` | Filter kabupaten / kota |
| `kode_kab_kota`| String | `020800` | Filter kode kabupaten / kota |
| `kec` | String | `Menteng` | Filter kecamatan |

**Contoh Response:**
```json
{
  "creator": "wahyusmktel",
  "status": "success",
  "total_data": 215373,
  "page": 1,
  "per_page": 2,
  "total_page": 107687,
  "dataSekolah": [
    {
      "id": "201C9F94-2BF5-E011-A7DC-591953DFFC15",
      "npsn": "20104653",
      "sekolah": "SD NEGERI PEGANGSAAN 01 PG",
      "bentuk": "SD",
      "status": "N",
      "alamat_jalan": "Jl. Ampiun No. 1-A",
      "lintang": "-6.1977000",
      "bujur": "106.8422000",
      "kode_prop": "010000",
      "propinsi": "Prov. D.K.I. Jakarta",
      "kode_kab_kota": "016000",
      "kabupaten_kota": "Kota Jakarta Pusat",
      "kode_kec": "016002",
      "kecamatan": "Kec. Menteng"
    }
  ]
}
```

---

### 2. Shortcut Filter Jenjang

```http
GET /sekolah/sd?page=1&perPage=5
GET /sekolah/smp?page=1&perPage=5
GET /sekolah/sma?page=1&perPage=5
GET /sekolah/smk?page=1&perPage=5
```

---

### 3. Pencarian Berdasarkan Nama Sekolah

```http
GET /sekolah/s?sekolah=telkom&page=1&perPage=5
```

---

### 4. Detail Satuan Sekolah (Berdasarkan NPSN / ID)

```http
GET /sekolah/detail/20104462
```

---

### 5. Data Wilayah Administratif & Statistik

- **Statistik Dataset:** `GET /stats`
- **Daftar Seluruh Provinsi:** `GET /provinsi`
- **Daftar Kabupaten/Kota:** `GET /kabupaten?provinsi=Jawa Barat`
- **Daftar Kecamatan:** `GET /kecamatan?kab_kota=Kota Bandung`

---

## 💻 Contoh Integrasi Kode

### JavaScript (Fetch API / Node.js)
```javascript
fetch('https://your-domain.vercel.app/sekolah?page=1&perPage=5')
  .then(res => res.json())
  .then(data => {
    console.log('Total:', data.total_data);
    console.log(data.dataSekolah);
  });
```

### Python
```python
import requests

res = requests.get('https://your-domain.vercel.app/sekolah', params={'jenjang': 'SMK', 'perPage': 5})
data = res.json()

for s in data['dataSekolah']:
    print(f"[{s['npsn']}] {s['sekolah']} - {s['kabupaten_kota']}")
```

### cURL
```bash
curl -X GET "https://your-domain.vercel.app/sekolah?page=1&perPage=5"
```

---

## 🛠️ Menjalankan di Komputer Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/wahyusmktel/API-Sekolah-Indonesia.git
   cd API-Sekolah-Indonesia
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server:**
   ```bash
   npm start
   # Server aktif di http://localhost:5000
   ```

4. Buka browser dan akses `http://localhost:5000` untuk melihat dokumentasi interaktif dan playground API.

---

## 🚢 Cara Deploy ke Vercel

### Metode 1: Hubungkan ke Dashboard Vercel (Paling Mudah)
1. Push repository ini ke akun GitHub Anda: `https://github.com/wahyusmktel/API-Sekolah-Indonesia`.
2. Buka [Vercel Dashboard](https://vercel.com/new).
3. Klik **Import Project** lalu pilih repository `API-Sekolah-Indonesia`.
4. Biarkan pengaturan default (Framework Preset: *Other*, Root Directory: `./`).
5. Klik **Deploy**. Website dan API Anda langsung online!

### Metode 2: Menggunakan Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📁 Struktur Berkas

```text
├── api/
│   └── index.js             # Handler Express & router Vercel Serverless
├── public/
│   └── index.html           # Landing page dokumentasi & interactive playground
├── download_schools.js      # Script downloader sinkronisasi dataset
├── sekolah_indonesia.json   # Dataset 215.373 sekolah (JSON array, ~75 MB)
├── sekolah_indonesia.sql    # Skrip SQL dump tabel & index (~47 MB)
├── package.json             # Konfigurasi dependensi project
├── vercel.json              # Routing & rewrite Vercel
├── .vercelignore            # Pengecualian berkas bundle lambda
├── .gitignore               # Berkas yang diabaikan git
└── README.md                # Dokumentasi utama
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Silakan gunakan untuk keperluan edukasi, non-profit, maupun komersial.

Dikembangkan oleh **[@wahyusmktel](https://github.com/wahyusmktel)**.
