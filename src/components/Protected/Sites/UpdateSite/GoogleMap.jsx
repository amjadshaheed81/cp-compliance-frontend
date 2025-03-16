import React, { Fragment, useEffect, useState } from "react";
import GoogleMapReact from "google-map-react";
import logo from "../../../../images/logo-red.png";

const AnyReactComponent = ({ text }) => 
  {
    const license = JSON.parse(localStorage.getItem('license'));
    
    return (
  <div>
    <img src={license?.logo} height={25} />
  </div>
)};

const GoogleMap = ({ lat, long, postCode, streetViewURL }) => {
  const [defaultCenter, setdefaultCenter] = useState({
    lat: lat || "",
    lng: long || "",
  });
  const defaultZoom = 11; // Default zoom level
  useEffect(() => {
    if (streetViewURL) {
      const data = getLatLong(streetViewURL);
      setdefaultCenter({ lat: data?.latitude, lng: data?.longitude });
    }
  }, [streetViewURL]);
  useEffect(() => {
    if (lat && long) {
      setdefaultCenter({ lat: lat, lng: long });
    }
  }, [lat, long]);

  const getLatLong = (url) => {
    const match = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    return match
      ? { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) }
      : null;
  };

  return (
    <Fragment>
      {defaultCenter.lat && defaultCenter.lng && (
        <div style={{ height: "400px", width: "100%" }}>
          <GoogleMapReact
            bootstrapURLKeys={{
              key: "AIzaSyCszO_QrjGQ_w8ouOXQinr5yvVasIOqHoo",
            }}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
          >
            <AnyReactComponent
              lat={defaultCenter.lat}
              lng={defaultCenter.lng}
              text={postCode}
            />
          </GoogleMapReact>
        </div>
      )}
    </Fragment>
  );
};

export default GoogleMap;
