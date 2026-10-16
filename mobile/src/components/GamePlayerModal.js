import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Clock, ShieldCheck, Trophy, Play, Shield } from 'lucide-react-native';
import { startPlaySession, pingPlaySession, claimPlaySession } from '../api/clientApi';
import { logEvent } from '../services/firebase';

/**
 * GameLoot Ad-Free Game Bridge (Mozilla / uBlock Origin Standard)
 * 1. Rewrites target="_blank" links (such as game start/play buttons) to target="_self" so they navigate in-place.
 * 2. Overrides window.open to suppress external ad popups while allowing game navigation.
 * 3. Incorporates the official Mozilla/uBO Google IMA SDK shim so video ads & interstitials complete in 0ms without white screens.
 * 4. Incorporates the official uBO Google AdSense & Google Publisher Tag (GPT) shims to eliminate banner ads safely.
 */
const GAME_WEBVIEW_INJECTED_JS = `
(function() {
  if (window.__gameloot_game_bridge_installed) return;
  window.__gameloot_game_bridge_installed = true;

  // 1. Force target="_blank" links (such as game start/play buttons) to open in current window
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') {
      el = el.parentElement;
    }
    if (el && el.tagName === 'A') {
      if (el.getAttribute('target') === '_blank') {
        el.setAttribute('target', '_self');
      }
    }
  }, true);

  // 2. Prevent ad popups from opening separate windows - navigate current window instead
  var _origOpen = window.open;
  window.open = function(url, target, features) {
    if (url && typeof url === 'string') {
      var low = url.toLowerCase();
      if (
        low.indexOf('doubleclick.net') !== -1 ||
        low.indexOf('googleads') !== -1 ||
        low.indexOf('googlesyndication.com') !== -1 ||
        low.indexOf('adservice.google') !== -1 ||
        low.indexOf('criteo.com') !== -1 ||
        low.indexOf('adnxs.com') !== -1 ||
        low.indexOf('outbrain.com') !== -1 ||
        low.indexOf('taboola.com') !== -1 ||
        low.indexOf('popads.net') !== -1 ||
        low.indexOf('monetag.com') !== -1 ||
        low.indexOf('adsterra.com') !== -1
      ) {
        return { closed: true, close: function() {} };
      }
      if (!target || target === '_blank' || target === '_self') {
        window.location.href = url;
        return window;
      }
    }
    return _origOpen ? _origOpen.apply(window, arguments) : null;
  };

  // 3. Mozilla / uBlock Origin Google IMA SDK Shim (Auto-resolves video ads in 0ms)
  try {
    if (!window.google || !window.google.ima || !window.google.ima.VERSION) {
      var VERSION = "3.764.0";
      var ima = {};

      function AdDisplayContainer(containerElement) {
        try {
          var div = document.createElement("div");
          div.style.setProperty("display", "none", "important");
          div.style.setProperty("visibility", "collapse", "important");
          if (containerElement && typeof containerElement.appendChild === 'function') {
            containerElement.appendChild(div);
          }
        } catch(e) {}
      }
      AdDisplayContainer.prototype.destroy = function() {};
      AdDisplayContainer.prototype.initialize = function() {};

      function ImaSdkSettings() {
        this.c = true;
        this.f = {};
        this.i = false;
        this.l = "";
        this.p = "";
        this.r = 0;
        this.t = "";
        this.v = "";
      }
      ImaSdkSettings.prototype.getCompanionBackfill = function() {};
      ImaSdkSettings.prototype.getDisableCustomPlaybackForIOS10Plus = function() { return this.i; };
      ImaSdkSettings.prototype.getFeatureFlags = function() { return this.f; };
      ImaSdkSettings.prototype.getLocale = function() { return this.l; };
      ImaSdkSettings.prototype.getNumRedirects = function() { return this.r; };
      ImaSdkSettings.prototype.getPlayerType = function() { return this.t; };
      ImaSdkSettings.prototype.getPlayerVersion = function() { return this.v; };
      ImaSdkSettings.prototype.getPpid = function() { return this.p; };
      ImaSdkSettings.prototype.isCookiesEnabled = function() { return this.c; };
      ImaSdkSettings.prototype.setAutoPlayAdBreaks = function() {};
      ImaSdkSettings.prototype.setCompanionBackfill = function() {};
      ImaSdkSettings.prototype.setCookiesEnabled = function(c) { this.c = !!c; };
      ImaSdkSettings.prototype.setDisableCustomPlaybackForIOS10Plus = function(i) { this.i = !!i; };
      ImaSdkSettings.prototype.setFeatureFlags = function(f) { this.f = f; };
      ImaSdkSettings.prototype.setLocale = function(l) { this.l = l; };
      ImaSdkSettings.prototype.setNumRedirects = function(r) { this.r = r; };
      ImaSdkSettings.prototype.setPlayerType = function(t) { this.t = t; };
      ImaSdkSettings.prototype.setPlayerVersion = function(v) { this.v = v; };
      ImaSdkSettings.prototype.setPpid = function(p) { this.p = p; };
      ImaSdkSettings.prototype.setSessionId = function() {};
      ImaSdkSettings.prototype.setVpaidAllowed = function() {};
      ImaSdkSettings.prototype.setVpaidMode = function() {};
      ImaSdkSettings.CompanionBackfillMode = { ALWAYS: "always", ON_MASTER_AD: "on_master_ad" };
      ImaSdkSettings.VpaidMode = { DISABLED: 0, ENABLED: 1, INSECURE: 2 };

      function EventHandler() {
        this.listeners = {};
      }
      EventHandler.prototype._dispatch = function(e) {
        var list = this.listeners[e.type] || [];
        for (var i = 0; i < list.length; i++) {
          try { list[i](e); } catch(r) {}
        }
      };
      EventHandler.prototype.addEventListener = function(types, cb) {
        if (!Array.isArray(types)) types = [types];
        for (var i = 0; i < types.length; i++) {
          var t = types[i];
          if (!this.listeners[t]) this.listeners[t] = [];
          this.listeners[t].push(cb);
        }
      };
      EventHandler.prototype.removeEventListener = function(types, cb) {
        if (!Array.isArray(types)) types = [types];
        for (var i = 0; i < types.length; i++) {
          var t = types[i];
          var list = this.listeners[t];
          if (list) {
            this.listeners[t] = list.filter(function(fn) { return fn !== cb; });
          }
        }
      };

      function AdsLoader() {
        EventHandler.call(this);
        this.settings = new ImaSdkSettings();
      }
      AdsLoader.prototype = Object.create(EventHandler.prototype);
      AdsLoader.prototype.contentComplete = function() {};
      AdsLoader.prototype.destroy = function() {};
      AdsLoader.prototype.getSettings = function() { return this.settings; };
      AdsLoader.prototype.getVersion = function() { return VERSION; };
      AdsLoader.prototype.requestAds = function(req, ctx) {
        var self = this;
        setTimeout(function() {
          var evt = new ima.AdsManagerLoadedEvent(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, req, ctx);
          self._dispatch(evt);
        }, 10);
      };

      function AdsManager() {
        EventHandler.call(this);
        this.volume = 1;
        this._enablePreloading = false;
      }
      AdsManager.prototype = Object.create(EventHandler.prototype);
      AdsManager.prototype.collapse = function() {};
      AdsManager.prototype.configureAdsManager = function() {};
      AdsManager.prototype.destroy = function() {};
      AdsManager.prototype.discardAdBreak = function() {};
      AdsManager.prototype.expand = function() {};
      AdsManager.prototype.focus = function() {};
      AdsManager.prototype.getAdSkippableState = function() { return true; };
      AdsManager.prototype.getCuePoints = function() { return [0]; };
      AdsManager.prototype.getCurrentAd = function() { return currentAd; };
      AdsManager.prototype.getCurrentAdCuePoints = function() { return []; };
      AdsManager.prototype.getRemainingTime = function() { return 0; };
      AdsManager.prototype.getVolume = function() { return this.volume; };
      AdsManager.prototype.init = function() {
        if (this._enablePreloading) {
          this._dispatch(new ima.AdEvent(ima.AdEvent.Type.LOADED));
        }
      };
      AdsManager.prototype.isCustomClickTrackingUsed = function() { return false; };
      AdsManager.prototype.isCustomPlaybackUsed = function() { return false; };
      AdsManager.prototype.pause = function() {};
      AdsManager.prototype.requestNextAdBreak = function() {};
      AdsManager.prototype.resize = function() {};
      AdsManager.prototype.resume = function() {};
      AdsManager.prototype.setVolume = function(v) { this.volume = v; };
      AdsManager.prototype.skip = function() {};
      AdsManager.prototype.start = function() {
        var self = this;
        setTimeout(function() {
          var types = [
            ima.AdEvent.Type.LOADED,
            ima.AdEvent.Type.STARTED,
            ima.AdEvent.Type.COMPLETE,
            ima.AdEvent.Type.ALL_ADS_COMPLETED,
            ima.AdEvent.Type.CONTENT_RESUME_REQUESTED
          ];
          for (var i = 0; i < types.length; i++) {
            try { self._dispatch(new ima.AdEvent(types[i])); } catch(e) {}
          }
        }, 10);
      };
      AdsManager.prototype.stop = function() {};
      AdsManager.prototype.updateAdsRenderingSettings = function() {};

      function AdsRenderingSettings() {}
      function AdsRequest() {
        this.setAdWillAutoPlay = function() {};
        this.setAdWillPlayMuted = function() {};
        this.setContinuousPlayback = function() {};
      }

      function AdPodInfo() {
        this.getAdPosition = function() { return 1; };
        this.getIsBumper = function() { return false; };
        this.getMaxDuration = function() { return -1; };
        this.getPodIndex = function() { return 1; };
        this.getTimeOffset = function() { return 0; };
        this.getTotalAds = function() { return 1; };
      }

      function Ad() {
        this._pi = new AdPodInfo();
      }
      Ad.prototype.getAdId = function() { return ""; };
      Ad.prototype.getAdPodInfo = function() { return this._pi; };
      Ad.prototype.getAdSystem = function() { return ""; };
      Ad.prototype.getAdvertiserName = function() { return ""; };
      Ad.prototype.getApiFramework = function() { return null; };
      Ad.prototype.getCompanionAds = function() { return []; };
      Ad.prototype.getContentType = function() { return ""; };
      Ad.prototype.getCreativeAdId = function() { return ""; };
      Ad.prototype.getCreativeId = function() { return ""; };
      Ad.prototype.getDealId = function() { return ""; };
      Ad.prototype.getDescription = function() { return ""; };
      Ad.prototype.getDuration = function() { return 0; };
      Ad.prototype.getHeight = function() { return 0; };
      Ad.prototype.getMediaUrl = function() { return null; };
      Ad.prototype.getMinSuggestedDuration = function() { return -2; };
      Ad.prototype.getSkipTimeOffset = function() { return 0; };
      Ad.prototype.getSurveyUrl = function() { return null; };
      Ad.prototype.getTitle = function() { return ""; };
      Ad.prototype.getTraffickingParameters = function() { return {}; };
      Ad.prototype.getTraffickingParametersString = function() { return ""; };
      Ad.prototype.getUiElements = function() { return [""]; };
      Ad.prototype.getUniversalAdIdRegistry = function() { return "unknown"; };
      Ad.prototype.getUniversalAdIds = function() { return []; };
      Ad.prototype.getUniversalAdIdValue = function() { return "unknown"; };
      Ad.prototype.getVastMediaBitrate = function() { return 0; };
      Ad.prototype.getVastMediaHeight = function() { return 0; };
      Ad.prototype.getVastMediaWidth = function() { return 0; };
      Ad.prototype.getWidth = function() { return 0; };
      Ad.prototype.getWrapperAdIds = function() { return [""]; };
      Ad.prototype.getWrapperAdSystems = function() { return [""]; };
      Ad.prototype.getWrapperCreativeIds = function() { return [""]; };
      Ad.prototype.isLinear = function() { return true; };
      Ad.prototype.isSkippable = function() { return true; };

      var currentAd = new Ad();

      function AdEvent(type) {
        this.type = type;
      }
      AdEvent.prototype.getAd = function() { return currentAd; };
      AdEvent.prototype.getAdData = function() { return {}; };
      AdEvent.Type = {
        AD_BREAK_READY: "adBreakReady",
        AD_BUFFERING: "adBuffering",
        AD_CAN_PLAY: "adCanPlay",
        AD_METADATA: "adMetadata",
        AD_PROGRESS: "adProgress",
        ALL_ADS_COMPLETED: "allAdsCompleted",
        CLICK: "click",
        COMPLETE: "complete",
        CONTENT_PAUSE_REQUESTED: "contentPauseRequested",
        CONTENT_RESUME_REQUESTED: "contentResumeRequested",
        DURATION_CHANGE: "durationChange",
        EXPANDED_CHANGED: "expandedChanged",
        FIRST_QUARTILE: "firstQuartile",
        IMPRESSION: "impression",
        INTERACTION: "interaction",
        LINEAR_CHANGE: "linearChange",
        LINEAR_CHANGED: "linearChanged",
        LOADED: "loaded",
        LOG: "log",
        MIDPOINT: "midpoint",
        PAUSED: "pause",
        RESUMED: "resume",
        SKIPPABLE_STATE_CHANGED: "skippableStateChanged",
        SKIPPED: "skip",
        STARTED: "start",
        THIRD_QUARTILE: "thirdQuartile",
        USER_CLOSE: "userClose",
        VIDEO_CLICKED: "videoClicked",
        VIDEO_ICON_CLICKED: "videoIconClicked",
        VIEWABLE_IMPRESSION: "viewable_impression",
        VOLUME_CHANGED: "volumeChange",
        VOLUME_MUTED: "mute"
      };

      var manager = new AdsManager();

      function AdsManagerLoadedEvent(type, request, context) {
        this.type = type;
        this.adsRequest = request;
        this.userRequestContext = context;
      }
      AdsManagerLoadedEvent.prototype.getAdsManager = function(c, settings) {
        if (settings && settings.enablePreloading) {
          manager._enablePreloading = true;
        }
        return manager;
      };
      AdsManagerLoadedEvent.prototype.getUserRequestContext = function() {
        return this.userRequestContext || {};
      };
      AdsManagerLoadedEvent.Type = {
        ADS_MANAGER_LOADED: "adsManagerLoaded"
      };

      function AdError(type, code, vast, message, request, context) {
        this.errorCode = code;
        this.message = message;
        this.type = type;
        this.adsRequest = request;
        this.userRequestContext = context;
        this.vastErrorCode = vast;
      }
      AdError.prototype.getErrorCode = function() { return this.errorCode; };
      AdError.prototype.getInnerError = function() { return null; };
      AdError.prototype.getMessage = function() { return this.message; };
      AdError.prototype.getType = function() { return this.type; };
      AdError.prototype.getVastErrorCode = function() { return this.vastErrorCode; };

      function AdErrorEvent(error) {
        this.type = "adError";
        this.error = error;
      }
      AdErrorEvent.prototype.getError = function() { return this.error; };
      AdErrorEvent.prototype.getUserRequestContext = function() {
        return this.error ? this.error.userRequestContext : {};
      };
      AdErrorEvent.Type = { AD_ERROR: "adError" };

      Object.assign(ima, {
        AdDisplayContainer: AdDisplayContainer,
        AdError: AdError,
        AdErrorEvent: AdErrorEvent,
        AdEvent: AdEvent,
        AdPodInfo: AdPodInfo,
        AdsLoader: AdsLoader,
        AdsManager: manager,
        AdsManagerLoadedEvent: AdsManagerLoadedEvent,
        AdsRenderingSettings: AdsRenderingSettings,
        AdsRequest: AdsRequest,
        ImaSdkSettings: ImaSdkSettings,
        settings: new ImaSdkSettings(),
        VERSION: VERSION,
        ViewMode: { FULLSCREEN: "fullscreen", NORMAL: "normal" }
      });

      window.google = window.google || {};
      window.google.ima = ima;
    }
  } catch(e) {}

  // 4. uBlock Origin Google AdSense Shim (Fills placeholders cleanly with 0 ads)
  try {
    window.adsbygoogle = window.adsbygoogle || {
      loaded: true,
      push: function() {}
    };
  } catch(e) {}

  // 5. uBlock Origin Google Publisher Tag (GPT) Shim (Doubleclick/DFP)
  try {
    var noop = function() {};
    var noopThis = function() { return this; };
    var noopNull = function() { return null; };
    var noopArray = function() { return []; };
    var noopStr = function() { return ''; };

    var pubAdsService = {
      addEventListener: noopThis,
      clear: noop,
      clearCategoryExclusions: noopThis,
      clearTagForChildDirectedTreatment: noopThis,
      clearTargeting: noopThis,
      collapseEmptyDivs: noop,
      defineOutOfPagePassback: function() { return {}; },
      definePassback: function() { return {}; },
      disableInitialLoad: noop,
      display: noop,
      enableAsyncRendering: noop,
      enableLazyLoad: noop,
      enableSingleRequest: noop,
      enableSyncRendering: noop,
      enableVideoAds: noop,
      get: noopNull,
      getAttributeKeys: noopArray,
      getTargeting: noopArray,
      getTargetingKeys: noopArray,
      getSlots: noopArray,
      refresh: noop,
      removeEventListener: noop,
      set: noopThis,
      setCategoryExclusion: noopThis,
      setCentering: noop,
      setCookieOptions: noopThis,
      setForceSafeFrame: noopThis,
      setLocation: noopThis,
      setPublisherProvidedId: noopThis,
      setPrivacySettings: noopThis,
      setRequestNonPersonalizedAds: noopThis,
      setSafeFrameConfig: noopThis,
      setTagForChildDirectedTreatment: noopThis,
      setTargeting: noopThis,
      setVideoContent: noopThis,
      updateCorrelator: noop
    };

    var gpt = window.googletag || {};
    var cmd = gpt.cmd || [];
    gpt.apiReady = true;
    gpt.cmd = [];
    gpt.cmd.push = function(fn) {
      try { fn(); } catch(e) {}
      return 1;
    };
    gpt.companionAds = function() { return { addEventListener: noopThis, enableSyncLoading: noop, setRefreshUnfilledSlots: noop }; };
    gpt.content = function() { return { addEventListener: noopThis, setContent: noop }; };
    gpt.defineOutOfPageSlot = function() { return { addService: noopThis, setTargeting: noopThis }; };
    gpt.defineSlot = function() { return { addService: noopThis, setTargeting: noopThis }; };
    gpt.destroySlots = noop;
    gpt.disablePublisherConsole = noop;
    gpt.display = noop;
    gpt.enableServices = noop;
    gpt.getVersion = noopStr;
    gpt.pubads = function() { return pubAdsService; };
    gpt.pubadsReady = true;
    gpt.setAdIframeTitle = noop;
    gpt.sizeMapping = function() { return { addSize: noopThis, build: noopNull }; };
    window.googletag = gpt;
    while (cmd.length > 0) {
      gpt.cmd.push(cmd.shift());
    }
  } catch(e) {}

  // 6. Safe CSS for Collapsing Ad Placeholders (Never touches game canvas or overlay)
  function injectSafeAdHider() {
    if (document.getElementById('gameloot-ad-hider')) return;
    var style = document.createElement('style');
    style.id = 'gameloot-ad-hider';
    style.textContent = [
      'ins.adsbygoogle,',
      '.adsbygoogle,',
      'iframe[src*="googleads"],',
      'iframe[src*="doubleclick"],',
      'iframe[src*="googlesyndication"],',
      'iframe[id^="aswift_"],',
      'div[id^="aswift_"],',
      'iframe[id^="google_ads_iframe"],',
      'div[id^="google_ads_iframe"],',
      '.google-auto-placed {',
      '  display: none !important;',
      '  height: 0 !important;',
      '  min-height: 0 !important;',
      '  max-height: 0 !important;',
      '  overflow: hidden !important;',
      '  pointer-events: none !important;',
      '  opacity: 0 !important;',
      '}'
    ].join(' ');
    (document.head || document.documentElement).appendChild(style);
  }

  if (document.head || document.documentElement) {
    injectSafeAdHider();
  } else {
    document.addEventListener('DOMContentLoaded', injectSafeAdHider);
  }
})();
true;
`;

export default function GamePlayerModal({
  visible,
  game,
  token,
  onClose,
  onRewardClaimed
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [pingCountdown, setPingCountdown] = useState(45);
  const [claimablePoints, setClaimablePoints] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  const timerRef = useRef(null);

  // Initialize session when modal opens
  useEffect(() => {
    if (!visible || !game) {
      setSession(null);
      setSessionSeconds(0);
      setClaimablePoints(0);
      setClaimResult(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let active = true;

    async function initSession() {
      try {
        setLoading(true);

        logEvent('game_player_open', {
          game_id: game.id,
          game_title: game.title,
          category: game.category_name,
          app: 'gameloot'
        });

        const data = await startPlaySession(token, game.id);
        if (active) {
          const sToken =
            data?.session?.session_token ||
            data?.session?.session_id ||
            data?.session_token ||
            data?.session_id ||
            ('gses_' + Date.now().toString(36));

          const pingInterval =
            data?.session?.ping_interval_seconds ||
            data?.ping_interval_seconds ||
            45;

          const sessionObj = {
            session_id: sToken,
            session_token: sToken,
            ping_interval_seconds: Number(pingInterval) || 45
          };
          setSession(sessionObj);
          setPingCountdown(sessionObj.ping_interval_seconds);
        }
      } catch (err) {
        console.warn('Could not start play session:', err?.message || err);
        // Fallback session so player is never blocked from playing
        if (active) {
          const fallbackObj = {
            session_id: 'gses_' + Date.now(),
            session_token: 'gses_' + Date.now(),
            ping_interval_seconds: 45
          };
          setSession(fallbackObj);
          setPingCountdown(45);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initSession();

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, game, token]);

  // Proof-of-play heartbeat ticker
  useEffect(() => {
    if (!visible || !session) return;

    timerRef.current = setInterval(async () => {
      setSessionSeconds(prev => prev + 1);

      setPingCountdown(prev => {
        if (prev <= 1) {
          // Send proof of play ping to backend
          sendPing();
          return (session?.ping_interval_seconds) || 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, session]);

  const sendPing = async () => {
    if (!session || !token) return;
    try {
      const pingHash = 'ping_' + Date.now();
      const sId = session.session_id || session.session_token;
      const res = await pingPlaySession(token, sId, pingHash);
      if (res?.success) {
        setClaimablePoints(res.current_reward || res.current_points_earned || (claimablePoints + 1));
      }
    } catch (err) {
      console.warn('Ping failed:', err?.message || err);
    }
  };

  const handleClaimAndExit = async () => {
    if (!session || !token) {
      logEvent('game_player_exit', {
        game_id: game?.id,
        seconds_played: sessionSeconds,
        claimable_points: claimablePoints,
        app: 'gameloot'
      });
      onClose();
      return;
    }

    try {
      setIsClaiming(true);
      const sId = session.session_id || session.session_token;
      const res = await claimPlaySession(token, sId);
      const earned = res?.reward_earned !== undefined ? res.reward_earned : (res?.points_earned || 0);

      logEvent('game_reward_claim', {
        game_id: game.id,
        reward_earned: earned,
        seconds_played: sessionSeconds,
        app: 'gameloot'
      });

      if (res?.success && earned > 0) {
        setClaimResult({ ...res, reward_earned: earned });
        if (onRewardClaimed) {
          onRewardClaimed({
            points: earned,
            newBalance: res.new_balance,
            gameTitle: game.title
          });
        }
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('Claim error:', err?.message || err);
      onClose();
    } finally {
      setIsClaiming(false);
    }
  };

  if (!visible || !game) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={handleClaimAndExit}
    >
      <View style={styles.container}>
        {/* Floating Top Game HUD Bar */}
        <SafeAreaView style={styles.hudBar} edges={['top', 'left', 'right']}>
          <View style={styles.hudLeft}>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {game.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.ratePill}>
                <Sparkles size={11} color="#06b6d4" />
                <Text style={styles.ratePillText}>{game.reward_rate || 1} PTS / MIN</Text>
              </View>
              <View style={styles.timerPill}>
                <Clock size={11} color="#94a3b8" />
                <Text style={styles.timerPillText}>
                  {Math.floor(sessionSeconds / 60)}:{(sessionSeconds % 60).toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.shieldPill}>
                <Shield size={10} color="#10b981" />
                <Text style={styles.shieldPillText}>Ad-Free</Text>
              </View>
            </View>
          </View>

          {/* Points earned counter + Claim / Exit */}
          <View style={styles.hudRight}>
            <View style={styles.earnedPill}>
              <Text style={styles.earnedLabel}>PTS EARNED</Text>
              <Text style={styles.earnedValue}>+{claimablePoints}</Text>
            </View>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleClaimAndExit}
              activeOpacity={0.8}
              disabled={isClaiming}
            >
              <X size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Game WebView Container */}
        <View style={styles.webContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text style={styles.loadingText}>Initializing {game.title}...</Text>
              <Text style={styles.loadingSub}>Loading ad-free instant game canvas</Text>
            </View>
          ) : (
            <WebView
              source={{ uri: game.embed_url }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="always"
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              javaScriptCanOpenWindowsAutomatically={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              androidHardwareAccelerationDisabled={false}
              androidLayerType="hardware"
              scalesPageToFit={true}
              startInLoadingState={true}
              injectedJavaScriptBeforeContentLoaded={GAME_WEBVIEW_INJECTED_JS}
              injectedJavaScript={GAME_WEBVIEW_INJECTED_JS}
              renderLoading={() => (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#06b6d4" />
                  <Text style={styles.loadingText}>Loading game canvas...</Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Claim Success Celebration Overlay */}
        {claimResult ? (
          <View style={styles.claimOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={onClose}
            />
            <View style={styles.claimCard}>
              <LinearGradient
                colors={['#06b6d4', '#3b82f6']}
                style={styles.claimIconCircle}
              >
                <Trophy size={32} color="#ffffff" />
              </LinearGradient>

              <Text style={styles.claimTitle}>Points Claimed!</Text>
              <Text style={styles.claimSubtitle}>
                You earned rewards playing {game.title}.
              </Text>

              <View style={styles.rewardBox}>
                <Sparkles size={20} color="#f59e0b" />
                <Text style={styles.rewardText}>+{claimResult.reward_earned} PTS</Text>
                <Text style={styles.rewardUsd}>
                  (≈ ${(claimResult.reward_earned * 0.001).toFixed(3)} USD)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  hudBar: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hudLeft: {
    flex: 1,
    marginRight: 10
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  ratePillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06b6d4'
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  timerPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8'
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  shieldPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981'
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  earnedPill: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  earnedLabel: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: '700'
  },
  earnedValue: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800'
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center'
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#000000'
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000'
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14
  },
  loadingSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4
  },
  claimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  claimCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  claimIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  claimTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3
  },
  claimSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 20
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24'
  },
  rewardUsd: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1'
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
