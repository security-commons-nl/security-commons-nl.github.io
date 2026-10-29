// Het profiel van de commons (plan de site is het product, stap 9): zestien vragen uit
// /kennisbank/profiel.json, ingevuld in de browser onder een bewaarnaam die elke pagina op dit domein
// leest. Alleen vaste keuzes; een waarde die niet in het schema staat, wordt bij laden genegeerd.
(function () {
  'use strict';
  var SLEUTEL = 'commons-profiel';
  var SCHEMA = '/kennisbank/profiel.json';
  var wortel = document.getElementById('profiel');
  if (!wortel) return;
  var melding = document.getElementById('profiel-melding');
  var schema = null;

  function zeg(tekst, soort) {
    melding.textContent = tekst;
    melding.className = 'profiel-melding ' + (soort || '');
  }
  function lees() {
    try { return JSON.parse(localStorage.getItem(SLEUTEL) || '{}') || {}; } catch (e) { return {}; }
  }
  function bewaar(p) {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(p)); } catch (e) { zeg('Opslaan in deze browser lukt niet (privevenster of opslag geblokkeerd).', 'fout'); }
  }
  // Alleen bekende vragen en bekende antwoorden; alles anders valt weg. Zo kan er via een bestand of een
  // link nooit iets in het profiel komen dat geen vaste keuze is.
  function schoon(p) {
    var uit = {}, weg = 0;
    if (!p || typeof p !== 'object') return { profiel: uit, weg: 1 };
    Object.keys(p).forEach(function (id) {
      var vraag = schema.vragen.filter(function (v) { return v.id === id; })[0];
      if (!vraag) { weg++; return; }
      var geldig = vraag.antwoorden.map(function (a) { return a.id; });
      var w = p[id];
      if (vraag.meerdere) {
        var lijst = (Array.isArray(w) ? w : [w]).filter(function (x) { return geldig.indexOf(x) >= 0; });
        if (lijst.length) uit[id] = lijst; else weg++;
      } else if (geldig.indexOf(w) >= 0) {
        uit[id] = w;
      } else { weg++; }
    });
    return { profiel: uit, weg: weg };
  }
  function uitFormulier() {
    var p = {};
    schema.vragen.forEach(function (v) {
      var aan = [].slice.call(wortel.querySelectorAll('input[name="' + v.id + '"]:checked')).map(function (x) { return x.value; });
      if (aan.length) p[v.id] = v.meerdere ? aan : aan[0];
    });
    return p;
  }
  function naarFormulier(p) {
    [].slice.call(wortel.querySelectorAll('input')).forEach(function (x) {
      var w = p[x.name];
      x.checked = Array.isArray(w) ? w.indexOf(x.value) >= 0 : w === x.value;
    });
    stand();
  }
  function stand() {
    var p = uitFormulier();
    var n = Object.keys(p).length;
    document.getElementById('profiel-stand').textContent = n === 0 ? 'Nog niets ingevuld.' : n + ' van ' + schema.vragen.length + ' vragen beantwoord. Geen vraag is verplicht.';
  }
  // [<] in plaats van < : de build zet "</" om naar "<\/" voor de inline scripttag, en /</g bevat die reeks.
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/[<]/g, '&lt;').replace(/[>]/g, '&gt;').replace(/"/g, '&quot;'); }

  function teken() {
    var html = '';
    schema.vragen.forEach(function (v) {
      var soort = v.meerdere ? 'checkbox' : 'radio';
      html += '<fieldset class="profiel-vraag"><legend>' + esc(v.vraag) + (v.meerdere ? ' <small>(meer antwoorden mogelijk)</small>' : '') + '</legend>';
      v.antwoorden.forEach(function (a) {
        html += '<label><input type="' + soort + '" name="' + esc(v.id) + '" value="' + esc(a.id) + '"> ' + esc(a.label) + '</label>';
      });
      html += '</fieldset>';
    });
    wortel.innerHTML = html;
    wortel.addEventListener('change', function () { bewaar(uitFormulier()); stand(); zeg('Bewaard in deze browser.', 'ok'); });
  }

  function uitLink() {
    var m = /[#&]p=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return null;
    try {
      var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) { return null; }
  }
  function naarLink(p) {
    var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return location.origin + location.pathname + '#p=' + b64;
  }

  function knoppen() {
    document.getElementById('profiel-wis').addEventListener('click', function () {
      try { localStorage.removeItem(SLEUTEL); } catch (e) {}
      naarFormulier({}); zeg('Profiel gewist uit deze browser.', 'ok');
    });
    document.getElementById('profiel-bestand').addEventListener('click', function () {
      var p = uitFormulier();
      var blob = new Blob([JSON.stringify({ commons: 'profiel', schema: schema.versie, profiel: p }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'commons-profiel.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      zeg('Opgeslagen als commons-profiel.json.', 'ok');
    });
    var inp = document.getElementById('profiel-laadveld');
    document.getElementById('profiel-laad').addEventListener('click', function () { inp.click(); });
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.value = '';
      if (!f) return;
      var lezer = new FileReader();
      lezer.onload = function () {
        try {
          var data = JSON.parse(String(lezer.result));
          var r = schoon(data && data.commons === 'profiel' ? data.profiel : data);
          bewaar(r.profiel); naarFormulier(r.profiel);
          zeg('Profiel geladen uit bestand' + (r.weg ? ' (' + r.weg + ' onbekende waarde(n) overgeslagen)' : '') + '.', 'ok');
        } catch (e) { zeg('Laden mislukt: geen leesbaar profiel.', 'fout'); }
      };
      lezer.readAsText(f);
    });
    document.getElementById('profiel-link').addEventListener('click', function () {
      var url = naarLink(uitFormulier());
      var klaar = function () { zeg('Link gekopieerd. Wie hem opent, krijgt dit profiel aangeboden; de naam van je organisatie zit er niet in.', 'ok'); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(klaar, function () { prompt('Kopieer deze link:', url); }); }
      else { prompt('Kopieer deze link:', url); }
    });
  }

  // ── Voorstel van de assistent (plan het profiel, stap 4) ──
  // De assistent is de AI-hulp van de beleidsset (opdracht "profiel"): die leest een beschrijving van je
  // organisatie met je eigen sleutel, en levert een bestand met per vraag een voorstel en het citaat waar het
  // op rust. Hier lees je dat bestand, zie je per vraag wat er wordt voorgesteld, en neem je over wat je
  // aanvinkt. Een regel waarvan het citaat niet in je document stond, staat uit. Het citaat zelf komt nooit in
  // het profiel; alleen de gekozen antwoord-id's, en alleen als ze in de vragenlijst bestaan.
  function voorstelRegels(v) {
    if (!v || v.formaat !== 'beleidsset-voorstel' || v.opdracht !== 'profiel' || !Array.isArray(v.items)) return null;
    var regels = [], weg = 0;
    v.items.forEach(function (item) {
      var vraag = schema.vragen.filter(function (x) { return x.id === item.code; })[0];
      if (!vraag) { weg++; return; }
      var geldig = vraag.antwoorden.map(function (a) { return a.id; });
      var antw = (Array.isArray(item.antwoorden) ? item.antwoorden : []).filter(function (a) { return geldig.indexOf(a) !== -1; });
      if (!antw.length) { weg++; return; }
      if (!vraag.meerdere) antw = antw.slice(0, 1);
      regels.push({ code: vraag.id, vraag: vraag.vraag, meerdere: !!vraag.meerdere, antwoorden: antw,
        labels: antw.map(function (a) { return vraag.antwoorden.filter(function (b) { return b.id === a; })[0].label; }),
        bronregel: String(item.bronregel || ''), citaatKlopt: item.citaat_klopt === true });
    });
    return { regels: regels, weg: weg };
  }
  var voorstel = null;
  function cel(tr, tekst) { var td = document.createElement('td'); td.textContent = tekst; tr.appendChild(td); return td; }
  function toonVoorstel(v) {
    var uitkomst = voorstelRegels(v);
    var blok = document.getElementById('voorstel-blok');
    if (!uitkomst) { zeg('Dit is geen voorstel van de assistent voor de contextvragen.', 'fout'); return; }
    voorstel = uitkomst;
    document.getElementById('voorstel-herkomst').textContent = 'Gemaakt op ' + (v.gemaakt || 'onbekende datum') +
      (v.leverancier ? ' met ' + v.leverancier : '') + (v.model ? ' (model ' + v.model + ')' : '') +
      '. Vink aan wat je overneemt; regels waarvan het citaat niet in je document stond, staan uit.' +
      (uitkomst.weg ? ' ' + uitkomst.weg + ' voorstel(len) met een onbekende vraag of antwoord overgeslagen.' : '');
    var tabel = document.getElementById('voorstel-tabel');
    while (tabel.firstChild) tabel.removeChild(tabel.firstChild);
    var kop = document.createElement('tr');
    ['Overnemen', 'Vraag', 'Voorstel', 'Waar het op rust'].forEach(function (t) { var th = document.createElement('th'); th.textContent = t; kop.appendChild(th); });
    tabel.appendChild(kop);
    uitkomst.regels.forEach(function (r, i) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      var vink = document.createElement('input');
      vink.type = 'checkbox'; vink.checked = r.citaatKlopt; vink.setAttribute('data-index', String(i)); vink.setAttribute('aria-label', 'overnemen');
      td.appendChild(vink); tr.appendChild(td);
      cel(tr, r.vraag);
      cel(tr, r.labels.join(', '));
      cel(tr, (r.citaatKlopt ? '' : 'niet in je document: ') + r.bronregel);
      tabel.appendChild(tr);
    });
    blok.hidden = false;
    zeg(uitkomst.regels.length + ' voorstel(len) geladen. Er is nog niets veranderd.', 'ok');
  }
  function voorstelKnoppen() {
    var inp = document.getElementById('voorstel-bestand');
    document.getElementById('voorstel-laad').addEventListener('click', function () { inp.click(); });
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.value = '';
      if (!f) return;
      var lezer = new FileReader();
      lezer.onload = function () {
        try { toonVoorstel(JSON.parse(String(lezer.result))); } catch (e) { zeg('Dit bestand is niet te lezen als voorstel.', 'fout'); }
      };
      lezer.readAsText(f);
    });
    document.getElementById('voorstel-overnemen').addEventListener('click', function () {
      if (!voorstel) return;
      var p = uitFormulier(), n = 0;
      [].slice.call(document.querySelectorAll('#voorstel-tabel input:checked')).forEach(function (x) {
        var r = voorstel.regels[+x.getAttribute('data-index')];
        if (!r) return;
        p[r.code] = r.meerdere ? r.antwoorden : r.antwoorden[0]; n++;
      });
      p = schoon(p).profiel;
      bewaar(p); naarFormulier(p);
      document.getElementById('voorstel-blok').hidden = true; voorstel = null;
      zeg(n + ' antwoord(en) overgenomen uit het voorstel en bewaard in deze browser.', 'ok');
    });
    document.getElementById('voorstel-sluiten').addEventListener('click', function () {
      voorstel = null; document.getElementById('voorstel-blok').hidden = true; zeg('Voorstel gesloten; er is niets veranderd.', 'ok');
    });
  }

  fetch(SCHEMA, { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    schema = data;
    teken(); knoppen(); voorstelKnoppen();
    var vanLink = uitLink();
    if (vanLink) {
      var r = schoon(vanLink);
      bewaar(r.profiel); naarFormulier(r.profiel);
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      zeg('Profiel uit de link overgenomen en bewaard in deze browser' + (r.weg ? ' (' + r.weg + ' onbekende waarde(n) overgeslagen)' : '') + '.', 'ok');
    } else {
      naarFormulier(schoon(lees()).profiel);
    }
  }).catch(function (e) {
    wortel.innerHTML = '<p class="profiel-melding fout">De vragenlijst (' + esc(SCHEMA) + ') is nu niet te laden: ' + esc(e.message) + '. Probeer het later opnieuw.</p>';
  });
})();
