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
    documents: { rc_book: null, insurance: null, puc_cert: null, permit: null }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

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
      setFormData(prev => ({ ...prev, documents: { ...prev.documents, [docName]: base64 } }));
      if (errors.documents) setErrors(prev => ({ ...prev, documents: null }));
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'driver_phone') value = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'vehicle_number') {
        let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length > 10) clean = clean.slice(0, 10);
        let formatted = clean;
        if (clean.length > 2) formatted = `${clean.slice(0, 2)}-${clean.slice(2)}`;
        if (clean.length > 4) formatted = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4)}`;
        const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,2})([0-9]{0,4})$/);
        if (match) formatted = `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
        value = formatted;
    }
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;
    if (formData.driver_phone.length !== 10) { newErrors.driver_phone = "Phone must be exactly 10 digits."; isValid = false; }
    const vehicleRegex = /^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}$/;
    if (!vehicleRegex.test(formData.vehicle_number)) { newErrors.vehicle_number = "Invalid! Format: TN-01-AB-1234"; isValid = false; }
    if (!formData.documents.rc_book) { newErrors.documents = "RC Book Proof is Mandatory!"; isValid = false; }
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
      if (onRouteSearch) onRouteSearch(formData.route_from, formData.route_to);
    } catch (error) {
      console.error("Pass Error:", error);
      alert("System Error: Ensure Backend is Running!");
    }
    setLoading(false);
  };

  return (
    // ✅ FORCE CENTER: mx-auto ensures it sits in the middle
    <div className="w-full max-w-4xl mx-auto"> 
      {!qrImage ? (
        <form onSubmit={handleSubmit} className="bg-gray-900/50 p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
          
          <div className="flex items-center justify-center gap-3 mb-8">
            <Truck className="text-[#FF6600]" size={40} />
            <h2 className="text-3xl font-black text-white italic tracking-wider">NEW GATEPASS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 flex items-center gap-3">
              <User size={20} className="text-gray-400" />
              <input name="driver_name" placeholder="Driver Name" onChange={handleChange} required className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold" />
            </div>

            <div className={`bg-black/40 p-4 rounded-xl border flex items-center gap-3 ${errors.driver_phone ? 'border-red-500' : 'border-white/10'}`}>
                <Phone size={20} className={errors.driver_phone ? "text-red-500" : "text-gray-400"} />
                <input name="driver_phone" value={formData.driver_phone} placeholder="Phone (10 Digits)" onChange={handleChange} className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold" />
            </div>

            <div className={`bg-black/40 p-4 rounded-xl border flex items-center gap-3 ${errors.vehicle_number ? 'border-red-500' : 'border-white/10'}`}>
                <Truck size={20} className={errors.vehicle_number ? "text-red-500" : "text-gray-400"} />
                <input name="vehicle_number" value={formData.vehicle_number} placeholder="TN-01-AB-1234" onChange={handleChange} maxLength={13} className="bg-transparent outline-none text-white w-full placeholder-gray-600 font-bold uppercase" />
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/10 flex items-center gap-3">
              <MapPin size={20} className="text-gray-400" />
              <div className="flex gap-2 w-full">
                <input name="route_from" placeholder="From" onChange={handleChange} required className="bg-transparent outline-none text-white w-1/2 placeholder-gray-600 font-bold uppercase" />
                <span className="text-gray-600">➝</span>
                <input name="route_to" placeholder="To" onChange={handleChange} required className="bg-transparent outline-none text-white w-1/2 placeholder-gray-600 font-bold uppercase" />
              </div>
            </div>
          </div>

          {(errors.driver_phone || errors.vehicle_number) && (
             <div className="mt-4 bg-red-500/20 border border-red-500 p-3 rounded-lg flex items-center justify-center gap-2 text-red-400 text-sm font-bold">
                <AlertCircle size={18} />
                <span>Fix Errors: {errors.driver_phone || errors.vehicle_number}</span>
             </div>
          )}

          <div className="border-t border-white/10 pt-6 mt-6">
            <h3 className="text-[#FF6600] text-sm font-bold mb-4 flex items-center justify-center gap-2">
              <FileText size={16} /> DIGITAL DOCUMENT UPLOAD
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['rc_book', 'insurance', 'puc_cert', 'permit'].map((doc) => (
                <div key={doc} className="relative group">
                  <input type="file" id={doc} className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, doc)} />
                  <label htmlFor={doc} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border cursor-pointer transition-all ${formData.documents[doc] ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-dashed border-gray-600 hover:bg-white/10 text-gray-400 group-hover:border-[#FF6600]'}`}>
                    {formData.documents[doc] ? <CheckCircle size={24} /> : <Upload size={24} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{doc.replace('_', ' ')}</span>
                  </label>
                </div>
              ))}
            </div>
            {errors.documents && <p className="text-red-500 text-center text-sm mt-4 font-bold animate-pulse">⚠️ {errors.documents}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full mt-8 bg-[#FF6600] hover:bg-[#ff8533] text-white py-4 rounded-2xl font-black tracking-widest transition-all shadow-lg flex justify-center items-center gap-2 text-lg">
            {loading ? "VALIDATING..." : "GENERATE SECURE PASS ✨"}
          </button>

        </form>
      ) : (
        <div className="text-center animate-fade-in w-full max-w-md mx-auto">
          <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl mb-6 inline-flex items-center gap-2">
            <CheckCircle className="text-green-500" />
            <span className="text-green-400 font-bold">OFFICIAL GATEPASS GENERATED</span>
          </div>
          <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl">
            <img src={`data:image/png;base64,${qrImage}`} alt="QR Code" className="w-64 h-64 object-contain" />
          </div>
          <button onClick={() => setQrImage(null)} className="w-full mt-6 border border-white/20 text-gray-400 font-bold py-4 rounded-xl hover:bg-white/5">
            CREATE ANOTHER PASS
          </button>
        </div>
      )}
    </div>
  );
};

export default TripForm;