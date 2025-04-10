import React, { useState, useContext } from 'react';
import { CC_Context } from "../../context/SmartContractConnector.js";
import { Loader2, File } from 'lucide-react';
import Swal from 'sweetalert2';
import { expireCreditApi, verifyBeforeExpire } from '../../api/api';

const MyCreditsList = ({ credits, setCredits, isLoading }) => {
  const { expireCredit } = useContext(CC_Context);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [pendingTx, setPendingTx] = useState(null);
  const [expirationData, setExpirationData] = useState({ creditName: "", amountReduced: "", password: "" });
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

      if (creditName !== selectedCredit.name) {
        Swal.fire({
          icon: "warning",
          title: "Name Error",
          text: "Name you entered doesn't match the credit name",
        });
        return;
      }

      const response = await verifyBeforeExpire(expirationData);
      console.log("verifyBeforeExpire says:", response.data["message"]);
      closeModal();
      await handleExpireCredit(selectedCredit.id);
    } catch (error) {
      console.error("Error expiring credit:", error.response.data["message"]);
    }
  };

  const handleExpireCredit = async (creditId) => {
    console.log(`Expire credit called for credit ID: ${creditId}`);
    try {
      setPendingTx(creditId);
      const response = await expireCreditApi(creditId);
      console.log(response.data);
      await expireCredit(creditId);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Credit expired successfully!',
      });

      setCredits((prevCredits) =>
        prevCredits.map((credit) =>
          credit.id === creditId ? { ...credit, is_expired: true } : credit
        )
      );
    } catch (error) {
      if (error.response && error.response.status === 400) {
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

  return (
    <div className="py-5 px-4 bg-white sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">My Credits</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <ul className="rounded-md border border-gray-200 divide-y divide-gray-200">
          {isLoading ? (
            <>
              <LoadingCredit key="loading-1" />
              <LoadingCredit key="loading-2" />
              <LoadingCredit key="loading-3" />
            </>
          ) : credits && credits.length > 0 ? (
            credits.map((credit) => (
              <li
                key={credit.id}  // Ensure the key is here at the top level
                className="flex justify-between items-center py-3 pr-4 pl-3 text-sm"
                style={{ backgroundColor: credit.is_expired ? '#D4EDDA' : 'transparent' }}
              >
                <div className="flex flex-1 items-center w-0">
                  <span className="flex-1 ml-2 w-0 truncate">
                    {credit.id}: {credit.name} - Amount: {credit.amount || 'N/A'}, Price: {credit.price || 'N/A'} ETH
                  </span>
                </div>
                {!credit.is_expired ? (
                  <>
                    <button
                      type='button'
                      onClick={() => window.open(credit.secure_url, '_blank')}
                      className="py-2 px-2 font-sans text-white bg-green-500 rounded hover:bg-green-400"
                    >
                      <File size={20}/>
                    </button>
                    <button
                      onClick={() => openModal(credit)}
                      className="py-1 px-3 ml-4 text-white rounded hover:opacity-90"
                      style={{ backgroundColor: "#415e02" }}
                    >
                      {pendingTx === credit.id ? (
                        <span className='flex'>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : 'Expire Credit'}
                    </button>
                  </>
                ) : (
                  <span className='text-emerald-900'>Expired!</span>
                )}
              </li>
            ))
          ) : (
            <li className="py-3 pr-4 pl-3 text-sm">No credits available</li>
          )}
        </ul>
      </dd>
      
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
              <br /><br /><br />
              <p className="mt-1 text-sm text-black-500">Add a document proof of expiration for Audit:</p>
              <input
                type="file"
                name="pdfFile"
                accept="application/pdf"
                className="p-2 w-full rounded border"
                onChange={handleFileChange}
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

export default MyCreditsList;