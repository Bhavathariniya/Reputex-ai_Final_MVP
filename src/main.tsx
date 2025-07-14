
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import axios for API calls
import axios from 'axios'

// Set axios base defaults if needed
axios.defaults.headers.common['Accept'] = 'application/json';

createRoot(document.getElementById("root")!).render(<App />);
