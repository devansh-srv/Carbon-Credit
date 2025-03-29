import React, { useContext, useState, useEffect } from 'react';
import { getNGOCredits, createNGOCredit, getTransactions, expireCreditApi, verifyBeforeExpire } from '../api/api';
import { CC_Context } from "../context/SmartContractConnector.js";
import Swal from 'sweetalert2';
import { Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone'
import { Cloudinary } from '@cloudinary/url-gen';

const cloud = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUD_NAME,
    apiKey: process.env.REACT_APP_CLOUD_API_KEY,
    apiSecret: process.env.REACT_APP_CLOUD_API_SECRET
  },
})

const LoadingCredit = () => (
  <li className="flex justify-between items-center py-3 pr-4 pl-3 text-sm animate-pulse">
    <div className="flex-1">
      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
    </div>
    <div className="w-16">
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </li>
);

const NGODashboard = () => {

  const {
    connectWallet,
    generateCredit,
    getNextCreditId,
    expireCredit
  } = useContext(CC_Context);

  const [myCredits, setMyCredits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileConfirmed, setIsFileConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCr, setPendingCr] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [docUrl, setDocUrl] = useState('')
  const [expirationData, setExpirationData] = useState({
    creditName: "",
    amountReduced: "",
    password: "",
  });


  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setIsLoading(true);
        const response = await getNGOCredits();
        setMyCredits(response.data);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCredits();
  }, []);

  const [newCredit, setNewCredit] = useState({ creditId: 0, name: '', amount: '', price: '', secure_url: '' });

  const handleCreateCredit = async (e) => {
    e.preventDefault();

    if (!newCredit.name || !newCredit.amount || !newCredit.price) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      setPendingCr(true);
      const newCreditId = await getNextCreditId(); // Resolve the promise
      console.log("Resolved newCredit ID:", newCreditId);

      const updatedCredit = { ...newCredit, creditId: Number(newCreditId), secure_url: docUrl }; // Update with the resolved ID
      console.log("Updated Credit Object:", updatedCredit);

      await generateCredit(updatedCredit.amount, updatedCredit.price); // Use updated credit here
      const response = await createNGOCredit(updatedCredit);
      console.log('response: ', response)

      // Refetch the updated credit list after successful creation
      const updatedCredits = await getNGOCredits();
      setMyCredits(updatedCredits.data);

      setNewCredit({ name: "", amount: 0, price: 0, creditId: 0 });
    } catch (error) {
      console.error("Failed to create credit:", error);
    } finally {
      setPendingCr(false);
    }
  };


  const handleInputChange = (e) => {
    setNewCredit({ ...newCredit, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Get the first file selected
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please upload a valid PDF file.",
      });
    }
  };

  const openModal = (credit) => {
    setSelectedCredit(credit);
    // console.log("selected credit:", selectedCredit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setExpirationData({ creditName: "", amountReduced: "", password: "" });
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setExpirationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async () => {

    try {
      const { creditName, amountReduced, password } = expirationData;

      if (!creditName || !amountReduced || !password) {
        Swal.fire({
          icon: "warning",
          title: "Missing Fields",
          text: "Please fill in all fields.",
        });
        return;
      }

      if (creditName != selectedCredit.name) {
        Swal.fire({
          icon: "warning",
          title: "Name Error",
          text: "Name name you entered doesnt match the credit name",
        });
        return;
      }
      // console.log("before nogga ");
      const response = await verifyBeforeExpire(expirationData);

      console.log("verifyBeforeExpire says:", response.data["message"])
      // Close the modal
      closeModal();

      // Proceed with original expireCredit logic
      await handleExpireCredit(selectedCredit.id);

    } catch (error) {
      console.error("Error expiring credit:", error.response.data["message"]);
    }
  };

  const handleExpireCredit = async (creditId) => {
    console.log(`Expire credit called for credit ID: ${creditId}`);
    const SC_Credit_Id = creditId;

    try {
      setPendingTx(creditId);
      const response = await expireCreditApi(creditId);
      console.log(response.data);

      // Call the smart contract function
      await expireCredit(SC_Credit_Id);

      // SweetAlert for success
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Credit expired successfully!',
      });

      setMyCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_expired: true } : credit
        )
      );
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Display a popup with the error message
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.response.data.message,
        });
      } else {
        console.error('Failed to expire credit:', error);
      }
    } finally {
      setPendingTx(null);
    }
  };


  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsResponse, transactionsResponse] = await Promise.all([
          getNGOCredits(),
          getTransactions()
        ]);
        setMyCredits(creditsResponse.data);
        setTransactions(transactionsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const onDrop = async (acceptedFiles) => {
    // Handle the dropped files

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

  return (
    <div className="overflow-hidden bg-white bg-gradient-to-br from-emerald-200 to-blue-100 shadow sm:rounded-lg">
      <div className="py-5 px-4 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">NGO Dashboard</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your carbon credits</p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="py-5 px-4 bg-gray-50 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Create New Credit</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <form onSubmit={handleCreateCredit} className="space-y-4">
                <input
                  className="input"
                  type="text"
                  name="name"
                  placeholder="Credit Name"
                  value={newCredit.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="input"
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={newCredit.amount}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="input"
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={newCredit.price}
                  onChange={handleInputChange}
                  required
                />
                <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Upload Project PDF</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <div {...getRootProps()} className="p-6 text-center border-2 border-gray-400 border-dashed">
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
                                className="py-2 px-4 font-sans text-white bg-green-500 rounded hover:bg-green-400">
                                Confirm Upload
                              </button>
                              <button
                                type='button'
                                onClick={open}
                                className="py-2 px-4 ml-2 font-sans text-black bg-blue-400 rounded hover:bg-gray-100">
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
                            className="py-2 px-4 font-sans text-black bg-blue-400 rounded hover:bg-gray-100">
                            Upload Project File
                          </button>
                        </>
                      )}
                    </div>
                  </dd>
                </div>
                <button type="submit" className="btn btn-primary">{pendingCr ? <span className='flex'>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Generating Credit...
                </span>
                  : "Create Credit"}</button>
              </form>
            </dd>
          </div>
          <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">My Credits</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
                {isLoading ? (
                  <>
                    <LoadingCredit />
                    <LoadingCredit />
                    <LoadingCredit />
                  </>
                ) : myCredits.map((credit) => (
                  <li
                    key={credit.id}
                    className="flex justify-between items-center py-3 pr-4 pl-3 text-sm"
                    style={{ backgroundColor: credit.is_expired ? '#D4EDDA' : 'transparent' }} // Replace with your green hex
                  >
                    <div className="flex flex-1 items-center w-0">
                      <span className="flex-1 ml-2 w-0 truncate">
                        {credit.id}: {credit.name} - Amount: {credit.amount}, Price: {credit.price} ETH
                      </span>
                    </div>
                    {!credit.is_expired ? (
                      <button
                        onClick={() => openModal(credit)}
                        className="py-1 px-3 ml-4 text-white rounded hover:opacity-90"
                        style={{ backgroundColor: "#415e02" }}
                      >
                        {pendingTx === credit.id ? <span className='flex'>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                          : 'Expire Credit'}
                      </button>
                    ) : <span className='text-emerald-900'>Expired !</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500">Recent Transactions</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
            {isLoading ? (
              <>
                <LoadingCredit />
                <LoadingCredit />
                <LoadingCredit />
              </>
            ) : transactions.slice(-10).map((transaction) => (
              <li key={transaction.id} className="flex justify-between items-center py-3 pr-4 pl-3 text-sm">
                <div className="flex flex-1 items-center w-0">
                  <span className="flex-1 ml-2 w-0 truncate">
                    Buyer: {transaction.buyer}, Credit: {transaction.credit}, Amount: {transaction.amount}, Total Price: ${transaction.total_price}, Date: {new Date(transaction.timestamp).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </dd>
      </div>


      {modalVisible && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-gray-800 bg-opacity-75">
          <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Expire Credit</h3>
            <div className="space-y-4">
              <input
                type="text"
                name="creditName"
                placeholder="Credit Name"
                className="p-2 w-full rounded border"
                value={expirationData.creditName}
                onChange={handleModalInputChange}
              />
              <input
                type="number"
                name="amountReduced"
                placeholder="Amount Reduced"
                className="p-2 w-full rounded border"
                value={expirationData.amountReduced}
                onChange={handleModalInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Your Password"
                className="p-2 w-full rounded border"
                value={expirationData.password}
                onChange={handleModalInputChange}
              />

              {/* File Upload Input for PDF */}
              <br /><br /><br />
              <p className="mt-1 text-sm text-black-500"> Add a document proof of expiration for Audit:</p>
              <input
                type="file"
                name="pdfFile"
                accept="application/pdf"
                className="p-2 w-full rounded border"
                onChange={handleFileChange}  // Handle file change
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="py-2 px-4 text-white bg-gray-500 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="py-2 px-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
