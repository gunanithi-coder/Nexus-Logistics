import React, { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, PlayCircle } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🚚 TRUCK ICON (For Animation)
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // Simple Truck Icon
  iconSize: [40, 40],
  className: 'animate-bounce-slow'
});

// ✅ CHECKPOINT PASSED ICON (Green Tick)
const checkIcon = new L.DivIcon({
  html: '<div style="background: #22c55e; width: 15px; height: 15px; border-radius: 50%; box-shadow: 0 0 10px #22c55e; border: 2px solid white;"></div>',
  className: 'custom-div-icon'
});

// ⏳ CHECKPOINT PENDING ICON (Gray Dot)
const pendingIcon = new L.DivIcon({
  html: '<div style="background: #6b7280; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  className: 'custom-div-icon'
});

// 🚁 COMPONENT: FLIES THE MAP TO THE NEW ROUTE
function MapUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

function App() {
  const [route, setRoute] = useState(null); // Stores start & end coordinates
  const [truckPos, setTruckPos] = useState(null); // 🚚 Live Truck Position
  const [checkpoints, setCheckpoints] = useState([]); // 📍 Checkpoints
  const [progress, setProgress] = useState(0); // 0 to 100%

  // 🌍 FUNCTION: FETCH COORDINATES & GENERATE CHECKPOINTS
  const handleRouteSearch = async (fromCity, toCity) => {
    try {
      // Fetch "From" City
      const res1 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fromCity}`);
      const data1 = await res1.json();

      // Fetch "To" City
      const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${toCity}`);
      const data2 = await res2.json();

      if (data1.length > 0 && data2.length > 0) {
        const start = [parseFloat(data1[0].lat), parseFloat(data1[0].lon)];
        const end = [parseFloat(data2[0].lat), parseFloat(data2[0].lon)];
        
        // Generate 2 Fake "Checkpoints" along the line (at 33% and 66%)
        const mid1 = [(start[0]*2 + end[0])/3, (start[1]*2 + end[1])/3];
        const mid2 = [(start[0] + end[0]*2)/3, (start[1] + end[1]*2)/3];

        setRoute({ start, end });
        setTruckPos(start); // Start truck at beginning
        setCheckpoints([
          { pos: mid1, status: 'pending', name: 'Toll Plaza A' },
          { pos: mid2, status: 'pending', name: 'Police Checkpost B' }
        ]);
        setProgress(0);
      }
    } catch (error) {
      console.error("Map Error:", error);
    }
  };

  // 🎮 SIMULATE JOURNEY (Animation)
  const startSimulation = () => {
    if (!route) return;
    let step = 0;
    const totalSteps = 100;
    
    const interval = setInterval(() => {
      step++;
      // Calculate truck position based on percentage
      const lat = route.start[0] + (route.end[0] - route.start[0]) * (step / totalSteps);
      const lng = route.start[1] + (route.end[1] - route.start[1]) * (step / totalSteps);
      
      setTruckPos([lat, lng]);
      setProgress(step);

      // Check if we passed checkpoints
      setCheckpoints(prev => prev.map(cp => {
        // Simple logic: if truck passed this lat/lng (approx distance), mark green
        const dist = Math.sqrt(Math.pow(lat - cp.pos[0], 2) + Math.pow(lng - cp.pos[1], 2));
        return dist < 0.5 ? { ...cp, status: 'cleared' } : cp;
      }));

      if (step >= totalSteps) clearInterval(interval);
    }, 50); // Speed of animation (lower is faster)
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-6 bg-black">
      
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-black/40 backdrop-blur-2xl rounded-[30px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* LEFT: FORM SECTION */}
        <div className="flex-1 p-10 flex flex-col justify-center border-r border-white/5 relative">
          {/* We pass the 'handleRouteSearch' function down to the form */}
          <TripForm onRouteSearch={handleRouteSearch} />
          
          {/* SIMULATION BUTTON (Only appears when route is ready) */}
          {route && (
            <button 
              onClick={startSimulation}
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-green-400 font-bold transition-all"
            >
              <PlayCircle size={20} /> START TRACKING SIMULATION 🚚
            </button>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-gray-500 text-xs font-mono">
             <ShieldCheck size={14} className="text-green-500" />
             <span>ENCRYPTED CONNECTION ESTABLISHED</span>
          </div>
        </div>

        {/* RIGHT: MAP SECTION */}
        <div className="flex-1 relative min-h-[600px] bg-black/60">
           {/* Live Badge */}
           <div className="absolute top-6 right-6 z-[999] bg-green-500/20 backdrop-blur-md border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-green-400 text-xs font-bold tracking-wider">
               LIVE FEED: {progress}% COMPLETED
             </span>
           </div>

           <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
             <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
             />
             
             {/* 📍 DRAW THE ROUTE IF IT EXISTS */}
             {route && (
               <>
                 <Marker position={route.start}>
                   <Popup>STARTING POINT</Popup>
                 </Marker>
                 <Marker position={route.end}>
                   <Popup>DESTINATION</Popup>
                 </Marker>
                 
                 {/* The Red Logistics Line */}
                 <Polyline positions={[route.start, route.end]} color="#FF6600" weight={6} dashArray="10, 15" opacity={0.8} />
                 
                 {/* Checkpoints along the road */}
                 {checkpoints.map((cp, idx) => (
                   <Marker 
                     key={idx} 
                     position={cp.pos} 
                     icon={cp.status === 'cleared' ? checkIcon : pendingIcon}
                   >
                     <Popup>{cp.name}: {cp.status === 'cleared' ? "✅ PASSED" : "⏳ PENDING"}</Popup>
                   </Marker>
                 ))}

                 {/* 🚚 The Moving Truck */}
                 {truckPos && <Marker position={truckPos} icon={truckIcon} zIndexOffset={1000} />}
                 
                 {/* Auto-Zoom to fit the route */}
                 <MapUpdater bounds={[route.start, route.end]} />
               </>
             )}
             
             {/* Default View */}
             {!route && <Marker position={[13.0827, 80.2707]}><Popup>HUB CHENNAI</Popup></Marker>}
           </MapContainer>
        </div>

      </div>
    </div>
  );
}

export default App;