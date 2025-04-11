import React, { useState, useContext } from 'react';
import { CC_Context } from "../../context/SmartContractConnector.js";
import { Loader2 } from 'lucide-react';
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
    // console.log('File uploaded to Cloudinary: ', data);
    console.log('secure_url: ', data['secure_url'])
    setDocUrl(data['secure_url'])
    console.log('docUrl: ', docUrl)
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
      
      // Refetch the updated credit list after successful creation
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
    <div className="py-5 px-4 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">Create New Credit</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <form onSubmit={handleCreateCredit} className="space-y-4">
          {/* Input fields */}
          <input className="input" type="text" name="name" placeholder="Credit Name" value={newCredit.name} onChange={handleInputChange} required />
          <input className="input" type="number" name="amount" placeholder="Amount" value={newCredit.amount} onChange={handleInputChange} required />
          <input className="input" type="number" name="price" placeholder="Price" value={newCredit.price} onChange={handleInputChange} required />
          <input className="input" type="number" name="auditFees" placeholder={`Audit Fees min:${newCredit.amount * 0.01 * 0.01} ETH`} value={newCredit.auditFees} onChange={handleInputChange} required />
          
          {/* Dropzone */}
          <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Upload Project PDF</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div {...getRootProps()} className="p-6 text-center rounded border-2 border-gray-400 border-dashed hover:border-blue-600">
                    <input {...getInputProps()} />
                    {isDragActive ? (
                    <p>Drop the files here ...</p>
                    ) : selectedFile ? (
                    <>
                        <p>Selected file: {selectedFile.name}</p>
                        {isFileConfirmed ? (
                        <p>File has been uploaded successfully.</p>
                        ) : (
                        <>
                            <button
                            type='button'
                            onClick={onSubmit}
                            className="py-2 px-4 font-sans text-white bg-green-500 rounded hover:bg-green-800">
                            Confirm Upload
                            </button>
                            <button
                            type='button'
                            onClick={open}
                            className="py-2 px-4 ml-2 font-sans text-white bg-blue-500 rounded hover:bg-blue-800">
                            Upload another file
                            </button>
                        </>
                        )}
                    </>
                    ) : (
                    <>
                        <p>Drag 'n' drop a PDF file here, or click to select one</p>
                        <button
                        type='button'
                        onClick={open}
                        className="py-2 px-4 font-sans text-black bg-blue-500 rounded hover:bg-blue-800">
                        Upload Project File
                        </button>
                    </>
                    )}
                </div>
                </dd>
            </div>
          
          <button type="submit" className="btn btn-primary">
            {pendingCr ? (
              <span className='flex'>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Generating Credit...
              </span>
            ) : "Create Credit & Request Audit"}
          </button>
        </form>
      </dd>
    </div>
  );
};

export default CreateCreditForm;