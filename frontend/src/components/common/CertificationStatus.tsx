import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import api from '../../services/api';

interface CertificationStatusProps {
  userId: string;
  className?: string;
}

const CertificationStatus: React.FC<CertificationStatusProps> = ({ userId, className = '' }) => {
  const navigate = useNavigate();
  const [hasAllCertifications, setHasAllCertifications] = useState(false);
  const [certificationCount, setCertificationCount] = useState({ verified: 0, total: 4 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCertifications = async () => {
      setError(null);
      
      try {
        const response = await api.get(`/certifications/verify/${userId}`);
        if (response.data.success) {
          setHasAllCertifications(response.data.data.hasAllCertifications);
          setCertificationCount(response.data.data.certificationsCount);
        }
      } catch (error) {
        console.error('Error checking certifications:', error);
        setError('Error al verificar las certificaciones. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    checkCertifications();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (hasAllCertifications) {
    return null; // Don't show anything if user has all certifications
  }

  return (
    <Card className={`bg-yellow-50 border-yellow-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-1">
              Certificaciones Requeridas
            </h3>
            <p className="text-sm text-yellow-700">
              Necesitas tener los 4 certificados obligatorios para vender productos.
              Actualmente tienes {certificationCount.verified} de {certificationCount.total}.
            </p>
          </div>
          <button
            onClick={() => navigate('/certificados')}
            className="bg-yellow-1 hover:bg-yellow-1-5 text-white py-2 px-4 rounded-md transition-colors"
          >
            Agregar Certificados
          </button>
        </div>
      </div>
    </Card>
  );
};

export default CertificationStatus; 