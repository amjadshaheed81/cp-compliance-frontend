import React from 'react';
import GoogleMapReact from 'google-map-react';
import logo from "../../../../images/logo-red.png";

const AnyReactComponent = ({ text }) => <div><img src={logo} height={25}/></div>;

const GoogleMap = ({ lat, long, postCode }) => {
  const defaultCenter = { lat: lat, lng: long };
  const defaultZoom = 11; // Default zoom level

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo' }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      >
        <AnyReactComponent
          lat={lat}
          lng={long}
          text={postCode}
        />
      </GoogleMapReact>
    </div>
  );
};

export default GoogleMap;
