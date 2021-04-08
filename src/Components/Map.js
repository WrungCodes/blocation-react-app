import React, { Component } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default class Map extends Component {
    position = [51.505, -0.09];

    render() {
        return (<MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[51.505, -0.09]}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
            </Marker>
        </MapContainer>
        )
    }
}

//  function MapLayout({blocations, currentPosition, zoom})
//  {   
//     return (
//         blocations ?
//             <Map 
//                 center={[currentPosition.lat, currentPosition.lng]} 
//                 zoom={zoom} 
//                 style={{ width: '100%', height: '900px'}}
//             >
//             <TileLayer
//                 attribution='&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             />
//             </Map>
//             :
//             'Data is loading...'
//     )
//  }

//  export default Map;