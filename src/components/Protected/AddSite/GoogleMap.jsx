import React from 'react';
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

const GoogleMap = () => {
  const defaultCenter = { lat: 37.7749, lng: -122.4194 }; // Default center of the map (San Francisco)
  const defaultZoom = 11; // Default zoom level

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'YOUR_GOOGLE_MAPS_API_KEY' }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      >
        <AnyReactComponent
          lat={37.7749}
          lng={-122.4194}
          text="My Marker"
        />
      </GoogleMapReact>
    </div>
  );
};

export default GoogleMap;
