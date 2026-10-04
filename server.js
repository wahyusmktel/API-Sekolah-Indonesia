const app = require('./api/index.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 API Sekolah Indonesia Berjalan di Port ${PORT}`);
  console.log(`📖 Dokumentasi & Web: http://localhost:${PORT}`);
  console.log(`🔍 Endpoint Sekolah:   http://localhost:${PORT}/sekolah?page=1&perPage=5`);
  console.log(`📊 Endpoint Statistik: http://localhost:${PORT}/stats`);
  console.log(`====================================================`);
});
