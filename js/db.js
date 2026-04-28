// ═══════════════════════════════════════════════════════════════
// db.js — Database layer: SQLite (sql.js) + localStorage + Data
// ═══════════════════════════════════════════════════════════════

var SQL = null;
var sqlDB = null;
var LS_KEY_DATA = 'warungku_data_v2';
var LS_KEY_DB   = 'warungku_sqlite_v2';

// ── Data terpusat in-memory ─────────────────────────────────────
var DB = {
  barang: [
    {id:1,  nama:'Mie Instan Goreng',           emoji:'🍜', harga:3500,  stok:24,  stokMin:10, unit:'pcs', kategori:'Makanan',   exp:'20 Jun 26', supplier:'PT Grosir Nusantara', barcode:'089686012345', mutasi:[]},
    {id:2,  nama:'Kopi Sachet Tubruk',           emoji:'☕', harga:1500,  stok:95,  stokMin:20, unit:'pcs', kategori:'Minuman',   exp:'10 Des 26', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[]},
    {id:3,  nama:'Gula Pasir 1kg',               emoji:'🧂', harga:15000, stok:25,  stokMin:5,  unit:'kg',  kategori:'Makanan',   exp:'01 Jan 27', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[]},
    {id:4,  nama:'Minyak Goreng 1L',             emoji:'🫙', harga:18000, stok:18,  stokMin:6,  unit:'btl', kategori:'Makanan',   exp:'18 Apr 28', supplier:'PT Grosir Nusantara', barcode:'',             mutasi:[]},
    {id:5,  nama:'Sabun Colek 500gr',            emoji:'🧼', harga:8500,  stok:10,  stokMin:3,  unit:'pcs', kategori:'Kebutuhan', exp:'05 Mar 27', supplier:'PT Sinar Sari',       barcode:'',             mutasi:[]},
    {id:6,  nama:'Teh Celup Sariwangi',          emoji:'🍵', harga:800,   stok:130, stokMin:30, unit:'pcs', kategori:'Minuman',   exp:'15 Nov 26', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[]},
    {id:7,  nama:'Rokok Surya 16',               emoji:'🚬', harga:24000, stok:12,  stokMin:4,  unit:'bks', kategori:'Lainnya',   exp:'—',         supplier:'PT Grosir Nusantara', barcode:'',             mutasi:[]},
    {id:8,  nama:'Bimoli Minyak Goreng 1L',      emoji:'🧴', harga:20000, stok:4,   stokMin:5,  unit:'pcs', kategori:'Makanan',   exp:'13 Apr 28', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[
      {tgl:'17 April',ket:'Terjual',jml:-6},{tgl:'16 April',ket:'Terjual',jml:-1},
      {tgl:'15 April',ket:'Terjual',jml:-9},{tgl:'14 April',ket:'Retur Rusak',jml:-6},
      {tgl:'12 April',ket:'Barang Masuk',jml:50}
    ]},
    {id:9,  nama:'Tango Wafer Cokelat 99gr',     emoji:'🍫', harga:12500, stok:2,   stokMin:5,  unit:'pcs', kategori:'Makanan',   exp:'05 Jan 27', supplier:'PT Sinar Sari',       barcode:'',             mutasi:[]},
    {id:10, nama:'Nu Yogurt Tea 250ml',          emoji:'🧃', harga:7000,  stok:18,  stokMin:5,  unit:'pcs', kategori:'Minuman',   exp:'18 Apr 28', supplier:'PT Sinar Sari',       barcode:'',             mutasi:[]},
    {id:11, nama:'ABC Kecap Manis 620ml',        emoji:'🍶', harga:37000, stok:11,  stokMin:3,  unit:'pcs', kategori:'Makanan',   exp:'12 Apr 26', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[]},
    {id:12, nama:'Gulaku Gula Premium 1kg',      emoji:'🍬', harga:18000, stok:13,  stokMin:5,  unit:'kg',  kategori:'Makanan',   exp:'05 Mei 28', supplier:'PT Sembako Sari',     barcode:'',             mutasi:[]},
    {id:13, nama:'Garam Meja Refina 250g',       emoji:'🧂', harga:3500,  stok:17,  stokMin:5,  unit:'pcs', kategori:'Makanan',   exp:'25 Jun 29', supplier:'PT Sinar Sari',       barcode:'',             mutasi:[]},
  ],
  supplier: [
    {id:0, toko:'PT Sembako Sari',     sales:'Andika Rahmadian', wa:'0813-7585-1155', alamat:'Jl. Pasar Baru No. 12, Jakarta Pusat',    tglKedatangan:'Rabu, 13 Apr 2026',  hariKunjungan:'Rabu'},
    {id:1, toko:'PT Sinar Sari',       sales:'Yohanes Yongki',   wa:'0821-4382-9355', alamat:'Jl. Sudirman No. 45, Jakarta Selatan',    tglKedatangan:'Jumat, 11 Apr 2026', hariKunjungan:'Jumat'},
    {id:2, toko:'PT Grosir Nusantara', sales:'Budi Santoso',     wa:'0812-3456-7890', alamat:'Jl. Gatot Subroto No. 88, Jakarta Barat', tglKedatangan:'Senin, 7 Apr 2026',  hariKunjungan:'Senin'},
  ],
  transaksi:    [],
  mutasiHarian: [],
  selectedId:   null,
  selectedMitra: 0,
  filterState:  {kategori:[], sortStok:'', sortHarga:''},
  mitraFilterHari: 'Hari Ini',
  profile: {nama: 'Pak Faiq', warung: 'Suka Maju'},

  getById:    function(id){ return this.barang.find(function(b){return b.id===id;}); },
  getSupById: function(id){ return this.supplier.find(function(s){return s.id===id;}); },
  rp:         function(n){ return 'Rp '+Number(n).toLocaleString('id-ID'); },
  tagClass:   function(stok,min){ return stok===0?'tr':stok<=min?'to':'tg'; },
  nextId:     function(){ return this.barang.reduce(function(mx,b){return Math.max(mx,b.id);},0)+1; },

  tambahMutasi: function(id, jml, ket){
    var b = this.getById(id); if(!b) return;
    b.stok = Math.max(0, b.stok + jml);
    var tgl = _tglHariIni();
    b.mutasi.unshift({tgl:tgl, ket:ket, jml:jml});
    this.mutasiHarian.unshift({nama:b.nama, tgl:tgl, ket:ket, jml:jml, unit:b.unit});
    // Sync SQLite stok
    if(sqlDB){
      sqlDB.run('UPDATE BARANG SET Stok_Aktual=? WHERE ID_Barang=?', [b.stok,'B'+b.id]);
      var mid = 'M_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
      sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga) VALUES(?,?,?,?,?,?)',
        [mid,'B'+b.id, tgl, ket, jml, b.harga]);
    }
  }
};

function _tglHariIni(){
  var H=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  var BL=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
  var d=new Date();
  return H[d.getDay()]+', '+d.getDate()+' '+BL[d.getMonth()]+' '+d.getFullYear();
}

// ── localStorage Persistence ────────────────────────────────────
function saveToLocalStorage(){
  try {
    localStorage.setItem(LS_KEY_DATA, JSON.stringify({
      barang:       DB.barang,
      supplier:     DB.supplier,
      transaksi:    (DB.transaksi||[]).slice(0,500),
      mutasiHarian: DB.mutasiHarian.slice(0,200),
      profile:      DB.profile
    }));
    if(sqlDB){
      try {
        var bArr = sqlDB.export();
        if(bArr.length < 3500000){
          var b64 = btoa(String.fromCharCode.apply(null, bArr));
          localStorage.setItem(LS_KEY_DB, b64);
        }
      } catch(e2){}
    }
  } catch(e){ console.warn('localStorage error:', e); }
}

function loadFromLocalStorage(){
  try {
    var raw = localStorage.getItem(LS_KEY_DATA);
    if(!raw) return false;
    var saved = JSON.parse(raw);
    if(saved.barang    && saved.barang.length)    DB.barang        = saved.barang;
    if(saved.supplier  && saved.supplier.length)  DB.supplier      = saved.supplier;
    if(saved.transaksi && saved.transaksi.length) DB.transaksi     = saved.transaksi;
    if(saved.mutasiHarian)                         DB.mutasiHarian  = saved.mutasiHarian;
    if(saved.profile)                              DB.profile       = saved.profile;
    console.log('✅ Data dimuat ('+DB.barang.length+' barang, '+(DB.transaksi||[]).length+' transaksi)');
    return true;
  } catch(e){ console.warn('Gagal load localStorage:', e); return false; }
}

function resetDatabase(){
  if(!confirm('Reset semua data ke data awal? Tidak bisa dibatalkan.')) return;
  localStorage.removeItem(LS_KEY_DATA);
  localStorage.removeItem(LS_KEY_DB);
  location.reload();
}

// Auto-save tiap 30 detik
setInterval(saveToLocalStorage, 30000);

// ── SQLite Init ─────────────────────────────────────────────────
function initSQLite(cb){
  if(typeof initSqlJs === 'undefined'){ cb && cb(); return; }
  initSqlJs({ locateFile: function(f){ return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/'+f; }})
  .then(function(sql){
    SQL = sql;
    var b64saved = localStorage.getItem(LS_KEY_DB);
    if(b64saved){
      try {
        var raw=atob(b64saved), arr=new Uint8Array(raw.length);
        for(var i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
        sqlDB = new SQL.Database(arr);
        console.log('✅ SQLite dipulihkan dari localStorage');
      } catch(e){ sqlDB = new SQL.Database(); }
    } else {
      sqlDB = new SQL.Database();
    }
    sqlDB.run('PRAGMA foreign_keys = ON;');
    sqlDB.run(`
      CREATE TABLE IF NOT EXISTS BARANG (ID_Barang TEXT PRIMARY KEY, Barcode TEXT, Nama_Barang TEXT NOT NULL, Harga_Jual REAL DEFAULT 0, Kategori TEXT, Stok_Aktual INTEGER DEFAULT 0, Batas_Stok INTEGER DEFAULT 3, Unit TEXT DEFAULT 'pcs', Emoji TEXT DEFAULT '📦', Exp_Date TEXT);
      CREATE TABLE IF NOT EXISTS SUPPLIER (ID_Supplier TEXT PRIMARY KEY, Nama_Toko TEXT, Nama_Sales TEXT, No_WA TEXT, Alamat TEXT, Tgl_Kedatangan TEXT, Hari_Kunjungan TEXT);
      CREATE TABLE IF NOT EXISTS JADWAL_KUNJUNGAN (ID_Jadwal TEXT PRIMARY KEY, ID_Supplier TEXT REFERENCES SUPPLIER(ID_Supplier) ON DELETE CASCADE, Hari_Kunjungan TEXT, Frekuensi TEXT DEFAULT 'Mingguan');
      CREATE TABLE IF NOT EXISTS MUTASI_STOK (ID_Mutasi TEXT PRIMARY KEY, ID_Barang TEXT REFERENCES BARANG(ID_Barang) ON DELETE CASCADE, ID_Supplier TEXT, Tanggal_Mutasi TEXT, Jenis_Mutasi TEXT, Jumlah INTEGER, Harga REAL, Tanggal_Expired TEXT, Catatan TEXT);
      CREATE TABLE IF NOT EXISTS HARGA_GROSIR (ID_Harga TEXT PRIMARY KEY, ID_Barang TEXT REFERENCES BARANG(ID_Barang) ON DELETE CASCADE, Jumlah_Beli INTEGER NOT NULL, Harga_Satuan REAL NOT NULL);
      CREATE TABLE IF NOT EXISTS TRANSAKSI_PENJUALAN (ID_Transaksi TEXT PRIMARY KEY, Tanggat_Waktu TEXT, Total_Belanja REAL DEFAULT 0, Metode_Pembayaran TEXT DEFAULT 'Tutup Toko', Jumlah_Bayar REAL DEFAULT 0, Kembalian REAL DEFAULT 0, Status TEXT DEFAULT 'LUNAS');
      CREATE TABLE IF NOT EXISTS DETAIL_TRANSAKSI (ID_Detail TEXT PRIMARY KEY, ID_Transaksi TEXT REFERENCES TRANSAKSI_PENJUALAN(ID_Transaksi) ON DELETE CASCADE, ID_Barang TEXT REFERENCES BARANG(ID_Barang), Jumlah_Beli INTEGER DEFAULT 1, Harga_Satuan REAL DEFAULT 0, Subtotal REAL DEFAULT 0, Jumlah_Retur REAL DEFAULT 0);
    `);
    // Seed data
    DB.barang.forEach(function(b){
      sqlDB.run('INSERT OR IGNORE INTO BARANG VALUES(?,?,?,?,?,?,?,?,?,?)',
        ['B'+b.id,b.barcode||'',b.nama,b.harga,b.kategori,b.stok,b.stokMin,b.unit,b.emoji,b.exp]);
    });
    DB.supplier.forEach(function(s){
      sqlDB.run('INSERT OR REPLACE INTO SUPPLIER VALUES(?,?,?,?,?,?,?)',
        ['SUP'+s.id,s.toko,s.sales,s.wa,s.alamat,s.tglKedatangan,s.hariKunjungan]);
      if(s.hariKunjungan){
        sqlDB.run('INSERT OR IGNORE INTO JADWAL_KUNJUNGAN VALUES(?,?,?,?)',
          ['JK_SUP'+s.id,'SUP'+s.id,s.hariKunjungan,'Mingguan']);
      }
    });
    // Re-sync current in-memory data
    DB.barang.forEach(function(b){
      sqlDB.run('UPDATE BARANG SET Stok_Aktual=?,Harga_Jual=?,Nama_Barang=? WHERE ID_Barang=?',
        [b.stok,b.harga,b.nama,'B'+b.id]);
    });
    console.log('✅ SQLite siap');
    if(cb) cb();
  }).catch(function(e){ console.warn('sql.js error:', e); if(cb) cb(); });
}

// ── API Functions ───────────────────────────────────────────────
function tambahBarang(obj){
  if(!obj||!obj.nama) throw new Error('Nama barang wajib diisi');
  var newId = DB.nextId();
  var b = {id:newId, nama:(obj.nama||'').trim(), emoji:obj.emoji||'📦',
    harga:parseInt(obj.harga)||0, stok:parseInt(obj.stok)||0,
    stokMin:parseInt(obj.stokMin)||3, unit:obj.unit||'pcs',
    kategori:obj.kategori||'Lainnya', exp:obj.exp||'—',
    supplier:obj.supplier||'—', barcode:obj.barcode||'', mutasi:[]};
  DB.barang.push(b);
  if(b.stok>0) b.mutasi.push({tgl:_tglHariIni(),ket:'Stok Awal',jml:b.stok});
  if(sqlDB){
    sqlDB.run('INSERT OR REPLACE INTO BARANG VALUES(?,?,?,?,?,?,?,?,?,?)',
      ['B'+newId,b.barcode,b.nama,b.harga,b.kategori,b.stok,b.stokMin,b.unit,b.emoji,b.exp]);
    if(b.stok>0){
      sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga) VALUES(?,?,?,?,?,?)',
        ['M_INIT_'+newId,'B'+newId,_tglHariIni(),'Stok Awal',b.stok,b.harga]);
    }
  }
  saveToLocalStorage();
  return b;
}

function eksporSQL(){
  if(!sqlDB){ alert('SQLite belum siap'); return; }
  var data=sqlDB.export(), arr=new Uint8Array(data);
  var blob=new Blob([arr],{type:'application/octet-stream'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a'); a.href=url; a.download='warungku.db'; a.click();
}

// ── Weekly Summary Calculator ───────────────────────────────────
function hitungRingkasanMingguan(){
  var HARI_LABEL = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  var result = [];
  var now = new Date();
  var totalMinggu = 0;
  var totalItems = 0;
  var hariAktif = 0;

  for(var d=6; d>=0; d--){
    var tgl = new Date(now);
    tgl.setDate(now.getDate() - d);
    var dayTotal = 0;
    var dayItems = 0;

    // Cari dari DB.transaksi (data real dari Tutup Toko)
    (DB.transaksi||[]).forEach(function(tx){
      var txDate = new Date(tx.tgl);
      if(txDate.toDateString() === tgl.toDateString()){
        dayTotal += tx.total||0;
        dayItems += (tx.details||[]).reduce(function(s,dt){return s+(dt.jumlah||0);},0);
      }
    });

    // Fallback: estimasi dari mutasi stok jika belum ada transaksi real
    if(dayTotal === 0){
      var tglStr = HARI_LABEL[tgl.getDay()]+', '+tgl.getDate();
      DB.barang.forEach(function(b){
        b.mutasi.forEach(function(m){
          if(m.ket.indexOf('Terjual')>=0 && (m.tgl||'').indexOf(tglStr)>=0){
            dayTotal += Math.abs(m.jml)*b.harga;
            dayItems += Math.abs(m.jml);
          }
        });
      });
    }

    if(dayTotal>0) hariAktif++;
    totalMinggu += dayTotal;
    totalItems  += dayItems;

    result.push({
      label: d===0 ? 'Hari ini' : HARI_LABEL[tgl.getDay()],
      tanggal: tgl.getDate(),
      total: dayTotal,
      items: dayItems,
      isToday: d===0
    });
  }

  return {
    hari: result,
    totalMinggu: totalMinggu,
    totalItems: totalItems,
    hariAktif: hariAktif,
    rataHari: hariAktif>0 ? Math.round(totalMinggu/hariAktif) : 0,
    maxHari: Math.max.apply(null, result.map(function(r){return r.total;})) || 1
  };
}
