import React from 'react';
import Navbar from '../components/Navbar';  
import Homepage from '../components/Homepage';
import FAQ from '../components/FAQ';

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <Homepage />
      {/* <FAQ/> */}
    </div>
  );
}
