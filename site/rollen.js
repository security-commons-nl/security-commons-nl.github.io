// De rolkiezer en de suggestie uit je profiel op de voorpagina (plan het profiel, stap 3).
// Rol: van de persoon, meer tegelijk mag, bewaard onder commons-rol. Gekozen rollen staan vooraan; de andere
// rollen gaan achter een knop "Toon alle rollen", nooit weg. Situaties staan in een eigen rij en worden niet
// verborgen. Met een profiel (commons-profiel) leest de pagina /kennisbank/profielregels.json en stelt een
// route of situatie voor. Zonder JavaScript staat alles er gewoon.
(function () {
  'use strict';
  var kiezer = document.getElementById('rolkiezer');
  var sectie = document.getElementById('routes-rollen');
  if (!kiezer || !sectie) return;
  var blokken = [].slice.call(sectie.querySelectorAll('.route'));
  var ids = blokken.map(function (b) { return b.getAttribute('data-route'); });
  var knoppen = [].slice.call(kiezer.querySelectorAll('button[data-rol]'));
  var alle = document.getElementById('rol-alle');
  var toonAlles = false;

  function leesRol() {
    try {
      var w = JSON.parse(localStorage.getItem('commons-rol') || '[]');
      return (Array.isArray(w) ? w : []).filter(function (x) { return ids.indexOf(x) !== -1; });
    } catch (e) { return []; }
  }
  var gekozen = leesRol();
  function bewaar() { try { localStorage.setItem('commons-rol', JSON.stringify(gekozen)); } catch (e) {} }

  function pas() {
    knoppen.forEach(function (k) { k.setAttribute('aria-pressed', gekozen.indexOf(k.getAttribute('data-rol')) !== -1 ? 'true' : 'false'); });
    var voor = blokken.filter(function (b) { return gekozen.indexOf(b.getAttribute('data-route')) !== -1; });
    var na = blokken.filter(function (b) { return gekozen.indexOf(b.getAttribute('data-route')) === -1; });
    voor.concat(na).forEach(function (b) { sectie.appendChild(b); });
    // Een route die het profiel voorstelt (route-voorgesteld) blijft zichtbaar, ook als hij niet bij een gekozen rol hoort.
    na.forEach(function (b) { b.hidden = gekozen.length > 0 && !toonAlles && !(b.classList && b.classList.contains('route-voorgesteld')); });
    voor.forEach(function (b) { b.hidden = false; });
    alle.hidden = gekozen.length === 0 || na.length === 0;
    alle.textContent = toonAlles ? 'Alleen mijn rollen' : 'Toon alle rollen (' + na.length + ' meer)';
  }
  knoppen.forEach(function (k) {
    k.addEventListener('click', function () {
      var id = k.getAttribute('data-rol');
      var i = gekozen.indexOf(id);
      if (i === -1) gekozen.push(id); else gekozen.splice(i, 1);
      gekozen = ids.filter(function (x) { return gekozen.indexOf(x) !== -1; });
      bewaar(); pas();
    });
  });
  alle.addEventListener('click', function () { toonAlles = !toonAlles; pas(); });
  kiezer.hidden = false;
  pas();

  // De suggestie uit het profiel. Een situatie of route uit de regels, met het waarom, en een knop om hem
  // voor deze sessie weg te klikken. Geen profiel, geen regels of een fout bij het ophalen: niets.
  var vak = document.getElementById('profielsuggestie');
  if (!vak) return;
  var profiel = {};
  try { profiel = JSON.parse(localStorage.getItem('commons-profiel') || '{}') || {}; } catch (e) { profiel = {}; }
  var weg = false;
  try { weg = sessionStorage.getItem('commons-suggestie') === 'weg'; } catch (e) {}
  if (!Object.keys(profiel).length || weg || typeof fetch !== 'function') return;
  function lijst(w) { return Array.isArray(w) ? w : (w == null ? [] : [w]); }
  function geldt(r) {
    return Object.keys(r.als || {}).some(function (vraag) {
      var antw = lijst(profiel[vraag]);
      return (r.als[vraag] || []).some(function (a) { return antw.indexOf(a) !== -1; });
    });
  }
  fetch('/kennisbank/profielregels.json', { cache: 'no-cache' }).then(function (r) {
    return r.ok ? r.json() : { regels: [] };
  }).then(function (data) {
    var alleRoutes = [].slice.call(document.querySelectorAll('.route[data-route]')).map(function (b) { return b.getAttribute('data-route'); });
    var raak = (data.regels || []).filter(geldt).filter(function (r) {
      var d = r.dan || {};
      return alleRoutes.indexOf(d.situatie || d.route) !== -1;
    });
    if (!raak.length) return;
    var kop = document.createElement('p');
    kop.className = 'suggestie-kop';
    kop.textContent = 'Op basis van je profiel';
    vak.appendChild(kop);
    raak.forEach(function (r) {
      var doel = (r.dan || {}).situatie || (r.dan || {}).route;
      var p = document.createElement('p');
      p.textContent = r.waarom + ' ';
      var a = document.createElement('a');
      a.href = '#route-' + doel;
      a.textContent = 'Naar de route';
      p.appendChild(a);
      vak.appendChild(p);
      var blok = document.getElementById('route-' + doel);
      if (blok) { blok.classList.add('route-voorgesteld'); blok.hidden = false; }
    });
    var p2 = document.createElement('p');
    var aan = document.createElement('a');
    aan.href = '/profiel/';
    aan.textContent = 'Profiel aanpassen';
    p2.appendChild(aan);
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.textContent = 'Niet meer tonen';
    knop.addEventListener('click', function () {
      try { sessionStorage.setItem('commons-suggestie', 'weg'); } catch (e) {}
      vak.hidden = true;
    });
    p2.appendChild(knop);
    vak.appendChild(p2);
    vak.hidden = false;
  }).catch(function () {});
})();
