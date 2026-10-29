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
      html += '<fieldset class="profiel-vraag' + (v.hoort_bij ? ' profiel-subvraag' : '') + '"><legend>' + esc(v.vraag) + (v.meerdere ? ' <small>(meer antwoorden mogelijk)</small>' : '') + '</legend>';
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
          if (!Object.keys(r.profiel).length) { zeg('Dit bestand bevat geen geldig profiel; er is niets veranderd.', 'fout'); return; }
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

  fetch(SCHEMA, { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    // Een subvraag (zoals BYOD onder werkplek) is in het profiel een eigen sleutel, precies zoals de
    // beleidsset-generator hem schrijft. Hier wordt hij een gewone vraag direct na zijn hoofdvraag.
    var vlak = [];
    (data.vragen || []).forEach(function (v) {
      var kopie = {}; Object.keys(v).forEach(function (k) { if (k !== 'subvraag') kopie[k] = v[k]; });
      vlak.push(kopie);
      if (v.subvraag) { var sub = { meerdere: false }; Object.keys(v.subvraag).forEach(function (k) { sub[k] = v.subvraag[k]; }); sub.hoort_bij = v.id; vlak.push(sub); }
    });
    schema = { versie: data.versie, vragen: vlak };
    teken(); knoppen();
    var vanLink = uitLink();
    if (vanLink && Object.keys(schoon(vanLink).profiel).length) {
      var r = schoon(vanLink);
      bewaar(r.profiel); naarFormulier(r.profiel);
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      zeg('Profiel uit de link overgenomen en bewaard in deze browser' + (r.weg ? ' (' + r.weg + ' onbekende waarde(n) overgeslagen)' : '') + '.', 'ok');
    } else if (vanLink) {
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      naarFormulier(schoon(lees()).profiel);
      zeg('De link bevat geen geldig profiel; je eigen profiel staat er nog.', 'fout');
    } else {
      naarFormulier(schoon(lees()).profiel);
    }
  }).catch(function (e) {
    wortel.innerHTML = '<p class="profiel-melding fout">De vragenlijst (' + esc(SCHEMA) + ') is nu niet te laden: ' + esc(e.message) + '. Probeer het later opnieuw.</p>';
  });
})();
