import React from 'react';
import TripForm from './components/TripForm';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, ShieldCheck } from 'lucide-react';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full p-6">
      
      {/* 🚀 THE GLASS DASHBOARD CONTAINER */}
      <div className="flex flex-col md:flex-row w-full max-w-6xl bg-black/40 backdrop-blur-2xl rounded-[30px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* LEFT: FORM SECTION */}
        <div className="flex-1 p-10 flex flex-col justify-center border-r border-white/5">
          <div className="mb-8">
            <h1 className="text-4xl font-black italic tracking-tighter text-white">
              NEXUS <span className="text-[#FF6600]">GATEPASS</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-[#FF6600] text-black text-[10px] font-bold px-2 py-0.5 rounded">OFFICIAL</span>
              <p className="text-gray-400 text-xs font-mono uppercase tracking-widest flex items-center gap-1">
                <Zap size={12} className="text-[#FF6600]" /> National Logistics Grid
              </p>
            </div>
          </div>
          
          <TripForm />
          
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-gray-500 text-xs font-mono">
             <ShieldCheck size={14} className="text-green-500" />
             <span>ENCRYPTED CONNECTION ESTABLISHED</span>
          </div>
        </div>

        {/* RIGHT: MAP SECTION */}
        <div className="flex-1 relative min-h-[500px] bg-black/60">
           {/* Live Badge */}
           <div className="absolute top-6 right-6 z-[999] bg-green-500/20 backdrop-blur-md border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-green-400 text-xs font-bold tracking-wider">LIVE SATELLITE FEED</span>
           </div>

           {/* The Map */}
           <MapContainer center={[13.0827, 80.2707]} zoom={13} style={{ height: '100%', width: '100%' }}>
             <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
             />
             <Marker position={[13.0827, 80.2707]}>
               <Popup>HUB CHENNAI <br/> Active Gate</Popup>
             </Marker>
           </MapContainer>
        </div>

      </div>
    </div>
  );
}

export default App;