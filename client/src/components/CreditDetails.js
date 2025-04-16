import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCreditDetailsAPI } from '../api/api.js';
import { ethers } from 'ethers';
import { FaEthereum } from "react-icons/fa6";
import { CC_Context } from '../context/SmartContractConnector.js';
import { 
  FileText, 
  DollarSign, 
  User, 
  Shield, 
  Clock, 
  Check, 
  X, 
  Link,
  CreditCard, 
  Activity,
  Cloud
} from 'lucide-react';

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

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto p-4 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
        <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 text-lg">{error}</p>
      </div>
    </div>
  );
  
  if (!credit && !dbCredit) return (
    <div className="container mx-auto p-4 text-center">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 inline-block">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 text-lg">No credit found.</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <CreditCard className="h-8 w-8 text-emerald-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Credit Details <span className="text-emerald-500">#{creditId}</span></h1>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border-l-4 border-emerald-500">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-emerald-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Carbon Credit Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          {/* Name */}
          {dbCredit && (
            <div className="flex items-start">
              <div className="bg-emerald-50 p-2 rounded-full mr-3">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{dbCredit.name}</p>
              </div>
            </div>
          )}
          
          {/* Tons of Carbon */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <Cloud className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tons of Carbon</p>
              <p className="font-medium">{dbCredit?.amount || ethers.formatEther(credit?.amount || '0')}</p>
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <FaEthereum className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">
                {dbCredit?.price ? `${dbCredit.price} ETH` : credit ? `${ethers.formatEther(credit.price)} ETH` : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  (dbCredit?.is_active || credit?.forSale) ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                <p className="font-medium">
                  {(dbCredit?.is_active || credit?.forSale) ? 'For Sale' : 'Not For Sale'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Expiration */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <Clock className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiration</p>
              <div className="flex items-center">
                {(dbCredit?.is_expired || credit?.expired) ? (
                  <X className="h-5 w-5 text-red-500 mr-1" />
                ) : (
                  <Check className="h-5 w-5 text-green-500 mr-1" />
                )}
                <p className="font-medium">
                  {(dbCredit?.is_expired || credit?.expired) ? 'Expired' : 'Active'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Creator ID */}
          {dbCredit?.creator_id && (
            <div className="flex items-start">
              <div className="bg-emerald-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Creator ID</p>
                <p className="font-medium">{dbCredit.creator_id}</p>
              </div>
            </div>
          )}
          
          
          {/* Auditors */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Auditors</p>
              <p className="font-medium">
                {dbCredit?.auditors?.length > 0
                  ? dbCredit.auditors.map(auditor => auditor.username).join(', ')
                  : credit ? credit.numOfAuditors.toString() : 'None'}
              </p>
            </div>
          </div>
          
          {/* Request Status */}
          <div className="flex items-start">
            <div className="bg-emerald-50 p-2 rounded-full mr-3">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Request Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                (dbCredit?.req_status === 3 ) ? 'bg-green-100 text-green-800' :
                (dbCredit?.req_status === 2 || credit?.requestStatus === '3') ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {dbCredit?.req_status || credit?.requestStatus || 'Unknown'}
              </span>
            </div>
          </div>
          
          {/* Owner */}
          {credit?.owner && (
            <div className="flex items-start">
              <div className="bg-emerald-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium text-xs md:text-sm truncate max-w-xs">{credit.owner}</p>
              </div>
            </div>
          )}
          
          {/* Creator */}
          {credit?.creator && (
            <div className="flex items-start">
              <div className="bg-emerald-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Creator</p>
                <p className="font-medium text-xs md:text-sm truncate max-w-xs">{credit.creator}</p>
              </div>
            </div>
          )}
          
          {/* Audit Fees */}
          {credit?.auditFees && (
            <div className="flex items-start">
              <div className="bg-emerald-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Audit Fees</p>
                <p className="font-medium">{ethers.formatEther(credit.auditFees)} ETH</p>
              </div>
            </div>
          )}
      {/* Document URL */}
      {dbCredit?.docu_url ? (
        <div className="flex items-start ">
          <div className="bg-emerald-50 p-2 rounded-full mr-3">
            <Link className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Document URL</p>
            <a 
              href={dbCredit.docu_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-500 hover:text-emerald-600 font-medium truncate block"
            >
              link
            </a>
          </div>
        </div>
      ):(
        <div className="flex items-start col-span-1 md:col-span-2 lg:col-span-3">
          <div className="bg-emerald-50 p-2 rounded-full mr-3">
            <Link className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">Document URL</p>
            <p className="font-medium">Not available</p>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default CreditDetails;