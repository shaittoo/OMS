import React from "react";
import Image from "next/image";
import Link from "next/link";
import Write from "../components/Write";
import Navbar from "./Navbar";
import { ToastContainer } from "react-toastify";

export default function Example() {
  return (
    <div className="App">
      <Navbar />
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar
        closeButton={false}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        toastStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          color: "#374151",
          borderRadius: "12px",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)",
          fontSize: "14px",
          padding: "12px 16px",
          minHeight: "48px",
          display: "flex",
          alignItems: "center",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          margin: "0 0 16px 0",
        }}
      />
      <header className="App-header">
        <Image
          src="/logo.svg"
          alt="logo"
          width={100}
          height={100}
          className="App-logo"
        />
        <p>Shaina Marie</p>
        <Link href="/write">Write</Link>
        <Link href="/register">Register</Link>
        <Link href="/login">Login</Link>
      </header>
    </div>
  );
}
