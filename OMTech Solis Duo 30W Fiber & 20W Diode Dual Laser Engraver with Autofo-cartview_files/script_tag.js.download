if (!window.rbrHideScripts) {
  window.rbrHideScripts = true;
  const baseURL = "api.fastbundle.co";
  const sdkURL = "sdk.fastbundle.co";
  const appName = "fast-bundle-product-bundles";
  const configBaseUrl = `https://${baseURL}/v3/fast-bundle-conf/?shop_domain=${window.Shopify.shop}`;
  const fastBundleAppUrl = `https://${sdkURL}/{version}/main.min.js`;
  const rbrVendorUrl = `https://${sdkURL}/{version}/vendor.js`;
  const fastBundleCartUrl = `https://${baseURL}/scripts/cart.js`;
  const fastBundleStyleUrl = `https://${sdkURL}/{version}/main.min.css`;

  const previousScriptLoaded =
  Boolean(
    document.querySelectorAll(`script[src*="${sdkURL}"][type="module"]`).length
  ) ||
  Boolean(
    document.querySelectorAll(
      `script[src*="cdn.shopify.com/extensions/"][src*="${appName}"][type="module"]`
    ).length
  );

  const previousCartScriptLoaded = Boolean(
    document.querySelectorAll(`script[src*="${fastBundleCartUrl}"]`).length
  );

  function addScriptsToHead(res) {
    if (res.is_active) {
      const FastBundleConf = res;
      FastBundleConf.pid = window.pid
        ? `${window.pid}`
        : FastBundleConf.pid || "";
      FastBundleConf.domain = window.Shopify.shop;
      FastBundleConf.serverless_vd = false;
      FastBundleConf.serverless_vd_display = false;
      window.FastBundleConf = FastBundleConf;
      const version = FastBundleConf.frontend_version || "1.0.0";

      // add random generated number query parameter to clear the cache
      const urlQueryParameter = `?rgn=${FastBundleConf?.rgn}`;

      const appScript = document.createElement("script");
      appScript.async = true;

      let style = document.createElement("link");
      style.rel = "stylesheet";

      appScript.src = fastBundleAppUrl.replace("{version}", version);
      appScript.type = "module";
      style.href = fastBundleStyleUrl.replace("{version}", version);

      let vendorScript = document.createElement("link");
      vendorScript.rel = "modulepreload";
      vendorScript.href = rbrVendorUrl.replace("{version}", version);

      document.head.appendChild(vendorScript);
      document.head.appendChild(appScript);
      document.head.appendChild(style);

      if (!previousCartScriptLoaded) {
        const cartScript = document.createElement("script");
        cartScript.src = fastBundleCartUrl + urlQueryParameter;
        cartScript.async = true;
        cartScript.type = "text/javascript";
        document.head.appendChild(cartScript);
      }
    }
  }

  if (!previousScriptLoaded) {
    if (!window.FastBundleConf?.pid)
      window
        .fetch(window.location.pathname + ".js")
        .then((r) => r.json())
        .then((r) => (window.pid = r.id));
    if (!window.FastBundleConf)
      window
        .fetch(configBaseUrl)
        .then((res) => res.json())
        .then((res) => addScriptsToHead(res));
    else addScriptsToHead(window.FastBundleConf);
  }
}
