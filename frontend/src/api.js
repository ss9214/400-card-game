import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // adjust if using a different backend port
});

export const fetchPlayerHand = async (playerId) => {
    const response = await api.get(`/games/hand/${playerId}`);
    return response.data.hand;
  };

export default api;
