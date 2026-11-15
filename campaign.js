// Tag App Store downloads with where the visitor came from, and count each tap.
// helloping.ai/?ref=ig_kendall sends the download button to the App Store with
// ct=ig_kendall, so App Store Connect (Analytics → Campaigns) credits the
// download to that tag. Any ref works; no ref counts under the site's own tag
// (SITE_TAGS), so downloads split by site there too.
// The ref is kept for the rest of the visit, so moving to another page and
// back keeps it.
// A tap on the button also tells Ping's server which site and tag it came
// from, for the admin dashboard's Analytics tab. The beacon carries no body and
// nothing about the visitor, needs no CORS preflight, and never holds up the
// App Store.
// The same file runs on helloping.ai, hnchapp.com, igotahunch.com and
// alpha.helloping.ai: change it in all four repos together.
(() => {
  const APP_STORE = "https://apps.apple.com/app/apple-store/id6764042802";
  const PROVIDER_TOKEN = "129186659";
  const STORAGE_KEY = "ping-ref";
  const CLICKS = "https://api.helloping.ai/api/v1/site/app-store-clicks";
  const SITE_TAGS = {
    "helloping.ai": "website",
    "www.helloping.ai": "website",
    "hnchapp.com": "website-hnchapp",
    "igotahunch.com": "website-igotahunch",
    "alpha.helloping.ai": "website-alpha",
  };

  // Lowercase, so ig_Kendall and ig_kendall are one campaign; Apple caps the
  // campaign token at 30 characters.
  const normalize = value => {
    const ref = (value ?? "").trim().toLowerCase();
    return /^[a-z0-9_.-]{1,30}$/.test(ref) ? ref : "";
  };

  let ref = normalize(new URLSearchParams(window.location.search).get("ref"));
  try {
    if (ref) sessionStorage.setItem(STORAGE_KEY, ref);
    else ref = normalize(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode); the ref in the URL still counts.
  }

  const tag = ref || SITE_TAGS[window.location.hostname] || "website";
  const link = `${APP_STORE}?pt=${PROVIDER_TOKEN}&ct=${tag}&mt=8`;
  const count = () => {
    const url = `${CLICKS}?ref=${encodeURIComponent(tag)}`;
    try {
      if (navigator.sendBeacon(url)) return;
    } catch {
      // No sendBeacon (an old browser): the keepalive fetch below.
    }
    fetch(url, { method: "POST", mode: "no-cors", keepalive: true }).catch(() => {});
  };
  document.querySelectorAll("a[data-app-store]").forEach(anchor => {
    anchor.href = link;
    anchor.addEventListener("click", count);
  });
})();
