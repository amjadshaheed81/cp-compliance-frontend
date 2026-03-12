import bowser from 'bowser';

export const isBrowserSupported = () => {
  const browser = bowser.getParser(window.navigator.userAgent);
  return browser.satisfies({
    chrome: '>=100',
    firefox: '>=100',
    edge: '>=100',
    safari: '>=15',
  });
};