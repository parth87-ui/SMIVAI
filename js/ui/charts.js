/* ============================================================
   SMIVAI — ui/charts.js
   Small, calm SVG charts. No library, no canvas, no colour outside the
   SMIVAI palette. Everything scales with its container and stays legible
   on a phone.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var W = 620, H = 230, PAD_L = 44, PAD_R = 14, PAD_T = 18, PAD_B = 34;

  function open(aria) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + S.esc(aria || 'chart') + '">';
  }

  function gridlines(min, max, steps) {
    var out = '';
    for (var i = 0; i <= steps; i++) {
      var v = min + ((max - min) * i) / steps;
      var y = PAD_T + (H - PAD_T - PAD_B) * (1 - (v - min) / (max - min || 1));
      out += '<line x1="' + PAD_L + '" y1="' + y.toFixed(1) + '" x2="' + (W - PAD_R) + '" y2="' + y.toFixed(1) +
        '" stroke="var(--divider)" stroke-width="1"/>' +
        '<text x="' + (PAD_L - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="12" ' +
        'font-weight="700" fill="var(--muted)" font-family="var(--font)">' + Math.round(v) + '</text>';
    }
    return out;
  }

  var Charts = {

    /**
     * Line chart with a soft area fill.
     * @param {Array<{date:string,value:number}>} points
     */
    line: function (points, opts) {
      opts = opts || {};
      if (!points || points.length === 0) {
        return S.UI.empty('📈', 'No activity yet', 'A trend appears once a few activities are completed.');
      }
      var min = opts.min !== undefined ? opts.min : 0;
      var max = opts.max !== undefined ? opts.max : 100;
      var innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
      var n = points.length;
      var x = function (i) { return PAD_L + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1)); };
      var y = function (v) { return PAD_T + innerH * (1 - (v - min) / (max - min || 1)); };

      var d = '', area = '';
      points.forEach(function (p, i) {
        d += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1) + ' ';
      });
      area = d + 'L' + x(n - 1).toFixed(1) + ' ' + (H - PAD_B) + ' L' + x(0).toFixed(1) + ' ' + (H - PAD_B) + ' Z';

      var dots = points.map(function (p, i) {
        var last = i === n - 1;
        return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.value).toFixed(1) + '" r="' + (last ? 6 : 3.5) +
          '" fill="' + (last ? 'var(--green)' : 'var(--card)') + '" stroke="var(--green)" stroke-width="2.5"/>';
      }).join('');

      var labels = '';
      var every = Math.max(1, Math.ceil(n / 6));
      points.forEach(function (p, i) {
        if (i % every !== 0 && i !== n - 1) return;
        labels += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" ' +
          'font-weight="700" fill="var(--muted)" font-family="var(--font)">' + S.esc(S.shortDate(p.date)) + '</text>';
      });

      var lastVal = points[n - 1].value;
      return open(opts.aria || 'Performance trend') +
        gridlines(min, max, opts.steps || 4) +
        '<path d="' + area + '" fill="var(--sage)" opacity=".55"/>' +
        '<path d="' + d.trim() + '" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>' +
        dots + labels +
        '<text x="' + (W - PAD_R) + '" y="' + (PAD_T - 4) + '" text-anchor="end" font-size="13" font-weight="800" ' +
        'fill="var(--green-dark)" font-family="var(--font)">' + S.esc(opts.lastLabel || ('Latest ' + lastVal)) + '</text>' +
        '</svg>';
    },

    /** Vertical bars — used for daily reminder completion. */
    bars: function (items, opts) {
      opts = opts || {};
      if (!items || !items.length) {
        return S.UI.empty('📊', 'Nothing to show yet', 'Data appears as activity is recorded.');
      }
      var max = opts.max || 100;
      var innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
      var n = items.length;
      var slot = innerW / n;
      var bw = Math.min(opts.barWidth || 30, slot * 0.62);

      var bars = items.map(function (it, i) {
        var cx = PAD_L + slot * i + slot / 2;
        var h = innerH * S.clamp((it.value || 0) / max, 0, 1);
        var yy = PAD_T + innerH - h;
        var color = it.color || (it.value >= 80 ? 'var(--green)' : it.value >= 50 ? 'var(--amber)' : 'var(--error)');
        return '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + bw.toFixed(1) +
          '" height="' + Math.max(3, h).toFixed(1) + '" rx="6" fill="' + color + '"/>';
      }).join('');

      var labels = '';
      var every = Math.max(1, Math.ceil(n / 7));
      items.forEach(function (it, i) {
        if (i % every !== 0 && i !== n - 1) return;
        var cx = PAD_L + slot * i + slot / 2;
        labels += '<text x="' + cx.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" ' +
          'font-weight="700" fill="var(--muted)" font-family="var(--font)">' + S.esc(it.label) + '</text>';
      });

      return open(opts.aria || 'Daily values') + gridlines(0, max, 4) + bars + labels + '</svg>';
    },

    /** Horizontal bars — used for per-activity accuracy. */
    hbars: function (items, opts) {
      opts = opts || {};
      if (!items || !items.length) return S.UI.empty('📊', 'No activity data yet', '');
      var rowH = 44;
      var height = items.length * rowH + 12;
      var labelW = 168;
      var trackX = labelW + 8;
      var trackW = W - trackX - 62;

      var rows = items.map(function (it, i) {
        var y = 8 + i * rowH;
        var pct = S.clamp(it.value, 0, 100);
        var w = (trackW * pct) / 100;
        var color = it.color || (pct >= 75 ? 'var(--green)' : pct >= 55 ? 'var(--amber)' : 'var(--error)');
        return '<text x="0" y="' + (y + 22) + '" font-size="14" font-weight="800" fill="var(--text)" font-family="var(--font)">' +
            S.esc(it.label) + '</text>' +
          '<rect x="' + trackX + '" y="' + (y + 8) + '" width="' + trackW + '" height="18" rx="9" fill="var(--ivory-sunk)"/>' +
          '<rect x="' + trackX + '" y="' + (y + 8) + '" width="' + Math.max(4, w).toFixed(1) + '" height="18" rx="9" fill="' + color + '"/>' +
          '<text x="' + (W - 4) + '" y="' + (y + 22) + '" text-anchor="end" font-size="14" font-weight="800" ' +
            'fill="var(--muted)" font-family="var(--font)">' + Math.round(pct) + '%</text>';
      }).join('');

      return '<svg viewBox="0 0 ' + W + ' ' + height + '" style="width:100%;height:auto;display:block" ' +
        'preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + S.esc(opts.aria || 'Activity accuracy') + '">' +
        rows + '</svg>';
    },

    /** Compact inline sparkline for list rows. */
    spark: function (values, opts) {
      opts = opts || {};
      if (!values || values.length < 2) return '';
      var w = opts.width || 110, h = opts.height || 34;
      var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
      var span = (max - min) || 1;
      var d = values.map(function (v, i) {
        var x = (w * i) / (values.length - 1);
        var y = h - 3 - (h - 6) * ((v - min) / span);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
      return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
        '<path d="' + d + '" fill="none" stroke="' + (opts.color || 'var(--green)') + '" stroke-width="2.5" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    },

    /** Stacked completion strip: completed / missed / skipped. */
    strip: function (parts, opts) {
      opts = opts || {};
      var total = S.sum(parts.map(function (p) { return p.value; })) || 1;
      var x = 0;
      var segs = parts.map(function (p) {
        var w = (100 * p.value) / total;
        var seg = '<rect x="' + x.toFixed(2) + '%" y="0" width="' + w.toFixed(2) + '%" height="100%" fill="' + p.color + '"/>';
        x += w;
        return seg;
      }).join('');
      return '<svg viewBox="0 0 100 14" preserveAspectRatio="none" style="width:100%;height:16px;border-radius:8px;overflow:hidden;display:block" ' +
        'role="img" aria-label="' + S.esc(opts.aria || 'Completion breakdown') + '">' + segs + '</svg>';
    }
  };

  S.Charts = Charts;
})(window);
