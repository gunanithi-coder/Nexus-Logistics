import React from 'react';
import TripForm from './components/TripForm';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col md:flex-row p-6 gap-6">
      <div className="flex-1">
        <h1 className="text-4xl font-black italic mb-2">NEXUS <span className="text-[#FF6600]">GATEPASS</span></h1>
        <p className="text-gray-400 mb-8">National Logistics Verification System</p>
        <TripForm />
      </div>
      
      <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-[500px] relative">
         <div className="absolute top-4 right-4 z-[999] bg-green-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">LIVE TRACKING ACTIVE</div>
         <MapContainer center={[13.0827, 80.2707]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[13.0827, 80.2707]}><Popup>Hub Chennai</Popup></Marker>
         </MapContainer>
      </div>
    </div>
  );
}
export default App;