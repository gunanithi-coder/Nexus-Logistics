import React, { useState } from 'react';
import { createTrip } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, Zap, Camera, Upload, Phone, MessageSquare, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// We accept 'onRouteSearch' to tell the Map where to go
const TripForm = ({ onRouteSearch }) => {
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false); // SMS Popup State
  
  const [formData, setFormData] = useState({
    driver_name: '',
    driver_phone: '', // 📱 Critical for Police App "Call" button
    vehicle_number: '',
    route_from: '',
    route_to: '',
    driver_photo: '', // 📸 Critical for Police App ID Check
    documents: [
      { doc_name: "RC", expiry_date: "2030-01-01" },
      { doc_name: "PUC", expiry_date: "2026-12-30" }
    ]
  });

  // 📸 Convert Image to Base64 String
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, driver_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // 📄 DOWNLOAD PDF FUNCTION
  const handleDownloadPDF = () => {
    const input = document.getElementById('gatepass-ticket'); // We grab the specific ticket ID
    
    // 1. Capture the Ticket Element
    html2canvas(input, { scale: 2, backgroundColor: '#111' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      
      // 2. Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // 3. Save
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Nexus_GatePass_${formData.vehicle_number}.pdf`);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Validation Logic
    const vehicleRegex = /^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/;
    if (!vehicleRegex.test(formData.vehicle_number.toUpperCase())) {
      alert("⛔ Invalid Format! Use: TN-01-AB-1234");
      setLoading(false);
      return;
    }
    if (formData.driver_phone.length < 10) {
      alert("⛔ Invalid Phone Number! Need 10 digits.");
      setLoading(false);
      return;
    }

    try {
      // 2. Send Data to Backend
      const img = await createTrip(formData);
      setQrImage(img);
      
      // 3. Show "SMS Sent" Simulation
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // 4. Update the Map Route
      if (onRouteSearch) {
         onRouteSearch(formData.route_from, formData.route_to);
      }

    } catch (err) {
      alert("⚠️ Backend Error! Check Port 8000 connection.");
    } finally {
      setLoading(false);
    }
  };

  const bgVariant = {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: { duration: 15, ease: "linear", repeat: Infinity }
    }
  };

  return (
    <motion.div 
      variants={bgVariant}
      animate="animate"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-transparent"
    >
      {/* 🔔 SMS TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-10 z-50 bg-green-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-3 font-bold"
          >
            <MessageSquare size={20} className="fill-white text-green-600" />
            <span>SMS SENT: Driver Notified!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border-2 border-white/10 shadow-[0_0_50px_rgba(255,102,0,0.3)] max-w-md w-full text-center overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,102,0,0.15)_0%,transparent_70%)] pointer-events-none animate-pulse-slow"></div>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="bg-gradient-to-br from-[#FF6600] to-[#ff3300] p-4 rounded-2xl mb-4 shadow-lg shadow-orange-500/30"
          >
            <ShieldCheck size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
             NEXUS <span className="text-[#FF6600]">GATEPASS</span>
          </h1>
          <p className="text-orange-300/80 text-xs mt-2 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
            <Zap size={12} /> National Logistics Grid 🌐
          </p>
        </div>

        {!qrImage ? (
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            
            {/* 📸 PHOTO UPLOAD */}
            <div className="flex justify-center mb-2">
              <label className="cursor-pointer group relative">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${formData.driver_photo ? 'border-[#FF6600]' : 'border-gray-500 hover:border-white'}`}>
                  {formData.driver_photo ? (
                    <img src={formData.driver_photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-1 group-hover:text-white">
                      <Camera size={20} />
                      <span className="text-[10px]">PHOTO</span>
                    </div>
                  )}
                </div>
                {!formData.driver_photo && (
                   <div className="absolute -bottom-2 -right-2 bg-[#FF6600] p-1.5 rounded-full text-white shadow-lg">
                     <Upload size={12} />
                   </div>
                )}
              </label>
            </div>

            <div className="space-y-3">
                {/* NAME INPUT */}
                <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                    <span className="absolute left-4 top-4 text-xl grayscale group-focus-within:grayscale-0 transition-all">🧑‍✈️</span>
                    <input className="w-full p-4 pl-12 bg-white/5 rounded-xl border border-white/10 text-white focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all placeholder:text-gray-500" placeholder="Driver Full Name" onChange={e => setFormData({...formData, driver_name: e.target.value})} required />
                </motion.div>

                {/* 📱 PHONE INPUT */}
                <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                    <span className="absolute left-4 top-4 text-xl grayscale group-focus-within:grayscale-0 transition-all">📱</span>
                    <input type="tel" maxLength="10" className="w-full p-4 pl-12 bg-white/5 rounded-xl border border-white/10 text-white focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all placeholder:text-gray-500" placeholder="Driver Mobile (10 digits)" onChange={e => setFormData({...formData, driver_phone: e.target.value})} required />
                </motion.div>

                {/* VEHICLE INPUT */}
                <motion.div whileFocus={{ scale: 1.02 }} className="relative group">
                    <span className="absolute left-4 top-4 text-xl grayscale group-focus-within:grayscale-0 transition-all">🚛</span>
                    <input className="w-full p-4 pl-12 bg-white/5 rounded-xl border border-white/10 text-[#FF6600] font-bold focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all uppercase placeholder:text-gray-500 placeholder:font-normal" placeholder="Vehicle No. (TN-01-AB-1234)" onChange={e => setFormData({...formData, vehicle_number: e.target.value})} required />
                </motion.div>
                
                <div className="flex gap-3">
                   {/* ROUTE INPUTS */}
                   <motion.div whileFocus={{ scale: 1.02 }} className="relative w-1/2 group">
                     <span className="absolute left-3 top-3.5 text-lg grayscale group-focus-within:grayscale-0 transition-all">📍</span>
                     <input className="w-full p-3 pl-10 bg-white/5 rounded-xl border border-white/10 text-white text-sm focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all" placeholder="From City" onChange={e => setFormData({...formData, route_from: e.target.value})} required />
                   </motion.div>
                   <motion.div whileFocus={{ scale: 1.02 }} className="relative w-1/2 group">
                     <span className="absolute left-3 top-3.5 text-lg grayscale group-focus-within:grayscale-0 transition-all">🎯</span>
                     <input className="w-full p-3 pl-10 bg-white/5 rounded-xl border border-white/10 text-white text-sm focus:border-[#FF6600] focus:bg-white/10 outline-none transition-all" placeholder="To City" onChange={e => setFormData({...formData, route_to: e.target.value})} required />
                   </motion.div>
                </div>
            </div>

            <motion.button 
              disabled={loading}
              whileHover={{ scale: 1.03 }} 
              whileTap={{ scale: 0.97 }} 
              className="w-full py-4 bg-gradient-to-r from-[#FF6600] via-[#ff4500] to-[#ff3300] text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                  {loading ? "⚡ VALIDATING..." : <><Truck size={22} /> GENERATE SECURE PASS ✨</>}
              </span>
            </motion.button>
          </form>
        ) : (
          // ✅ TICKET VIEW (Wrapped in ID for PDF Capture)
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="relative z-10 text-center w-full"
          >
            {/* THIS DIV WILL BE CAPTURED AS PDF */}
            <div id="gatepass-ticket" className="p-4 bg-black/50 rounded-2xl mb-4 border border-white/10">
              <h2 className="text-xl font-black text-white italic mb-2">
                🎉 OFFICIAL GATEPASS
              </h2>
              <p className="text-gray-400 text-xs mb-4 uppercase tracking-widest border-b border-gray-700 pb-2">
                 {formData.vehicle_number} • {formData.driver_name}
              </p>
              
              <div className="bg-white p-2 rounded-2xl inline-block mb-2 shadow-2xl">
                {/* ✅ FIXED IMAGE TAG */}
                <img 
                  src={`data:image/png;base64,${qrImage}`} 
                  alt="Generated QR Code" 
                  className="border-4 border-white shadow-lg"
                  style={{ width: '150px', height: '150px', objectFit: 'contain' }} 
                />              
              </div>

              <p className="text-[#FF6600] font-bold mt-1 flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Verified & Secure
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDownloadPDF} 
                className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <Download size={18} /> DOWNLOAD PDF
              </button>

              <button 
                onClick={() => setQrImage(null)} 
                className="text-sm text-white/60 hover:text-[#FF6600] transition-colors underline flex items-center justify-center gap-1"
              >
                🔄 Create Another Pass
              </button>
            </div>
            
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TripForm;