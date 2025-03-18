import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { isBrowserSupported } from './utils/browserCheck';
import UnsupportedBrowserModal from './UnsupportedBrowserModal';

const Root = () => {
  const [showModal, setShowModal] = React.useState(!isBrowserSupported());

  const handleProceed = () => {
    setShowModal(false);
  };

  return (
    <React.StrictMode>
      {showModal && <UnsupportedBrowserModal onProceed={handleProceed} />}
      <App />
    </React.StrictMode>
  );
};

ReactDOM.render(<Root />, document.getElementById('root'));

reportWebVitals();