// Het zoekvak op de voorpagina. build.mjs zet dit bestand inline in de pagina.
//
// De index komt van de normen-repo (normen/zoekindex.json, elke nacht opnieuw gebouwd): alle stukken van de
// kennisbank, het bronnenregister met de stukken van anderen, en de maatregelen van de normwijzer. De
// instrumenten zelf staan al als kaart op deze pagina; die leest het script uit de pagina.
//
// Het zoeken werkt zoals in de kennisbank: accenten en koppeltekens tellen niet, elk woord moet voorkomen,
// korte woorden alleen aan het begin van een woord, en de synoniemen uit het register (cbw vindt
// Cyberbeveiligingswet).
(function (root) {
  var INDEX_URL = '/normen/zoekindex.json';
  var NORMWIJZER = '/normen/normwijzer.html#';
  var ZICHTBAAR = 8;

  function norm(s) {
    return ' ' + (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/-/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }

  function komtVoor(tekst, w) {
    return w.length <= 3 ? tekst.indexOf(' ' + w) !== -1 : tekst.indexOf(w) !== -1;
  }

  function past(tekst, woorden) {
    for (var i = 0; i < woorden.length; i++) {
      var alt = woorden[i], raak = false;
      for (var j = 0; j < alt.length && !raak; j++) raak = komtVoor(tekst, alt[j]);
      if (!raak) return false;
    }
    return true;
  }

  // Bouwt de zoekfunctie op de index en de instrumenten van de pagina. Geeft per groep de treffers terug,
  // met eerst wat op de titel raak is (of op het nummer van de maatregel) en daarna de rest.
  function maakZoeker(index, instrumenten) {
    var groepen = (index.synoniemen || []).map(function (g) {
      return g.map(function (w) { return norm(w).trim(); });
    });
    var kaders = index.kaders || {};
    var stukken = (index.stukken || []).map(function (s) {
      return { t: s.t, u: s.u, w: s.w, slot: s.slot, _titel: norm(s.t), _zoek: norm(s.t + ' ' + s.w + ' ' + (s.z || '')) };
    });
    var normen = (index.normen || []).map(function (n) {
      var kader = kaders[n.k] || n.k;
      return { t: n.t, u: NORMWIJZER + n.k + '/' + n.id, w: kader + ' ' + n.id, id: n.id.toLowerCase(),
               _titel: norm(n.t), _zoek: norm(kader + ' ' + n.id + ' ' + n.t + ' ' + (n.z || '')) };
    });
    var tools = (instrumenten || []).map(function (p) {
      return { t: p.t, u: p.u, w: 'instrument', _titel: norm(p.t), _zoek: norm(p.t + ' ' + (p.z || '')) };
    });

    function varianten(woord) {
      var uit = [woord];
      groepen.forEach(function (g) {
        if (g.indexOf(woord) !== -1) g.forEach(function (w) { if (uit.indexOf(w) === -1) uit.push(w); });
      });
      return uit;
    }

    function filter(lijst, woorden, ruw) {
      var raak = [];
      lijst.forEach(function (r, i) {
        if (!past(r._zoek, woorden)) return;
        var rang = past(r._titel, woorden) ? 1 : 2;
        if (r.id && (ruw === r.id || ruw.slice(-r.id.length - 1) === ' ' + r.id)) rang = 0;
        raak.push({ r: r, rang: rang, i: i });
      });
      raak.sort(function (a, b) { return a.rang - b.rang || a.i - b.i; });
      return raak.map(function (x) { return x.r; });
    }

    return function (vraag) {
      var ruw = (vraag || '').toLowerCase().trim();
      var term = norm(vraag).trim();
      if (term === '') return null;
      var woorden = term.split(' ').map(varianten);
      return {
        instrumenten: filter(tools, woorden, ruw),
        kennisbank: filter(stukken.filter(function (s) { return s.w === 'kennisbank'; }), woorden, ruw),
        normen: filter(normen, woorden, ruw),
        anderen: filter(stukken.filter(function (s) { return s.w !== 'kennisbank'; }), woorden, ruw)
      };
    };
  }

  root.CommonsZoek = { norm: norm, maakZoeker: maakZoeker };
  if (typeof document === 'undefined') return;

  var vak = document.getElementById('commons-zoek');
  var uit = document.getElementById('commons-zoek-uit');
  var formulier = document.getElementById('commons-zoekvak');
  if (!vak || !uit || !formulier) return;

  // De kaarten staan onder het zoekvak, dus pas bij het zoeken lezen: bij het laden van dit script
  // bestaan ze nog niet.
  function instrumenten() {
    return [].slice.call(document.querySelectorAll('a.card')).map(function (a) {
      var titel = a.querySelector('.card-title');
      var desc = a.querySelector('.card-desc');
      return { t: titel ? titel.textContent : a.textContent, u: a.getAttribute('href'), z: desc ? desc.textContent : '' };
    });
  }
  var zoeker = null, laden = null, wacht = null;

  function haal() {
    if (!laden) {
      laden = fetch(INDEX_URL).then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        return r.json();
      }).then(function (index) {
        zoeker = maakZoeker(index, instrumenten());
      });
      laden.catch(function () { laden = null; });
    }
    return laden;
  }

  function el(tag, klasse, tekst) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (tekst) e.textContent = tekst;
    return e;
  }

  var KOPPEN = {
    instrumenten: ['Instrumenten', 'om direct mee aan de slag te gaan'],
    kennisbank: ['In de kennisbank', 'handleidingen, beleid en sjablonen om te hergebruiken'],
    normen: ['In de normwijzer', 'wat de norm vraagt en wat je eraan kunt doen'],
    anderen: ['Bij anderen', 'stukken van de IBD, het CIP, het Rijk en andere partijen']
  };

  function groep(naam, lijst) {
    var sectie = el('section', 'zoek-groep');
    var kop = el('h3', null, KOPPEN[naam][0] + ' (' + lijst.length + ')');
    sectie.appendChild(kop);
    sectie.appendChild(el('p', 'zoek-uitleg', KOPPEN[naam][1]));
    var ul = el('ul', 'zoek-lijst');
    lijst.forEach(function (r, i) {
      var li = el('li');
      if (i >= ZICHTBAAR) li.hidden = true;
      var a = el('a', null, naam === 'normen' ? r.w + ' · ' + r.t : r.t);
      a.href = r.u;
      li.appendChild(a);
      if (naam === 'anderen') {
        li.appendChild(el('span', 'zoek-wie', r.w + (r.slot ? ', achter inlog' : '')));
      }
      ul.appendChild(li);
    });
    sectie.appendChild(ul);
    if (lijst.length > ZICHTBAAR) {
      var knop = el('button', 'zoek-meer', 'Toon alle ' + lijst.length);
      knop.type = 'button';
      knop.addEventListener('click', function () {
        [].forEach.call(ul.children, function (li) { li.hidden = false; });
        knop.remove();
      });
      sectie.appendChild(knop);
    }
    return sectie;
  }

  function toon() {
    var vraag = vak.value;
    uit.textContent = '';
    if (!vraag.trim()) return;
    if (!zoeker) {
      uit.appendChild(el('p', 'zoek-melding', 'Even laden...'));
      haal().then(toon, function () {
        uit.textContent = '';
        var p = el('p', 'zoek-melding', 'Het zoeken lukt nu niet. Zoek direct in de ');
        var a = el('a', null, 'kennisbank');
        a.href = '/kennisbank/';
        p.appendChild(a);
        uit.appendChild(p);
      });
      return;
    }
    var res = zoeker(vraag);
    var n = 0;
    ['instrumenten', 'kennisbank', 'normen', 'anderen'].forEach(function (naam) {
      if (res[naam].length) { uit.appendChild(groep(naam, res[naam])); n += res[naam].length; }
    });
    if (!n) {
      uit.appendChild(el('p', 'zoek-melding', 'Niets gevonden op "' + vraag.trim() + '". Probeer een ander of korter woord.'));
    }
  }

  vak.addEventListener('focus', function () { haal(); });
  vak.addEventListener('input', function () {
    clearTimeout(wacht);
    wacht = setTimeout(toon, 150);
  });
  formulier.addEventListener('submit', function (e) {
    e.preventDefault();
    clearTimeout(wacht);
    toon();
  });
  // Een zoekvraag in het adres (?q=dpia) is deelbaar.
  var q = new URLSearchParams(location.search).get('q');
  if (q) {
    vak.value = q;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', toon);
    else toon();
  }
})(typeof window !== 'undefined' ? window : globalThis);
