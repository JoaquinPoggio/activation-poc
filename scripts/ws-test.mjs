import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Conectado al WebSocket'));
socket.on('connect_error', (e) => console.log('Error de conexión:', e.message));
socket.on('activation.update', (m) => console.log(m));
console.log('Intentando conectar a http://localhost:3000 ...');