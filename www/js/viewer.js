/* eslint global-require: 0, import/no-unresolved: 0, import/no-dynamic-require: 0 */
global.platform = global.platform || require('./js/desktop_scripts');
const h = require('hyperscript');
window.$ = require('jquery');
window.spectrum = require('spectrum-colorpicker');

const corePath = (global.mainWindow ? '..' : '.');
const core = require(`${corePath}/core/js/index`);

let prefs = JSON.parse(window.localStorage.getItem('prefs'));

const decks = [];
let currentShabad;
const $message = document.getElementById('message');
const $body = document.body;
const $viewer = document.getElementById('viewer');

$body.classList.add(process.platform);

if (!global.mainWindow) {
  core.menu.settings.applySettings(prefs);
}

function hideDecks() {
  Array.from(document.querySelectorAll('.deck')).forEach((el) => {
    el.classList.remove('active');
  });
}

// IPC
global.platform.ipc.on('show-line', (event, data) => {
  module.exports.showLine(data.shabadID, data.lineID);
});

global.platform.ipc.on('show-text', (event, data) => {
  module.exports.showText(data.text);
});

global.platform.ipc.on('update-settings', () => {
  prefs = JSON.parse(window.localStorage.getItem('prefs'));
  core.menu.settings.applySettings(prefs);
});

module.exports = {
  showLine(shabadID, lineID) {
    const newShabadID = parseInt(shabadID, 10);
    if (decks.indexOf(newShabadID) > -1) {
      const $shabadDeck = document.getElementById(`shabad${newShabadID}`);
      if (currentShabad !== newShabadID || !$shabadDeck.classList.contains('active')) {
        hideDecks();
        $shabadDeck.classList.add('active');
        currentShabad = newShabadID;
      }
      Array.from($shabadDeck.querySelectorAll('.slide')).forEach(el => el.classList.remove('active'));
      document.getElementById(`slide${lineID}`).classList.add('active');
    } else {
      if (!global.platform.db) {
        global.platform.initDB();
      }
      global.platform.db.all(`SELECT v.ID, v.Gurmukhi, v.English, v.transliteration, v.PunjabiUni FROM Verse v LEFT JOIN Shabad s ON v.ID = s.VerseID WHERE s.ShabadID = ${newShabadID} ORDER BY v.ID ASC`,
        (err, rows) => {
          if (rows.length > 0) {
            const cards = [];
            rows.forEach((row) => {
              const gurmukhiShabads = row.Gurmukhi.split(' ');
              const taggedGurmukhi = [];
              gurmukhiShabads.forEach((val, index) => {
                if (val.indexOf(']') !== -1) {
                  taggedGurmukhi[index - 1] = `<span>${taggedGurmukhi[index - 1]}<i> </i>${val}</span>`;
                } else {
                  taggedGurmukhi[index] = val;
                }
              });
              const gurmukhiContainer = document.createElement('div');
              gurmukhiContainer.innerHTML = `<span class="padchhed">${taggedGurmukhi.join(' ')}</span><span class="larivaar">${taggedGurmukhi.join('<wbr>')}</span>`;
              cards.push(
                h(
                  `div#slide${row.ID}.slide${row.ID === lineID ? '.active' : ''}`,
                  [
                    h('h1.gurbani.gurmukhi', gurmukhiContainer),
                    h('h2.translation', row.English),
                    h('h2.teeka', row.PunjabiUni),
                    h('h2.transliteration', row.Transliteration),
                  ]));
            });
            hideDecks();
            $viewer.appendChild(h(`div#shabad${newShabadID}.deck.active`, cards));
            currentShabad = parseInt(newShabadID, 10);
            decks.push(newShabadID);
          }

          // apply custom theme settings
          core.menu.settings.applyViewerSettings();
        });
    }
  },

  showText(text) {
    hideDecks();
    $message.classList.add('active');
    while ($message.firstChild) {
      $message.removeChild($message.firstChild);
    }
    $message.appendChild(h('div.slide.active', h('h1.gurmukhi.gurbani', text)));
  },
};
