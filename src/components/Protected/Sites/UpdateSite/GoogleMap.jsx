import React from 'react';
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

const GoogleMap = () => {
  const defaultCenter = { lat: 53.3769, lng: -2.90701 }; // Default center of the map (San Francisco)
  const defaultZoom = 11; // Default zoom level

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo' }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      >
        <AnyReactComponent
          lat={53.3769}
          lng={-2.90701}
          text="My Marker"
        />
      </GoogleMapReact>
    </div>
  );
};

export default GoogleMap;
