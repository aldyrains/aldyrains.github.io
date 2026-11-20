/* Beranda interaktif: mini-game Dadu Takdir + misi kecil untuk penjelajah.
   Kejadian diambil dari bank event WNI Life Simulator (assets/takdir.json). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Penyimpanan kecil (boleh gagal) ----------
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* mode privat, abaikan */ }
  }

  // ---------- Suara ----------
  var soundOn = load('al.sound', true);
  var sounds = {};
  function play(name) {
    if (!soundOn) return;
    try {
      var a = sounds[name] || (sounds[name] = new Audio('/assets/sfx/' + name + '.m4a'));
      a.currentTime = 0;
      a.volume = 0.6;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* tanpa suara pun tetap jalan */ }
  }

  // ---------- Misi ----------
  var QUESTS = [
    { id: 'roll', text: 'Lempar Dadu Takdir pertama' },
    { id: 'finish', text: 'Jalani lima tahun sampai habis' },
    { id: 'about', text: 'Kenalan dengan pembuatnya' },
    { id: 'contact', text: 'Temukan cara menghubungi' },
    { id: 'game', text: 'Buka halaman WNI Life' },
    { id: 'secret', text: 'Rahasia: penggemar logo', hidden: true }
  ];
  var done = load('al.quests', {});
  var hud, hudCount, hudList, toastBox;

  function questCount() {
    return QUESTS.filter(function (q) { return done[q.id]; }).length;
  }

  function renderHud() {
    if (!hud) return;
    hudCount.textContent = questCount() + '/' + QUESTS.length;
    hudList.innerHTML = QUESTS.map(function (q) {
      var ok = !!done[q.id];
      var label = q.hidden && !ok ? '???' : q.text;
      return '<li class="' + (ok ? 'ok' : '') + '"><span aria-hidden="true">' + (ok ? '✓' : '·') + '</span>' + label +
        '<span class="sr">' + (ok ? ' (selesai)' : ' (belum)') + '</span></li>';
    }).join('');
    hud.classList.toggle('all', questCount() === QUESTS.length);
  }

  function toast(text, emoji) {
    if (!toastBox) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="mono">' + (emoji || '🏆') + ' Pencapaian</span><b></b>';
    el.querySelector('b').textContent = text;
    toastBox.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 3200);
    setTimeout(function () { el.remove(); }, 3800);
  }

  function complete(id) {
    if (done[id]) return;
    var q = QUESTS.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    done[id] = true;
    save('al.quests', done);
    renderHud();
    play('success');
    toast(q.text, q.hidden ? '✨' : '🏆');
    if (questCount() === QUESTS.length) {
      setTimeout(function () { toast('Semua misi selesai. Terima kasih sudah mampir!', '👑'); }, 900);
    }
  }

  function setupQuests() {
    hud = document.createElement('div');
    hud.className = 'quests';
    hud.innerHTML =
      '<button type="button" class="quests-btn mono" aria-expanded="false" aria-controls="quests-list">' +
      '<span aria-hidden="true">🎯</span> Misi <b></b></button>' +
      '<div class="quests-panel" id="quests-list" hidden><p class="mono label">Misi di halaman ini</p><ul></ul>' +
      '<button type="button" class="quests-reset mono">Ulang misi</button></div>';
    document.body.appendChild(hud);
    hudCount = hud.querySelector('.quests-btn b');
    hudList = hud.querySelector('ul');
    var btn = hud.querySelector('.quests-btn');
    var panel = hud.querySelector('.quests-panel');
    btn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
    hud.querySelector('.quests-reset').addEventListener('click', function () {
      done = {};
      save('al.quests', done);
      renderHud();
    });

    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastBox);
    renderHud();

    // Bagian yang terlihat
    if ('IntersectionObserver' in window) {
      var watch = { tentang: 'about', kontak: 'contact' };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { complete(watch[en.target.id]); io.unobserve(en.target); }
        });
      }, { threshold: 0.45 });
      Object.keys(watch).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }

    // Di layar kecil, sembunyikan tombol misi selama main supaya tidak menutupi pilihan.
    var game = document.getElementById('dadu');
    if (game && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        hud.classList.toggle('away', entries[0].isIntersecting);
      }, { threshold: 0.12 }).observe(game);
    }

    // Link ke halaman game
    document.querySelectorAll('a[href^="/games/wni-life/"]').forEach(function (a) {
      a.addEventListener('click', function () { complete('game'); });
    });

    // Rahasia: klik logo besar lima kali
    var mark = document.querySelector('.intro .mark');
    if (mark) {
      var taps = 0, timer;
      mark.addEventListener('click', function () {
        taps += 1;
        mark.classList.remove('boop');
        void mark.offsetWidth;
        mark.classList.add('boop');
        clearTimeout(timer);
        timer = setTimeout(function () { taps = 0; }, 1500);
        if (taps >= 5) { taps = 0; complete('secret'); }
      });
    }
  }

  // ---------- Dadu Takdir ----------
  var YEARS = 5;
  var START = { age: 25, health: 70, happiness: 60, stres: 30, money: 5000000 };
  var CAT = {
    musibah: ['🩹', 'Musibah', 'musibah'],
    rezeki: ['💰', 'Rezeki', 'rezeki'],
    sosial: ['👥', 'Sosial', 'sosial'],
    karir: ['💼', 'Karir', 'karir'],
    hari_lurus: ['☀️', 'Hari Lurus', 'hari_lurus'],
    kejutan: ['⚡', 'Kejutan', 'takdir'],
    bencana: ['🌊', 'Bencana', 'bencana'],
    bintang_jatuh: ['⭐', 'Bintang Jatuh', 'bintang']
  };
  var LABEL = {
    health: '❤️ Sehat', happiness: '😊 Bahagia', stres: '😩 Stres', money: '💰 Uang',
    smartness: '🧠 Pinter', looks: '✨ Tampang', restu: '🙏 Restu', gengsi: '😎 Gengsi',
    akhlak: '🕊️ Akhlak', koneksi: '🤝 Koneksi'
  };
  // Stres naik itu buruk, sisanya naik itu baik.
  var BAD_UP = { stres: true };
  // Sisi dadu ke orientasi kubus (lihat CSS .die .f1 ... .f6).
  var FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };

  var data = null, state, used, spins = { x: 0, y: 0 };
  var root, die, card, ageEl, yearEl, moneyEl, logEl, bars = {};

  function rupiah(n) {
    var sign = n < 0 ? '-' : '';
    var v = Math.abs(n);
    var s;
    if (v >= 1e9) s = (v / 1e9).toFixed(v % 1e9 ? 1 : 0) + ' M';
    else if (v >= 1e6) s = (v / 1e6).toFixed(v % 1e6 && v < 1e7 ? 1 : 0) + ' jt';
    else if (v >= 1e3) s = Math.round(v / 1e3) + ' rb';
    else s = String(v);
    return sign + 'Rp' + s.replace('.', ',');
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function value(v) {
    if (Array.isArray(v)) return Math.round(v[0] + Math.random() * (v[1] - v[0]));
    return v;
  }

  function reset() {
    state = { age: START.age, year: 0, health: START.health, happiness: START.happiness, stres: START.stres, money: START.money, extra: {}, log: [] };
    used = {};
    renderHudStats();
    logEl.innerHTML = '';
    showIntro();
  }

  function renderHudStats(changed) {
    ageEl.textContent = state.age;
    yearEl.textContent = 'Tahun ' + state.year + ' dari ' + YEARS;
    moneyEl.textContent = rupiah(state.money);
    ['health', 'happiness', 'stres'].forEach(function (k) {
      var b = bars[k];
      b.fill.style.width = state[k] + '%';
      b.num.textContent = state[k];
      b.li.setAttribute('aria-valuenow', state[k]);
      if (changed && changed[k]) {
        b.li.classList.remove('pulse');
        void b.li.offsetWidth;
        b.li.classList.add('pulse');
      }
    });
  }

  function setCard(html) {
    card.innerHTML = html;
    card.classList.remove('in');
    void card.offsetWidth;
    card.classList.add('in');
  }

  function rollButton(label) {
    return '<button type="button" class="btn btn-solid dg-roll" data-act="roll">' +
      '<span aria-hidden="true">🎲</span> ' + label + '</button>';
  }

  function showIntro() {
    setCard(
      '<p class="mono label">Dadu Takdir</p>' +
      '<h3>Umur 25. Lima tahun ke depan, terserah dadu.</h3>' +
      '<p class="dg-desc">Setiap tahun lempar dadu. Sisinya menentukan nasib: musibah, rezeki, urusan sosial, karir, hari yang lurus, atau takdir tak terduga. Kamu tinggal memilih cara menghadapinya.</p>' +
      '<div class="dg-actions">' + rollButton('Lempar dadu') + '</div>'
    );
  }

  function eventFor(face) {
    var pool = data.events.filter(function (e) { return e.f === face && !used[e.t]; });
    if (!pool.length) pool = data.events.filter(function (e) { return e.f === face; });
    return pick(pool);
  }

  function roll() {
    if (!data) return;
    var face = 1 + Math.floor(Math.random() * 6);
    var rot = FACE_ROT[face];
    spins.x += 720;
    spins.y += 360;
    die.style.transform = 'rotateX(-16deg) rotateY(20deg) rotateX(' + (rot[0] + spins.x) + 'deg) rotateY(' + (rot[1] + spins.y) + 'deg)';
    die.classList.add('rolling');
    root.classList.add('busy');
    play('dice_throw');
    card.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    complete('roll');
    setTimeout(function () {
      die.classList.remove('rolling');
      root.classList.remove('busy');
      state.year += 1;
      state.age += 1;
      renderHudStats();
      // Sisi 5 biasanya tahun yang tenang, seperti di game.
      if (face === 5 && Math.random() < 0.6) {
        quietYear();
      } else {
        showEvent(eventFor(face), face);
      }
    }, reduceMotion ? 50 : 1100);
  }

  function quietYear() {
    var line = pick(data.quiet);
    play('hari_lurus');
    addLog(line);
    renderHudStats();
    setCard(
      '<p class="mono cat"><span aria-hidden="true">☀️</span> Sisi 5 · Hari Lurus</p>' +
      '<h3>Umur ' + state.age + ': tahun yang tenang</h3>' +
      '<p class="dg-desc">' + escapeHtml(line) + '</p>' +
      '<div class="dg-actions">' + nextButton() + '</div>'
    );
  }

  function showEvent(ev, face) {
    used[ev.t] = true;
    var c = CAT[ev.c] || ['🎲', ev.c, 'takdir'];
    play(c[2]);
    var opts = ev.o.map(function (o, i) {
      return '<button type="button" class="dg-opt" data-act="choose" data-i="' + i + '">' + escapeHtml(o.x) + '</button>';
    }).join('');
    setCard(
      '<p class="mono cat"><span aria-hidden="true">' + c[0] + '</span> Sisi ' + face + ' · ' + c[1] + '</p>' +
      '<h3>' + escapeHtml(ev.t) + '</h3>' +
      '<p class="dg-desc">' + escapeHtml(ev.d) + '</p>' +
      '<div class="dg-opts" role="group" aria-label="Pilihanmu">' + opts + '</div>'
    );
    card._event = ev;
    var first = card.querySelector('.dg-opt');
    if (first && document.activeElement && root.contains(document.activeElement)) first.focus();
  }

  function choose(i) {
    var ev = card._event;
    if (!ev) return;
    var opt = ev.o[i];
    var r = Math.random(), acc = 0, out = opt.r[opt.r.length - 1];
    for (var k = 0; k < opt.r.length; k++) {
      acc += opt.r[k].p;
      if (r <= acc) { out = opt.r[k]; break; }
    }
    var changes = {};
    Object.keys(out.e).forEach(function (key) {
      var v = value(out.e[key]);
      if (!v) return;
      changes[key] = v;
      if (key === 'money') state.money += v;
      else if (key in START) state[key] = Math.max(0, Math.min(100, state[key] + v));
      else state.extra[key] = (state.extra[key] || 0) + v;
    });
    play('choose');
    addLog(out.l);
    renderHudStats(changes);
    var chips = Object.keys(changes).map(function (key) {
      var v = changes[key];
      var good = BAD_UP[key] ? v < 0 : v > 0;
      var txt = key === 'money' ? (v > 0 ? '+' : '') + rupiah(v) : (v > 0 ? '+' : '') + v;
      return '<li class="' + (good ? 'up' : 'down') + '">' + (LABEL[key] || key) + ' <b>' + txt + '</b></li>';
    }).join('');
    setCard(
      '<p class="mono label">Umur ' + state.age + ' · kamu memilih: ' + escapeHtml(opt.x) + '</p>' +
      '<h3>Hasilnya…</h3>' +
      '<p class="dg-desc">' + escapeHtml(out.s) + '</p>' +
      (chips ? '<ul class="dg-chips">' + chips + '</ul>' : '') +
      '<div class="dg-actions">' + nextButton() + '</div>'
    );
    card._event = null;
  }

  function nextButton() {
    return state.year >= YEARS
      ? '<button type="button" class="btn btn-solid" data-act="end">Lihat ringkasan hidupmu →</button>'
      : rollButton('Lempar untuk umur ' + (state.age + 1));
  }

  function addLog(text) {
    state.log.push({ age: state.age, text: text });
    var li = document.createElement('li');
    li.innerHTML = '<span class="mono">' + state.age + '</span>';
    li.appendChild(document.createTextNode(text));
    logEl.appendChild(li);
  }

  function verdict() {
    if (state.health < 30) return ['🩺', 'Badan remuk, tapi masih berdiri.'];
    if (state.money >= 50000000) return ['👑', 'Sultan dadakan.'];
    if (state.stres >= 70) return ['😵', 'Kepala penuh, dompet tipis.'];
    if (state.happiness >= 75) return ['🌴', 'Hidup santai, hati senang.'];
    if (state.money < 0) return ['💸', 'Gali lubang, tutup lubang.'];
    return ['🙂', 'Lima tahun yang lurus-lurus saja.'];
  }

  function end() {
    var v = verdict();
    complete('finish');
    play('success');
    setCard(
      '<p class="mono label">Umur ' + state.age + ' · ringkasan</p>' +
      '<h3><span aria-hidden="true">' + v[0] + '</span> ' + v[1] + '</h3>' +
      '<ol class="dg-log dg-endlog">' + state.log.map(function (l) {
        return '<li><span class="mono">' + l.age + '</span>' + escapeHtml(l.text) + '</li>';
      }).join('') + '</ol>' +
      '<p class="dg-desc">Itu baru lima tahun. Di WNI Life Simulator kamu menjalani satu hidup penuh, dari bayi sampai tua, dengan lebih dari 1000 kejadian, pekerjaan, keluarga, dan ujian.</p>' +
      '<div class="dg-actions">' +
      '<a class="btn btn-solid" href="/games/wni-life/#penguji">Main versi lengkap</a>' +
      '<button type="button" class="btn" data-act="again">Ulang dari umur 25</button>' +
      '</div>'
    );
    var link = card.querySelector('a');
    if (link) link.addEventListener('click', function () { complete('game'); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function setupDice() {
    root = document.getElementById('dadu');
    if (!root) return;
    die = document.getElementById('dg-die');
    card = document.getElementById('dg-card');
    ageEl = document.getElementById('dg-age');
    yearEl = document.getElementById('dg-year');
    moneyEl = document.getElementById('dg-money');
    logEl = document.getElementById('dg-log');
    root.querySelectorAll('[data-stat]').forEach(function (li) {
      bars[li.getAttribute('data-stat')] = { li: li, fill: li.querySelector('s'), num: li.querySelector('b') };
    });

    var soundBtn = document.getElementById('dg-sound');
    function paintSound() {
      soundBtn.setAttribute('aria-pressed', String(soundOn));
      soundBtn.innerHTML = '<span aria-hidden="true">' + (soundOn ? '🔊' : '🔇') + '</span> Suara ' + (soundOn ? 'nyala' : 'mati');
    }
    soundBtn.addEventListener('click', function () { soundOn = !soundOn; save('al.sound', soundOn); paintSound(); });
    paintSound();

    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t || t.disabled || root.classList.contains('busy')) return;
      var act = t.getAttribute('data-act');
      if (act === 'roll') roll();
      else if (act === 'choose') choose(+t.getAttribute('data-i'));
      else if (act === 'end') end();
      else if (act === 'again') reset();
    });
    die.parentNode.addEventListener('click', function () {
      var b = card.querySelector('[data-act="roll"]');
      if (b && !b.disabled) roll();
    });

    reset();
    card.querySelector('.dg-roll').disabled = true;
    fetch('/assets/takdir.json')
      .then(function (r) { return r.json(); })
      .then(function (json) {
        data = json;
        var b = card.querySelector('.dg-roll');
        if (b) b.disabled = false;
      })
      .catch(function () {
        setCard('<h3>Dadu sedang ngambek.</h3><p class="dg-desc">Data kejadian gagal dimuat. Coba muat ulang halaman.</p>');
      });
  }

  setupQuests();
  setupDice();
})();
