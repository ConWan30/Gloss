/* Shared surface helpers for dock, rail, folio, second.
   Front-end only. Reads the same /v1 views; adds motion hints. */
(function () {
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Remember the last mark per reading id, per root, so only a new or
     re-marked plate animates. Polling an unchanged view does nothing. */
  function tracker() {
    var seen = new Map();
    var last = null;
    return {
      changed: function (key) {
        if (key === last) return false;
        last = key;
        return true;
      },
      motion: function (r) {
        var prev = seen.get(r.id);
        if (prev === undefined) return " is-new";
        if (prev !== r.mark) return " is-remarked";
        return "";
      },
      commit: function (list) {
        seen = new Map();
        list.forEach(function (r) { seen.set(r.id, r.mark); });
      },
    };
  }

  function keyOf(list) {
    return JSON.stringify(list.map(function (r) {
      return [r.id, r.mark, r.label, r.type, r.concentration, r.echoOf];
    }));
  }

  /* Narrow plate used by rail, folio, second. */
  function slip(r, motion, tail) {
    var m = esc(r.mark);
    return '<div class="card ' + m + (motion || "") + '" data-id="' + esc(r.id) + '">' +
      '<i class="press" aria-hidden="true"></i>' +
      '<div class="mark ' + m + '">' + m + '</div>' +
      '<div class="label">' + esc(r.label) + '</div>' +
      (r.type ? '<div class="meta">' + esc(r.type) + (r.echoOf ? '<span class="sep">·</span>echo' : '') + '</div>' : '') +
      (tail || "") +
      '</div>';
  }

  window.Gloss = { esc: esc, tracker: tracker, keyOf: keyOf, slip: slip };
})();
