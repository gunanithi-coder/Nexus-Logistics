import React, { useState } from 'react';
import { createTrip } from '../api';
import { Truck, MapPin, User, Phone, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const TripForm = ({ onRouteSearch }) => {
  const [formData, setFormData] = useState({
    driver_name: '',
    driver_phone: '',
    vehicle_number: '',
    route_from: '',
    route_to: '',
    documents: {
      rc_book: null,
      insurance: null,
      puc_cert: null,
      permit: null
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  // Helper: Convert File to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e, docName) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setFormData(prev => ({
        ...prev,
        documents: { ...prev.documents, [docName]: base64 }
      }));
      if (errors.documents) setErrors(prev => ({ ...prev, documents: null }));
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    // 🧠 SMART INPUT LOGIC 🧠
    
    // 1. Phone: Enforce Numbers Only & Max 10 Digits
    if (name === 'driver_phone') {
        value = value.replace(/\D/g, '').slice(0, 10);
    }

    // 2. Vehicle: SMART FORMATTER (TN-01-BC-1234)
    if (name === 'vehicle_number') {
        // Remove special chars first to get raw data
        let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Prevent typing more than allowed (Max 10 chars raw = TN01BC1234)
        if (clean.length > 10) clean = clean.slice(0, 10);

        // Auto-Insert Dashes
        let formatted = clean;
        if (clean.length > 2) {
            formatted = `${clean.slice(0, 2)}-${clean.slice(2)}`;
        }
        if (clean.length > 4) {
             formatted = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
        }
        if (clean.length > 6) {
             // Handle 1 or 2 letter series (TN-01-A-1234 vs TN-01-AB-1234)
             // We assume series ends when numbers begin
             const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,2})([0-9]{0,4})$/);
             if (match) {
                 formatted = `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
             }
        }
        
        value = formatted;
    }

    setFormData({ ...formData, [name]: value });

    // Clear error as user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // 🛡️ VALIDATION LOGIC
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Phone Check
    if (formData.driver_phone.length !== 10) {
      newErrors.driver_phone = "Phone must be exactly 10 digits.";
      isValid = false;
    }

    // Vehicle Format Check
    // Matches: TN-01-A-1234 OR TN-01-AB-1234
    const vehicleRegex = /^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}$/;
    if (!vehicleRegex.test(formData.vehicle_number)) {
      newErrors.vehicle_number = "Invalid! Format: TN-01-AB-1234";
      isValid = false;
    }

    // Document Check
    if (!formData.documents.rc_book) {
      newErrors.documents = "RC Book Proof is Mandatory!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; 

    setLoading(true);
    try {
      const qrCode = await createTrip(formData);
      setQrImage(qrCode);
      if (onRouteSearch) {
        onRouteSearch(formData.route_from, formData.route_to);
      }
    } catch (error) {
      console.error("Pass Error:", error);
      alert("System Error: Ensure Backend is Running!");
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      {!qrImage ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex items-center gap-3 mb-6">
            <Truck className="text-[#FF6600]" size={28} />
            <h2 className="text-2xl font-black text-white italic tracking-wider">NEW GATEPASS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* DRIVER NAME */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <input name="driver_name" placeholder="Driver Name" onChange={handleChange} required className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold" />
            </div>

            {/* PHONE */}
            <div className={`bg-black/40 p-3 rounded-xl border flex items-center gap-3 ${errors.driver_phone ? 'border-red-500' : 'border-white/10'}`}>
                <Phone size={18} className={errors.driver_phone ? "text-red-500" : "text-gray-400"} />
                <input 
                  name="driver_phone" 
                  value={formData.driver_phone}
                  placeholder="Phone (10 Digits)" 
                  onChange={handleChange} 
                  className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold" 
                />
            </div>

            {/* VEHICLE NO (With Auto-Formatting) */}
            <div className={`bg-black/40 p-3 rounded-xl border flex items-center gap-3 ${errors.vehicle_number ? 'border-red-500' : 'border-white/10'}`}>
                <Truck size={18} className={errors.vehicle_number ? "text-red-500" : "text-gray-400"} />
                <input 
                  name="vehicle_number" 
                  value={formData.vehicle_number}
                  placeholder="TN-01-AB-1234" 
                  onChange={handleChange} 
                  // Limits user to typing roughly the correct length
                  maxLength={13} 
                  className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold uppercase" 
                />
            </div>

            {/* ROUTE */}
            <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-3">
              <MapPin size={18} className="text-gray-400" />
              <div className="flex gap-2 w-full">
                <input name="route_from" placeholder="From City" onChange={handleChange} required className="bg-transparent outline-none text-white w-1/2 placeholder-gray-600 font-bold uppercase" />
                <span className="text-gray-600">➝</span>
                <input name="route_to" placeholder="To City" onChange={handleChange} required className="bg-transparent outline-none text-white w-1/2 placeholder-gray-600 font-bold uppercase" />
              </div>
            </div>
          </div>

          {/* Errors */}
          {(errors.driver_phone || errors.vehicle_number) && (
             <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertCircle size={16} />
                <span>Fix Errors: {errors.driver_phone || errors.vehicle_number}</span>
             </div>
          )}

          {/* DOCUMENT UPLOAD */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-[#FF6600] text-sm font-bold mb-3 flex items-center gap-2">
              <FileText size={16} /> DIGITAL DOCUMENT UPLOAD
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {['rc_book', 'insurance', 'puc_cert', 'permit'].map((doc) => (
                <div key={doc} className="relative">
                  <input type="file" id={doc} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, doc)} />
                  <label htmlFor={doc} className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all ${formData.documents[doc] ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-dashed border-gray-600 hover:bg-white/10 text-gray-400'}`}>
                    {formData.documents[doc] ? <CheckCircle size={16} /> : <Upload size={16} />}
                    <span className="text-xs font-bold uppercase">{doc.replace('_', ' ')}</span>
                  </label>
                </div>
              ))}
            </div>
            
            {errors.documents && (
              <p className="text-red-500 text-center text-xs mt-3 font-bold animate-pulse">
                 ⚠️ {errors.documents}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#FF6600] hover:bg-[#ff8533] text-white py-4 rounded-xl font-black tracking-widest transition-all shadow-lg flex justify-center items-center gap-2">
            {loading ? "VALIDATING..." : "GENERATE SECURE PASS ✨"}
          </button>

        </form>
      ) : (
        <div className="text-center animate-fade-in">
          <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl mb-6 inline-flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            <span className="text-green-400 font-bold">OFFICIAL GATEPASS GENERATED</span>
          </div>
          <div className="bg-white p-4 rounded-xl inline-block shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            <img src={`data:image/png;base64,${qrImage}`} alt="QR Code" className="w-48 h-48 object-contain" />
          </div>
          <div className="mt-6 space-y-3">
            <button onClick={() => setQrImage(null)} className="w-full border border-white/20 text-gray-400 font-bold py-3 rounded-xl hover:bg-white/5">
              CREATE ANOTHER PASS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripForm;