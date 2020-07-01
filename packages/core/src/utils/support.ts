import { isFunction } from './unit';

export const IS_CLIENT = typeof window !== 'undefined';
export const UA = (IS_CLIENT && window.navigator.userAgent.toLowerCase());
export const IS_IOS = (UA && /iphone|ipad|ipod|ios/.test(UA));
export const IS_ANDROID = (UA && /android/.test(UA));
export const IS_MOBILE = (IS_IOS || IS_ANDROID);
export const IS_IPHONE = (IS_CLIENT && /(iPhone|iPod)/gi.test(navigator.platform));

export const ORIGIN = (window.location.protocol !== 'file:')
  ? `${window.location.protocol}//${window.location.hostname}`
  : undefined;

export type WebKitPresentationMode = 'picture-in-picture' | 'inline' | 'fullscreen';

/**
 * Checks if a video player can enter fullscreen.
 *
 * @see https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen
 */
export const canFullscreenVideo = (): boolean => {
  if (!IS_CLIENT) return false;
  const video = document.createElement('video');
  // @ts-ignore
  return isFunction(video.webkitEnterFullscreen);
};

/**
 * Reduced motion iOS & MacOS setting.
 *
 * @see https://webkit.org/blog/7551/responsive-design-for-motion/
 */
export const isReducedMotionPreferred = (): boolean => IS_CLIENT
  && 'matchMedia' in window
  && window.matchMedia('(prefers-reduced-motion)').matches;

/**
 * Checks if the native HTML5 video player can play HLS.
 */
export const canPlayHLSNatively = (): boolean => {
  if (!IS_CLIENT) return false;
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl').length > 0;
};

/**
 * Checks if the native HTML5 video player can enter picture-in-picture (PIP) mode when using
 * the Chrome browser.
 *
 * @see  https://developers.google.com/web/updates/2018/10/watch-video-using-picture-in-picture
 */
export const canUsePiPInChrome = (): boolean => {
  if (!IS_CLIENT) return false;
  const video = document.createElement('video');
  // @ts-ignore
  return !!document.pictureInPictureEnabled && !video.disablePictureInPicture;
};

/**
 * Checks if the native HTML5 video player can enter picture-in-picture (PIP) mode when using
 * the desktop Safari browser, iOS Safari appears to "support" PiP through the check, however PiP
 * does not function.
 *
 * @see https://developer.apple.com/documentation/webkitjs/adding_picture_in_picture_to_your_safari_media_controls
 */
export const canUsePiPInSafari = (): boolean => {
  if (!IS_CLIENT) return false;
  const video = document.createElement('video');
  // @ts-ignore
  return isFunction(video.webkitSupportsPresentationMode)
    // @ts-ignore
    && isFunction(video.webkitSetPresentationMode)
    && !IS_IPHONE;
};

// Checks if the native HTML5 video player can enter PIP.
export const canUsePiP = (): boolean => canUsePiPInChrome() || canUsePiPInSafari();

/**
 * To detect autoplay, we create a video element and call play on it, if it is `paused` after
 * a `play()` call, autoplay is supported. Although this unintuitive, it works across browsers
 * and is currently the lightest way to detect autoplay without using a data source.
 *
 * @see https://github.com/ampproject/amphtml/blob/9bc8756536956780e249d895f3e1001acdee0bc0/src/utils/video.js#L25
 */
export const canAutoplay = (muted = true, playsinline = true): Promise<boolean> => {
  if (!IS_CLIENT) return Promise.resolve(false);

  const video = document.createElement('video');

  if (muted) {
    video.setAttribute('muted', '');
    video.muted = true;
  }

  if (playsinline) {
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  video.setAttribute('height', '0');
  video.setAttribute('width', '0');

  video.style.position = 'fixed';
  video.style.top = '0';
  video.style.width = '0';
  video.style.height = '0';
  video.style.opacity = '0';

  // Promise wrapped this way to catch both sync throws and async rejections.
  // More info: https://github.com/tc39/proposal-promise-try
  new Promise((resolve) => resolve(video.play())).catch(() => {});

  return Promise.resolve(!video.paused);
};