import axios from 'axios';

// ⚠️ PASTE YOUR BACKEND URL HERE (The one that showed "Not Found")
// Remove the trailing slash '/' if it has one.
const API_URL = 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev';

export const createTrip = async (tripData) => {
    const response = await axios.post(`${API_URL}/create_trip_qr`, tripData, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
};