import React from 'react';
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

const GoogleMap = () => {
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // Default center of the map (San Francisco)
  const defaultZoom = 11; // Default zoom level

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo' }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      >
        <AnyReactComponent
          lat={51.50853000}
          lng={-0.12574000}
          text="My Marker"
        />
      </GoogleMapReact>
    </div>
  );
};

export default GoogleMap;
