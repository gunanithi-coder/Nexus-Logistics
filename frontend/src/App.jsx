import React, { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, PlayCircle, Database, Map as MapIcon, PlusSquare, LayoutDashboard } from 'lucide-react';
import L from 'leaflet';

// ⚠️ YOUR BACKEND URL
const API_URL = 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev';

// --- ICONS & MAP ASSETS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
  iconSize: [40, 40],
  className: 'animate-bounce-slow'
});

// Helper for map zooming
function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'map', 'vault'

  // Data State
  const [route, setRoute] = useState(null);
  const [truckPos, setTruckPos] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [progress, setProgress] = useState(0);

  // 🌍 FETCH VAULT LOGS
  const fetchVaultLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/get_all_trips`);
      const data = await res.json();
      setAllTrips(data);
    } catch (err) {
      console.error("Backend Error", err);
    }
  };

  // 🌍 HANDLE ROUTE SEARCH
  const handleRouteSearch = async (fromCity, toCity) => {
    try {
      // Fetch coordinates (simulated for simplicity)
      const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fromCity}`);
      const data1 = await res1.json();
      const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${toCity}`);
      const data2 = await res2.json();

      if (data1.length > 0 && data2.length > 0) {
        const start = [parseFloat(data1[0].lat), parseFloat(data1[0].lon)];
        const end = [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
        
        setRoute({ start, end });
        setTruckPos(start);
      }
    } catch (error) {
      console.error("Map Error", error);
    }
  };

  // 🚚 TRUCK SIMULATION
  const startSimulation = () => {
    if (!route) return;
    let step = 0;
    const totalSteps = 100;
    const interval = setInterval(() => {
      step++;
      const lat = route.start[0] + (route.end[0] - route.start[0]) * (step / totalSteps);
      const lng = route.start[1] + (route.end[1] - route.start[1]) * (step / totalSteps);
      setTruckPos([lat, lng]);
      setProgress(step);
      if (step >= totalSteps) clearInterval(interval);
    }, 50);
  };

  // Refresh Vault when tab opens
  useEffect(() => {
    if (activeTab === 'vault') fetchVaultLogs();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      
      {/* 1. TOP NAVIGATION BAR */}
      <div className="bg-gray-900 border-b border-white/10 px-8 py-4 flex items-center justify-between shadow-2xl z-50">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="text-xl font-black tracking-widest italic">NEXUS LOGISTICS</h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-[0.2em]">NATIONAL GRID ACTIVE</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-[#FF6600] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <PlusSquare size={16} /> CREATE PASS
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'map' ? 'bg-[#FF6600] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <MapIcon size={16} /> LIVE MAP
          </button>
          <button 
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'vault' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <Database size={16} /> VAULT LOGS
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 p-6 overflow-hidden relative">
        
        {/* TAB 1: CREATE FORM */}
        {activeTab === 'create' && (
          <div className="flex justify-center items-center h-full animate-fade-in">
            <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <TripForm onRouteSearch={handleRouteSearch} />
            </div>
          </div>
        )}

        {/* TAB 2: LIVE MAP */}
        {activeTab === 'map' && (
          <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative animate-fade-in">
             {route ? (
                <>
                  <MapContainer center={route.start} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={route.start}><Popup>START</Popup></Marker>
                    <Marker position={route.end}><Popup>END</Popup></Marker>
                    <Polyline positions={[route.start, route.end]} color="#FF6600" />
                    {truckPos && <Marker position={truckPos} icon={truckIcon} />}
                    <MapUpdater bounds={[route.start, route.end]} />
                  </MapContainer>
                  
                  {/* Floating Controls */}
                  <div className="absolute bottom-8 left-8 z-[999]">
                    <button 
                      onClick={startSimulation}
                      className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg border border-green-400"
                    >
                      <PlayCircle size={20} /> START TRUCK SIMULATION
                    </button>
                  </div>
                </>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                   <MapIcon size={64} className="mb-4 opacity-20" />
                   <p>NO ACTIVE SHIPMENT. CREATE A PASS FIRST.</p>
                   <button onClick={() => setActiveTab('create')} className="mt-4 text-[#FF6600] underline">Go to Create Pass</button>
                </div>
             )}
          </div>
        )}

        {/* TAB 3: VAULT LOGS */}
        {activeTab === 'vault' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTrips.map((trip, idx) => (
                <div key={idx} className="bg-gray-900/80 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
                  <div>
                     <h3 className="text-xl font-bold text-[#FF6600]">{trip.vehicle_number}</h3>
                     <p className="text-white mt-1">{trip.driver_name}</p>
                     <p className="text-gray-500 text-xs mt-2 font-mono">{trip.route_from} ➝ {trip.route_to}</p>
                  </div>
                  <div className="text-right">
                     <div className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/30">
                        <ShieldCheck size={12} /> SECURE
                     </div>
                     <p className="text-gray-600 text-[10px] mt-2 font-mono">ID: {trip._id.slice(-6)}</p>
                  </div>
                </div>
              ))}
            </div>
            {allTrips.length === 0 && (
               <p className="text-center text-gray-500 mt-20">Database is empty or loading...</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;