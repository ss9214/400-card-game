import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

export const fetchPlayerHand = async (playerId) => {
    const response = await api.get(`/games/hand/${playerId}`);
    return response.data.hand;
  };

export default api;
