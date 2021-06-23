import './App.css';
import Web3 from 'web3';
import Blocation from './Blocation.json'
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function App() {
  const [address, setAddress] = useState('');
  const [contract, setContract] = useState({});

  const [symbol, setSymbol] = useState('');
  const [blocation_count, setBlocationCount] = useState(0);
  const [blocation_ids_list, setBlocationList] = useState([]);
  const [locations, setLocations] = useState([]);

  const [tag, setTag] = useState('')
  const [longitude, setLongitude] = useState(0.0)
  const [latitude, setLatitude] = useState(0.0)
  const [center, setCenter] = useState([0, 0])

  const [success, setSuccess] = useState(false)
  const [isLoading, setLoading] = useState(true)
  const [isLocationLoading, setLocationLoading] = useState(true)

  const inputRef = useRef();
  const mapRef = useRef();

  const loadBlockchainData = async () => {
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545')

    // const network = await web3.eth.net.getNetworkType()
    const networkID = await web3.eth.net.getId()
    const networkData = Blocation.networks[networkID]

    const abi = Blocation.abi
    const contract_address = networkData.address

    const accounts = await window.ethereum.send('eth_requestAccounts');
    setAddress(accounts.result[0]);

    const contract = new web3.eth.Contract(abi, contract_address);
    setContract(contract)

    const symbol = await contract.methods.symbol().call()
    setSymbol(symbol)

    await loadBlocationBalance(contract, accounts.result[0])

    await loadData(contract, accounts.result[0])

    await getLocation()

  }

  const loadBlocationIds = async (contract, address) => {
    const list = await contract.methods.blocationsOfOwner().call({
      from: address
    })
    return list
  }

  const loadBlocationBalance = async (contract, address) => {
    const balance = await contract.methods.balanceOf(address).call()
    setBlocationCount(balance)
    return balance
  }

  const getBlocation = async (contract, address, id) => {
    return await contract.methods.getBlocation(id).call({
      from: address
    })
  }

  const convertIdsToObject = async (contract, address, id) => {
    var location_string = await getBlocation(contract, address, id)
    var location_array = location_string.split("|")
    return {
      id: id,
      name: location_array[0],
      location: {
        lat: parseFloat(location_array[2]),
        lng: parseFloat(location_array[1])
      }
    }
  }

  const loadData = async (contract, address) => {
    setLocationLoading(true)
    const ids = await loadBlocationIds(contract, address)
    setBlocationList(ids)

    var blocations = []

    for (let index = 0; index < ids.length; index++) {
      var obj = await convertIdsToObject(contract, address, ids[index])
      blocations.push(obj)
    }

    setLocations(blocations.reverse())
    setLocationLoading(false)
  }

  const load = async () => {
    loadBlockchainData()
  }

  useEffect(() => { load() }, []);

  useEffect(() => { }, [inputRef]);
  useEffect(() => { }, [mapRef]);

  const mintBlocation = async (tag) => {
    await getLocation()
    if (success) {
      await contract.methods.createBlocation(tag, longitude, latitude).send({ from: address })
        .then((e) => {
          loadBlocationBalance(contract, address);
          loadData(contract, address);

          // setLatitude(0)
          // setLongitude(0)
          setTag('')
          setSuccess(false)
        })
    } else {
      alert('your location is turned off');
    }
  }

  const getLocation = async () => {
    setLoading(true)
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
    } else {
      navigator.geolocation.getCurrentPosition((position) => {
        setSuccess(true);
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setCenter([position.coords.latitude, position.coords.longitude]);
        setLoading(false)

      }, (error) => {
        handleLocationError(error)
      });
    }
    return [latitude, longitude]
  }

  const handleLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        alert("User denied the request for Geolocation.")
        break;
      case error.POSITION_UNAVAILABLE:
        alert("Location information is unavailable.")
        break;
      case error.TIMEOUT:
        alert("The request to get user location timed out.")
        break;
      case error.UNKNOWN_ERROR:
        alert("An unknown error occurred.")
        break;
      default:
        alert('Unable to retrieve your location');
    }
  }

  useEffect(() => {
  }, [center])

  const placeCenter = (lat, lng) => {
    setCenter([lat, lng])
  }

  return (
    <div >
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <a class="navbar-brand" >Blocation</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav mr-auto">
          </ul>
          <span class="navbar-text">
            Address: <b>{address}</b>  Blocation count: <b>{blocation_count} {symbol}</b>
          </span>
        </div>
      </nav>

      <div className="container">
        {/* <div className="">
          <form >
            <input
              type="text"
              ref={inputRef}
              value={tag}
              onChange={e => setTag(e.target.value)}
            />
            <input type="submit" value="Save Location" />
          </form>
        </div> */}
        <form class="form-inline mt-4 mb-3" onSubmit={(event) => {
          event.preventDefault();
          mintBlocation(tag);
        }}>
          <div class="form-group mx-sm-3 mb-2">
            <label for="taginput" class="sr-only">Tag</label>
            <input type="text" class="form-control" id="taginput" placeholder="tag.."
              ref={inputRef}
              value={tag}
              onChange={e => setTag(e.target.value)} />
          </div>
          <button type="submit" class="btn btn-primary mb-2">Save Current Location</button>
        </form>
        {
          isLoading | isLocationLoading ? 'Loading' :
            <MapContainer refs={mapRef} center={center} zoom={25} scrollWheelZoom={false} >
              <ChangeView center={center} zoom={25} />
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker key={0} position={[latitude, longitude]}>
                <Tooltip permanent>
                  <span>Current Location</span>
                </Tooltip>
              </Marker>

              {
                locations.map(blocation => {
                  return (
                    typeof blocation.location.lat == "number" && !Number.isNaN(blocation.location.lat) &&
                      typeof blocation.location.lng == "number" && !Number.isNaN(blocation.location.lng)
                      ?
                      <Marker key={blocation.id} position={[blocation.location.lat, blocation.location.lng]} draggable={false} opacity={0.25} >
                        <Tooltip permanent>
                          <span>{blocation.name}</span>
                        </Tooltip>
                      </Marker>
                      : null
                  )
                })
              }
            </MapContainer>
        }
        <br />
        <div class="card-columns">
          {
            locations.map(blocation => {
              return (
                typeof blocation.location.lat == "number" && !Number.isNaN(blocation.location.lat) &&
                  typeof blocation.location.lng == "number" && !Number.isNaN(blocation.location.lng)
                  ?
                  <div id={blocation.id} class="card" styles="width:7rem;">
                    <div class="card-body">
                      <h5 class="card-title">{blocation.name}</h5>
                      {/* <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p> */}
                      <button
                        class="btn btn-primary ml-1"
                        onClick={(event) => {
                          event.preventDefault();
                          placeCenter(blocation.location.lat, blocation.location.lng)
                        }}
                      >Go</button>
                      <button class="btn btn-primary ml-1">Send</button>
                      <button class="btn btn-primary ml-1">burn</button>
                    </div>
                  </div>
                  : null
              )
            })
          }
        </div>
      </div>
    </div>
  );
}
export default App;
