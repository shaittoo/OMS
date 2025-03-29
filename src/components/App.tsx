import React from "react";
import Image from "next/image";
import Link from "next/link";
import Write from "../components/Write";
import Navbar from "./Navbar";

export default function Example() {
  return (
    <div className="App">
      <Navbar />
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
