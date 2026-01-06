import React, { useState } from 'react';
import { createTrip } from '../api';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, MapPin, Zap } from 'lucide-react';

const TripForm = () => {
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    driver_name: '',
    vehicle_number: '',
    route_from: '',
    route_to: '',
    documents: [
      { doc_name: "RC", expiry_date: "2030-01-01" },
      { doc_name: "PUC", expiry_date: "2026-12-30" }
    ]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const vehicleRegex = /^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/;
    if (!vehicleRegex.test(formData.vehicle_number.toUpperCase())) {
      alert("⛔ Invalid Format! Use: TN-01-AB-1234");
      setLoading(false);
      return;
    }
    try {
      const img = await createTrip(formData);
      setQrImage(img);
    } catch (err) {
      alert("⚠️ Backend Error! Check Port 8000 connection.");
    } finally {
      setLoading(false);
    }
  };

  // Background animation variant
  const bgVariant = {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: { duration: 15, ease: "linear", repeat: Infinity }
    }
  };

  return (
    // DYNAMIC ANIMATED BACKGROUND
    <motion.div 
      variants={bgVariant}
      animate="animate"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[linear-gradient(-45deg,#0f0c29,#302b63,#24243e,#220238)] bg-[length:400%_400%]"
    >
      {/* Glowing Glass Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border-2 border-white/10 shadow-[0_0_50px_rgba(255,102,0,0.3)] max-w-md w-full text-center overflow-hidden"
      >
        {/* Decorative Glow effect behind the card */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,102,0,0.15)_0%,transparent_70%)] pointer-events-none animate-pulse-slow"></div>

        {/* Header with Emojis */}
        <div className="relative z-10 flex flex-col items-center mb-8">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="bg-gradient-to-br from-[#FF6600] to-[#ff3300] p-4 rounded-2xl mb-4 shadow-lg shadow-orange-500/30"
          >
            <ShieldCheck size={40} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-orange-500 tracking-tighter">
            
          </h1>
          <p className="text-orange-300/80 text-xs mt-2 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
            <Zap size={12} /> National Logistics Grid 🌐
          </p>
        </div>

        {!qrImage ? (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            {/* Glowing Inputs with Emojis */}
            <div className="space-y-3">
                <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                    <span className="absolute left-4 top-4 text-xl grayscale group-focus-within:grayscale-0 transition-all">🧑‍✈️</span>
                    <input className="w-full p-4 pl-12 bg-white/5 rounded-xl border border-white/10 text-white focus:border-[#FF6600] focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,102,0,0.3)] outline-none transition-all placeholder:text-gray-500" placeholder="Driver Full Name" onChange={e => setFormData({...formData, driver_name: e.target.value})} required />
                </motion.div>
                <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                    <span className="absolute left-4 top-4 text-xl grayscale group-focus-within:grayscale-0 transition-all">🚛</span>
                    <input className="w-full p-4 pl-12 bg-white/5 rounded-xl border border-white/10 text-[#FF6600] font-bold focus:border-[#FF6600] focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,102,0,0.3)] outline-none transition-all uppercase placeholder:text-gray-500 placeholder:font-normal" placeholder="Vehicle No. (TN-01-AB-1234)" onChange={e => setFormData({...formData, vehicle_number: e.target.value})} required />
                </motion.div>
                
                <div className="flex gap-3">
                   <motion.div whileFocus={{ scale: 1.02 }} className="relative w-1/2 group">
                     <span className="absolute left-3 top-3.5 text-lg grayscale group-focus-within:grayscale-0 transition-all">📍</span>
                     <input className="w-full p-3 pl-10 bg-white/5 rounded-xl border border-white/10 text-white text-sm focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all placeholder:text-gray-500" placeholder="From City" onChange={e => setFormData({...formData, route_from: e.target.value})} required />
                   </motion.div>
                   <motion.div whileFocus={{ scale: 1.02 }} className="relative w-1/2 group">
                     <span className="absolute left-3 top-3.5 text-lg grayscale group-focus-within:grayscale-0 transition-all">🎯</span>
                     <input className="w-full p-3 pl-10 bg-white/5 rounded-xl border border-white/10 text-white text-sm focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all placeholder:text-gray-500" placeholder="To City" onChange={e => setFormData({...formData, route_to: e.target.value})} required />
                   </motion.div>
                </div>
            </div>

            {/* Dynamic Gradient Button */}
            <motion.button 
              disabled={loading}
              whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(255,102,0,0.6)" }} 
              whileTap={{ scale: 0.97 }} 
              className="w-full py-4 bg-gradient-to-r from-[#FF6600] via-[#ff4500] to-[#ff3300] text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                  {loading ? "⚡ VALIDATING WITH AI..." : <><Truck size={22} /> GENERATE SECURE PASS ✨</>}
              </span>
            </motion.button>
          </form>
        ) : (
          // Success State with Emojis and Glow
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center">
            <div className="bg-gradient-to-br from-white to-orange-100 p-3 rounded-2xl inline-block mb-6 shadow-[0_0_30px_rgba(255,102,0,0.5)]">
              <img src={qrImage} alt="QR" className="w-56 h-56 mix-blend-multiply" />
            </div>
            <h2 className="text-2xl font-black text-white italic">
              🎉 PASS GENERATED!
            </h2>
            <p className="text-[#FF6600] font-bold mt-1 flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> Ready for Police Scan 🚓
            </p>
            <button onClick={() => setQrImage(null)} className="text-sm text-white/60 hover:text-[#FF6600] transition-colors underline mt-6 flex items-center justify-center gap-1 mx-auto">
              🔄 Create Another Pass
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TripForm;