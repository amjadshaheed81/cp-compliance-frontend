import React from 'react';
import { getBrowserNameWithVersion }  from "js_utility_fns";


const UnsupportedBrowserModal = ({ onProceed }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        textAlign: 'center',
      }}>
        <h1>Unsupported Browser</h1>
        <p>You're using version {getBrowserNameWithVersion()?.[1]} of {getBrowserNameWithVersion()?.[0]}. which is not supported by Core CAFM.</p>
        <p>Your browser is outdated and may not support this application. For the best experience, please upgrade to a modern browser.</p>
        <p>Recommended browsers:</p>
        <ul>
          <li><a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://www.mozilla.org/firefox/new/" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://www.microsoft.com/edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          <li><a href="https://www.apple.com/safari/" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
        </ul>
        <button onClick={onProceed} style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}>
          Proceed Anyway
        </button>
      </div>
    </div>
  );
};

export default UnsupportedBrowserModal;