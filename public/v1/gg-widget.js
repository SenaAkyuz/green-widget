/* Green Gold Connect widget — v1 (stable). Bu yol SABİT kalır; kırıcı
   değişiklikler /v2/ altında yayınlanır, partner siteleri bozulmaz. */
(function () {
  "use strict";

  // FAIL-SILENT: widget hata verirse host sayfanın checkout'unu KİLİTLEME.
  // Önce no-op bir API tanımla → host "Onayla" butonu GreenGold.confirm()
  // çağırsa bile (init patlasa dahi) exception fırlamaz, akış durmaz.
  function noop() { return 0; }
  if (!window.GreenGold) {
    window.GreenGold = {
      confirm: noop,
      total: noop,
      isSelected: function () { return false; },
      contribution: noop
    };
  }

  try {
    main();
  } catch (e) {
    // Sessizce vazgeç: hiçbir şey render etme, host checkout'u akışına devam etsin.
    try { console.warn("[GreenGold] widget atlandı (checkout etkilenmedi):", e); } catch (_) {}
  }

  function main() {
    // --- Config: script tag'inden oku ---
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName("script");
      s = all[all.length - 1];
    }

    var cfg = {
      merchantId: s.getAttribute("data-merchant-id") || "DEMO",
      amount: parseFloat(s.getAttribute("data-amount")) || 0,
      currency: s.getAttribute("data-currency") || "TRY",
      type: s.getAttribute("data-type") || "mobility",
      locale: s.getAttribute("data-locale") || "tr",
      fixed: parseFloat(s.getAttribute("data-fixed")),     // sabit katki (orn 6)
      percent: parseFloat(s.getAttribute("data-percent")), // veya % bazli
      min: parseFloat(s.getAttribute("data-min")) || 3,
      max: parseFloat(s.getAttribute("data-max")) || 50,
      target: s.getAttribute("data-target"),               // tutar OKUNACAK / yazilacak DOM selector (ops.)
      endpoint: s.getAttribute("data-endpoint"),           // veri POST edilecek URL (ops.)
      mount: s.getAttribute("data-mount")                  // widget'in basilacagi selector (ops.)
    };

    // window.GreenGoldConfig ile override
    if (window.GreenGoldConfig) for (var k in window.GreenGoldConfig) cfg[k] = window.GreenGoldConfig[k];

    // --- Katki hesabi: sabit oncelikli, yoksa %, yoksa default 6 ---
    function calc(amount) {
      var c;
      if (!isNaN(cfg.fixed)) c = cfg.fixed;
      else if (!isNaN(cfg.percent)) c = (amount * cfg.percent) / 100;
      else c = 6; // BiTaksi default 5-6 TL
      c = Math.min(Math.max(c, cfg.min), cfg.max);
      return Math.round(c * 100) / 100;
    }

    // "268,50 TL" / "$1,234.56" / "1.234,56 €" → 268.5 / 1234.56 / 1234.56
    function parseAmount(text) {
      if (text == null) return NaN;
      var str = String(text).replace(/[^0-9.,]/g, "");
      if (!str) return NaN;
      var dots = (str.match(/\./g) || []).length;
      var commas = (str.match(/,/g) || []).length;
      var dec = ""; // ondalik ayiraci
      if (dots && commas) dec = str.lastIndexOf(".") > str.lastIndexOf(",") ? "." : ",";
      else if (commas === 1 && str.length - 1 - str.lastIndexOf(",") <= 2) dec = ",";
      else if (dots === 1 && str.length - 1 - str.lastIndexOf(".") <= 2) dec = ".";
      if (dec) {
        str = str.split(dec === "." ? "," : ".").join(""); // bin ayiracini at
        if (dec === ",") str = str.replace(/,/g, ".");
      } else {
        str = str.replace(/[.,]/g, ""); // ayiraclarin hepsi bin ayiraci
      }
      return parseFloat(str);
    }

    var labels = {
      tr: { title: "Bu yolculugu karbon notr yap", thanks: "Dogaya katkin icin tesekkurler!", total: "Toplam", mark: "Green Gold Connect ile guclendirildi" },
      en: { title: "Make this trip climate positive", thanks: "Thanks for your contribution!", total: "Total", mark: "Powered by Green Gold Connect" }
    };
    var t = labels[cfg.locale] || labels.tr;

    // --- Tutar kaynagi ---
    // ÖNERİLEN: data-amount ile checkout toplamini ver (sabit/sablon degiskeni).
    // ALTERNATIF (ileri): data-amount yoksa data-target DOM elemanindan okunur ve
    // degisince yeniden hesaplanir.
    var hasFixedAmount = !isNaN(cfg.amount) && cfg.amount > 0;
    var readFromTarget = !hasFixedAmount && !!cfg.target;
    var baseAmount = hasFixedAmount ? cfg.amount : 0;
    if (readFromTarget) {
      var srcEl0 = document.querySelector(cfg.target);
      var parsed0 = srcEl0 ? parseAmount(srcEl0.textContent) : NaN;
      if (!isNaN(parsed0)) baseAmount = parsed0;
    }

    var contribution = calc(baseAmount);
    var selected = true; // default ACIK
    var sym = cfg.currency === "EUR" ? "€" : cfg.currency === "USD" ? "$" : "TL";

    function fmt(n) { return n.toLocaleString(cfg.locale === "tr" ? "tr-TR" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function money(n) { return cfg.currency === "TRY" ? fmt(n) + " " + sym : sym + fmt(n); }

    // --- Stil (izole, host'u bozmaz) ---
    var css =
      ".gg-card{font-family:-apple-system,Segoe UI,Roboto,sans-serif;border:1px solid #d8ead9;background:#f3faf4;border-radius:12px;padding:14px 16px;margin:12px 0;color:#1a2e1d;width:100%;max-width:480px;box-sizing:border-box;overflow-wrap:break-word}" +
      ".gg-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}" +
      ".gg-cb{width:20px;height:20px;accent-color:#2D7A3A;cursor:pointer;flex:0 0 auto}" +
      ".gg-title{font-weight:600;font-size:14px;line-height:1.3;min-width:0;flex:1 1 140px}" +
      ".gg-amt{margin-left:auto;font-weight:700;color:#2D7A3A;white-space:nowrap}" +
      ".gg-sub{font-size:12px;color:#5b7a5f;margin:6px 0 0 30px}" +
      ".gg-total{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 10px;margin-top:10px;padding-top:10px;border-top:1px dashed #cfe3d0;font-weight:700;font-size:15px}" +
      ".gg-mark{font-size:10px;color:#9bb59e;text-align:right;margin-top:8px}" +
      "@media (max-width:340px){.gg-sub{margin-left:0}}";
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    // --- DOM ---
    var card = document.createElement("div");
    card.className = "gg-card";
    card.innerHTML =
      '<div class="gg-row">' +
        '<input type="checkbox" class="gg-cb" checked>' +
        '<span class="gg-title">🌿 ' + t.title + '</span>' +
        '<span class="gg-amt">+' + money(contribution) + '</span>' +
      '</div>' +
      '<div class="gg-sub">' + t.thanks + '</div>' +
      '<div class="gg-total"><span>' + t.total + '</span><span class="gg-totval"></span></div>' +
      '<div class="gg-mark">' + t.mark + '</div>';

    var host = cfg.mount ? document.querySelector(cfg.mount) : null;
    if (host) host.appendChild(card);
    else (document.body || document.documentElement).appendChild(card);

    var cb = card.querySelector(".gg-cb");
    var totEl = card.querySelector(".gg-totval");
    var amtEl = card.querySelector(".gg-amt");

    function total() { return baseAmount + (selected ? contribution : 0); }

    function render() {
      contribution = calc(baseAmount);
      amtEl.textContent = "+" + money(contribution);
      totEl.textContent = money(total());
      // Sabit modda host'un toplamina yeni toplami yaz. DOM'dan okuma modunda
      // YAZMA: kaynak eleman ayni anda hedef olunca sonsuz donguyu onler; host
      // kendi toplamini gosterir, kart icinde yeni toplam zaten gorunur.
      if (cfg.target && !readFromTarget) {
        var tg = document.querySelector(cfg.target);
        if (tg) tg.textContent = money(total());
      }
    }

    cb.addEventListener("change", function () {
      selected = cb.checked;
      render();
    });

    render();

    // DOM'dan okuma modu: checkout toplami degisince katkiyi yeniden hesapla.
    if (readFromTarget && window.MutationObserver) {
      var srcEl = document.querySelector(cfg.target);
      if (srcEl) {
        var mo = new MutationObserver(function () {
          var v = parseAmount(srcEl.textContent);
          if (!isNaN(v) && v !== baseAmount) {
            baseAmount = v;
            render();
          }
        });
        mo.observe(srcEl, { childList: true, characterData: true, subtree: true });
      }
    }

    // --- Veri gonderimi (ops. endpoint varsa) ---
    // keepalive + try/catch: ag hatasi olsa bile checkout akisini ASLA bloklamaz.
    function send(status) {
      if (!cfg.endpoint) return;
      var payload = {
        merchant_id: cfg.merchantId,
        session_id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + "",
        original_amount: baseAmount,
        contribution_amount: selected ? contribution : 0,
        currency: cfg.currency,
        type: cfg.type,
        contribution_selected: selected,
        payment_status: status || "pending"
      };
      try {
        fetch(cfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }

    // Host'un "Onayla" butonu: GreenGold.confirm() cagirsin (no-op API'yi gercekle degistir)
    window.GreenGold = {
      confirm: function () { try { send("completed"); } catch (e) {} return total(); },
      total: total,
      isSelected: function () { return selected; },
      contribution: function () { return selected ? contribution : 0; }
    };
  }
})();
