// ═══════════════════════════════════════════════════════════════
// app.js — UI logic, render functions, navigation
// ═══════════════════════════════════════════════════════════════

// ── AUTH SYSTEM ─────────────────────────────────────────────────
var LS_KEY_USERS   = 'warungku_users_v1';
var LS_KEY_SESSION = 'warungku_session_v1';

function getUsers(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_USERS)||'[]'); }catch(e){return[];} }
function saveUsers(u){ localStorage.setItem(LS_KEY_USERS, JSON.stringify(u)); }
function getSession(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_SESSION)||'null'); }catch(e){return null;} }
function saveSession(s){ localStorage.setItem(LS_KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(LS_KEY_SESSION); }

// Validasi: apakah sudah login?
function isLoggedIn(){ return !!getSession(); }

function doLogin(){
  var username = (document.getElementById('login-username').value||'').trim();
  var password = (document.getElementById('login-password').value||'');
  var errEl = document.getElementById('login-err');
  errEl.style.display='none';

  if(!username || !password){
    errEl.textContent = '⚠️ Username dan password wajib diisi!';
    errEl.style.display='block'; return;
  }
  var users = getUsers();
  var found = users.find(function(u){ return u.username===username && u.password===password; });
  if(!found){
    errEl.textContent = '❌ Username atau password salah, atau akun belum terdaftar.';
    errEl.style.display='block'; return;
  }
  // Set session
  saveSession({username: found.username, warung: found.warung, nama: found.nama});
  // Update profile
  DB.profile.nama = found.nama || found.username;
  DB.profile.warung = found.warung;
  // Clear form
  document.getElementById('login-username').value='';
  document.getElementById('login-password').value='';
  errEl.style.display='none';
  go('pg-login-sukses');
  setTimeout(function(){ go('pg-home'); }, 1200);
}

function doSignupStep1(){
  var email    = (document.getElementById('signup-email').value||'').trim();
  var password = (document.getElementById('signup-password').value||'');
  var konfirm  = (document.getElementById('signup-konfirmasi').value||'');
  var errEl    = document.getElementById('signup-err');
  errEl.style.display='none';

  if(!email || !password || !konfirm){
    errEl.textContent = '⚠️ Semua kolom wajib diisi!';
    errEl.style.display='block'; return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    errEl.textContent = '⚠️ Format email tidak valid.';
    errEl.style.display='block'; return;
  }
  if(password.length < 6){
    errEl.textContent = '⚠️ Password minimal 6 karakter.';
    errEl.style.display='block'; return;
  }
  if(password !== konfirm){
    errEl.textContent = '❌ Konfirmasi password tidak cocok!';
    errEl.style.display='block'; return;
  }
  var users = getUsers();
  if(users.find(function(u){ return u.email===email; })){
    errEl.textContent = '❌ Email ini sudah terdaftar, silakan login.';
    errEl.style.display='block'; return;
  }
  // Simpan sementara di variabel global untuk dilanjutkan di step 2
  window._signupTemp = {email: email, password: password};
  errEl.style.display='none';
  go('pg-data-pengguna');
}

function doSignupFinish(){
  var username = (document.getElementById('dp-username').value||'').trim();
  var warung   = (document.getElementById('dp-warung').value||'').trim();
  var errEl    = document.getElementById('datapeng-err');
  errEl.style.display='none';

  if(!username || !warung){
    errEl.textContent = '⚠️ Username dan nama warung wajib diisi!';
    errEl.style.display='block'; return;
  }
  if(/\s/.test(username)){
    errEl.textContent = '⚠️ Username tidak boleh mengandung spasi.';
    errEl.style.display='block'; return;
  }
  var users = getUsers();
  if(users.find(function(u){ return u.username===username; })){
    errEl.textContent = '❌ Username sudah dipakai, pilih yang lain.';
    errEl.style.display='block'; return;
  }
  if(!window._signupTemp){
    errEl.textContent = '❌ Sesi pendaftaran habis, mulai dari awal.';
    errEl.style.display='block';
    setTimeout(function(){ go('pg-signup'); }, 1500); return;
  }
  var newUser = {
    email: window._signupTemp.email,
    password: window._signupTemp.password,
    username: username,
    nama: username,
    warung: warung
  };
  users.push(newUser);
  saveUsers(users);
  window._signupTemp = null;
  // Auto-login
  saveSession({username: newUser.username, warung: newUser.warung, nama: newUser.nama});
  DB.profile.nama = newUser.nama;
  DB.profile.warung = newUser.warung;
  saveToLocalStorage();
  go('pg-daftar-sukses');
  setTimeout(function(){ go('pg-home'); }, 1500);
}

function doLogout(){
  if(!confirm('Keluar dari akun ini?')) return;
  clearSession();
  go('pg-login');
}

// ── LUPA SANDI ──────────────────────────────────────────────────
var _lupaTarget = null; // username akun yang sedang direset

function bukaLupaSandi(){
  // Reset semua step ke awal
  _lupaTarget = null;
  var u = document.getElementById('lupa-username');
  var nw = document.getElementById('lupa-namawarung');
  var np = document.getElementById('lupa-newpass');
  var kp = document.getElementById('lupa-konfirmpass');
  if(u) u.value = '';
  if(nw) nw.value = '';
  if(np) np.value = '';
  if(kp) kp.value = '';
  ['lupa-err1','lupa-err2','lupa-err3'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.style.display='none'; el.textContent=''; }
  });
  _lupaTampilStep(1);
  go('pg-lupa-sandi');
}

function _lupaTampilStep(n){
  [1,2,3,4].forEach(function(i){
    var el = document.getElementById('lupa-step'+i);
    if(el) el.style.display = (i===n) ? 'block' : 'none';
  });
}

function lupaSandiKembali(toStep){
  ['lupa-err1','lupa-err2','lupa-err3'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.style.display='none'; el.textContent=''; }
  });
  _lupaTampilStep(toStep);
}

function lupaSandiCariAkun(){
  var username = (document.getElementById('lupa-username').value || '').trim();
  var errEl = document.getElementById('lupa-err1');
  errEl.style.display = 'none';

  if(!username){
    errEl.textContent = '⚠️ Username wajib diisi!';
    errEl.style.display = 'block';
    return;
  }
  var users = getUsers();
  var found = users.find(function(u){ return u.username === username; });
  if(!found){
    errEl.textContent = '❌ Username tidak ditemukan. Periksa kembali atau daftar akun baru.';
    errEl.style.display = 'block';
    return;
  }
  _lupaTarget = username;
  var el = document.getElementById('lupa-found-username');
  if(el) el.textContent = username;
  var nw = document.getElementById('lupa-namawarung');
  if(nw) nw.value = '';
  _lupaTampilStep(2);
}

function lupaSandiVerifikasi(){
  var namaWarung = (document.getElementById('lupa-namawarung').value || '').trim();
  var errEl = document.getElementById('lupa-err2');
  errEl.style.display = 'none';

  if(!namaWarung){
    errEl.textContent = '⚠️ Nama warung wajib diisi!';
    errEl.style.display = 'block';
    return;
  }
  var users = getUsers();
  var found = users.find(function(u){ return u.username === _lupaTarget; });
  if(!found){
    errEl.textContent = '❌ Akun tidak ditemukan. Mulai dari awal.';
    errEl.style.display = 'block';
    return;
  }
  // Verifikasi nama warung (tidak case-sensitive)
  if(found.warung.toLowerCase().trim() !== namaWarung.toLowerCase()){
    errEl.textContent = '❌ Nama warung tidak cocok. Coba lagi.';
    errEl.style.display = 'block';
    return;
  }
  var np = document.getElementById('lupa-newpass');
  var kp = document.getElementById('lupa-konfirmpass');
  if(np) np.value = '';
  if(kp) kp.value = '';
  _lupaTampilStep(3);
}

function lupaSandiSimpan(){
  var newpass  = (document.getElementById('lupa-newpass').value || '');
  var konfirm  = (document.getElementById('lupa-konfirmpass').value || '');
  var errEl = document.getElementById('lupa-err3');
  errEl.style.display = 'none';

  if(!newpass || !konfirm){
    errEl.textContent = '⚠️ Kedua kolom password wajib diisi!';
    errEl.style.display = 'block';
    return;
  }
  if(newpass.length < 6){
    errEl.textContent = '⚠️ Password minimal 6 karakter.';
    errEl.style.display = 'block';
    return;
  }
  if(newpass !== konfirm){
    errEl.textContent = '❌ Konfirmasi password tidak cocok!';
    errEl.style.display = 'block';
    return;
  }
  // Simpan password baru
  var users = getUsers();
  var idx = users.findIndex(function(u){ return u.username === _lupaTarget; });
  if(idx === -1){
    errEl.textContent = '❌ Akun tidak ditemukan. Mulai dari awal.';
    errEl.style.display = 'block';
    return;
  }
  users[idx].password = newpass;
  saveUsers(users);

  // Tampilkan step sukses
  var el = document.getElementById('lupa-sukses-username');
  if(el) el.textContent = _lupaTarget;
  _lupaTarget = null;
  _lupaTampilStep(4);
}

function lupaSandiSelesai(){
  // Bersihkan form lalu kembali ke login
  var u = document.getElementById('lupa-username');
  if(u) u.value = '';
  _lupaTampilStep(1);
  // Clear login form juga
  var lu = document.getElementById('login-username');
  var lp = document.getElementById('login-password');
  var le = document.getElementById('login-err');
  if(lu) lu.value = '';
  if(lp) lp.value = '';
  if(le){ le.style.display='none'; le.textContent=''; }
  go('pg-login');
}

// ── Navigation ─────────────────────────────────────────────────
function go(pageId){
  document.querySelectorAll('.page').forEach(function(p){
    p.classList.remove('active');
    var ps = p.querySelector('.page-scroll');
    if(ps) ps.scrollTop = 0;
    p.scrollTop = 0;
  });
  var t = document.getElementById(pageId);
  if(t){
    t.classList.add('active');
    var ps = t.querySelector('.page-scroll');
    if(ps) ps.scrollTop = 0;
    t.scrollTop = 0;
    requestAnimationFrame(function(){ window.scrollTo(0,0); });
  }
  if(pageId==='pg-home')          renderHome();
  if(pageId==='pg-katalog')       renderKatalog();
  if(pageId==='pg-laporan')       renderLaporan();
  if(pageId==='pg-mitra')         renderMitra();
  if(pageId==='pg-profil-mitra')  renderProfilMitra();
  if(pageId==='pg-edit-mitra')    renderEditMitra();
  if(pageId==='pg-tutup-toko')    renderTutupToko();
  if(pageId==='pg-barang-detail') renderBarangDetail();
  if(pageId==='pg-info-barang')   renderInfoBarang();
  if(pageId==='pg-barang-masuk')  renderBarangMasuk();
  if(pageId==='pg-barang-keluar') renderBarangKeluar();
  if(pageId==='pg-tambah-barang') resetTambahBarang();
  if(pageId==='pg-scanner')       startScanner();
  if(pageId!=='pg-scanner')       stopScanner();
  if(pageId==='pg-pengaturan')    renderPengaturan();
  if(pageId==='pg-ganti-nama')    renderGantiNama();
  if(pageId==='pg-ganti-warung')  renderGantiWarung();
  if(pageId==='pg-lupa-sandi')    resetLupaSandiForm();
}


function renderPengaturan(){
  var s = getSession();
  var nama = s ? (s.nama||s.username) : DB.profile.nama;
  var warung = s ? s.warung : DB.profile.warung;
  var el1 = document.getElementById("set-username");
  var el2 = document.getElementById("set-warung");
  if(el1) el1.value = nama;
  if(el2) el2.value = warung;
}

function showSel(id){ if(id!==undefined) DB.selectedId=id; document.getElementById('sel-overlay').classList.add('show'); }
function hideSel(){ document.getElementById('sel-overlay').classList.remove('show'); }
function showBarPlus(){ document.getElementById('bar-plus-overlay').classList.add('show'); }
function hideBarPlus(){ document.getElementById('bar-plus-overlay').classList.remove('show'); }

function showToastWK(msg, type){
  var t=document.getElementById('wk-toast');
  if(!t) return;
  t.textContent=msg;
  t.style.background=type==='error'?'#E74C3C':type==='warn'?'#F5A623':'#1A1A2E';
  t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer=setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)';},2500);
}

// ── HOME ────────────────────────────────────────────────────────
function renderHome(){
  // Profile
  var nm=document.getElementById('home-warung-name');
  var gr=document.getElementById('home-greeting');
  if(nm) nm.textContent=DB.profile.warung||'Warung Anda';
  if(gr){
    var jam=new Date().getHours();
    var sapa=jam<11?'Selamat Pagi':jam<15?'Selamat Siang':jam<18?'Selamat Sore':'Selamat Malam';
    if(jam<11) sapa='Selamat Pagi';
    else if(jam<15) sapa='Selamat Siang';
    else if(jam<18) sapa='Selamat Sore';
    else sapa='Selamat Malam';
    gr.textContent=sapa+', '+DB.profile.nama+'!';
  }

  // Ringkasan mingguan dari hitungRingkasanMingguan()
  var rk = hitungRingkasanMingguan();

  // Update kartu pendapatan
  var revEl=document.getElementById('home-rev-total');
  var metaEl=document.getElementById('home-rev-meta');
  var progEl=document.getElementById('home-prog-fill');
  var progLbl=document.getElementById('home-prog-lbl');
  if(revEl) revEl.textContent = 'Rp '+rk.totalMinggu.toLocaleString('id-ID');
  if(metaEl) metaEl.textContent = 'Minggu Ini · '+rk.hariAktif+' hari aktif';

  // Progress vs target (target default 5 juta)
  var target = 5000000;
  var pct = Math.min(100, Math.round(rk.totalMinggu/target*100));
  if(progEl) progEl.style.width=pct+'%';
  if(progLbl) progLbl.textContent='Target Rp 5Jt: '+pct+'% Tercapai';

  // Mini bar chart mingguan di home
  var barsEl=document.getElementById('home-weekly-bars');
  if(barsEl){
    var max=rk.maxHari||1;
    barsEl.innerHTML='<div style="display:flex;align-items:flex-end;gap:4px;height:60px;width:100%;">'+
      rk.hari.map(function(h){
        var pct=max>0?Math.max(4,Math.round(h.total/max*100)):4;
        var clr=h.isToday?'var(--blue)':h.total>0?'var(--green)':'#eee';
        var tip=h.total>0?'Rp '+Math.round(h.total/1000)+'rb':'—';
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">'+
          '<div style="font-size:8px;color:#999;">'+tip+'</div>'+
          '<div style="width:100%;height:'+pct+'%;background:'+clr+';border-radius:4px 4px 0 0;min-height:4px;transition:height .3s;"></div>'+
          '<div style="font-size:9px;color:'+(h.isToday?'var(--blue)':'#999')+';font-weight:'+(h.isToday?'700':'400')+';">'+h.label+'</div>'+
        '</div>';
      }).join('')+
    '</div>';
  }

  // Jadwal sales hari ini
  var salesEl=document.getElementById('home-sales-container');
  if(salesEl){
    var HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var hariIni=HARI[new Date().getDay()];
    var salesHariIni=DB.supplier.filter(function(s){return s.hariKunjungan===hariIni;});
    var hdr='<div class="sales-hdr"><h4>Sales yang akan Datang</h4><span class="wh-lnk" onclick="go(\'pg-mitra\')">Buka Jadwal</span></div>';
    if(!salesHariIni.length){
      var urut=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
      var hIdx=urut.indexOf(hariIni); var next=null;
      for(var d=1;d<=7;d++){
        var cek=urut[(hIdx+d)%7];
        var found=DB.supplier.filter(function(s){return s.hariKunjungan===cek;});
        if(found.length){next={hari:cek,list:found};break;}
      }
      salesEl.innerHTML=hdr+(next?
        '<div class="badge-hari" style="background:rgba(255,255,255,.25);">Berikutnya: '+next.hari+'</div>'+
        next.list.map(function(s){return _salesBodyHtml(s);}).join(''):
        '<div style="color:rgba(255,255,255,.7);font-size:13px;padding:8px 0;">Tidak ada jadwal. <span onclick="go(\'pg-mitra\')" style="text-decoration:underline;cursor:pointer;">Tambah mitra</span></div>');
    } else {
      salesEl.innerHTML=hdr+'<div class="badge-hari">Hari Ini — '+hariIni+'</div>'+salesHariIni.map(function(s){return _salesBodyHtml(s);}).join('');
    }
  }

  // Peringatan stok
  var wEl=document.getElementById('home-stok-warning');
  if(wEl){
    var w=DB.barang.filter(function(b){return b.stok<=b.stokMin;});
    if(!w.length){
      wEl.innerHTML='<div style="color:var(--text-light);font-size:13px;padding:8px 0;">Semua stok aman ✅</div>';
    } else {
      wEl.innerHTML=w.map(function(b){
        return '<div class="stok-row">'+
          '<div class="stok-img-box">'+b.emoji+'</div>'+
          '<div class="stok-info">'+
            '<div class="stok-alert">'+(b.stok===0?'Habis!':'Hampir Habis!')+
            ' <span class="stok-badge">'+b.stok+' '+b.unit+'</span></div>'+
            '<div class="stok-nm">'+b.nama+'</div>'+
          '</div>'+
          '<div class="stok-more" onclick="DB.selectedId='+b.id+';go(\'pg-barang-detail\')">≡</div>'+
        '</div>';
      }).join('');
    }
  }
}

function _salesBodyHtml(s){
  return '<div class="sales-body">'+
    '<div class="sales-ava">👨‍💼</div>'+
    '<div>'+
      '<div class="sales-name">'+s.sales+'</div>'+
      '<div style="font-size:11px;color:rgba(255,255,255,.7);">'+s.toko+'</div>'+
      '<div class="sales-phone">'+s.wa+'</div>'+
      '<a href="https://wa.me/'+s.wa.replace(/[^0-9]/g,'')+'" target="_blank" class="btn-wa-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;">💬 WhatsApp</a>'+
    '</div></div>';
}

// ── LAPORAN — terintegrasi penuh dengan hitungRingkasanMingguan ──
function renderLaporan(){
  var rk = hitungRingkasanMingguan();

  // Header card — ringkasan mingguan
  var totalEl=document.getElementById('lap-total-minggu');
  var lblEl=document.getElementById('lap-total-lbl');
  var progEl=document.getElementById('lap-prog-fill');
  var progLblEl=document.getElementById('lap-prog-lbl');
  if(totalEl) totalEl.textContent='Rp '+rk.totalMinggu.toLocaleString('id-ID');
  if(lblEl) lblEl.textContent='Total pendapatan 7 hari terakhir · '+rk.hariAktif+' hari aktif';
  var target=5000000, pct=Math.min(100,Math.round(rk.totalMinggu/target*100));
  if(progEl) progEl.style.width=pct+'%';
  if(progLblEl) progLblEl.textContent='Target Rp 5Jt: '+pct+'% Tercapai';

  // Stat 3-kolom
  var statHari=document.getElementById('lap-stat-hari');
  var statItems=document.getElementById('lap-stat-items');
  var statAvg=document.getElementById('lap-stat-avg');
  if(statHari) statHari.textContent=rk.hariAktif;
  if(statItems) statItems.textContent=rk.totalItems;
  if(statAvg) statAvg.textContent=rk.rataHari>0?'Rp '+Math.round(rk.rataHari/1000)+'rb':'Rp 0';

  // Grafik batang 7 hari
  var chartEl=document.getElementById('lap-weekly-chart');
  var labelsEl=document.getElementById('lap-weekly-labels');
  if(chartEl){
    var max=rk.maxHari||1;
    chartEl.innerHTML=rk.hari.map(function(h){
      var barH=max>0?Math.max(4,Math.round(h.total/max*90)):4;
      var clr=h.isToday?'var(--blue)':h.total>0?'var(--green)':'#E8E8E8';
      return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;">'+
        (h.total>0?'<div style="font-size:8px;color:#999;white-space:nowrap;">'+Math.round(h.total/1000)+'rb</div>':'<div style="font-size:8px;"> </div>')+
        '<div style="width:100%;height:'+barH+'px;background:'+clr+';border-radius:4px 4px 0 0;min-height:4px;transition:height .4s;"></div>'+
      '</div>';
    }).join('');
    if(labelsEl){
      labelsEl.innerHTML=rk.hari.map(function(h){
        return '<div style="flex:1;text-align:center;font-size:9px;color:'+(h.isToday?'var(--blue)':'#999')+';font-weight:'+(h.isToday?'700':'400')+';">'+
          h.label+'<br><span style="font-size:8px;color:#ccc;">'+h.tanggal+'</span></div>';
      }).join('');
    }
  }

  // ── Tab Pendapatan ──────────────────────────────────────────
  var pendEl=document.getElementById('lap-pendapatan');
  if(pendEl){
    var txList=DB.transaksi||[];
    var BULAN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    var HARI_S=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    if(!txList.length){
      // Estimasi per-hari dari mutasi
      var byDay={};
      DB.barang.forEach(function(b){
        b.mutasi.forEach(function(m){
          if(m.ket.indexOf('Terjual')<0) return;
          var key=m.tgl||'Hari ini';
          if(!byDay[key]) byDay[key]={tgl:key,total:0,items:0};
          byDay[key].total+=Math.abs(m.jml)*b.harga;
          byDay[key].items++;
        });
      });
      var days=Object.values(byDay).slice(0,14);
      pendEl.innerHTML=!days.length?
        '<div style="text-align:center;padding:28px 0;color:#aaa;font-size:13px;">Belum ada data pendapatan.<br>Gunakan <strong>Tutup Toko</strong> setiap malam.</div>':
        days.map(function(d){
          return '<div class="lap-item"><div class="lap-row">'+
            '<span class="lap-date">'+d.tgl+'</span>'+
            '<span class="badge-green">Rp '+d.total.toLocaleString('id-ID')+'</span></div>'+
            '<div class="lap-sub">'+d.items+' jenis (estimasi)</div><div class="lap-div"></div></div>';
        }).join('');
    } else {
      var grand=txList.reduce(function(s,tx){return s+(tx.total||0);},0);
      pendEl.innerHTML=
        '<div style="background:#f0f9f4;border-radius:14px;padding:12px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">'+
          '<div style="font-size:12px;color:#666;">Total keseluruhan</div>'+
          '<div style="font-size:18px;font-weight:800;color:var(--green);">Rp '+grand.toLocaleString('id-ID')+'</div>'+
        '</div>'+
        txList.slice(0,30).map(function(tx){
          var d=new Date(tx.tgl);
          var ts=isNaN(d.getTime())?(tx.tgl||'—'):HARI_S[d.getDay()]+', '+d.getDate()+' '+BULAN[d.getMonth()]+' '+d.getFullYear();
          return '<div class="lap-item"><div class="lap-row">'+
            '<span class="lap-date">'+ts+'</span>'+
            '<span class="badge-green">Rp '+tx.total.toLocaleString('id-ID')+'</span></div>'+
            '<div class="lap-sub">Tutup Toko · '+(tx.details?tx.details.length:0)+' jenis barang</div>'+
            '<div class="lap-div"></div></div>';
        }).join('');
    }
  }

  // ── Tab Stok ────────────────────────────────────────────────
  var stokEl=document.getElementById('lap-stok');
  if(stokEl){
    var sorted=DB.barang.slice().sort(function(a,b){
      var ta=a.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;}).reduce(function(s,m){return s+Math.abs(m.jml);},0);
      var tb=b.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;}).reduce(function(s,m){return s+Math.abs(m.jml);},0);
      return tb-ta;
    });
    stokEl.innerHTML=sorted.map(function(b){
      var tj=b.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;}).reduce(function(s,m){return s+Math.abs(m.jml);},0);
      var max=b.stok+tj+1, pct=Math.min(100,Math.round(b.stok/max*100));
      var clr=b.stok===0?'#E74C3C':b.stok<=b.stokMin?'#F5A623':'#27AE60';
      return '<div class="stok-bar-item">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'+
          '<span style="font-size:20px;">'+b.emoji+'</span>'+
          '<div class="stok-bar-name">'+b.nama+'</div>'+
          '<span style="margin-left:auto;font-size:11px;font-weight:700;color:'+clr+';">'+b.stok+' '+b.unit+'</span>'+
        '</div>'+
        '<div class="stok-bar-sub">Min: '+b.stokMin+' '+b.unit+(b.stok<=b.stokMin?' · <span style="color:'+clr+';font-weight:700;">'+(b.stok===0?'HABIS':'HAMPIR HABIS')+'</span>':'')+' · Terjual: '+tj+' '+b.unit+'</div>'+
        '<div style="height:6px;background:#eee;border-radius:3px;margin-top:5px;"><div style="height:100%;width:'+pct+'%;background:'+clr+';border-radius:3px;"></div></div>'+
      '</div>';
    }).join('');
  }

  // ── Tab Mutasi ──────────────────────────────────────────────
  var mutEl=document.getElementById('lap-mutasi');
  if(mutEl){
    var all=[];
    DB.barang.forEach(function(b){ b.mutasi.forEach(function(m){all.push({nama:b.nama,emoji:b.emoji,unit:b.unit,tgl:m.tgl,ket:m.ket,jml:m.jml,harga:b.harga});}); });
    mutEl.innerHTML=!all.length?
      '<div style="color:#aaa;font-size:13px;text-align:center;padding:20px 0;">Belum ada mutasi</div>':
      all.slice(0,40).map(function(m){
        var isIn=m.jml>0;
        var isWarn=!isIn&&(m.ket.indexOf('Kadaluarsa')>=0||m.ket.indexOf('Rusak')>=0||m.ket.indexOf('tikus')>=0||m.ket.indexOf('Buang')>=0);
        var cls=isIn?'badge-plus':isWarn?'badge-warn':'badge-minus';
        return '<div class="lap-item"><div class="lap-row">'+
          '<span class="lap-date">'+m.emoji+' '+m.nama+'</span>'+
          '<span class="'+cls+'">'+(m.jml>0?'+':'')+m.jml+' '+m.unit+'</span></div>'+
          '<div class="lap-sub">'+m.ket+(m.harga>0?' · Rp '+Math.abs(m.jml*m.harga).toLocaleString('id-ID'):'')+' · '+m.tgl+'</div></div>';
      }).join('');
  }
}

function setLapTab(btn, tabId){
  ['lap-pendapatan','lap-stok','lap-mutasi'].forEach(function(id){document.getElementById(id).style.display='none';});
  document.getElementById(tabId).style.display='block';
  document.querySelectorAll('#lap-tabs .tab').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
}

// ── KATALOG ─────────────────────────────────────────────────────
var katalogPage=1, KATALOG_PER_PAGE=6;

function renderKatalog(resetPage){
  var listEl=document.getElementById('katalog-list');
  var pgnEl=document.getElementById('katalog-pgn');
  if(!listEl) return;
  var q=(document.getElementById('katalog-search')||{value:''}).value.toLowerCase();
  // Reset ke halaman 1 kalau search berubah atau diminta
  if(resetPage) katalogPage=1;
  var items=DB.barang.filter(function(b){return b.nama.toLowerCase().indexOf(q)>=0;});
  if(DB.filterState.kategori.length) items=items.filter(function(b){return DB.filterState.kategori.indexOf(b.kategori)>=0;});
  if(DB.filterState.sortStok==='Hampir Habis') items=items.filter(function(b){return b.stok<=b.stokMin;});
  if(DB.filterState.sortStok==='Terbanyak') items.sort(function(a,b){return b.stok-a.stok;});
  if(DB.filterState.sortStok==='Tersedikit') items.sort(function(a,b){return a.stok-b.stok;});
  if(DB.filterState.sortHarga==='Termahal') items.sort(function(a,b){return b.harga-a.harga;});
  if(DB.filterState.sortHarga==='Termurah') items.sort(function(a,b){return a.harga-b.harga;});
  var totalPage=Math.max(1,Math.ceil(items.length/KATALOG_PER_PAGE));
  if(katalogPage>totalPage) katalogPage=1;
  var start=(katalogPage-1)*KATALOG_PER_PAGE;
  var pageItems=items.slice(start,start+KATALOG_PER_PAGE);
  listEl.innerHTML=pageItems.map(function(b){
    var cls=DB.tagClass(b.stok,b.stokMin);
    return '<div class="kat-item" data-id="'+b.id+'">'+
      '<div class="kat-img">'+b.emoji+'</div>'+
      '<div class="kat-info">'+
        '<div class="kat-name">'+b.nama+'</div>'+
        '<div class="kat-price">'+DB.rp(b.harga)+'</div>'+
        '<div class="kat-tags"><span class="tag '+cls+'">Stok: '+b.stok+' '+b.unit+'</span>'+
        (b.exp&&b.exp!=='—'?'<span class="tag tgr">'+b.exp+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="kat-more" data-id="'+b.id+'">⋮</div>'+
    '</div>';
  }).join('');
  if(pgnEl){
    var p1d=katalogPage<=1?'disabled':'', pd=katalogPage<=1?'disabled':'';
    var nd=katalogPage>=totalPage?'disabled':'', n1d=katalogPage>=totalPage?'disabled':'';
    pgnEl.innerHTML=
      '<button class="pgn-arr '+p1d+'" onclick="gotoKatalogPage(1)">←</button>'+
      '<button class="pgn-arr '+pd+'" onclick="gotoKatalogPage('+(katalogPage-1)+')">‹</button>'+
      '<span class="pgn-btn active">'+katalogPage+' / '+totalPage+'</span>'+
      '<button class="pgn-arr '+nd+'" onclick="gotoKatalogPage('+(katalogPage+1)+')">›</button>'+
      '<button class="pgn-arr '+n1d+'" onclick="gotoKatalogPage('+totalPage+')">→</button>';
  }
  listEl.querySelectorAll('.kat-item').forEach(function(el){
    var id=parseInt(el.dataset.id), pressTimer=null;
    el.querySelector('.kat-more').addEventListener('click',function(e){e.stopPropagation();DB.selectedId=id;showSel();});
    function sp(e){if(e.target===el.querySelector('.kat-more'))return;pressTimer=setTimeout(function(){pressTimer=null;DB.selectedId=id;showSel();},600);}
    function ep(e){if(e.target===el.querySelector('.kat-more'))return;if(pressTimer){clearTimeout(pressTimer);pressTimer=null;DB.selectedId=id;go('pg-info-barang');}}
    function cp(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}}
    el.addEventListener('mousedown',sp); el.addEventListener('touchstart',sp,{passive:true});
    el.addEventListener('mouseup',ep);   el.addEventListener('touchend',ep);
    el.addEventListener('mouseleave',cp);el.addEventListener('touchmove',cp,{passive:true});
  });
}

function gotoKatalogPage(p){
  var q=(document.getElementById('katalog-search')||{value:''}).value.toLowerCase();
  var cnt=DB.barang.filter(function(b){return b.nama.toLowerCase().indexOf(q)>=0;}).length;
  katalogPage=Math.max(1,Math.min(p,Math.max(1,Math.ceil(cnt/KATALOG_PER_PAGE))));
  renderKatalog();
  var pg=document.getElementById('pg-katalog'); if(pg) pg.scrollTop=0;
}

function toggleFOpt(el){ el.classList.toggle('on'); }
function selectFOpt(el,groupId){
  document.querySelectorAll('#'+groupId+' .f-opt').forEach(function(b){b.classList.remove('on');});
  el.classList.add('on');
}
function applyFilter(){
  var kats=[];
  document.querySelectorAll('#filter-kategori .f-opt.on').forEach(function(b){kats.push(b.textContent.trim());});
  DB.filterState.kategori=kats;
  DB.filterState.sortStok=(document.querySelector('#filter-stok .f-opt.on')||{textContent:''}).textContent.trim();
  DB.filterState.sortHarga=(document.querySelector('#filter-harga .f-opt.on')||{textContent:''}).textContent.trim();
  katalogPage=1; go('pg-katalog');
}
function resetFilter(){
  document.querySelectorAll('#filter-kategori .f-opt,#filter-stok .f-opt,#filter-harga .f-opt').forEach(function(b){b.classList.remove('on');});
  DB.filterState={kategori:[],sortStok:'',sortHarga:''}; katalogPage=1; go('pg-katalog');
}

// ── BARANG DETAIL ───────────────────────────────────────────────
function renderBarangDetail(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var el=document.getElementById('detail-content'); if(!el) return;
  var EMOJIS=['📦','🍜','☕','🧂','🫙','🧼','🍵','🚬','🧴','🍫','🧃','🍶','🍬','🥫','🛒','🍚','🥤','🧹','🪣','🧻','🍭','🫗','🍾','🥚','🍗','🥩','🧇','🍞','🍪','🧆'];
  var emojiOpts=EMOJIS.map(function(e){
    return '<span onclick="editEmoji(\''+e+'\')" style="font-size:28px;cursor:pointer;padding:4px;border-radius:8px;'+(b.emoji===e?'background:#E8EBFF;':'')+'" title="'+e+'">'+e+'</span>';
  }).join('');
  var supOpts=DB.supplier.map(function(s){
    return '<option value="'+s.toko+'" '+(b.supplier===s.toko?'selected':'')+'>'+s.toko+'</option>';
  }).join('');
  var katList=['Makanan','Minuman','Kebutuhan','Lainnya','Rokok','Frozen','Snack','Sembako'];
  var katOpts=katList.map(function(k){return '<option value="'+k+'" '+(b.kategori===k?'selected':'')+'>'+k+'</option>';}).join('');

  el.innerHTML=
    '<div class="detail-top" style="min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">'+
      '<button class="detail-close" onclick="go(\'pg-katalog\')">✕</button>'+
      '<div style="font-size:80px;cursor:pointer;" onclick="toggleEmojiPicker()" title="Tap untuk ganti emoji">'+b.emoji+'</div>'+
      '<div style="font-size:11px;color:rgba(255,255,255,.7);">Tap gambar untuk ganti</div>'+
      '<div id="emoji-picker" style="display:none;background:#fff;border-radius:14px;padding:10px;max-width:280px;flex-wrap:wrap;display:none;gap:4px;box-shadow:0 4px 20px rgba(0,0,0,.15);">'+emojiOpts+'</div>'+
    '</div>'+
    '<div class="detail-body">'+
      '<div class="detail-name-row"><div class="detail-name">'+b.nama+'</div>'+
      '<div class="detail-edit-btn" onclick="editNamaBarang()">✏️</div></div>'+
      '<div class="detail-divider"></div>'+
      '<div class="detail-grid">'+
        '<div><div class="dg-label">Harga Barang</div><div class="dg-field">'+
          '<span>💰</span><span class="dg-val" id="dd-harga">'+DB.rp(b.harga)+'</span>'+
          '<span class="dg-edit" onclick="editHarga()">✏️</span></div></div>'+
        '<div><div class="dg-label">Stok</div><div class="dg-field">'+
          '<span>📦</span><span class="dg-val" id="dd-stok">'+b.stok+' '+b.unit+'</span>'+
          '<span class="dg-edit" onclick="editStok()">✏️</span></div></div>'+
        '<div><div class="dg-label">Kadaluarsa</div><div class="dg-field" style="cursor:pointer;" onclick="editExpDate()">'+
          '<span>📅</span><span class="dg-val" id="dd-exp">'+b.exp+'</span>'+
          '<span class="dg-edit">✏️</span></div></div>'+
        '<div><div class="dg-label">Kategori</div><div class="dg-field">'+
          '<span>🏷️</span>'+
          '<select id="dd-kategori" onchange="editKategori(this.value)" style="border:none;background:transparent;font-family:inherit;font-size:13px;color:var(--text);flex:1;cursor:pointer;">'+katOpts+'</select>'+
          '</div></div>'+
      '</div>'+
      '<div class="dg-label">Supplier</div>'+
      '<div class="dg-field" style="margin-bottom:4px;">'+
        '<span>🏭</span>'+
        '<select id="dd-supplier" onchange="editSupplier(this.value)" style="border:none;background:transparent;font-family:inherit;font-size:13px;color:var(--text);flex:1;cursor:pointer;">'+
          '<option value="—" '+(b.supplier==='—'?'selected':'')+'>— Belum ada —</option>'+supOpts+
        '</select>'+
      '</div>'+
      '<div class="dg-label" style="margin-top:8px;">Deskripsi</div>'+
      '<div style="margin-bottom:8px;">'+
        '<textarea id="dd-deskripsi" onblur="editDeskripsi(this.value)" rows="2" style="width:100%;box-sizing:border-box;border:1px solid #E5E7EB;border-radius:10px;padding:8px 10px;font-family:inherit;font-size:13px;color:var(--text);resize:none;" placeholder="Tambahkan deskripsi barang...">'+( b.deskripsi||'')+'</textarea>'+
      '</div>'+
      '<div class="detail-actions">'+
        '<div class="dact" onclick="go(\'pg-barang-masuk\')">'+
          '<div class="dact-circle" style="background:var(--green);"><span style="color:#fff;font-size:22px;">📥</span></div>'+
          '<div class="dact-label">Stok Masuk</div></div>'+
        '<div class="dact" onclick="lihatBarangLaku()">'+
          '<div class="dact-circle" style="background:#F39C12;"><span style="color:#fff;font-size:22px;">📊</span></div>'+
          '<div class="dact-label">Penjualan</div></div>'+
        '<div class="dact" onclick="konfirmasiHapusBarang()">'+
          '<div class="dact-circle" style="background:#C0392B;"><span style="color:#fff;font-size:22px;">🗑️</span></div>'+
          '<div class="dact-label">Hapus</div></div>'+
        '<div class="dact" onclick="go(\'pg-info-barang\')">'+
          '<div class="dact-circle" style="background:var(--blue);"><span style="color:#fff;font-size:22px;">📋</span></div>'+
          '<div class="dact-label">Riwayat</div></div>'+
      '</div>'+
    '</div>';
}

function toggleEmojiPicker(){
  var p=document.getElementById('emoji-picker');
  if(!p) return;
  p.style.display = p.style.display==='none'?'flex':'none';
}

function editEmoji(emoji){
  var b=DB.getById(DB.selectedId); if(!b) return;
  b.emoji=emoji;
  if(sqlDB) sqlDB.run('UPDATE BARANG SET Emoji=? WHERE ID_Barang=?',[emoji,'B'+b.id]);
  saveToLocalStorage(); renderBarangDetail(); renderKatalog();
  showToastWK('✅ Ikon barang diperbarui');
}

function editExpDate(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var v=prompt('Tanggal kadaluarsa (contoh: 31 Des 26):', b.exp==='—'?'':b.exp);
  if(v===null) return;
  b.exp=(v.trim()||'—');
  if(sqlDB) sqlDB.run('UPDATE BARANG SET Exp_Date=? WHERE ID_Barang=?',[b.exp,'B'+b.id]);
  saveToLocalStorage(); renderBarangDetail();
  showToastWK('✅ Kadaluarsa diperbarui');
}

function editKategori(val){
  var b=DB.getById(DB.selectedId); if(!b) return;
  b.kategori=val;
  if(sqlDB) sqlDB.run('UPDATE BARANG SET Kategori=? WHERE ID_Barang=?',[val,'B'+b.id]);
  saveToLocalStorage(); renderKatalog();
  showToastWK('✅ Kategori diperbarui');
}

function editSupplier(val){
  var b=DB.getById(DB.selectedId); if(!b) return;
  b.supplier=val;
  saveToLocalStorage();
  showToastWK('✅ Supplier diperbarui');
}

function editDeskripsi(val){
  var b=DB.getById(DB.selectedId); if(!b) return;
  b.deskripsi=(val||'').trim();
  saveToLocalStorage();
}

function lihatBarangLaku(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var totalTerjual=b.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;})
    .reduce(function(s,m){return s+Math.abs(m.jml);},0);
  var totalPendapatan=totalTerjual*b.harga;
  var riwayatTerjual=b.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;}).slice(0,5);
  var detail=riwayatTerjual.length
    ? riwayatTerjual.map(function(m){return '• '+m.tgl+': '+Math.abs(m.jml)+' '+b.unit;}).join('\n')
    : 'Belum ada riwayat penjualan';
  alert(
    '📊 DATA PENJUALAN: '+b.nama+'\n\n'+
    '📦 Total terjual : '+totalTerjual+' '+b.unit+'\n'+
    '💰 Total pendapatan: Rp '+totalPendapatan.toLocaleString('id-ID')+'\n\n'+
    '📅 Riwayat terakhir:\n'+detail
  );
}

function editStok(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var v=prompt('Ubah stok '+b.nama+' (saat ini: '+b.stok+')',b.stok);
  if(v===null) return;
  var n=parseInt(v); if(isNaN(n)||n<0){alert('Angka tidak valid');return;}
  var delta=n-b.stok, ket=(delta>=0?'Penambahan':'Pengurangan')+' Stok Manual';
  if(delta!==0){
    b.stok=n;
    b.mutasi.unshift({tgl:_tglHariIni(),ket:ket,jml:delta});
    DB.mutasiHarian.unshift({nama:b.nama,tgl:_tglHariIni(),ket:ket,jml:delta,unit:b.unit});
    if(sqlDB){
      sqlDB.run('UPDATE BARANG SET Stok_Aktual=? WHERE ID_Barang=?',[n,'B'+b.id]);
      var mid='M_ADJ_'+Date.now();
      sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga) VALUES(?,?,?,?,?,?)',
        [mid,'B'+b.id,_tglHariIni(),ket,delta,b.harga]);
    }
    saveToLocalStorage();
  }
  renderBarangDetail(); renderKatalog(); renderHome();
}

function editHarga(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var v=prompt('Ubah harga '+b.nama+' (saat ini: '+b.harga+')',b.harga);
  if(v===null) return;
  var n=parseInt(v); if(isNaN(n)||n<0){alert('Angka tidak valid');return;}
  b.harga=n;
  if(sqlDB) sqlDB.run('UPDATE BARANG SET Harga_Jual=? WHERE ID_Barang=?',[n,'B'+b.id]);
  saveToLocalStorage(); renderBarangDetail();
  showToastWK('✅ Harga diperbarui: '+DB.rp(n));
}

function editNamaBarang(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var v=prompt('Ubah nama barang:',b.nama);
  if(!v||!v.trim()) return;
  b.nama=v.trim();
  if(sqlDB) sqlDB.run('UPDATE BARANG SET Nama_Barang=? WHERE ID_Barang=?',[b.nama,'B'+b.id]);
  saveToLocalStorage(); renderBarangDetail(); renderKatalog();
  showToastWK('✅ Nama diperbarui');
}

function konfirmasiHapusBarang(){
  hideSel();
  var b=DB.getById(DB.selectedId); if(!b) return;
  if(!confirm('Hapus "'+b.nama+'"?\nSemua riwayat mutasi akan terhapus.')) return;
  var idToDel=DB.selectedId;
  DB.barang=DB.barang.filter(function(x){return x.id!==idToDel;});
  if(sqlDB){
    sqlDB.run('DELETE FROM BARANG WHERE ID_Barang=?',['B'+idToDel]);
    sqlDB.run('DELETE FROM MUTASI_STOK WHERE ID_Barang=?',['B'+idToDel]);
    sqlDB.run('DELETE FROM DETAIL_TRANSAKSI WHERE ID_Barang=?',['B'+idToDel]);
  }
  DB.selectedId=null; saveToLocalStorage(); renderKatalog(); renderHome();
  showToastWK('🗑️ Barang berhasil dihapus'); go('pg-katalog');
}

// ── INFO BARANG ─────────────────────────────────────────────────
function renderInfoBarang(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var hdr=document.getElementById('info-barang-header');
  var mut=document.getElementById('info-mutasi-list');
  if(hdr){
    var tj=b.mutasi.filter(function(m){return m.ket.indexOf('Terjual')>=0;}).reduce(function(s,m){return s+Math.abs(m.jml);},0);
    hdr.innerHTML=
      '<div class="info-item-row">'+
        '<div class="info-img">'+b.emoji+'</div>'+
        '<div><div class="info-item-name">'+b.nama+'</div>'+
        '<div class="info-item-sup">'+b.supplier+'</div></div>'+
        '<div style="margin-left:auto;color:#aaa;cursor:pointer;" onclick="DB.selectedId='+b.id+';showSel()">⋮</div>'+
      '</div>'+
      '<div class="info-stats">'+
        '<div class="info-stat-box blue"><div class="info-stat-num">'+b.stok+' '+b.unit+'</div><div class="info-stat-lbl">Stok saat ini</div></div>'+
        '<div class="info-stat-box green"><div class="info-stat-num">'+tj+' '+b.unit+'</div><div class="info-stat-lbl">Total terjual</div></div>'+
      '</div>'+
      '<div class="info-kat-row"><span class="info-kat-lbl">Kategori</span><span class="info-kat-val">'+b.kategori+'</span></div>';
  }
  if(mut){
    mut.innerHTML=!b.mutasi.length?
      '<div style="color:var(--text-light);font-size:13px;padding:12px 0;text-align:center;">Belum ada riwayat mutasi</div>':
      b.mutasi.slice(0,20).map(function(m){
        var cls=m.jml>0?'mutasi-plus':(m.ket.indexOf('Kadaluarsa')>=0||m.ket.indexOf('Rusak')>=0?'mutasi-red':'mutasi-minus');
        return '<div class="mutasi-row">'+
          '<span class="mutasi-date">'+m.tgl+' — '+m.ket+'</span>'+
          '<span class="'+cls+'">'+(m.jml>0?'+':'')+m.jml+' '+b.unit+'</span></div>';
      }).join('');
  }
}

// ── BARANG MASUK ────────────────────────────────────────────────
function renderBarangMasuk(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var n=document.getElementById('bm-nama'), s=document.getElementById('bm-stok-now');
  var j=document.getElementById('bm-jumlah'), k=document.getElementById('bm-ket');
  if(n) n.textContent=b.nama;
  if(s) s.textContent='Stok saat ini: '+b.stok+' '+b.unit;
  if(j) j.value=''; if(k) k.value='';
  // Dropdown supplier
  var wrap=document.getElementById('bm-sup-wrap');
  if(!wrap){
    wrap=document.createElement('div'); wrap.id='bm-sup-wrap';
    wrap.innerHTML='<label class="form-label" style="margin-top:4px;">Supplier / Mitra (opsional)</label>'+
      '<select class="form-input" id="bm-supplier" style="padding:12px 10px;"><option value="">— Pilih Supplier —</option>'+
      DB.supplier.map(function(s){return '<option value="'+s.toko+'">'+s.toko+' ('+s.sales+')</option>';}).join('')+'</select>';
    if(k&&k.parentNode) k.parentNode.insertBefore(wrap,k);
  } else {
    var sel=document.getElementById('bm-supplier');
    if(sel) sel.innerHTML='<option value="">— Pilih Supplier —</option>'+DB.supplier.map(function(s){return '<option value="'+s.toko+'">'+s.toko+'</option>';}).join('');
  }
}

function simpanBarangMasuk(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var jml=parseInt(document.getElementById('bm-jumlah').value);
  if(isNaN(jml)||jml<=0){alert('Masukkan jumlah yang valid');return;}
  var ket=(document.getElementById('bm-ket').value||'Barang Masuk').trim();
  var supEl=document.getElementById('bm-supplier');
  var supName=supEl?supEl.value:'';
  var fullKet=supName?ket+' dari '+supName:ket;
  b.stok+=jml;
  b.mutasi.unshift({tgl:_tglHariIni(),ket:fullKet,jml:jml});
  DB.mutasiHarian.unshift({nama:b.nama,tgl:_tglHariIni(),ket:fullKet,jml:jml,unit:b.unit,supplier:supName});
  if(sqlDB){
    sqlDB.run('UPDATE BARANG SET Stok_Aktual=? WHERE ID_Barang=?',[b.stok,'B'+b.id]);
    var mid='M_IN_'+Date.now();
    var supId=null;
    if(supName){
      var sup=DB.supplier.find(function(s){return s.toko===supName;});
      if(sup){supId='SUP'+sup.id; sqlDB.run('UPDATE SUPPLIER SET Tgl_Kedatangan=? WHERE ID_Supplier=?',[_tglHariIni(),'SUP'+sup.id]); sup.tglKedatangan=_tglHariIni();}
    }
    sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,ID_Supplier,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga) VALUES(?,?,?,?,?,?,?)',
      [mid,'B'+b.id,supId,_tglHariIni(),fullKet,jml,b.harga]);
  }
  saveToLocalStorage(); renderKatalog(); renderHome();
  showToastWK('✅ +'+jml+' '+b.unit+' '+b.nama+' dicatat');
  go('pg-katalog');
}

// ── BARANG KELUAR ───────────────────────────────────────────────
function renderBarangKeluar(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var n=document.getElementById('bk-nama'), s=document.getElementById('bk-stok-now');
  if(n) n.textContent=b.nama;
  if(s) s.textContent='Stok saat ini: '+b.stok+' '+b.unit;
  var j=document.getElementById('bk-jumlah'), a=document.getElementById('bk-alasan');
  if(j) j.value=''; if(a) a.value='';
}

function simpanBarangKeluar(){
  var b=DB.getById(DB.selectedId); if(!b) return;
  var jml=parseInt(document.getElementById('bk-jumlah').value);
  if(isNaN(jml)||jml<=0){alert('Masukkan jumlah yang valid');return;}
  if(jml>b.stok){alert('Jumlah melebihi stok ('+b.stok+' '+b.unit+')');return;}
  var alasan=(document.getElementById('bk-alasan').value||'Keluar').trim();
  var catatan=(document.getElementById('bk-catatan')||{value:''}).value||'';
  var fullKet=alasan+(catatan?' — '+catatan:'');
  b.stok=Math.max(0,b.stok-jml);
  b.mutasi.unshift({tgl:_tglHariIni(),ket:fullKet,jml:-jml});
  DB.mutasiHarian.unshift({nama:b.nama,tgl:_tglHariIni(),ket:fullKet,jml:-jml,unit:b.unit});
  if(sqlDB){
    sqlDB.run('UPDATE BARANG SET Stok_Aktual=? WHERE ID_Barang=?',[b.stok,'B'+b.id]);
    var mid='M_OUT_'+Date.now();
    sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga,Catatan) VALUES(?,?,?,?,?,?,?)',
      [mid,'B'+b.id,_tglHariIni(),alasan,-jml,b.harga,catatan]);
  }
  saveToLocalStorage(); renderKatalog(); renderHome();
  showToastWK('✅ Keluar '+jml+' '+b.unit+' '+b.nama+' dicatat');
  go('pg-katalog');
}

// ── TAMBAH BARANG ───────────────────────────────────────────────
function resetTambahBarang(){
  ['tb-nama','tb-barcode','tb-harga','tb-modal','tb-stok','tb-min-stok','tb-kategori','tb-satuan','tb-supplier'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.value='';
  });
}

function simpanBarangBaru(){
  var nama=(document.getElementById('tb-nama').value||'').trim();
  var harga=parseInt(document.getElementById('tb-harga').value)||0;
  var stok=parseInt(document.getElementById('tb-stok').value)||0;
  var min=parseInt(document.getElementById('tb-min-stok').value)||3;
  var kat=(document.getElementById('tb-kategori').value||'Lainnya').trim();
  var unit=(document.getElementById('tb-satuan').value||'pcs').trim()||'pcs';
  var sup=(document.getElementById('tb-supplier').value||'—').trim();
  var barcode=(document.getElementById('tb-barcode')||{value:''}).value.trim();
  if(!nama){showToastWK('⚠️ Nama barang wajib diisi','warn');return;}
  try{
    var b=tambahBarang({nama:nama,harga:harga,stok:stok,stokMin:min,kategori:kat,unit:unit,supplier:sup,barcode:barcode});
    if(sqlDB){
      sqlDB.run('UPDATE BARANG SET Unit=?,Stok_Aktual=? WHERE ID_Barang=?',[unit,b.stok,'B'+b.id]);
      if(barcode) sqlDB.run('UPDATE BARANG SET Barcode=? WHERE ID_Barang=?',[barcode,'B'+b.id]);
    }
    saveToLocalStorage(); katalogPage=1; renderKatalog(); renderHome();
    showToastWK('✅ Barang "'+nama+'" ditambahkan');
    go('pg-katalog');
  } catch(e){showToastWK('⚠️ '+e.message,'error');}
}

// ── TUTUP TOKO ──────────────────────────────────────────────────
function renderTutupToko(){
  var c=document.getElementById('tt-items-container'); if(!c) return;
  document.getElementById('tt-total-pendapatan').textContent='Rp 0';
  document.getElementById('tt-total-jenis').textContent='0 jenis';
  var H=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
      BL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
      d=new Date();
  document.getElementById('tt-date-label').textContent=H[d.getDay()]+', '+d.getDate()+' '+BL[d.getMonth()]+' '+d.getFullYear();
  c.innerHTML=DB.barang.map(function(b){
    return '<div class="tt-item" data-id="'+b.id+'">'+
      '<div class="tt-item-top"><div><div class="tt-item-name">'+b.nama+'</div>'+
      '<div class="tt-item-price">'+DB.rp(b.harga)+' / '+b.unit+'</div></div>'+
      '<div style="font-size:28px;">'+b.emoji+'</div></div>'+
      '<div class="tt-item-cols">'+
        '<div><div class="tt-col-lbl">Stok Awal</div><div class="tt-col-val">'+b.stok+' <span class="tt-col-unit">'+b.unit+'</span></div></div>'+
        '<div><div class="tt-col-lbl">Sisa di Rak</div><div class="tt-input-wrap"><input class="tt-input" type="number" min="0" max="'+b.stok+'" placeholder="—" oninput="hitungTT()"></div></div>'+
        '<div><div class="tt-col-lbl">Terjual</div><div class="tt-col-val tt-terjual" style="color:var(--green);">—</div></div>'+
      '</div>'+
      '<div class="tt-subtotal"><span>Subtotal</span><span class="tt-subtotal-val">—</span></div>'+
    '</div>';
  }).join('');
}

function hitungTT(){
  var items=document.querySelectorAll('#tt-items-container .tt-item');
  var tot=0, jen=0;
  items.forEach(function(item){
    var b=DB.getById(parseInt(item.dataset.id));
    var inp=item.querySelector('.tt-input');
    var tEl=item.querySelector('.tt-terjual');
    var sEl=item.querySelector('.tt-subtotal-val');
    if(!b||!inp) return;
    var sisa=inp.value!==''?parseInt(inp.value):NaN;
    if(!isNaN(sisa)&&sisa>=0&&sisa<=b.stok){
      var tj=b.stok-sisa, sub=tj*b.harga;
      tEl.textContent=tj+' '+b.unit; sEl.textContent=DB.rp(sub);
      tot+=sub; if(tj>0) jen++;
    } else {tEl.textContent='—';sEl.textContent='—';}
  });
  document.getElementById('tt-total-pendapatan').textContent=DB.rp(tot);
  document.getElementById('tt-total-jenis').textContent=jen+' jenis';
}

function simpanTutupToko(){
  var items=document.querySelectorAll('#tt-items-container .tt-item');
  var ada=false, txItems=[], total=0;
  items.forEach(function(item){
    var b=DB.getById(parseInt(item.dataset.id));
    var inp=item.querySelector('.tt-input');
    if(!b||!inp||inp.value==='') return;
    var sisa=parseInt(inp.value);
    if(isNaN(sisa)||sisa<0||sisa>b.stok) return;
    var tj=b.stok-sisa;
    if(tj>0){
      txItems.push({id:b.id,jumlah:tj,harga:b.harga,subtotal:tj*b.harga});
      total+=tj*b.harga;
      b.stok=sisa;
      b.mutasi.unshift({tgl:_tglHariIni(),ket:'Terjual (Tutup Toko)',jml:-tj});
      DB.mutasiHarian.unshift({nama:b.nama,tgl:_tglHariIni(),ket:'Terjual',jml:-tj,unit:b.unit});
      if(sqlDB) sqlDB.run('UPDATE BARANG SET Stok_Aktual=? WHERE ID_Barang=?',[sisa,'B'+b.id]);
      ada=true;
    }
  });
  if(!ada){showToastWK('Isi minimal 1 sisa stok dulu','warn');return;}
  var idTx='TX_TT_'+Date.now();
  var tgl=new Date().toISOString().replace('T',' ').slice(0,19);
  if(!DB.transaksi) DB.transaksi=[];
  DB.transaksi.unshift({id:idTx,tgl:tgl,total:total,metode:'Tutup Toko',bayar:total,kembalian:0,
    details:txItems.map(function(it){return {idBarang:it.id,jumlah:it.jumlah,harga:it.harga,subtotal:it.subtotal};})});
  if(sqlDB){
    sqlDB.run('INSERT INTO TRANSAKSI_PENJUALAN(ID_Transaksi,Tanggat_Waktu,Total_Belanja,Metode_Pembayaran,Jumlah_Bayar,Kembalian,Status) VALUES(?,?,?,?,?,?,?)',
      [idTx,tgl,total,'Tutup Toko',total,0,'LUNAS']);
    txItems.forEach(function(it,i){
      sqlDB.run('INSERT INTO DETAIL_TRANSAKSI(ID_Detail,ID_Transaksi,ID_Barang,Jumlah_Beli,Harga_Satuan,Subtotal) VALUES(?,?,?,?,?,?)',
        [idTx+'_D'+i,idTx,'B'+it.id,it.jumlah,it.harga,it.subtotal]);
      sqlDB.run('INSERT INTO MUTASI_STOK(ID_Mutasi,ID_Barang,Tanggal_Mutasi,Jenis_Mutasi,Jumlah,Harga) VALUES(?,?,?,?,?,?)',
        ['M_TT_'+Date.now()+'_'+i,'B'+it.id,tgl,'Terjual (Tutup Toko)',-it.jumlah,it.harga]);
    });
  }
  saveToLocalStorage(); renderKatalog(); renderHome(); renderLaporan();
  showToastWK('✅ Tersimpan! Pendapatan: Rp '+total.toLocaleString('id-ID'));
  setTimeout(function(){go('pg-laporan');},400);
}

// ── MITRA ───────────────────────────────────────────────────────
var _hariIniClickCount=0;
function setDay(el,hari){
  var isHariIni=(hari==='Hari Ini');
  if(isHariIni){
    // Kalau pindah dari hari lain ke Hari Ini, reset counter
    if(!el.classList.contains('on')) _hariIniClickCount=0;
    _hariIniClickCount++;
    // Setiap kelipatan 3: ganti mode
    if(_hariIniClickCount%3===0){
      var newFilter=(DB.mitraFilterHari==='Semua')?'Hari Ini':'Semua';
      DB.mitraFilterHari=newFilter;
      el.textContent=(newFilter==='Semua')?'Semua':'Hari Ini';
      document.querySelectorAll('#day-chips .dchip').forEach(function(c){c.classList.remove('on');});
      el.classList.add('on');
      renderMitra();
      return;
    }
    // Klik biasa, pastikan aktif
    document.querySelectorAll('#day-chips .dchip').forEach(function(c){c.classList.remove('on');});
    el.classList.add('on');
    DB.mitraFilterHari='Hari Ini';
    el.textContent='Hari Ini';
    renderMitra();
    return;
  }
  // Pindah ke hari lain: reset counter & reset teks tombol Hari Ini
  _hariIniClickCount=0;
  var btnHariIni=document.querySelector('#day-chips .dchip:first-child');
  if(btnHariIni) btnHariIni.textContent='Hari Ini';
  document.querySelectorAll('#day-chips .dchip').forEach(function(c){c.classList.remove('on');});
  el.classList.add('on'); DB.mitraFilterHari=hari; renderMitra();
}

function renderMitra(){
  var listEl=document.getElementById('mitra-list');
  var dateLbl=document.getElementById('mitra-date-lbl');
  if(!listEl) return;
  var HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var now=new Date();
  var hariIni=HARI[now.getDay()];
  var BULAN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var tglStr=now.getDate()+' '+BULAN[now.getMonth()]+' '+now.getFullYear();
  var tglEl=document.getElementById('mitra-tanggal');
  if(tglEl) tglEl.textContent=tglStr;
  var filter=DB.mitraFilterHari||'Hari Ini';
  var q=(document.getElementById('mitra-search')||{value:''}).value.toLowerCase();
  var items=DB.supplier.filter(function(s){
    var mQ=!q||s.toko.toLowerCase().indexOf(q)>=0||(s.sales||'').toLowerCase().indexOf(q)>=0;
    var mH=filter==='Semua'||(filter==='Hari Ini'?s.hariKunjungan===hariIni:s.hariKunjungan===filter);
    return mQ&&mH;
  });
  if(dateLbl){
    if(filter==='Hari Ini') dateLbl.innerHTML='Hari Ini - '+tglStr;
    else if(filter==='Semua') dateLbl.innerHTML='Semua Jadwal';
    else dateLbl.innerHTML='Hari: '+filter;
  }
  if(!items.length){
    listEl.innerHTML='<div class="mitra-empty"><div class="mitra-empty-icon">\uD83E\uDD1D</div><div class="mitra-empty-title">Tidak ada mitra</div><div>Belum ada sales yang terjadwal untuk '+filter+'</div></div>';
    return;
  }
  listEl.innerHTML=items.map(function(s){
    var isHariIni=s.hariKunjungan===hariIni;
    var badge=isHariIni
      ?'<span style="background:rgba(255,255,255,.25);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;border:1.5px solid rgba(255,255,255,.5);">Hari ini</span>'
      :'<button class="mitra-card-v2-jadwal" onclick="event.stopPropagation()">Buka Jadwal</button>';
    var noWa=(s.wa||'').replace(/[^0-9]/g,'');
    var catatan=s.catatan||s.tglKedatangan||'';
    return '<div class="mitra-card-v2" onclick="DB.selectedMitra='+s.id+';go(\'pg-profil-mitra\')">'
      +'<div class="mitra-card-v2-top">'
        +'<div class="mitra-card-v2-agent-row">'
          +'<span class="mitra-card-v2-agent">Agen '+s.toko+'</span>'+badge
        +'</div>'
        +'<div class="mitra-card-v2-body">'
          +'<div class="mitra-card-v2-ava">\uD83D\uDC68\u200D\uD83D\uDCBC</div>'
          +'<div class="mitra-card-v2-info">'
            +'<div class="mitra-card-v2-name">'+s.sales+'</div>'
            +'<div class="mitra-card-v2-phone">'+s.wa+'</div>'
            +(catatan?'<div class="mitra-card-v2-note">Catatan: '+catatan+'</div>':'')
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div class="mitra-card-v2-acts">'
        +'<a href="tel:'+noWa+'" class="mitra-card-v2-act tel" style="text-decoration:none;" onclick="event.stopPropagation()">'
          +'<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#E74C3C;flex-shrink:0;"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11 21 3 13 3 5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>'
          +' Telepon'
        +'</a>'
        +'<a href="https://wa.me/'+noWa+'" target="_blank" class="mitra-card-v2-act wa" style="text-decoration:none;" onclick="event.stopPropagation()">'
          +'<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#fff;flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
          +' WhatsApp'
        +'</a>'
      +'</div>'
    +'</div>';
  }).join('');
}


function renderProfilMitra(){
  var s=DB.getSupById(DB.selectedMitra);
  var el=document.getElementById('profil-mitra-content');
  if(!s||!el) return;
  el.innerHTML=
    '<div class="pm-date-lbl">'+_tglHariIni()+'</div>'+
    '<div class="pm-mitra-card">'+
      '<div class="pm-card-top">'+
        '<div class="pm-agent-row"><span class="pm-agent">Agen '+s.toko+'</span><span style="color:rgba(255,255,255,.85);font-size:11px;">'+s.hariKunjungan+'</span></div>'+
        '<div class="pm-body-inner">'+
          '<div class="pm-ava">👨‍💼</div>'+
          '<div><div class="pm-name">'+s.sales+'</div>'+
            '<div class="pm-phone">'+s.wa+'</div>'+
            '<div class="pm-address">'+(s.alamat||'')+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="pm-actions">'+
        '<a href="tel:'+s.wa.replace(/[^0-9]/g,'')+'" class="pm-act tel" style="text-decoration:none;">📞 Telepon</a>'+
        '<a href="https://wa.me/'+s.wa.replace(/[^0-9]/g,'')+'" target="_blank" class="pm-act wa" style="text-decoration:none;">💬 WhatsApp</a>'+
      '</div>'+
    '</div>'+
    '<div class="pm-section-title">Info Jadwal</div>'+
    '<div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:14px;">'+
      '<div class="pm-hist-row"><span class="pm-hist-date">Hari Kunjungan</span><span class="pm-hist-val">'+(s.hariKunjungan||'—')+'</span></div>'+
      '<div class="pm-hist-row" style="border:none;"><span class="pm-hist-date">Kedatangan Terakhir</span><span class="pm-hist-val">'+(s.tglKedatangan||'—')+'</span></div>'+
    '</div>';
}

function renderEditMitra(){
  var s=DB.getSupById(DB.selectedMitra); if(!s) return;
  function set(id,val){var el=document.getElementById(id);if(el)el.value=val||'';}
  set('em-toko',s.toko); set('em-sales',s.sales); set('em-wa',s.wa);
  set('em-alamat',s.alamat); set('em-hari',s.hariKunjungan);
}

function simpanMitraBaru(){ simpanTambahMitra(); }

function simpanTambahMitra(){
  var toko=(document.getElementById('tm-toko').value||'').trim();
  var sales=(document.getElementById('tm-sales').value||'').trim();
  var wa=(document.getElementById('tm-wa').value||'').trim();
  var alamat=(document.getElementById('tm-alamat').value||'').trim();
  var hari=(document.getElementById('tm-hari').value||'').trim();
  var tgl=document.getElementById('tm-tgl').value||_tglHariIni();
  if(!toko){alert('Nama toko wajib diisi');return;}
  var newId=DB.supplier.reduce(function(mx,s){return Math.max(mx,s.id);},-1)+1;
  var s={id:newId,toko:toko,sales:sales,wa:wa,alamat:alamat,hariKunjungan:hari,tglKedatangan:tgl};
  DB.supplier.push(s);
  if(sqlDB){
    sqlDB.run('INSERT OR REPLACE INTO SUPPLIER VALUES(?,?,?,?,?,?,?)',['SUP'+newId,toko,sales,wa,alamat,tgl,hari]);
    if(hari) sqlDB.run('INSERT OR IGNORE INTO JADWAL_KUNJUNGAN VALUES(?,?,?,?)',['JK_SUP'+newId,'SUP'+newId,hari,'Mingguan']);
  }
  saveToLocalStorage();
  ['tm-toko','tm-sales','tm-wa','tm-alamat','tm-hari'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  showToastWK('✅ Mitra "'+toko+'" ditambahkan'); go('pg-mitra');
}

function simpanEditMitra(){
  var s=DB.getSupById(DB.selectedMitra); if(!s) return;
  s.toko=(document.getElementById('em-toko').value||s.toko).trim();
  s.sales=(document.getElementById('em-sales').value||s.sales).trim();
  s.wa=(document.getElementById('em-wa').value||s.wa).trim();
  s.alamat=(document.getElementById('em-alamat').value||s.alamat||'').trim();
  s.hariKunjungan=document.getElementById('em-hari').value||s.hariKunjungan;
  s.tglKedatangan=document.getElementById('em-tgl').value||s.tglKedatangan;
  if(sqlDB){
    sqlDB.run('UPDATE SUPPLIER SET Nama_Toko=?,Nama_Sales=?,No_WA=?,Alamat=?,Tgl_Kedatangan=?,Hari_Kunjungan=? WHERE ID_Supplier=?',
      [s.toko,s.sales,s.wa,s.alamat,s.tglKedatangan,s.hariKunjungan,'SUP'+s.id]);
    if(s.hariKunjungan) sqlDB.run('INSERT OR REPLACE INTO JADWAL_KUNJUNGAN VALUES(?,?,?,?)',['JK_SUP'+s.id,'SUP'+s.id,s.hariKunjungan,'Mingguan']);
  }
  saveToLocalStorage(); showToastWK('✅ Data mitra diperbarui'); go('pg-profil-mitra');
}

function hapusMitra(){
  var s=DB.getSupById(DB.selectedMitra); if(!s) return;
  if(!confirm('Hapus mitra "'+s.toko+'"?')) return;
  DB.supplier=DB.supplier.filter(function(x){return x.id!==s.id;});
  if(sqlDB){ sqlDB.run('DELETE FROM SUPPLIER WHERE ID_Supplier=?',['SUP'+s.id]); sqlDB.run('DELETE FROM JADWAL_KUNJUNGAN WHERE ID_Supplier=?',['SUP'+s.id]); }
  saveToLocalStorage(); showToastWK('🗑️ Mitra "'+s.toko+'" dihapus'); go('pg-mitra');
}

// ── PENGATURAN ──────────────────────────────────────────────────
function renderGantiNama(){
  var s=getSession();
  var nama=s?(s.nama||s.username):DB.profile.nama;
  var el=document.getElementById('input-nama-pengguna');
  if(el) el.value=nama||'';
}

function renderGantiWarung(){
  var s=getSession();
  var warung=s?s.warung:DB.profile.warung;
  var el=document.getElementById('input-nama-warung');
  if(el) el.value=warung||'';
}

function simpanNamaWarung(){
  var val=(document.getElementById('input-nama-warung')||{value:''}).value.trim();
  if(!val) return;
  DB.profile.warung=val;
  var s=getSession(); if(s){ s.warung=val; saveSession(s); }
  saveToLocalStorage();
  showToastWK('✅ Nama warung diperbarui'); go('pg-pengaturan');
}

function simpanGantiNama(){
  var val=(document.getElementById('input-nama-pengguna')||{value:''}).value.trim();
  if(!val) return;
  DB.profile.nama=val;
  var s=getSession(); if(s){ s.nama=val; saveSession(s); }
  saveToLocalStorage();
  showToastWK('✅ Nama pengguna diperbarui'); go('pg-pengaturan');
}

// ── SCANNER ─────────────────────────────────────────────────────
var _scanStream=null, _scanTimer=null, _scanActive=false, _scanLastCode='', _torchTrack=null;

function startScanner(){
  _scanActive=true; _scanLastCode='';
  var video=document.getElementById('scan-video');
  var status=document.getElementById('scan-status');
  var resultCard=document.getElementById('scan-result-card');
  var manualArea=document.getElementById('scan-manual-area');
  if(resultCard) resultCard.style.display='none';
  if(manualArea) manualArea.style.display='block';
  if(status) status.textContent='Meminta akses kamera...';
  _animScanLine();
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){if(status)status.textContent='Kamera tidak tersedia';return;}
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}}})
  .then(function(stream){
    _scanStream=stream; video.srcObject=stream; video.play();
    var track=stream.getVideoTracks()[0]; _torchTrack=track;
    var caps=track.getCapabilities?track.getCapabilities():{};
    if(caps.torch){var btn=document.getElementById('scan-torch-btn');if(btn)btn.style.display='block';}
    if(status) status.textContent='Arahkan kamera ke barcode...';
    if(typeof BarcodeDetector!=='undefined'){
      BarcodeDetector.getSupportedFormats().then(function(fmts){
        var bd=new BarcodeDetector({formats:fmts});
        _scanLoop(bd,video,status);
      });
    } else {if(status) status.textContent='Mode manual — ketik barcode di bawah';}
  }).catch(function(){if(status) status.textContent='Akses kamera ditolak. Gunakan input manual.';});
}

function _scanLoop(bd,video,status){
  if(!_scanActive) return;
  if(video.readyState<2){setTimeout(function(){_scanLoop(bd,video,status);},200);return;}
  bd.detect(video).then(function(results){
    if(!_scanActive) return;
    if(results&&results.length>0){
      var code=results[0].rawValue;
      if(code!==_scanLastCode){_scanLastCode=code;onBarcodeDetected(code);}
    }
    _scanTimer=setTimeout(function(){_scanLoop(bd,video,status);},300);
  }).catch(function(){_scanTimer=setTimeout(function(){_scanLoop(bd,video,status);},500);});
}

function _animScanLine(){
  var line=document.getElementById('scan-line-anim');
  var pct=['10%','80%','10%','40%','70%','20%','60%'];
  var i=0;
  (function tick(){if(!_scanActive||!line)return;line.style.top=pct[i++%pct.length];setTimeout(tick,900);})();
}

function stopScanner(){
  _scanActive=false;
  if(_scanTimer){clearTimeout(_scanTimer);_scanTimer=null;}
  if(_scanStream){_scanStream.getTracks().forEach(function(t){t.stop();});_scanStream=null;}
  var v=document.getElementById('scan-video'); if(v) v.srcObject=null;
}

function toggleTorch(){
  if(!_torchTrack) return;
  var curr=_torchTrack.getSettings().torch||false;
  _torchTrack.applyConstraints({advanced:[{torch:!curr}]}).catch(function(){});
}

function onBarcodeDetected(code){
  var status=document.getElementById('scan-status');
  if(status) status.textContent='✅ '+code;
  cariBarcode(code);
}

function cariBarcode(code){
  code=(code||'').trim(); if(!code){showToastWK('Masukkan barcode dulu','warn');return;}
  var found=null;
  DB.barang.forEach(function(b){if((b.barcode||'')===code)found=b;});
  if(!found&&sqlDB){
    try{var res=sqlDB.exec('SELECT ID_Barang FROM BARANG WHERE Barcode=? LIMIT 1',[code]);
      if(res.length&&res[0].values.length){var id=parseInt((res[0].values[0][0]||'').replace('B',''));found=DB.getById(id);}
    }catch(e){}
  }
  tampilkanHasilScan(code,found);
}

function tampilkanHasilScan(code,barang){
  var card=document.getElementById('scan-result-card');
  var manualArea=document.getElementById('scan-manual-area');
  var barcodeEl=document.getElementById('scan-result-barcode');
  var namaEl=document.getElementById('scan-result-nama');
  var actionsEl=document.getElementById('scan-result-actions');
  if(!card) return;
  if(barcodeEl) barcodeEl.textContent=code;
  if(barang){
    if(namaEl) namaEl.innerHTML='<span style="font-size:22px;">'+barang.emoji+'</span> <strong>'+barang.nama+'</strong> — Stok: '+barang.stok+' '+barang.unit;
    if(actionsEl) actionsEl.innerHTML=
      '<button onclick="DB.selectedId='+barang.id+';stopScanner();go(\'pg-info-barang\')" style="background:#6472F3;color:#fff;border:none;border-radius:14px;padding:14px;font-family:\'Poppins\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">📋 Lihat Info Barang</button>'+
      '<button onclick="DB.selectedId='+barang.id+';stopScanner();go(\'pg-barang-masuk\')" style="background:#2ECC71;color:#fff;border:none;border-radius:14px;padding:14px;font-family:\'Poppins\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">📥 Tambah Stok Masuk</button>'+
      '<button onclick="DB.selectedId='+barang.id+';stopScanner();go(\'pg-barang-keluar\')" style="background:#E74C3C;color:#fff;border:none;border-radius:14px;padding:14px;font-family:\'Poppins\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">📤 Catat Keluar</button>';
  } else {
    if(namaEl) namaEl.textContent='Barang tidak ditemukan di database';
    if(actionsEl) actionsEl.innerHTML=
      '<button onclick="stopScanner();go(\'pg-tambah-barang\')" style="background:#6472F3;color:#fff;border:none;border-radius:14px;padding:14px;font-family:\'Poppins\',sans-serif;font-size:14px;font-weight:700;cursor:pointer;">➕ Daftarkan Barang Baru</button>';
  }
  if(manualArea) manualArea.style.display='none';
  if(card) card.style.display='block';
}

function tutupScanResult(){
  var card=document.getElementById('scan-result-card');
  var manualArea=document.getElementById('scan-manual-area');
  _scanLastCode='';
  if(card) card.style.display='none';
  if(manualArea) manualArea.style.display='block';
  var inp=document.getElementById('scan-manual-input'); if(inp) inp.value='';
}

// ── APP INIT ────────────────────────────────────────────────────
function appInit(){
  loadFromLocalStorage();
  initSQLite(function(){
    if(sqlDB){
      DB.barang.forEach(function(b){
        sqlDB.run('UPDATE BARANG SET Stok_Aktual=?,Harga_Jual=? WHERE ID_Barang=?',[b.stok,b.harga,'B'+b.id]);
      });
    }
    // Cek session login — jika belum login, arahkan ke halaman login
    // Cek session — jika sudah login skip splash langsung ke home
    if(isLoggedIn()){
      var s = getSession();
      if(s){ DB.profile.nama = s.nama||s.username; DB.profile.warung = s.warung; }
      go('pg-home');
    } else {
      // Tampilkan splash sebentar lalu ke login
      go('pg-splash');
      setTimeout(function(){
        go('pg-login');
      }, 1500);
    }
  });
}
