import React, { useState } from 'react';
import { createTrip } from '../api';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const TripForm = () => {
  const [qrImage, setQrImage] = useState(null);
  const [formData, setFormData] = useState({
    driver_name: '', vehicle_number: '', route_from: '', route_to: '',
    documents: [{ doc_name: "RC", expiry_date: "2030-01-01" }, { doc_name: "PUC", expiry_date: "2025-12-30" }]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/.test(formData.vehicle_number)) {
      alert("Invalid Indian Vehicle Number! Use format: TN 01 AB 1234");
      return;
    }
    try {
      const img = await createTrip(formData);
      setQrImage(img);
    } catch (err) { alert("Backend Error! Is the backend running?"); }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl max-w-md w-full">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ShieldCheck /> GatePass Generator</h2>
      
      {!qrImage ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full p-3 bg-white/5 rounded-lg border border-white/10 text-white" placeholder="Driver Name" onChange={e => setFormData({...formData, driver_name: e.target.value})} required />
          <input className="w-full p-3 bg-white/5 rounded-lg border border-white/10 text-white" placeholder="Vehicle (TN-01-AB-1234)" onChange={e => setFormData({...formData, vehicle_number: e.target.value})} required />
          <div className="flex gap-2">
            <input className="w-full p-3 bg-white/5 rounded-lg border border-white/10 text-white" placeholder="From" onChange={e => setFormData({...formData, route_from: e.target.value})} required />
            <input className="w-full p-3 bg-white/5 rounded-lg border border-white/10 text-white" placeholder="To" onChange={e => setFormData({...formData, route_to: e.target.value})} required />
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full py-3 bg-[#FF6600] text-white font-bold rounded-lg shadow-lg">
            GENERATE SECURE QR
          </motion.button>
        </form>
      ) : (
        <div className="text-center">
          <img src={qrImage} className="w-64 h-64 mx-auto border-4 border-white rounded-lg" />
          <p className="text-green-400 mt-4 font-mono font-bold">✨ SECURE TOKEN GENERATED</p>
          <button onClick={() => setQrImage(null)} className="text-white underline mt-4">Create Another</button>
        </div>
      )}
    </div>
  );
};
export default TripForm;