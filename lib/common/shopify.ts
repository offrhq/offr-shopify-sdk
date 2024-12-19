// deno-lint-ignore-file no-explicit-any
/**
 * Shopify does not provide type definition for `window.shopify`
 *
 *
 * https://community.shopify.com/c/hydrogen-headless-and-storefront/official-shopify-documentation-for-window-shopify-object/m-p/1577149
 */
export interface WindowShopify {
  PaymentButton: {
    init(): any;
  };
  autoloadFeatures(param: any): any;
  /**
   * Only show in Theme previews, it's a class instance, yuck.
   */
  PreviewBarInjector(options: {
    targetNode: HTMLElement;
    iframeRoot: string;
    iframeSrc: string;
    previewToken: string;
    themeStoreId: string;
    permanentDomain: string;
  }): {
    /**
     * This is already invoked at runtime
     */
    init(): void;
    hideIframe(): void;
    postMessageBuffer(argument: any): any;
    postTrekkieData(param: any): any;
    sendPostMessage(param1: any, param2: any): any;
    postMessageHandler(param1: any, param2: any, param3: any, param4: any): any;
    teardown(): void;
  };
  /**
   * Set to `true` when active in theme editor
   */
  designMode?: boolean;
  /**
   * Related to web-pixels management
   */
  analytics: {
    /**
     * Store reference of some sort, see `publish` method.
     */
    replayQueue: Array<[any, any, any]>;
    /**
     * Inserts entries into the `replayQueue`
     */
    publish(param1: any, param2: any, param3: any): void;
  };
  /**
   * Routes reference
   */
  routes: {
    /**
     * The root path, typically `/` unless you are using sub-folder
     * markets then it would be something like `/en-us/` etc
     */
    root: string;
  };
  /**
   * Reference to CDN hostname, typically: `cdn.shopify.com`
   */
  cdnHost: string;
  /**
   * Currency Reference
   */
  currency: {
    /**
     * The current active current code, eg: `USD`, `SEK` etc
     */
    active: string;
    /**
     * The exchange rate
     */
    rate: string;
  };
  /**
   * The current 2 Letter ISO Country code, eg: `US` or `CA` or `NL` etc
   */
  country: string;
  /**
   * Customer Privacy Methods
   */
  customerPrivacy: {
    getRegulation(): any;
    getShopPrefs(): any;
    getTrackingConsent(): any;
    isRegulationEnforced(): any;
    setTrackingConsent(param1: any, param2: any): any;
    shouldShowGDPRBanner(): any;
    userCanBeTracked(): any;
    userDataCanBeSold(): any;
  };
  loadFeatures(
    params: Array<{
      // deno-lint-ignore ban-types
      name: "consent-tracking-api" | (string & {});
      // deno-lint-ignore ban-types
      version: "0.1" | (string & {});
    }>,
    callback: (error: Error) => void
  ): any;
  /**
   * Two letter language code
   */
  locale: string;
  /**
   * The `myshopify.com` store domain
   */
  shop: string;
  modules: boolean;
  /**
   * Theme Information
   */
  theme: {
    handle: string;
    id: number;
    name: string;
    role: "published" | "unpublished";
    style: {
      id: number;
      handle: string;
    };
    theme_store_id: null | number;
  };
}
