import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## **Create .env file** (in root folder, same level as package.json)
```
VITE_REACT_APP_UNSPLASH_KEY=your_unsplash_api_key_here
