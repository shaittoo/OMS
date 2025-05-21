import React from "react";
import OfficerSidebar from "../components/officersidebar"; 
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import FontAwesome CSS

const SectionDivider = () => (
	<div className="flex items-center w-full relative my-2">
		<hr className="w-full h-[2px] bg-gray-200 border-0 rounded" />
		<span className="absolute left-1/2 -translate-x-1/2 bg-white px-2">
			<svg
				className="w-4 h-4 text-gray-400"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 18 14"
			>
				<path d="M6 0H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3H2a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v1a3 3 0 0 1-3 3h-1a1 1 0 0 0 0 2h1a5.006 5.006 0 0 0 5-5V2a2 2 0 0 0-2-2Z" />
			</svg>
		</span>
	</div>
);

const AboutUs = () => {
  return (
		<div className="flex">
			<div className="sticky left-0 top-0 h-screen bg-white shadow-md">
				{/* Sidebar */}
				<OfficerSidebar />
			</div>

			{/* Main content */}
			<main className="min-h-screen bg-white p-6">
				<div className="flex flex-col items-center bg-gray-100 rounded-lg min-h-screen py-6 px-4">
					{/* Logo Section */}
					<div className="flex-row lg:flex-row mx-10 items-center m-4justify-center gap-8 bg-white p-8 rounded-lg shadow-md w-full max-w-6xl mb-8">
						<div className="flex flex-col lg:flex-row items-center justify-center py-8">
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
									and create meaningful connections. With a focus on
									inclusivity, integrity, and making a positive impact, OMS
									strives to empower individuals and organizations to achieve
									their goals together.
								</p>
								<a
									href="/learnmore"
									className="inline-block text-white bg-gradient-to-r from-[#8736EA] to-[#a18cd1] px-7 py-2 rounded-lg font-semibold shadow hover:from-purple-700 hover:to-[#a18cd1] transition"
								>
									Learn More
								</a>
							</div>
						</div>

						<div className="flex-row relative">
							<SectionDivider />
							{/* Who We Are */}
							<div className=" p-8">
								<h2 className="text-4xl font-bold text-[#8736EA] mb-4">
									Who We Are
								</h2>
								<p className="text-gray-600">
									We are a dedicated team passionate about fostering
									collaboration, growth, and innovation within our community.
									Our mission is to provide tools and platforms that empower
									individuals and organizations to achieve their goals together.
								</p>
							</div>
							<SectionDivider />
							{/* Our Mission */}
							<div className="p-8">
								<h2 className="text-4xl font-bold text-[#8736EA] mb-4">
									Our Mission
								</h2>
								<p className="text-gray-600">
									Our mission is to build bridges that connect people, simplify
									processes, and create opportunities for all. By leveraging
									technology and fostering inclusivity, we aim to make a lasting
									impact in the lives of those we serve.
								</p>
							</div>
							<SectionDivider />
							{/* What We Do */}
							<div className="p-8">
								<h2 className="text-4xl font-bold text-[#8736EA] mb-4">
									What We Do
								</h2>
								<ul className="list-disc ml-6 text-gray-600">
									<li>
										Support Communities: Tools for managing members and events.
									</li>
									<li>
										Foster Growth: Tailored resources to help organizations
										excel.
									</li>
									<li>
										Celebrate Collaboration: Meaningful connections that matter.
									</li>
								</ul>
							</div>
							<SectionDivider />
							{/* Our Core Values */}
							<div className="p-8">
								<h2 className="text-4xl font-bold text-[#8736EA] mb-4">
									Our Core Values
								</h2>
								<ul className="list-disc ml-6 text-gray-600">
									<li>Inclusivity: Everyone is welcome here.</li>
									<li>Innovation: Adopting and creating the best solutions.</li>
									<li>Integrity: Transparency and trust guide us.</li>
									<li>Impact: Making a difference is at our core.</li>
								</ul>
							</div>
							<SectionDivider />
							{/* Join Us */}
							<div className="p-8">
								<h2 className="text-4xl font-bold text-[#8736EA] mb-4">
									Join Us
								</h2>
								<p className="text-gray-600">
									Whether you're an individual looking to connect or an
									organization ready to grow, we're here for you. Together, we
									can build a brighter future.
								</p>
							</div>
						</div>
					</div>

					{/* Features Grid */}
					<div className="grid rounded-lg w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 lg:px-16 py-12 bg-gradient-to-r from-[#a18cd1] via-[#fbc2eb] to-[#a6c1ee] text-gray-900 mb-8">
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">
								Community Support
							</h3>
							<p>
								Dedicated resources to help organizations and individuals
								thrive.
							</p>
						</div>
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">
								Innovation
							</h3>
							<p>Building tools that make processes simpler and better.</p>
						</div>
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">
								Collaboration
							</h3>
							<p>Strengthening partnerships through meaningful connections.</p>
						</div>
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">
								Inclusivity
							</h3>
							<p>Creating a space where everyone feels valued and welcomed.</p>
						</div>
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">
								Integrity
							</h3>
							<p>Ensuring transparency and trust in all our interactions.</p>
						</div>
						<div className="bg-white/80 p-6 rounded-lg shadow-lg text-center transition-transform duration-300 hover:scale-105 hover:bg-white">
							<h3 className="text-xl font-bold mb-2 text-[#8736EA]">Impact</h3>
							<p>
								Focused on creating meaningful and lasting positive changes.
							</p>
						</div>
					</div>

					{/* Contact Us Section */}
					<div className="w-full text-center px-4 lg:px-16 mb-8">
						<h2 className="text-4xl font-bold text-[#8736EA] mb-8">
							Contact Us
						</h2>
						<div className="flex gap-6 justify-center">
							<a
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-transform duration-200 hover:scale-110 shadow-md"
							>
								<i className="fab fa-facebook-f"></i>
							</a>
							<a
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-14 h-14 flex items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-transform duration-200 hover:scale-110 shadow-md"
							>
								<i className="fab fa-instagram"></i>
							</a>
							<a
								href="https://pinterest.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-transform duration-200 hover:scale-110 shadow-md"
							>
								<i className="fab fa-pinterest-p"></i>
							</a>
							<a
								href="https://twitter.com"
								target="_blank"
								rel="noopener noreferrer"
								className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-transform duration-200 hover:scale-110 shadow-md"
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