import React, { useState } from "react";
import { db, storage } from "../firebaseConfig"; // Make sure you have firebaseConfig.js set up
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CloseIcon from "@mui/icons-material/Close";
import { s3Client } from "./awsConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { toast } from "react-hot-toast";

interface OfficerAddEventProps {
  close: () => void;
}

const OfficerAddEvent: React.FC<OfficerAddEventProps> = ({ close }) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventPrice, setEventPrice] = useState("");
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isOpenForAll, setIsOpenForAll] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [eventLocation, setEventLocation] = useState("");
  const [user] = useAuthState(auth);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Append new files to existing eventImages
      setEventImages(prevImages => [...prevImages, ...files]); 
  
      const previews = files.map((file) => URL.createObjectURL(file));
      // Append new previews to existing imagePreviews
      setImagePreviews(prevPreviews => [...prevPreviews, ...previews]); 
    }
  };

  const handleImageRemove = (index: number) => {
    setEventImages(prevImages => prevImages.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedURLs: string[] = [];
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    
    if (!bucketName) {
      throw new Error("S3 bucket name is not configured");
    }

    for (const file of eventImages) {
      try {
        const key = `events/${Date.now()}-${encodeURIComponent(file.name)}`;
        
        // Create a new FormData instance
        const formData = new FormData();
        formData.append('file', file);
        formData.append('key', key);
        formData.append('bucket', bucketName);
        formData.append('Content-Type', file.type);

        // Upload using fetch
        const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const data = await response.json();
        const downloadURL = data.url;
        
        uploadedURLs.push(downloadURL);
        console.log("Uploaded file:", downloadURL);
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        if (error instanceof Error) {
          throw new Error(`Failed to upload image ${file.name}: ${error.message}`);
        } else {
          throw new Error(`Failed to upload image ${file.name}: Unknown error`);
        }
      }
    }
    return uploadedURLs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user) {
      alert("You must be logged in to perform this action.");
      return;
    }
  
    try {
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("email", "==", user.email));
      const userDocs = await getDocs(userQuery);
  
      if (userDocs.empty) {
        alert("You are not authorized to add events.");
        return;
      }
  
      const userData = userDocs.docs[0]?.data();
      if (userData.role !== "organization") {
        alert("Only organizations can add events.");
        return;
      }
  
      const organizationId = userData.organizationId;
  
      // Upload images and create event
      const imageUrls = await uploadImages();
  
      await addDoc(collection(db, "events"), {
        eventName,
        eventDate: new Date(eventDate),
        eventDescription,
        eventPrice: isFree ? 0 : parseFloat(eventPrice),
        isOpenForAll,
        tags: tags.split(",").map((tag) => tag.trim()),
        status: "pending",
        eventLocation,
        eventImages: imageUrls,
        organizationId,
        organizationVerified: true,
        createdAt: new Date(),
        likes: 0,
        interested: 0,
      });
  
      toast.success("Event submitted for approval! You'll be notified once it's reviewed.", {
        duration: 5000,
      });
      close();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("An error occurred while adding the event. Please try again.");
    }
  };  

  return (
    <div
      className="fixed inset-0 bg-gray-200 bg-opacity-50 flex justify-center items-center left-[18%] z-50"
      style={{ backgroundColor: "rgba(128, 128, 128, 0.5)" }}
    >
      <div
        className="bg-white p-10 rounded-lg w-full max-w-4xl shadow-xl relative"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        {/* Close Button */}
        <button
          onClick={close}
          className="absolute top-3 right-2 p-3 rounded-md hover:bg-purple-200 hover:text-white transition duration-200"
          style={{ backgroundColor: "#e8e8e8" }}
        >
          <CloseIcon className="h-5 w-5 text-[#8736EA]" />
        </button>

        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4 text-center text-[#8736EA]">
            Add New Event
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div> {/* Container for image upload and price/date */}
              <div className="h-32 w-full border-4 border-dashed border-purple-500 rounded-md hover:bg-purple-100 transition-colors duration-200 relative">
                {imagePreviews.length === 0 ? ( // Conditionally render label or button
                <label
                    htmlFor="file-upload"
                    className="absolute inset-0 flex justify-center items-center text-purple-600 font-semibold text-sm cursor-pointer"
                    style={{ textDecoration: "underline" }}
                >
                    Click here to upload images
                </label>
                ) : (
                <button 
                    type="button" 
                    onClick={() => document.getElementById('file-upload')?.click()} 
                    className="absolute bottom-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
                >
                    Add More Images
                </button>
                )}
                <input
                id="file-upload"
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                />

                {/* Image Preview */}
                <div className="p-2 mt-2 flex flex-wrap gap-2"> 
                {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative"> 
                    <img
                        src={preview}
                        alt={`preview-${index}`}
                        className="w-16 h-16 object-cover border-2 border-purple-500 rounded-md" 
                    />
                    <button
                        type="button" 
                        onClick={() => handleImageRemove(index)} 
                        className="absolute top-0 right-3 bg-red-500 text-white rounded-full p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <p className="text-center text-xs mt-1 truncate">
                        {eventImages[index].name.length > 10 
                        ? `${eventImages[index].name.substring(0, 10)}...${eventImages[index].name.split('.').pop()}` 
                        : eventImages[index].name}
                    </p> 
                    </div>
                ))}
                </div>

                </div>

                {/* Upload Event File Button */}
                <div className="mt-4">
                  <a 
                    href="https://forms.gle/3DECWcu9kRiPEF32A" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block w-full"
                  >
                    <button
                      type="button"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                      style={{ backgroundColor: "#8736EA" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Event Files
                    </button>
                  </a>
                </div>

                {/* Event Price and Date under Event Name */}
                <div className="mt-6 grid grid-cols-2 gap-4"> 
                  <div>
                    <label className="block text-sm font-medium text-[#8736EA] mb-2">
                      Event Price (PHP)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(e.target.value)}
                        className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                        min="0"
                        required={!isFree}
                        disabled={isFree}
                      />
                      <label className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-purple-600"
                          checked={isFree}
                          onChange={(e) => setIsFree(e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-500">Free</span>
                      </label>
                    </div>
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-medium text-[#8736EA] mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                      required
                    />
                  </div>
                </div>

                {/* Tags and Status */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8736EA] mb-2">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                      placeholder="e.g. conference, workshop, seminar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8736EA] mb-2">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Side (Text Inputs) */}
              <div className="space-y-4">
                {/* Event Name */}
                <div>
                  <label className="block text-sm font-medium text-[#8736EA] mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                    required
                    placeholder="Enter event name"
                  />
                </div>

                {/* Event Location */}
                <div>
                  <label className="block text-sm font-medium text-[#8736EA] mb-2">
                    Event Location
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                    required
                    placeholder="Enter event location"
                  />
                </div>

                {/* Event Description */}
                <div>
                  <label className="block text-sm font-medium text-[#8736EA] mb-2">
                    Event Description
                  </label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="h-24 block w-full px-6 py-4 border rounded-md border-gray-300 focus:ring-2 focus:ring-purple-500 border-[#cccccc]"
                    rows={4}
                    required
                    placeholder="Enter event description"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
                    style={{ backgroundColor: "#8736EA" }}
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfficerAddEvent;