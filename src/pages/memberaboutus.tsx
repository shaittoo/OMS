import React from "react";
import MemberSidebar from "../components/membersidebar"; 

const AboutUs = () => {
  return (
    <div className="flex bg-white"> 
    <div className="flex min-h-screen ">
      <MemberSidebar /> 
      </div>

      {/* Main content */}
      <main className="main-content flex-grow p-6 ">
        <div className="flex flex-col items-center bg-gray-100 min-h-screen py-10 px-4">
          {/* Logo Section */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 bg-white p-8 rounded-lg shadow-md w-full max-w-6xl mb-12">
            <img
              src="assets/OMSLOGO.png"
              alt="OMS Logo"
              className="h-20 lg:h-32"
            />
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-[#8736EA] mb-4">
                About OMS
              </h1>
              <p className="text-gray-600 mb-6">
                OMS (Organizational Management System) is a platform dedicated
                to fostering collaboration, growth, and innovation within
                communities and organizations. It offers tools to manage
                members, events, and resources, aiming to simplify processes
                and create meaningful connections. With a focus on inclusivity,
                integrity, and making a positive impact, OMS strives to empower
                individuals and organizations to achieve their goals together.
              </p>
              <a
                href="/learnmore"
                className="text-white bg-[#8736EA] px-6 py-2 rounded-md hover:bg-purple-700"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* About Us Sections */}
          <div className="px-4 lg:px-16 space-y-12 mb-12">
            {/* Who We Are */}
            <div className="about-section bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Who We Are
              </h2>
              <p className="text-gray-600">
                We are a dedicated team passionate about fostering
                collaboration, growth, and innovation within our community. Our
                mission is to provide tools and platforms that empower
                individuals and organizations to achieve their goals together.
              </p>
            </div>

            {/* Our Mission */}
            <div className="about-section bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600">
                Our mission is to build bridges that connect people, simplify
                processes, and create opportunities for all. By leveraging
                technology and fostering inclusivity, we aim to make a lasting
                impact in the lives of those we serve.
              </p>
            </div>

            {/* What We Do */}
            <div className="about-section bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                What We Do
              </h2>
              <ul className="list-disc ml-6 text-gray-600">
                <li>
                  Support Communities: Tools for managing members and events.
                </li>
                <li>Foster Growth: Tailored resources to help organizations excel.</li>
                <li>
                  Celebrate Collaboration: Meaningful connections that matter.
                </li>
              </ul>
            </div>

            {/* Our Core Values */}
            <div className="about-section bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Our Core Values
              </h2>
              <ul className="list-disc ml-6 text-gray-600">
                <li>Inclusivity: Everyone is welcome here.</li>
                <li>Innovation: Adopting and creating the best solutions.</li>
                <li>Integrity: Transparency and trust guide us.</li>
                <li>Impact: Making a difference is at our core.</li>
              </ul>
            </div>

            {/* Join Us */}
            <div className="about-section bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Join Us
              </h2>
              <p className="text-gray-600">
                Whether you’re an individual looking to connect or an
                organization ready to grow, we’re here for you. Together, we can
                build a brighter future.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 lg:px-16 py-12 bg-[#8736EA] text-white mb-12">
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Community Support</h3>
              <p>
                Dedicated resources to help organizations and individuals
                thrive.
              </p>
            </div>
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Innovation</h3>
              <p>Building tools that make processes simpler and better.</p>
            </div>
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Collaboration</h3>
              <p>
                Strengthening partnerships through meaningful connections.
              </p>
            </div>
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Inclusivity</h3>
              <p>
                Creating a space where everyone feels valued and welcomed.
              </p>
            </div>
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Integrity</h3>
              <p>
                Ensuring transparency and trust in all our interactions.
              </p>
            </div>
            <div className="feature-item bg-purple-600 p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-bold mb-2">Impact</h3>
              <p>
                Focused on creating meaningful and lasting positive changes.
              </p>
            </div>
          </div>

          {/* Contact Us Section */}
          <div className="w-full text-center py-12 px-4 lg:px-16">
            <h2 className="text-3xl font-bold text-purple mb-8">
              Contact Us
            </h2>
            <div className="flex gap-6 justify-center">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <i className="fab fa-facebook-f"></i> 
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-700"
              >
                <i className="fab fa-instagram"></i> 
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                <i className="fab fa-pinterest-p"></i> 
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-400 text-white hover:bg-blue-500"
              >
                <i className="fab fa-twitter"></i> 
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;