import React, { useState } from 'react';
import { db } from "../firebaseConfig"; 
import { collection, addDoc } from "firebase/firestore";

function Write() {
  const [inputValue1, setInputValue1] = useState("");
  const [inputValue2, setInputValue2] = useState("");

  const saveData = async () => {
    try {
      const docRef = await addDoc(collection(db, "fruits"), { 
        fruitName: inputValue1,
        fruitDefinition: inputValue2,
      });
      alert("Data saved successfully with ID: " + docRef.id);
    } catch (error: any) { 
      alert("Error saving data: " + error.message);
    }
  };

  return (
    <div>
      <input
        type='text'
        value={inputValue1}
        onChange={(e) => setInputValue1(e.target.value)}
        placeholder="Fruit Name" 
      />
      <input
        type='text'
        value={inputValue2}
        onChange={(e) => setInputValue2(e.target.value)}
        placeholder="Fruit Definition" 
      />
      <button onClick={saveData}>SAVE DATA</button>
    </div>
  );
}

export default Write;
