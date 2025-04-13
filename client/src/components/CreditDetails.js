import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCreditDetailsAPI } from '../api/api.js';
import { ethers } from 'ethers';
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
  Activity 
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
      
      {dbCredit && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border-l-4 border-green-400">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-emerald-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Database Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <FileText className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{dbCredit.name}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{dbCredit.amount}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">${dbCredit.price}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dbCredit.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <p className="font-medium">{dbCredit.is_active ? 'For Sale' : 'Not For Sale'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Clock className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiration</p>
                <div className="flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${dbCredit.is_expired ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  <p className="font-medium">{dbCredit.is_expired ? 'Expired' : 'Active'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Creator ID</p>
                <p className="font-medium">{dbCredit.creator_id}</p>
              </div>
            </div>
            
            <div className="flex items-start col-span-2">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Link className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Document URL</p>
                <a 
                  href={dbCredit.docu_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-500 hover:text-emerald-600 font-medium truncate block"
                >
                  {dbCredit.docu_url}
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Shield className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Auditors</p>
                <p className="font-medium">
                  {dbCredit.auditors?.length > 0
                    ? dbCredit.auditors.map(auditor => auditor.username).join(', ')
                    : 'None'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Request Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  dbCredit.req_status === 'Approved' ? 'bg-green-100 text-green-800' :
                  dbCredit.req_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dbCredit.req_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {credit && (
        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-emerald-500">
          <div className="flex items-center mb-4">
            <Activity className="h-6 w-6 text-emerald-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Blockchain Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{ethers.formatEther(credit.amount)} ETH</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">{ethers.formatEther(credit.price)} ETH</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p className="font-medium text-xs md:text-sm truncate max-w-xs">{credit.owner}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Creator</p>
                <p className="font-medium text-xs md:text-sm truncate max-w-xs">{credit.creator}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">For Sale</p>
                <div className="flex items-center">
                  {credit.forSale ? (
                    <Check className="h-5 w-5 text-green-500 mr-1" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mr-1" />
                  )}
                  <p className="font-medium">{credit.forSale ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Clock className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiration</p>
                <div className="flex items-center">
                  {credit.expired ? (
                    <X className="h-5 w-5 text-red-500 mr-1" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500 mr-1" />
                  )}
                  <p className="font-medium">{credit.expired ? 'Expired' : 'Active'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Request Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  credit.requestStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                  credit.requestStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {credit.requestStatus}
                </span>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Auditors</p>
                <p className="font-medium">{credit.numOfAuditors.toString()}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Audit Fees</p>
                <p className="font-medium">{ethers.formatEther(credit.auditFees)} ETH</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-green-50 p-2 rounded-full mr-3">
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Audit Score</p>
                <p className="font-medium">{credit.auditScore.toString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditDetails;