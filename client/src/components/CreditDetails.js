import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCreditDetailsAPI } from '../api/api.js';
import { ethers } from 'ethers';
import { CC_Context } from '../context/SmartContractConnector.js';
import axios from 'axios';

const CreditDetails = () => {
  const { creditId } = useParams();
  const navigate = useNavigate();
  const { getCreditDetails } = useContext(CC_Context);
  const [credit, setCredit] = useState(null);
  const [dbCredit, setDbCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchCreditDetails = async () => {
      if (parseInt(creditId) < 0) {
        setError('Invalid credit ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch from smart contract
        let contractData = null;
        try {
          contractData = await getCreditDetails(creditId);
        } catch (contractErr) {
          console.error('Smart contract error:', contractErr);
          setError('Failed to load blockchain data.');
        }

        const response = await getCreditDetailsAPI(creditId);

        setCredit(contractData);
        setDbCredit(response.data);
      } catch (err) {
        setError('Failed to load credit details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditDetails();
  }, [creditId, navigate, getCreditDetails]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!credit && !dbCredit) return <div>No credit found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Credit Details (ID: {creditId})</h1>
      <div className="bg-white shadow-md rounded p-6">
        {dbCredit && (
          <>
            <h2 className="text-xl font-semibold">Database Information</h2>
            <p><strong>Name:</strong> {dbCredit.name}</p>
            <p><strong>Amount:</strong> {dbCredit.amount}</p>
            <p><strong>Price:</strong> ${dbCredit.price}</p>
            <p><strong>For Sale:</strong> {dbCredit.is_active ? 'Yes' : 'No'}</p>
            <p><strong>Expired:</strong> {dbCredit.is_expired ? 'Yes' : 'No'}</p>
            <p><strong>Creator ID:</strong> {dbCredit.creator_id}</p>
            <p>
              <strong>Document URL:</strong>{' '}
              <a href={dbCredit.docu_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                {dbCredit.docu_url}
              </a>
            </p>
            <p>
              <strong>Auditors:</strong>{' '}
              {dbCredit.auditors?.length > 0
                ? dbCredit.auditors.map(auditor => auditor.username).join(', ')
                : 'None'}
            </p>
            <p><strong>Request Status:</strong> {dbCredit.req_status}</p>
          </>
        )}
        {credit && (
          <>
            <h2 className="text-xl font-semibold mt-6">Blockchain Information</h2>
            <p><strong>Amount:</strong> {ethers.formatEther(credit.amount)} ETH</p>
            <p><strong>Owner:</strong> {credit.owner}</p>
            <p><strong>Creator:</strong> {credit.creator}</p>
            <p><strong>Expired:</strong> {credit.expired ? 'Yes' : 'No'}</p>
            <p><strong>Price:</strong> {ethers.formatEther(credit.price)} ETH</p>
            <p><strong>For Sale:</strong> {credit.forSale ? 'Yes' : 'No'}</p>
            <p><strong>Request Status:</strong> {credit.requestStatus}</p>
            <p><strong>Number of Auditors:</strong> {credit.numOfAuditors.toString()}</p>
            <p><strong>Audit Fees:</strong> {ethers.formatEther(credit.auditFees)} ETH</p>
            <p><strong>Audit Score:</strong> {credit.auditScore.toString()}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default CreditDetails;