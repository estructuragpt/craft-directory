import { describe, expect, it } from "vitest";
import { getLocaleFromPathname, getPreferredLocale, localizedPath, routeMap, supportedLocales, translate } from "../src/lib/i18n";

describe("localization routing", () => {
  it("accepts only configured locales and uses the URL as authority", () => {
    expect(supportedLocales).toEqual(["en", "es"]);
    expect(getLocaleFromPathname("/es/proveedores")).toBe("es");
    expect(getLocaleFromPathname("/fr/providers")).toBeNull();
  });

  it("detects a browser locale only for an unprefixed entry", () => {
    expect(getPreferredLocale("es-CO,es;q=0.9,en;q=0.8")).toBe("es");
    expect(getPreferredLocale("fr-FR,en;q=0.8")).toBe("en");
  });

  it("maps localized public segments to one route identity", () => {
    expect(localizedPath("directory", "es")).toBe("/es/directorio");
    expect(localizedPath("directory", "en")).toBe("/en/directory");
    expect(routeMap.directory.internal).toBe("directory");
  });

  it("keeps catalog keys typed and localized", () => {
    expect(translate("es", "navigation.directory")).toBe("Directorio");
    expect(translate("en", "navigation.directory")).toBe("Directory");
  });
});
