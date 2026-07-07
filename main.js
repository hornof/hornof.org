// hornof.org — minimal vanilla JS. No dependencies.
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initDevColorPanel();
    initTheme();
    initTardis();
    initBreton();
    initProjects();
    initScrollSpy();
  });

  // TEMP — live look-and-feel tuner (3 sliders: background wash · panel warmth ·
  // panel opacity). Hidden by default; summon it by adding ?tune to the URL
  // (e.g. http://localhost:8788/?tune). Kept around so Luke can re-tune; the
  // readout shows the exact CSS. Tunes the ACTIVE theme via inline vars —
  // tune in light mode. Its defaults mirror the values baked into style.css.
  function initDevColorPanel() {
    if (!/[?&]tune\b/.test(location.search)) return;
    var root = document.documentElement;
    function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
    // warmth 0..100 → panel colour: neutral white → warm cream → amber.
    function warmthRGB(w) {
      var t = w / 100;
      return [lerp(250, 240, t), lerp(249, 228, t), lerp(246, 200, t)];
    }

    var state = { wash: 0, warmth: 60, opacity: 50 };

    var box = document.createElement("div");
    box.className = "dev-panel";
    var read = document.createElement("code");
    read.className = "dev-read";

    function row(label, key, min, max) {
      var wrap = document.createElement("label");
      wrap.className = "dev-row";
      var span = document.createElement("span");
      span.textContent = label;
      var input = document.createElement("input");
      input.type = "range";
      input.min = min;
      input.max = max;
      input.value = state[key];
      input.setAttribute("aria-label", label);
      input.addEventListener("input", function () {
        state[key] = Number(input.value);
        apply();
      });
      wrap.appendChild(span);
      wrap.appendChild(input);
      box.appendChild(wrap);
    }

    function apply() {
      var rgb = warmthRGB(state.warmth);
      var a = (state.opacity / 100).toFixed(2);
      var panel = "rgba(" + rgb.join(", ") + ", " + a + ")";
      root.style.setProperty("--panel", panel);

      var sa = (state.wash / 100).toFixed(2);
      var sa2 = Math.min(1, state.wash / 100 + 0.06).toFixed(2);
      var scrim =
        "linear-gradient(160deg, rgba(214,190,150," + sa + ") 0%, " +
        "rgba(184,156,116," + sa2 + ") 100%)";
      root.style.setProperty("--scrim", scrim);

      read.textContent =
        "panel " + panel + "\nscrim wash α=" + sa +
        "  (warmth " + state.warmth + ", opacity " + state.opacity + ")";
    }

    var title = document.createElement("div");
    title.className = "dev-title";
    title.textContent = "look & feel — tune, then tell me";
    box.appendChild(title);
    row("background wash", "wash", 0, 70);
    row("panel warmth", "warmth", 0, 100);
    row("panel opacity", "opacity", 30, 100);
    box.appendChild(read);
    document.body.appendChild(box);
    apply();
  }

  // F11: Projects wall. Entries are inlined JSON (#projects-data); render each to
  // a card. No fetch — the data is already in the DOM, so this is a pure static
  // page with zero runtime request.
  function initProjects() {
    var list = document.getElementById("projects-list");
    var dataEl = document.getElementById("projects-data");
    if (!list || !dataEl) return;

    var entries;
    try {
      entries = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      return; // malformed data — leave the wall empty rather than throw
    }
    if (!Array.isArray(entries)) return;

    entries.forEach(function (entry) {
      list.appendChild(buildCard(entry));
    });
  }

  function buildCard(entry) {
    var card = el("article", "project-card");
    card.setAttribute("data-slug", entry.slug || "");

    var head = el("div", "project-head");
    head.appendChild(el("h2", "project-title", entry.title));
    if (entry.date) head.appendChild(el("span", "project-date", entry.date));
    card.appendChild(head);

    if (entry.blurb) card.appendChild(el("p", "project-blurb", entry.blurb));

    // "How it was built" line — the differentiator, shown not hidden.
    var b = entry.build || {};
    if (b.stack) {
      var bits = [b.stack];
      if (b.agents) bits.push(b.agents);
      if (typeof b.tests === "number") bits.push(b.tests + " tests");
      if (b.firstPassGreen) bits.push("first-pass green: " + b.firstPassGreen);
      var buildLine = el("p", "project-build");
      buildLine.appendChild(el("span", "project-build-label", "Built with "));
      buildLine.appendChild(document.createTextNode(bits.join(" · ")));
      if (b.costNote) {
        buildLine.appendChild(el("span", "project-cost", b.costNote));
      }
      card.appendChild(buildLine);
    }

    var links = entry.links || [];
    if (links.length) {
      var nav = el("nav", "project-links");
      nav.setAttribute("aria-label", (entry.title || "project") + " links");
      links.forEach(function (l) {
        if (!l || !l.href) return;
        var a = el("a", null, l.label || l.href);
        a.setAttribute("href", l.href);
        nav.appendChild(a);
      });
      card.appendChild(nav);
    }
    return card;
  }

  // Tiny DOM helper: element with optional class + text (text set safely).
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // F9: Breton Easter egg — a faint fleur-de-lis revealing a nod to Brittany.
  // Same disclosure pattern as the Tardis (open/close, Escape, outside-click).
  function initBreton() {
    var toggle = document.querySelector(".breton-toggle");
    var panel = document.getElementById("breton-panel");
    if (!toggle || !panel) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }
    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    function close(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close(false);
      else open();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !e.target.closest(".breton")) close(false);
    });
  }

  // F7: dark/light toggle. The head script already resolved data-theme before
  // paint (localStorage → OS preference); here we just wire the button and keep
  // its label / aria-pressed in sync, persisting the user's choice.
  function initTheme() {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    var root = document.documentElement;

    function current() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function sync() {
      var dark = current() === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        dark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    function set(theme) {
      root.setAttribute("data-theme", theme);
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        /* private mode / storage disabled — the toggle still works in-session */
      }
      sync();
    }

    sync(); // reflect the pre-paint theme in the button on load
    toggle.addEventListener("click", function () {
      set(current() === "dark" ? "light" : "dark");
    });
  }

  // F4: Tardis time-machine — a subtle control revealing links to the archives.
  function initTardis() {
    var toggle = document.querySelector(".tardis-toggle");
    var panel = document.getElementById("tardis-panel");
    if (!toggle || !panel) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }
    function open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    function close(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }

    // Native <button> fires click on Enter/Space, so this covers keyboard too.
    toggle.addEventListener("click", function () {
      if (isOpen()) close(false);
      else open();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close(true);
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !e.target.closest(".tardis")) close(false);
    });
  }

  // F5: scroll-spy — highlight the nav link for the section currently in view.
  function initScrollSpy() {
    // Only in-page anchors take part in scroll-spy; page links (e.g. Projects)
    // are skipped so they never get a scroll-spy target lookup.
    var links = Array.prototype.slice
      .call(document.querySelectorAll(".section-nav a"))
      .filter(function (a) {
        var href = a.getAttribute("href");
        return href && href.charAt(0) === "#";
      });
    if (!links.length) return;

    var sections = links
      .map(function (a) {
        return document.querySelector(a.getAttribute("href"));
      })
      .filter(Boolean);
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    // On desktop the content panel scrolls internally (fixed-height frame); on
    // mobile the page scrolls. Spy against whichever is the real scroll box.
    var container = scrollContainer();

    // A thin band a bit above the middle of the scroll box is the "spy line":
    // the section crossing it is the active one.
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { root: container, rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      sections.forEach(function (s) {
        observer.observe(s);
      });
    }

    // Guard the extremes so the first/last section win at the very top/bottom,
    // where the spy line may sit past the edge of the scroll box.
    var last = sections[sections.length - 1];
    var first = sections[0];
    function edgeGuard() {
      var atBottom, atTop;
      if (container) {
        atBottom =
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 2;
        atTop = container.scrollTop <= 2;
      } else {
        var doc = document.documentElement;
        atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
        atTop = window.scrollY <= 2;
      }
      if (atBottom) setActive(last.id);
      else if (atTop) setActive(first.id);
    }
    (container || window).addEventListener("scroll", edgeGuard, {
      passive: true,
    });
    edgeGuard(); // set initial state on load
  }

  // The scrollable ancestor of the sections, or null when the page itself
  // scrolls (mobile). Desktop gives .content overflow-y:auto + a fixed height.
  function scrollContainer() {
    var content = document.querySelector(".content");
    if (!content) return null;
    var oy = getComputedStyle(content).overflowY;
    if (
      (oy === "auto" || oy === "scroll") &&
      content.scrollHeight > content.clientHeight + 4
    ) {
      return content;
    }
    return null;
  }
})();
