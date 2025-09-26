import React, { useState, useEffect } from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function TestComponent() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/hello')
          .then(res => res.json())
          .then(json => setData(json));
        
        return () => {
            console.log('Clean this, its test one)');
        };  
    }, []);

    return (
        <>
        <a href="https://google.com/" id="google-link">
            <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://gmail.com/" id="google-link">
            <img src={viteLogo} className="logo react" alt="React logo" />
        </a>
        
        <div id="back-msg">
            {data ? data.message : 'Loading...'}
        </div>
        </>
    );
}

export default TestComponent;