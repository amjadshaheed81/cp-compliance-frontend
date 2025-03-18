import bowser from 'bowser';

export const isBrowserSupported = () => {
  const browser = bowser.getParser(window.navigator.userAgent);
  return browser.satisfies({
    chrome: '>90',
    firefox: '>60',
    edge: '>15',
    safari: '>10',
  });
};