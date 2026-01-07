import axios from 'axios';

// ✅ Make sure this URL matches your current Port 8000 address
const API_URL = 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev';

export const createTrip = async (tripData) => {
    // 🚨 We REMOVED { responseType: 'blob' } -> This was the cause of the error!
    const response = await axios.post(`${API_URL}/create_trip_qr`, tripData);
    
    // We expect the backend to send us a JSON object with a "qr_base64" field
    return response.data.qr_base64; 
};