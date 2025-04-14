import React, { useState, useContext } from 'react';
import { CC_Context } from "../../context/SmartContractConnector.js";
import { Loader2, Upload, Tag, Cloud, Currency, FileText,Bitcoin } from 'lucide-react';
import { FaEthereum } from "react-icons/fa6";
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import { createNGOCredit, getNGOCredits, checkAuditorsNumber } from '../../api/api';

const CreateCreditForm = ({ setMyCredits }) => {
  const { generateCredit, getNextCreditId, requestAudit } = useContext(CC_Context);
  const [newCredit, setNewCredit] = useState({ creditId: 0, name: '', amount: '', price: '', auditFees: '', secure_url: '' });
  const [pendingCr, setPendingCr] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileConfirmed, setIsFileConfirmed] = useState(false);
  const [docUrl, setDocUrl] = useState('');

  const handleInputChange = (e) => {
    setNewCredit({ ...newCredit, [e.target.name]: e.target.value });
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setIsFileConfirmed(false);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please upload a valid PDF file.",
      });
    }
  };

  const onSubmit = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', 'CARBON')
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setDocUrl(data['secure_url'])
      Swal.fire({
        icon: "success",
        title: "File Uploaded",
        text: "Your file has been uploaded successfully.",
      });
      setIsFileConfirmed(true)
    }
    catch (err) {
      console.error('Failed uploading file to cloudinary: ', err);
      Swal.fire(
        {
          icon: "error",
          title: "Upload failed",
          text: "There was an error uploading your file. Please try again.",
        }
      )
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: "application/pdf",
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const handleCreateCredit = async (e) => {
    e.preventDefault();
    if (!newCredit.name || !newCredit.amount || !newCredit.price || !newCredit.auditFees) {
      alert("Please fill in all fields!");
      return;
    }

    if(newCredit.auditFees < (newCredit.amount * 0.01 * 0.01)){
      Swal.fire({
        icon: "warning",
        text: "Please give the minimum audit fees" 
      })
      return;
    }

    if(newCredit.price <= 0){
      Swal.fire({
        icon: "warning",
        text: "Add some price !" 
      })
      return;
    }

    try {
      const checkAuditors = await checkAuditorsNumber(newCredit.amount);
      console.log(checkAuditors);
      setPendingCr(true);
      const newCreditId = await getNextCreditId();
      const updatedCredit = { ...newCredit, creditId: Number(newCreditId), secure_url: docUrl };
      
      await generateCredit(updatedCredit.amount, updatedCredit.price);
      await requestAudit(newCreditId, updatedCredit.auditFees);
      const response = await createNGOCredit(updatedCredit);
      
      const updatedCredits = await getNGOCredits();
      setMyCredits(updatedCredits.data);

      setNewCredit({ name: "", amount: "", price: "", creditId: "", auditFees: '', secure_url: '' });
    } catch (error) {
      console.error("Failed to create credit:", error.response.data["message"]);
      Swal.fire({
        icon: "error",
        title: "Failed Credit request",
        text: `${error.response.data["message"]}`,
      });
    } finally {
      setPendingCr(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h4 className="text-base font-medium text-gray-800 mb-3 flex items-center">
        <FileText className="w-4 h-4 mr-1 text-cyan-500" />
        Create Credit
      </h4>
      <form onSubmit={handleCreateCredit} className="space-y-3">
        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600">Name</label>
            <div className="mt-1 flex items-center">
              <Tag className="absolute w-4 h-4 text-gray-400 ml-2" />
              <input
                type="text"
                name="name"
                placeholder="Credit name"
                value={newCredit.name}
                onChange={handleInputChange}
                required
                className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-300 focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600">Tons of Carbon</label> {/* Changed label */}
            <div className="mt-1 flex items-center">
              <Cloud className="absolute w-4 h-4 text-gray-400 ml-2" /> {/* Changed icon */}
              <input
                type="number"
                name="amount"
                placeholder="Tons of Carbon"
                value={newCredit.amount}
                onChange={handleInputChange}
                required
                className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-300 focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600">Price</label>
            <div className="mt-1 flex items-center">
              <FaEthereum  className="absolute w-4 h-4 text-gray-400 ml-2" /> {/* Changed icon */}
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={newCredit.price}
                onChange={handleInputChange}
                required
                className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-300 focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-600">Audit Fees</label>
            <div className="mt-1 flex items-center">
              <FileText className="absolute w-4 h-4 text-gray-400 ml-2" />
              <input
                type="number"
                name="auditFees"
                placeholder={`Min: ${newCredit.amount * 0.01 * 0.01} ETH`}
                value={newCredit.auditFees}
                onChange={handleInputChange}
                required
                className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-cyan-300 focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
        </div>
        {/* Dropzone */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center">
            <Upload className="w-3 h-3 mr-1 text-cyan-500" />
            Project PDF
          </label>
          <div
            {...getRootProps()}
            className={`p-4 border-2 border-dashed rounded-md text-center transition-colors ${
              isDragActive ? 'border-cyan-400 bg-emerald-50' : 'border-gray-200 bg-emerald-50'
            } hover:border-cyan-400`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              {isDragActive ? (
                <p className="text-xs text-gray-600">Drop here...</p>
              ) : selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs text-gray-700 truncate max-w-[200px]">{selectedFile.name}</p>
                  {isFileConfirmed ? (
                    <p className="text-xs text-cyan-600 flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      Uploaded
                    </p>
                  ) : (
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={onSubmit}
                        className="px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded flex items-center hover:bg-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-colors"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={open}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded flex items-center hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Drop PDF or click to select</p>
                  <button
                    type="button"
                    onClick={open}
                    className="px-2 py-1 bg-cyan-500 text-white text-xs font-medium rounded flex items-center hover:bg-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-colors"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Select
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pendingCr}
          className={`w-full px-3 py-1.5 bg-green-400 text-white text-sm font-medium rounded flex items-center justify-center ${
            pendingCr ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-500'
          } focus:outline-none focus:ring-1 focus:ring-cyan-300 transition-colors`}
        >
          {pendingCr ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-1" />
              Create & Audit
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateCreditForm;